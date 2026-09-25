const { poolUtama } = require("../../db/pool");

const checkDbConnection = (req, res, next) => {
  if (!poolUtama) {
    return res.status(500).json({
      status: "error",
      message: "DB_MAIN belum dikonfigurasi (cek file .env backend).",
    });
  }
  next();
};

// GET /api/tagstock/init-filters
const initFilters = async (req, res) => {
  try {
    const [warehouses] = await poolUtama.query(
      `SELECT warehouse, MAX(updated_at) as last_upload 
       FROM so_all_wh_barcode_monstock_auto_db 
       WHERE warehouse IS NOT NULL AND warehouse != '' 
       GROUP BY warehouse 
       ORDER BY warehouse ASC`,
    );

    const formattedWarehouses = warehouses.map((item) => {
      let lastUpload = "-";
      if (item.last_upload) {
        const d = new Date(item.last_upload);
        const pad = (n) => String(n).padStart(2, "0");
        lastUpload = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }
      return {
        warehouse: item.warehouse,
        last_upload: lastUpload,
      };
    });

    res.json({
      status: "success",
      warehouses: formattedWarehouses,
    });
  } catch (err) {
    console.error("[tagstock] initFilters error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// GET /api/tagstock/operators?warehouse=
const getOperatorsByWarehouse = async (req, res) => {
  const { warehouse } = req.query;
  if (!warehouse) {
    return res
      .status(400)
      .json({ status: "error", message: "Warehouse wajib dipilih!" });
  }

  try {
    const [operators] = await poolUtama.query(
      `SELECT no_penneng, nama, gedung, 
              GROUP_CONCAT(lot ORDER BY lot ASC SEPARATOR ', ') as combined_lot 
       FROM so_all_wh_pic_stock_db 
       WHERE warehouse = ? AND no_penneng IS NOT NULL AND no_penneng != '' 
       GROUP BY no_penneng, nama, gedung 
       ORDER BY nama ASC`,
      [warehouse],
    );

    res.json({
      status: "success",
      operators,
    });
  } catch (err) {
    console.error("[tagstock] getOperators error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// POST /api/tagstock/process-rows
const processRows = async (req, res) => {
  const { warehouse, operator_id, doc_start, doc_end } = req.body;

  if (!warehouse || !operator_id) {
    return res
      .status(400)
      .json({ status: "error", message: "Filter belum lengkap" });
  }

  try {
    const [picInfos] = await poolUtama.query(
      `SELECT * FROM so_all_wh_pic_stock_db WHERE no_penneng = ? AND warehouse = ?`,
      [operator_id, warehouse],
    );

    if (picInfos.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "PIC tidak ditemukan" });
    }

    const lotConditions = [];
    const lotParams = [];

    for (const pic of picInfos) {
      const gedung = (pic.gedung || "").trim().toUpperCase();
      const lotRaw = (pic.lot || "").trim();
      const lotParts = lotRaw.split("-");
      const awal = (lotParts[0] || "").trim();
      const akhir = (lotParts[1] || awal).trim();

      lotConditions.push(
        `(a.loccode LIKE ? AND SUBSTRING_INDEX(a.loccode, '-', -1) BETWEEN ? AND ?)`,
      );
      lotParams.push(`${gedung}-%`, awal, akhir);
    }

    let sql = `
      SELECT a.loccode as lot_display, a.no_doc, a.item, m.description, a.Rak, a.Qty 
      FROM so_all_wh_barcode_monstock_auto_db a 
      LEFT JOIN so_all_wh_master_size_db m 
        ON a.item = m.item AND a.warehouse = m.warehouse 
      WHERE a.warehouse = ? AND (${lotConditions.join(" OR ")})
    `;
    const params = [warehouse, ...lotParams];

    if (doc_start && doc_end) {
      sql += ` AND a.no_doc BETWEEN ? AND ?`;
      params.push(doc_start, doc_end);
    }

    sql += ` ORDER BY a.no_doc ASC`;

    const [rows] = await poolUtama.query(sql, params);

    res.json({
      status: "success",
      master_data: rows,
    });
  } catch (err) {
    console.error("[tagstock] processRows error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// POST /api/tagstock/validate-appkso
const validateAppkso = async (req, res) => {
  const { warehouse, operator_id, doc_start, doc_end } = req.body;

  if (!warehouse || !operator_id) {
    return res
      .status(400)
      .json({ status: "error", message: "Filter belum lengkap" });
  }

  try {
    const [picInfos] = await poolUtama.query(
      `SELECT * FROM so_all_wh_pic_stock_db WHERE no_penneng = ? AND warehouse = ?`,
      [operator_id, warehouse],
    );

    if (picInfos.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "PIC tidak ditemukan" });
    }

    const lotConditions = [];
    const lotParams = [];

    for (const pic of picInfos) {
      const gedung = (pic.gedung || "").trim().toUpperCase();
      const lotParts = (pic.lot || "").trim().split("-");
      const awal = (lotParts[0] || "").trim();
      const akhir = (lotParts[1] || awal).trim();

      lotConditions.push(
        `(a.loccode LIKE ? AND SUBSTRING_INDEX(a.loccode, '-', -1) BETWEEN ? AND ?)`,
      );
      lotParams.push(`${gedung}-%`, awal, akhir);
    }

    let sql = `
      SELECT a.loccode as lot_display, a.no_doc, a.item, m.description, a.Rak, 
             a.Qty as qty_tag, COALESCE(kso.total_qty, 0) as qty_appkso 
      FROM so_all_wh_barcode_monstock_auto_db a 
      LEFT JOIN so_all_wh_master_size_db m 
        ON a.item = m.item AND a.warehouse = m.warehouse 
      LEFT JOIN (
        SELECT nokso, item, SUM(qty) as total_qty 
        FROM so_all_wh_appkso_db 
        GROUP BY nokso, item
      ) kso ON a.no_doc = kso.nokso AND a.item = kso.item 
      WHERE a.warehouse = ? AND (${lotConditions.join(" OR ")})
    `;
    const params = [warehouse, ...lotParams];

    if (doc_start && doc_end) {
      sql += ` AND a.no_doc BETWEEN ? AND ?`;
      params.push(doc_start, doc_end);
    }

    sql += ` ORDER BY a.no_doc ASC`;

    const [rows] = await poolUtama.query(sql, params);

    res.json({
      status: "success",
      master_data: rows,
    });
  } catch (err) {
    console.error("[tagstock] validateAppkso error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// GET /api/tagstock/scan-history?warehouse=&doc=&item=
const getScanHistory = async (req, res) => {
  const { warehouse, doc, item } = req.query;
  try {
    const [history] = await poolUtama.query(
      `SELECT * FROM so_all_wh_appkso_db 
       WHERE warehouse = ? AND nokso = ? AND item = ? 
       ORDER BY created_at DESC`,
      [warehouse, doc, item],
    );

    res.json({ status: "success", data: history });
  } catch (err) {
    console.error("[tagstock] getScanHistory error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

module.exports = {
  checkDbConnection,
  initFilters,
  getOperatorsByWarehouse,
  processRows,
  validateAppkso,
  getScanHistory,
};
