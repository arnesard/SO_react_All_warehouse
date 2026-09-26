const XLSX = require("xlsx-js-style");
const { poolUtama } = require("../../db/pool");

const initFilters = async (req, res) => {
  try {
    const [rows] = await poolUtama.query(
      `SELECT DISTINCT warehouse FROM so_all_wh_non_barcode_tagstock_db WHERE warehouse IS NOT NULL AND warehouse != '' ORDER BY warehouse ASC`,
    );
    const warehouses = rows.map((r) => r.warehouse);
    return res.json({ status: "success", warehouses });
  } catch (error) {
    console.error("Error initFilters Non-Barcode:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getOperatorsByWarehouse = async (req, res) => {
  const { warehouse } = req.query;
  if (!warehouse) {
    return res
      .status(400)
      .json({ status: "error", message: "Warehouse wajib dipilih!" });
  }

  try {
    const sql = `
      SELECT 
        p.no_penneng,
        p.nama,
        p.gedung,
        GROUP_CONCAT(p.lot ORDER BY p.lot ASC SEPARATOR ', ') as combined_lot
      FROM so_all_wh_pic_stock_db p
      WHERE p.warehouse = ?
        AND p.no_penneng IS NOT NULL 
        AND p.no_penneng != ''
        AND EXISTS (
          SELECT 1 
          FROM so_all_wh_non_barcode_tagstock_db nb
          WHERE nb.warehouse = ?
            AND (
              nb.loccode LIKE CONCAT(UPPER(TRIM(p.gedung)), '-%')
              AND SUBSTRING_INDEX(nb.loccode, '-', -1) BETWEEN 
                  SUBSTRING_INDEX(p.lot, '-', 1) AND SUBSTRING_INDEX(p.lot, '-', -1)
            )
        )
      GROUP BY p.no_penneng, p.nama, p.gedung
      ORDER BY p.nama ASC
    `;
    const [operators] = await poolUtama.query(sql, [warehouse, warehouse]);
    return res.json({ status: "success", operators });
  } catch (error) {
    console.error("Error getOperators Non-Barcode:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const processRows = async (req, res) => {
  const { warehouse, operator_id, doc_start, doc_end } = req.body;

  if (!warehouse || !operator_id) {
    return res
      .status(400)
      .json({ status: "error", message: "Filter belum lengkap!" });
  }

  try {
    const [pics] = await poolUtama.query(
      `SELECT * FROM so_all_wh_pic_stock_db WHERE no_penneng = ? AND warehouse = ?`,
      [operator_id, warehouse],
    );

    if (pics.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "PIC tidak ditemukan!" });
    }

    const lotConditions = [];
    const params = [warehouse, warehouse];

    for (const pic of pics) {
      const gedung = (pic.gedung || "").trim().toUpperCase();
      const lotParts = (pic.lot || "").trim().split("-");
      const awal = lotParts[0]?.trim();
      const akhir = (lotParts[1] || lotParts[0])?.trim();

      lotConditions.push(
        `(t.loccode LIKE ? AND SUBSTRING_INDEX(t.loccode, '-', -1) BETWEEN ? AND ?)`,
      );
      params.push(`${gedung}-%`, awal, akhir);
    }

    let docFilterSql = "";
    if (doc_start && doc_end) {
      docFilterSql = ` AND t.upload_batch BETWEEN ? AND ? `;
      params.push(doc_start, doc_end);
    }

    const sql = `
      SELECT 
        t.upload_batch AS no_doc,
        t.loccode AS lot_display,
        t.item,
        m.description,
        r.jumlah_rak AS Rak,
        SUM(t.qty) AS Qty,
        MAX(a.total_qty) AS actual_qty,
        CASE
          WHEN MAX(a.total_qty) IS NULL THEN 'BELUM'
          WHEN SUM(t.qty) = MAX(a.total_qty) THEN 'SESUAI'
          ELSE 'TIDAK SESUAI'
        END AS status_validasi
      FROM so_all_wh_non_barcode_tagstock_db t
      LEFT JOIN (
        SELECT 
          TRIM(UPPER(nokso)) AS nokso,
          TRIM(UPPER(item)) AS item,
          SUM(qty) AS total_qty
        FROM so_all_wh_appkso_db
        GROUP BY nokso, item
      ) a ON TRIM(UPPER(t.upload_batch)) = a.nokso AND TRIM(UPPER(t.item)) = a.item
      LEFT JOIN so_all_wh_master_size_db m 
        ON t.item = m.item AND t.warehouse = m.warehouse
      LEFT JOIN (
        SELECT 
          warehouse, loccode, item,
          COUNT(DISTINCT rackcode) AS jumlah_rak
        FROM so_all_wh_non_barcode_tagstock_db
        WHERE warehouse = ?
        GROUP BY warehouse, loccode, item
      ) r ON t.warehouse = r.warehouse AND t.loccode = r.loccode AND t.item = r.item
      WHERE t.warehouse = ?
        AND (${lotConditions.join(" OR ")})
        ${docFilterSql}
      GROUP BY t.upload_batch, t.loccode, t.item, m.description, r.jumlah_rak
      ORDER BY t.upload_batch ASC
    `;

    const [rows] = await poolUtama.query(sql, params);

    return res.json({
      status: "success",
      master_data: rows.map((r) => ({
        ...r,
        Rak: Number(r.Rak) || 0,
        Qty: Number(r.Qty) || 0,
        actual_qty: r.actual_qty !== null ? Number(r.actual_qty) : null,
      })),
    });
  } catch (error) {
    console.error("Error processRows Non-Barcode:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const uploadExcel = async (req, res) => {
  const warehouse = req.body.warehouse;
  const file = req.file;

  if (!warehouse) {
    return res
      .status(400)
      .json({ status: "error", message: "Warehouse wajib dipilih!" });
  }

  if (!file) {
    return res
      .status(400)
      .json({ status: "error", message: "File Excel wajib diunggah!" });
  }

  let conn;
  try {
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (!rows || rows.length <= 1) {
      return res.status(400).json({
        status: "error",
        message: "File Excel kosong atau tidak terbaca!",
      });
    }

    conn = await poolUtama.getConnection();
    await conn.beginTransaction();

    const [histories] = await conn.query(
      `SELECT DISTINCT loccode, item, upload_batch 
       FROM so_all_wh_non_barcode_tagstock_db 
       WHERE warehouse = ? AND upload_batch IS NOT NULL AND upload_batch != ''`,
      [warehouse],
    );

    const historicalDocMap = {};
    for (const h of histories) {
      const key = `${String(h.loccode || "")
        .trim()
        .toUpperCase()}@${String(h.item || "")
        .trim()
        .toUpperCase()}`;
      historicalDocMap[key] = h.upload_batch;
    }

    const maxSequencePerPrefix = {};
    const insertData = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;

      const item = String(row[1] || "")
        .trim()
        .toUpperCase();
      const loccode = String(row[13] || "")
        .trim()
        .toUpperCase();
      const qty = parseInt(row[4] || 0, 10);
      const oem = parseInt(row[10] || 0, 10);
      const rackcode = row[0] || null;

      const isForcedOem = item.startsWith("TH") || item.endsWith("SP");
      const rawSplitRecords = [];

      if (isForcedOem) {
        rawSplitRecords.push({ item: `${item}-0`, qty, oem });
      } else {
        if (oem === qty) {
          rawSplitRecords.push({ item: `${item}-0`, qty: oem, oem });
        } else if (oem === 0) {
          rawSplitRecords.push({ item: `${item}-1`, qty, oem: 0 });
        } else {
          rawSplitRecords.push({ item: `${item}-0`, qty: oem, oem });
          rawSplitRecords.push({ item: `${item}-1`, qty: qty - oem, oem: 0 });
        }
      }

      for (const split of rawSplitRecords) {
        const splitItem = split.item;
        let noDoc = "-";

        if (loccode && loccode !== "-" && loccode !== "~") {
          const historyKey = `${loccode}@${splitItem}`;

          if (historicalDocMap[historyKey]) {
            noDoc = historicalDocMap[historyKey];
          } else {
            const char5 = loccode.length >= 5 ? loccode.substring(4, 5) : "0";
            const suffixLoc =
              loccode.length >= 7 ? loccode.substring(6) : "UNKNOWN";
            const prefixNoDoc = `G${char5}${suffixLoc}`;

            if (maxSequencePerPrefix[prefixNoDoc] === undefined) {
              maxSequencePerPrefix[prefixNoDoc] = 0;
              for (const oldDoc of Object.values(historicalDocMap)) {
                if (oldDoc && oldDoc.startsWith(prefixNoDoc)) {
                  const seqNum = parseInt(oldDoc.slice(-2), 10);
                  if (
                    !isNaN(seqNum) &&
                    seqNum > maxSequencePerPrefix[prefixNoDoc]
                  ) {
                    maxSequencePerPrefix[prefixNoDoc] = seqNum;
                  }
                }
              }
            }

            maxSequencePerPrefix[prefixNoDoc]++;
            noDoc = `${prefixNoDoc}${String(maxSequencePerPrefix[prefixNoDoc]).padStart(2, "0")}`;
            historicalDocMap[historyKey] = noDoc;
          }
        }

        insertData.push([
          warehouse,
          rackcode,
          splitItem,
          split.qty,
          split.oem,
          loccode,
          noDoc,
          new Date(),
          new Date(),
        ]);
      }
    }

    if (insertData.length === 0) {
      await conn.rollback();
      return res
        .status(400)
        .json({ status: "error", message: "Tidak ada baris data valid!" });
    }

    await conn.query(
      `DELETE FROM so_all_wh_non_barcode_tagstock_db WHERE warehouse = ?`,
      [warehouse],
    );

    const chunkSize = 200;
    for (let i = 0; i < insertData.length; i += chunkSize) {
      const chunk = insertData.slice(i, i + chunkSize);
      await conn.query(
        `INSERT INTO so_all_wh_non_barcode_tagstock_db 
         (warehouse, rackcode, item, qty, oem, loccode, upload_batch, created_at, updated_at) 
         VALUES ?`,
        [chunk],
      );
    }

    await conn.commit();
    return res.json({ status: "success", inserted: insertData.length });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Upload error Non-Barcode:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  initFilters,
  getOperatorsByWarehouse,
  processRows,
  uploadExcel,
};
