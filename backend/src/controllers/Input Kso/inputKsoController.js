const { poolUtama } = require("../../db/pool");

// 1. Inisiasi Event SO & Tarik Saldo Snapshot ke ms_cntso
const initEventSo = async (req, res) => {
  const { so_name, def_counter, date_stock, warehouse } = req.body;

  if (!so_name || !warehouse) {
    return res.status(400).json({
      success: false,
      message: "Nama Event SO dan Gudang wajib diisi!",
    });
  }

  const conn = await poolUtama.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Masukkan warehouse ke ms_kso
    await conn.query(
      `INSERT INTO ms_kso (warehouse, so_name, def_counter, date_stock, flag)
       VALUES (?, ?, ?, ?, 'Y')
       ON DUPLICATE KEY UPDATE def_counter = VALUES(def_counter), date_stock = VALUES(date_stock), flag = 'Y'`,
      [
        warehouse,
        so_name,
        def_counter || "",
        date_stock || new Date().toISOString().split("T")[0],
      ],
    );

    // Hapus snapshot lama untuk event dan warehouse ini agar tidak dobel
    await conn.query(
      `DELETE FROM ms_cntso WHERE kso_name = ? AND warehouse = ?`,
      [so_name, warehouse],
    );

    // 2. Masukkan warehouse ke ms_cntso saat menyalin dari snapshot
    const sqlSyncSnapshot = `
      INSERT INTO ms_cntso (warehouse, kso_name, kso_counter, kso_datestock, kso_item, kso_descr, kso_qtybar, kso_qtyorc, kso_type)
      SELECT 
        ? AS warehouse,
        ? AS kso_name,
        ? AS kso_counter,
        NOW() AS kso_datestock,
        s.item AS kso_item,
        IFNULL(m.description, '-') AS kso_descr,
        0 AS kso_qtybar,
        CAST(s.qty AS SIGNED) AS kso_qtyorc,
        IFNULL(m.grade, 'OK') AS kso_type
      FROM so_all_wh_snapshot_db s
      LEFT JOIN so_all_wh_master_size_db m 
        ON s.item = m.item AND s.warehouse = m.warehouse
      WHERE s.warehouse = ?
    `;
    const [insertResult] = await conn.query(sqlSyncSnapshot, [
      warehouse,
      so_name,
      def_counter || "",
      warehouse,
    ]);

    await conn.commit();
    return res.json({
      success: true,
      message: `Event SO [${so_name}] aktif! ${insertResult.affectedRows} item snapshot berhasil disinkronkan.`,
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error initEventSo:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};

// Ambil Event SO yang Sedang Aktif berdasarkan Warehouse
const getActiveEvent = async (req, res) => {
  const { warehouse } = req.query;
  try {
    let sql = `SELECT so_name, def_counter, date_stock, warehouse FROM ms_kso WHERE flag = 'Y'`;
    const params = [];
    if (warehouse && warehouse !== "ALL") {
      sql += ` AND warehouse = ?`;
      params.push(warehouse);
    }
    sql += ` ORDER BY recid DESC LIMIT 1`;

    const [rows] = await poolUtama.query(sql, params);
    return res.json({ success: true, activeEvent: rows[0] || null });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Lookup Info Item Code Realtime dari Master Size & Snapshot
const checkItemInfo = async (req, res) => {
  const { item, warehouse } = req.query;
  if (!item)
    return res
      .status(400)
      .json({ success: false, message: "Item code kosong" });

  try {
    const [rows] = await poolUtama.query(
      `SELECT m.item, m.description, m.pattern, m.grade, IFNULL(s.qty, 0) as qty_oracle
       FROM so_all_wh_master_size_db m
       LEFT JOIN so_all_wh_snapshot_db s ON m.item = s.item AND s.warehouse = ?
       WHERE m.item = ? AND m.warehouse = ?
       LIMIT 1`,
      [warehouse, item, warehouse],
    );

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: "Item tidak ditemukan di Master Size",
      });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Input Hasil Hitung PIC Lapangan (Simpan ke cntso & Auto-Sync ke so_all_wh_appkso_db)
const savePicScan = async (req, res) => {
  const { so_name, no_doc, item_code, qty_stk, opr_code, opr_name, warehouse } =
    req.body;

  if (!no_doc || !item_code || qty_stk === undefined || !warehouse) {
    return res
      .status(400)
      .json({ success: false, message: "Data scan belum lengkap!" });
  }

  const conn = await poolUtama.getConnection();
  try {
    await conn.beginTransaction();

    const now = new Date();
    const dateOnly = now.toISOString().split("T")[0];
    const nowStr = now.toISOString().replace("T", " ").substring(0, 19);

    // 1. Simpan ke cntso
    await conn.query(
      `INSERT INTO cntso (warehouse, NoDoc, ItemCode, QtyStk, txndate, ydate_shift, opr, so_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
      [
        warehouse,
        no_doc,
        item_code,
        Number(qty_stk),
        nowStr,
        dateOnly,
        opr_code || "",
        so_name || "",
      ],
    );

    // Ambil info deskripsi untuk tabel appkso (tambahkan wildcard/fallback)
    const [descRows] = await conn.query(
      `SELECT description FROM so_all_wh_master_size_db WHERE item = ? LIMIT 1`,
      [item_code],
    );
    const deskripsi = descRows[0]?.description || "-";

    // 2. Auto-Sync ke so_all_wh_appkso_db
    await conn.query(
      `INSERT INTO so_all_wh_appkso_db (warehouse, tgl, nokso, opr, oprname, item, deskripsi, qty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        warehouse,
        dateOnly,
        no_doc,
        opr_code || "",
        opr_name || "",
        item_code,
        deskripsi,
        Number(qty_stk),
      ],
    );

    await conn.commit();
    return res.json({
      success: true,
      message: `NoDoc ${no_doc} (${item_code}) berhasil disimpan!`,
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error savePicScan:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};

// 5. Validasi Dokumen oleh Auditor
const validateDoc = async (req, res) => {
  const { no_doc, auditor_name, warehouse } = req.body;

  if (!no_doc || !auditor_name) {
    return res
      .status(400)
      .json({ success: false, message: "NoDoc dan nama Auditor wajib ada!" });
  }

  const conn = await poolUtama.getConnection();
  try {
    await conn.beginTransaction();

    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);

    // 1. Update cntso
    const [resCnt] = await conn.query(
      `UPDATE cntso 
       SET opr_v = ?, scantime_v = ?, status = 'VERIFIED'
       WHERE NoDoc = ? AND (warehouse = ? OR ? = '')`,
      [auditor_name, nowStr, no_doc, warehouse || "", warehouse || ""],
    );

    // 2. Update so_all_wh_appkso_db
    await conn.query(
      `UPDATE so_all_wh_appkso_db 
       SET verifikasi_nama = ?, tanggal_verifikasi = ?
       WHERE nokso = ? AND (warehouse = ? OR ? = '')`,
      [auditor_name, nowStr, no_doc, warehouse || "", warehouse || ""],
    );

    await conn.commit();

    if (resCnt.affectedRows === 0) {
      return res.json({
        success: false,
        message: `NoDoc ${no_doc} tidak ditemukan di database scan!`,
      });
    }

    return res.json({
      success: true,
      message: `NoDoc ${no_doc} berhasil diverifikasi oleh ${auditor_name}!`,
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error validateDoc:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};

// 6. Ambil Riwayat Scan Hari Ini (Saring per Warehouse)
const getRecentScans = async (req, res) => {
  const { warehouse } = req.query;
  try {
    let sql = `
      SELECT c.recid, c.warehouse, c.NoDoc, c.ItemCode, c.QtyStk, c.txndate, c.opr, c.opr_v, c.scantime_v, c.status,
             IFNULL(m.description, '-') as description
      FROM cntso c
      LEFT JOIN so_all_wh_master_size_db m 
        ON c.ItemCode = m.item AND (m.warehouse = c.warehouse OR m.warehouse IS NULL)
    `;
    const params = [];

    if (warehouse) {
      sql += ` WHERE c.warehouse = ? `;
      params.push(warehouse);
    }

    sql += ` ORDER BY c.recid DESC LIMIT 50`;

    const [rows] = await poolUtama.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error getRecentScans:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Ambil semua daftar Event SO per Warehouse untuk dropdown
const getAllEvents = async (req, res) => {
  const { warehouse } = req.query;
  try {
    let sql = `SELECT so_name, def_counter, date_stock, flag, warehouse FROM ms_kso`;
    const params = [];
    if (warehouse && warehouse !== "ALL") {
      sql += ` WHERE warehouse = ?`;
      params.push(warehouse);
    }
    sql += ` ORDER BY recid DESC`;

    const [rows] = await poolUtama.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Set Event Terpilih Menjadi Default (flag = 'Y')
const setDefaultEvent = async (req, res) => {
  const { so_name, warehouse } = req.body;
  if (!so_name || !warehouse) {
    return res
      .status(400)
      .json({ success: false, message: "Data tidak lengkap" });
  }

  const conn = await poolUtama.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Matikan semua flag event milik gudang ini
    await conn.query(`UPDATE ms_kso SET flag = 'N' WHERE warehouse = ?`, [
      warehouse,
    ]);

    // 2. Aktifkan event yang dipilih
    await conn.query(
      `UPDATE ms_kso SET flag = 'Y' WHERE so_name = ? AND warehouse = ?`,
      [so_name, warehouse],
    );

    await conn.commit();
    return res.json({
      success: true,
      message: `Event [${so_name}] berhasil dijadikan default!`,
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};

// Pastikan di module.exports ditambahkan getAllEvents dan setDefaultEvent:
module.exports = {
  initEventSo,
  getActiveEvent,
  checkItemInfo,
  savePicScan,
  validateDoc,
  getRecentScans,
  getAllEvents,
  setDefaultEvent,
};
