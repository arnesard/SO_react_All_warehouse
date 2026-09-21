const express = require("express");
const multer = require("multer");
const { poolUtama } = require("../db/pool");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const TABLE_MAIN = "so_all_wh_barcode_monstock_db";
const TABLE_AUTO = "so_all_wh_barcode_monstock_auto_db";

router.use((req, res, next) => {
  if (!poolUtama) {
    return res.status(500).json({
      status: "error",
      message: "DB_MAIN belum dikonfigurasi (cek file .env backend).",
    });
  }
  next();
});

// ------------------------------------------------------------------
// GET /api/barcode-monstock/data
// Same "potong buntut master size" join as the Laravel controller:
// join b.item against SUBSTRING_INDEX(m.item, '-', 1), scoped per warehouse.
// ------------------------------------------------------------------
router.get("/data", async (req, res) => {
  try {
    const [mainData] = await poolUtama.query(
      `SELECT b.id, b.warehouse, b.rackcode, b.item, b.jml, b.oem, b.loccode, m.description
       FROM ${TABLE_MAIN} b
       LEFT JOIN so_all_wh_master_size_db m
         ON b.item = SUBSTRING_INDEX(m.item, '-', 1)
        AND b.warehouse = m.warehouse
       ORDER BY b.id DESC`,
    );

    const [whRows] = await poolUtama.query(
      `SELECT DISTINCT warehouse FROM ${TABLE_MAIN}
       WHERE warehouse IS NOT NULL AND warehouse != '' ORDER BY warehouse ASC`,
    );
    const [rackRows] = await poolUtama.query(
      `SELECT DISTINCT rackcode FROM ${TABLE_MAIN}
       WHERE rackcode IS NOT NULL AND rackcode != '' ORDER BY rackcode ASC`,
    );

    const [lastUploadRows] = await poolUtama.query(
      `SELECT warehouse, MAX(updated_at) AS last_upload FROM ${TABLE_MAIN}
       WHERE warehouse IS NOT NULL GROUP BY warehouse`,
    );
    const lastUpload = {};
    lastUploadRows.forEach((r) => {
      lastUpload[r.warehouse] = r.last_upload;
    });

    res.json({
      master_data: mainData,
      filter_wh: whRows.map((r) => r.warehouse),
      filter_rack: rackRows.map((r) => r.rackcode),
      last_upload: lastUpload,
    });
  } catch (err) {
    console.error("[barcode-monstock] getData error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ------------------------------------------------------------------
// POST /api/barcode-monstock/import  (multipart: file_csv, target_warehouse)
// Full port of the Laravel import(): validates the CSV's own loccode prefix
// against target_warehouse, wipes old rows for that warehouse, re-parses,
// splits each row into -0 (OEM) / -1 (non-OEM) item variants, aggregates
// them into the "auto" table, and carries over historical no_doc numbers.
// ------------------------------------------------------------------
router.post("/import", upload.single("file_csv"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: "error", message: "Berkas CSV tidak terdeteksi oleh sistem!" });
  }

  const targetWarehouse = (req.body.target_warehouse || "").trim().toUpperCase();
  if (!targetWarehouse) {
    return res.status(400).json({ status: "error", message: "Target Warehouse wajib lu pilih !" });
  }

  try {
    const text = req.file.buffer.toString("utf8");
    const lines = text.split(/\r\n|\r|\n/).filter((l) => l.length > 0);
    if (lines.length === 0) {
      return res.status(400).json({ status: "error", message: "File CSV kosong !" });
    }

    const parseCsvLine = (line) =>
      line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const idxRack = headers.indexOf("rackcode");
    const idxItem = headers.indexOf("item");
    const idxJml = headers.indexOf("jml");
    const idxOem = headers.indexOf("oem");
    const idxLoccode = headers.indexOf("loccode");

    if (idxItem === -1 || idxJml === -1) {
      return res.status(400).json({
        status: "error",
        message: "Format file salah! Kolom Item atau Jml tidak ditemukan.",
      });
    }

    const dataLines = lines.slice(1);

    // --- Detect the warehouse embedded in the CSV's own loccode, and guard
    // the upload against being applied to the wrong warehouse. ---
    let csvWarehouseDetected = null;
    for (const line of dataLines) {
      const row = parseCsvLine(line);
      if (!row[idxItem] || row[idxItem].trim() === "") continue;
      const checkLoc = idxLoccode !== -1 && row[idxLoccode] ? row[idxLoccode].trim() : "";
      if (checkLoc && checkLoc !== "-" && checkLoc !== "~") {
        csvWarehouseDetected = checkLoc.toUpperCase().slice(0, 3);
        break;
      }
    }

    if (csvWarehouseDetected !== null) {
      if (csvWarehouseDetected !== targetWarehouse) {
        return res.status(400).json({
          status: "error",
          message: `⚠️ PENTING BRO! Lu milih Gudang [${targetWarehouse}], tapi file CSV yang lu upload terdeteksi milik Gudang [${csvWarehouseDetected}]. Proses diblokir sistem biar data lu kagak kehapus salah!`,
        });
      }
    } else {
      return res.status(400).json({
        status: "error",
        message: "Gagal Validasi! Sistem tidak menemukan data Kode Lokasi (loccode) yang valid di dalam file CSV lu bro.",
      });
    }

    // --- Historical no_doc map for this warehouse (loccode@item -> no_doc) ---
    const [historyRows] = await poolUtama.query(
      `SELECT DISTINCT loccode, item, no_doc FROM ${TABLE_AUTO}
       WHERE warehouse = ? AND no_doc IS NOT NULL AND no_doc != '-'`,
      [targetWarehouse],
    );
    const historicalDocMap = {};
    historyRows.forEach((r) => {
      historicalDocMap[`${(r.loccode || "").toUpperCase().trim()}@${(r.item || "").toUpperCase().trim()}`] = r.no_doc;
    });

    // --- Wipe old rows for this warehouse ---
    await poolUtama.query(`DELETE FROM ${TABLE_MAIN} WHERE warehouse = ?`, [targetWarehouse]);
    await poolUtama.query(`DELETE FROM ${TABLE_AUTO} WHERE warehouse = ?`, [targetWarehouse]);

    const batchMain = [];
    const compressedAutoMap = {};
    let lastValidLoccode = `${targetWarehouse}-UNKNOWN`;

    const flushMain = async () => {
      if (batchMain.length === 0) return;
      await poolUtama.query(
        `INSERT INTO ${TABLE_MAIN} (warehouse, rackcode, item, jml, oem, loccode, created_at, updated_at)
         VALUES ?`,
        [batchMain.map((r) => [r.warehouse, r.rackcode, r.item, r.jml, r.oem, r.loccode, new Date(), new Date()])],
      );
      batchMain.length = 0;
    };

    for (const line of dataLines) {
      const row = parseCsvLine(line);
      if (!row[idxItem] || row[idxItem].trim() === "") continue;

      const loccodeRaw = idxLoccode !== -1 && row[idxLoccode] ? row[idxLoccode].trim() : "";
      const isLoccodeKosongAtauCacing = !loccodeRaw || loccodeRaw === "-" || loccodeRaw === "~";

      if (!isLoccodeKosongAtauCacing) {
        lastValidLoccode = loccodeRaw.toUpperCase();
      } else {
        lastValidLoccode =
          lastValidLoccode && lastValidLoccode !== "-" ? lastValidLoccode : `${targetWarehouse}-AUTO`;
      }

      const rackcode = idxRack !== -1 && row[idxRack] ? row[idxRack].toUpperCase().trim() : "-";
      const item = (row[idxItem] || "").toUpperCase().trim();
      const jml = idxJml !== -1 ? parseInt(row[idxJml], 10) || 0 : 0;
      const oem = idxOem !== -1 ? parseInt(row[idxOem], 10) || 0 : 0;

      batchMain.push({
        warehouse: targetWarehouse,
        rackcode,
        item,
        jml,
        oem,
        loccode: lastValidLoccode,
      });

      // B. Bypass grade OEM: TH-prefixed or SP-suffixed items are always treated as OEM.
      const isForcedOem = item.startsWith("TH") || item.endsWith("SP");
      const loccodeForAuto = isLoccodeKosongAtauCacing ? loccodeRaw || "-" : lastValidLoccode;

      const rawSplitRecords = [];
      if (isForcedOem) {
        rawSplitRecords.push({ item: `${item}-0`, qty: jml });
      } else if (oem === jml) {
        rawSplitRecords.push({ item: `${item}-0`, qty: oem });
      } else if (oem === 0) {
        rawSplitRecords.push({ item: `${item}-1`, qty: jml });
      } else {
        rawSplitRecords.push({ item: `${item}-0`, qty: oem });
        rawSplitRecords.push({ item: `${item}-1`, qty: jml - oem });
      }

      for (const split of rawSplitRecords) {
        const fingerprintKey = `${targetWarehouse}@${split.item}@${loccodeForAuto}`;
        if (!compressedAutoMap[fingerprintKey]) {
          compressedAutoMap[fingerprintKey] = {
            warehouse: targetWarehouse,
            item: split.item,
            Qty: split.qty,
            Rak: 1,
            loccode: loccodeForAuto,
            no_doc: "-",
          };
        } else {
          compressedAutoMap[fingerprintKey].Qty += split.qty;
          compressedAutoMap[fingerprintKey].Rak += 1;
        }
      }

      if (batchMain.length >= 500) await flushMain();
    }
    await flushMain();

    // D. Generate/carry-over no_doc, grouped & sequenced per location prefix.
    if (Object.keys(compressedAutoMap).length > 0) {
      const batchAutoFinal = Object.values(compressedAutoMap).sort((a, b) =>
        a.loccode < b.loccode ? -1 : a.loccode > b.loccode ? 1 : 0,
      );

      const maxSequencePerPrefix = {};

      for (const finalRow of batchAutoFinal) {
        const loccodeActive = finalRow.loccode;
        const itemActive = finalRow.item;

        if (!loccodeActive || loccodeActive === "-" || loccodeActive === "~") {
          finalRow.no_doc = loccodeActive;
          continue;
        }

        const historyKey = `${loccodeActive}@${itemActive}`;

        if (historicalDocMap[historyKey]) {
          finalRow.no_doc = historicalDocMap[historyKey];
        } else {
          const prefixDoc = "G";
          const char5 = loccodeActive.length >= 5 ? loccodeActive[4] : "0";
          const suffixLoc = loccodeActive.length >= 7 ? loccodeActive.slice(6) : "UNKNOWN";
          const prefixNoDoc = `${prefixDoc}${char5}${suffixLoc}`;

          if (maxSequencePerPrefix[prefixNoDoc] === undefined) {
            maxSequencePerPrefix[prefixNoDoc] = 0;
            for (const oldDoc of Object.values(historicalDocMap)) {
              if (oldDoc.startsWith(prefixNoDoc)) {
                const seqNumber = parseInt(oldDoc.slice(-2), 10) || 0;
                if (seqNumber > maxSequencePerPrefix[prefixNoDoc]) {
                  maxSequencePerPrefix[prefixNoDoc] = seqNumber;
                }
              }
            }
          }

          maxSequencePerPrefix[prefixNoDoc] += 1;
          const generatedNoDoc = `${prefixNoDoc}${String(maxSequencePerPrefix[prefixNoDoc]).padStart(2, "0")}`;
          finalRow.no_doc = generatedNoDoc;
          historicalDocMap[historyKey] = generatedNoDoc;
        }
      }

      for (let i = 0; i < batchAutoFinal.length; i += 500) {
        const chunk = batchAutoFinal.slice(i, i + 500);
        await poolUtama.query(
          `INSERT INTO ${TABLE_AUTO} (warehouse, item, Qty, Rak, loccode, no_doc, created_at, updated_at)
           VALUES ?`,
          [chunk.map((r) => [r.warehouse, r.item, r.Qty, r.Rak, r.loccode, r.no_doc, new Date(), new Date()])],
        );
      }
    }

    res.json({ status: "success", message: `Gudang ${targetWarehouse} sukses dibilas bersih & data auto siap saji!` });
  } catch (err) {
    console.error("[barcode-monstock] import error:", err);
    res.status(500).json({ status: "error", message: "Error Backend SQL: " + err.message });
  }
});

// DELETE /api/barcode-monstock/delete/:id
router.delete("/delete/:id", async (req, res) => {
  try {
    await poolUtama.query(`DELETE FROM ${TABLE_MAIN} WHERE id = ?`, [req.params.id]);
    res.json({ status: "success", message: "Baris barcode berhasil dibuang!" });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Gagal hapus: " + err.message });
  }
});

// POST /api/barcode-monstock/truncate-all  { password }
router.post("/truncate-all", async (req, res) => {
  const DEV_PASSWORD = process.env.BARCODE_MONSTOCK_TRUNCATE_PASSWORD || "DEVBPW";
  const inputPassword = (req.body.password || "").trim();

  if (inputPassword !== DEV_PASSWORD) {
    return res.status(200).json({ status: "wrong_password", message: "Password yang anda masukan salah!" });
  }

  try {
    await poolUtama.query(`TRUNCATE TABLE ${TABLE_AUTO}`);
    await poolUtama.query(`TRUNCATE TABLE ${TABLE_MAIN}`);
    res.status(200).json({ status: "success", message: "Password benar! Data truncate berhasil dilakukan, DB berhasil dihapus." });
  } catch (err) {
    res.status(200).json({ status: "error", message: "Error saat truncate: " + err.message });
  }
});

module.exports = router;
