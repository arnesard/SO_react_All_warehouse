const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const { poolUtama } = require("../db/pool");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const TABLE = "so_all_wh_snapshot_db";

router.use((req, res, next) => {
  if (!poolUtama) {
    return res.status(500).json({
      success: false,
      message: "DB_MAIN belum dikonfigurasi (cek file .env backend).",
    });
  }
  next();
});

// GET /api/snapshot/get-warehouses
router.get("/get-warehouses", async (req, res) => {
  try {
    const [rows] = await poolUtama.query(
      `SELECT DISTINCT warehouse FROM ${TABLE}
       WHERE warehouse IS NOT NULL ORDER BY warehouse ASC`,
    );
    res.json({ success: true, warehouses: rows.map((r) => r.warehouse) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/snapshot/data?warehouse=&search=
router.get("/data", async (req, res) => {
  try {
    const { warehouse, search } = req.query;

    let sql = `
      SELECT snap.id, snap.warehouse, snap.item, snap.qty, master.description
      FROM ${TABLE} snap
      LEFT JOIN so_all_wh_master_size_db master
        ON snap.item = master.item AND snap.warehouse = master.warehouse
      WHERE 1 = 1`;
    const params = [];

    if (warehouse) {
      sql += " AND snap.warehouse = ?";
      params.push(warehouse);
    }
    if (search) {
      sql += " AND (snap.item LIKE ? OR master.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY snap.updated_at DESC";

    const [rows] = await poolUtama.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/snapshot/import  (multipart: file_excel, warehouse)
// Parses the workbook server-side (SheetJS) instead of in the browser, then
// applies the same rules as the Laravel importExcel(): validate one sample
// item against Master Size for that warehouse, wipe old rows, batch insert.
router.post("/import", upload.single("file_excel"), async (req, res) => {
  const warehouse = (req.body.warehouse || "").trim().toUpperCase();

  if (!warehouse) {
    return res.status(400).json({ success: false, message: "Target gudang wajib diisi bro!" });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Data Excel dari browser kosong / korup!" });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const sheetRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    if (sheetRows.length <= 1) {
      return res.status(400).json({ success: false, message: "Struktur isi berkas Excel kosong bro!" });
    }

    const sampleItem = sheetRows[1] && sheetRows[1][0] ? String(sheetRows[1][0]).trim().toUpperCase() : "";

    // Proteksi silang: item sampel harus terdaftar di Master Size untuk gudang ini.
    if (sampleItem) {
      const [existsRows] = await poolUtama.query(
        `SELECT 1 FROM so_all_wh_master_size_db WHERE warehouse = ? AND item = ? LIMIT 1`,
        [warehouse, sampleItem],
      );
      if (existsRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: `VALIDASI REJECTED: Item sampel [${sampleItem}] tidak terdaftar di Gudang ${warehouse} pada Master Size DB. Pastikan file Excel sesuai dengan gudang tujuan!`,
        });
      }
    }

    const conn = await poolUtama.getConnection();
    let insertCount = 0;
    try {
      await conn.beginTransaction();
      await conn.query(`DELETE FROM ${TABLE} WHERE warehouse = ?`, [warehouse]);

      let batch = [];
      const flush = async () => {
        if (batch.length === 0) return;
        await conn.query(
          `INSERT INTO ${TABLE} (warehouse, item, qty, created_at, updated_at) VALUES ?`,
          [batch.map((r) => [r.warehouse, r.item, r.qty, new Date(), new Date()])],
        );
        insertCount += batch.length;
        batch = [];
      };

      for (let key = 1; key < sheetRows.length; key++) {
        const row = sheetRows[key];
        const item = String(row[0] ?? "").trim();
        if (!item) continue;

        const rawQty = String(row[1] ?? "0").replace(/,|\s/g, "");
        const qty = parseInt(rawQty, 10) || 0;

        batch.push({ warehouse, item: item.toUpperCase(), qty });
        if (batch.length >= 500) await flush();
      }
      await flush();

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    res.json({
      success: true,
      message: `Beres bro! ${insertCount} baris data Snapshot berhasil disuntik ke Gudang ${warehouse}.`,
    });
  } catch (err) {
    console.error("[snapshot] import error:", err);
    res.status(500).json({ success: false, message: "Gagal Insert DB: " + err.message });
  }
});

module.exports = router;
