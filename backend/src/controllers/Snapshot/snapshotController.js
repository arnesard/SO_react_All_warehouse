const { poolUtama } = require("../../db/pool");

const TABLE = "so_all_wh_snapshot_db";

// Middleware verifikasi pool database
const checkDbConnection = (req, res, next) => {
  if (!poolUtama) {
    return res.status(500).json({
      success: false,
      message: "DB_MAIN belum dikonfigurasi (cek file .env backend).",
    });
  }
  next();
};

// GET /api/snapshot/get-warehouses
const getWarehouses = async (req, res) => {
  try {
    const [rows] = await poolUtama.query(
      `SELECT DISTINCT warehouse FROM ${TABLE}
       WHERE warehouse IS NOT NULL ORDER BY warehouse ASC`,
    );
    res.json({ success: true, warehouses: rows.map((r) => r.warehouse) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/snapshot/data?warehouse=&search=
const getData = async (req, res) => {
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
};

// POST /api/snapshot/import
const importSnapshot = async (req, res) => {
  const warehouse = (req.body.warehouse || "").trim().toUpperCase();
  const sampleItem = (req.body.sample_item || "").trim().toUpperCase();
  const excelData = req.body.excel_data;

  if (!warehouse) {
    return res
      .status(400)
      .json({ success: false, message: "Target gudang wajib diisi bro!" });
  }
  if (!Array.isArray(excelData) || excelData.length === 0) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Data JSON dari browser kosong / korup!",
      });
  }

  try {
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
          [
            batch.map((r) => [
              r.warehouse,
              r.item,
              r.qty,
              new Date(),
              new Date(),
            ]),
          ],
        );
        insertCount += batch.length;
        batch = [];
      };

      for (let key = 0; key < excelData.length; key++) {
        if (key === 0) continue; // skip header baris pertama
        const row = excelData[key] || [];
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
    res
      .status(500)
      .json({ success: false, message: "Gagal Insert DB: " + err.message });
  }
};

module.exports = {
  checkDbConnection,
  getWarehouses,
  getData,
  importSnapshot,
};
