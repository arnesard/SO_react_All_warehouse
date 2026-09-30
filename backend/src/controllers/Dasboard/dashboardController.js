const { poolUtama } = require("../../db/pool");

// 1. Comparison Data & Global Summary Cards
const getComparisonData = async (req, res) => {
  const { warehouse } = req.query;

  if (!warehouse) {
    return res
      .status(400)
      .json({ success: false, message: "Gudang tidak ditemukan" });
  }

  try {
    // 1. Agregasi per Pattern & Grade (Persis getComparisonData Laravel)
    const sqlData = `
      SELECT 
        m.pattern,
        m.grade,
        CAST(SUM(IFNULL(s.qty, 0)) AS SIGNED) AS qty_oracle,
        CAST(SUM(IFNULL(a.qty, 0)) AS SIGNED) AS qty_appkso,
        CAST(SUM(IFNULL(a.qty, 0)) - SUM(IFNULL(s.qty, 0)) AS SIGNED) AS variance,
        CAST(COUNT(CASE WHEN (IFNULL(a.qty, 0) - IFNULL(s.qty, 0)) < 0 THEN 1 END) AS SIGNED) AS sku_minus,
        CAST(COUNT(CASE WHEN (IFNULL(a.qty, 0) - IFNULL(s.qty, 0)) > 0 THEN 1 END) AS SIGNED) AS sku_plus
      FROM so_all_wh_master_size_db m
      LEFT JOIN so_all_wh_snapshot_db s 
        ON m.item = s.item AND s.warehouse = ?
      LEFT JOIN (
        SELECT item, warehouse, SUM(qty) AS qty 
        FROM so_all_wh_appkso_db 
        WHERE warehouse = ? 
        GROUP BY item, warehouse
      ) a ON m.item = a.item AND m.warehouse = a.warehouse
      WHERE m.warehouse = ?
      GROUP BY m.pattern, m.grade
      HAVING qty_oracle > 0 OR qty_appkso > 0
      ORDER BY m.pattern ASC
    `;
    const [rows] = await poolUtama.query(sqlData, [
      warehouse,
      warehouse,
      warehouse,
    ]);

    // 2. Kalkulasi Item-Level untuk Summary Cards (Join ke so_all_wh_price_db)
    const sqlItemLevel = `
      SELECT 
        m.item,
        m.pattern,
        m.grade,
        IFNULL(p.price, 0) AS std_price,
        IFNULL(s.qty, 0) AS qty_oracle,
        IFNULL(a.qty, 0) AS qty_appkso,
        (IFNULL(a.qty, 0) - IFNULL(s.qty, 0)) AS variance,
        ((IFNULL(a.qty, 0) - IFNULL(s.qty, 0)) * IFNULL(p.price, 0)) AS price_variance
      FROM so_all_wh_master_size_db m
      LEFT JOIN so_all_wh_price_db p 
        ON m.item = p.item
      LEFT JOIN so_all_wh_snapshot_db s 
        ON m.item = s.item AND s.warehouse = ?
      LEFT JOIN (
        SELECT item, warehouse, SUM(qty) AS qty 
        FROM so_all_wh_appkso_db 
        WHERE warehouse = ? 
        GROUP BY item, warehouse
      ) a ON m.item = a.item AND m.warehouse = a.warehouse
      WHERE m.warehouse = ?
      HAVING qty_oracle > 0 OR qty_appkso > 0
    `;
    const [items] = await poolUtama.query(sqlItemLevel, [
      warehouse,
      warehouse,
      warehouse,
    ]);

    let totalOracle = 0;
    let totalAppkso = 0;
    let totalPlus = 0;
    let totalMinus = 0;
    let grossVariance = 0;
    let totalPriceVariance = 0;
    let oePriceVariance = 0;
    let okPriceVariance = 0;
    let oeVariancePcs = 0;
    let okVariancePcs = 0;
    let oeSkuMinus = 0;
    let oeSkuPlus = 0;
    let okSkuMinus = 0;
    let okSkuPlus = 0;
    let unscannedSku = 0;
    let totalItemOracle = 0;
    let totalItemAppkso = 0;

    items.forEach((item) => {
      const oracle = Number(item.qty_oracle) || 0;
      const appkso = Number(item.qty_appkso) || 0;
      const variance = Number(item.variance) || 0;
      const priceVar = Number(item.price_variance) || 0;

      totalOracle += oracle;
      totalAppkso += appkso;
      grossVariance += Math.abs(variance);
      totalPriceVariance += priceVar;

      if (oracle > 0) totalItemOracle++;
      if (appkso > 0) totalItemAppkso++;
      if (oracle > 0 && appkso === 0) unscannedSku++;

      if (variance > 0) totalPlus += variance;
      if (variance < 0) totalMinus += Math.abs(variance);

      if (item.grade === "OE") {
        oeVariancePcs += variance;
        oePriceVariance += priceVar;
        if (variance < 0) oeSkuMinus++;
        if (variance > 0) oeSkuPlus++;
      } else if (item.grade === "OK") {
        okVariancePcs += variance;
        okPriceVariance += priceVar;
        if (variance < 0) okSkuMinus++;
        if (variance > 0) okSkuPlus++;
      }
    });

    const netVariance = totalAppkso - totalOracle;
    const accuracyRate =
      totalOracle > 0
        ? Number(((totalAppkso / totalOracle) * 100).toFixed(1))
        : 0;
    const variancePpm =
      totalOracle > 0 ? Math.round((grossVariance / totalOracle) * 1000000) : 0;
    const skuPercentage =
      totalItemOracle > 0
        ? Number(((totalItemAppkso / totalItemOracle) * 100).toFixed(1))
        : 0;

    const summary = {
      total_oracle: totalOracle,
      total_appkso: totalAppkso,
      net_variance: netVariance,
      gross_variance: grossVariance,
      total_plus: totalPlus,
      total_minus: totalMinus,
      unscanned_sku: unscannedSku,
      accuracy_rate: accuracyRate,
      variance_ppm: variancePpm,
      total_price_variance: totalPriceVariance,
      oe_price_variance: oePriceVariance,
      ok_price_variance: okPriceVariance,
      oe_variance_pcs: oeVariancePcs,
      ok_variance_pcs: okVariancePcs,
      oe_sku_minus: oeSkuMinus,
      oe_sku_plus: oeSkuPlus,
      ok_sku_minus: okSkuMinus,
      ok_sku_plus: okSkuPlus,
      total_item_oracle: totalItemOracle,
      total_item_appkso: totalItemAppkso,
      sku_percentage: skuPercentage,
    };

    return res.json({ success: true, data: rows, summary });
  } catch (error) {
    console.error("Error getComparisonData:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Modal 1: Detail Pattern (Data Plus & Minus)
const getDetailPattern = async (req, res) => {
  const { pattern, grade, warehouse } = req.query;

  try {
    const sql = `
      SELECT 
        m.item,
        m.description,
        IFNULL(s.qty, 0) AS qty_oracle,
        IFNULL(a.qty, 0) AS qty_appkso,
        (IFNULL(a.qty, 0) - IFNULL(s.qty, 0)) AS variance
      FROM so_all_wh_master_size_db m
      LEFT JOIN so_all_wh_snapshot_db s 
        ON m.item = s.item AND s.warehouse = ?
      LEFT JOIN (
        SELECT item, warehouse, SUM(qty) AS qty 
        FROM so_all_wh_appkso_db 
        WHERE warehouse = ? 
        GROUP BY item, warehouse
      ) a ON m.item = a.item AND m.warehouse = a.warehouse
      WHERE m.warehouse = ? AND m.pattern = ? AND m.grade = ?
      HAVING qty_oracle > 0 OR qty_appkso > 0
      ORDER BY variance ASC, m.item ASC
    `;
    const [rows] = await poolUtama.query(sql, [
      warehouse,
      warehouse,
      warehouse,
      pattern,
      grade,
    ]);

    const minusList = rows.filter((r) => Number(r.variance) < 0);
    const plusList = rows.filter((r) => Number(r.variance) > 0);

    return res.json({
      success: true,
      minusList,
      plusList,
      summary: {
        minus_sku: minusList.length,
        plus_sku: plusList.length,
      },
    });
  } catch (error) {
    console.error("Error getDetailPattern:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Modal 2: Riwayat Scan Operator
const getScanHistory = async (req, res) => {
  const { item, warehouse } = req.query;

  try {
    const sql = `
      SELECT 
        opr,
        oprname,
        nokso,
        item,
        deskripsi,
        qty
      FROM so_all_wh_appkso_db
      WHERE warehouse = ? AND item = ?
      ORDER BY nokso ASC, id ASC
    `;
    const [rows] = await poolUtama.query(sql, [warehouse, item]);
    const totalQty = rows.reduce(
      (acc, curr) => acc + (Number(curr.qty) || 0),
      0,
    );

    return res.json({ success: true, data: rows, total_qty: totalQty });
  } catch (error) {
    console.error("Error getScanHistory:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Modal 3: Unscanned Items
const getUnscannedItems = async (req, res) => {
  const { warehouse } = req.query;

  try {
    const sql = `
      SELECT 
        m.item,
        m.description,
        m.grade,
        s.qty AS qty_sisa,
        ROUND((IFNULL(a.qty, 0) / s.qty) * 100, 1) AS persen
      FROM so_all_wh_snapshot_db s
      JOIN so_all_wh_master_size_db m 
        ON s.item = m.item AND s.warehouse = m.warehouse
      LEFT JOIN (
        SELECT item, warehouse, SUM(qty) AS qty 
        FROM so_all_wh_appkso_db 
        WHERE warehouse = ? 
        GROUP BY item, warehouse
      ) a ON s.item = a.item AND s.warehouse = a.warehouse
      WHERE s.warehouse = ? AND (a.qty IS NULL OR a.qty = 0) AND s.qty > 0
      ORDER BY s.qty DESC
    `;
    const [rows] = await poolUtama.query(sql, [warehouse, warehouse]);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error getUnscannedItems:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Modal 5: Detail Price Pattern (Persis modal_detail_price.blade.php)
const getDetailPricePattern = async (req, res) => {
  const { pattern, grade, warehouse } = req.query;

  try {
    const sql = `
      SELECT 
        m.item,
        m.description,
        IFNULL(p.price, 0) AS price,
        IFNULL(p.price, 0) AS std_price,
        IFNULL(s.qty, 0) AS oracle_qty,
        IFNULL(s.qty, 0) AS qty_oracle,
        IFNULL(a.qty, 0) AS appkso_qty,
        IFNULL(a.qty, 0) AS qty_appkso,
        (IFNULL(a.qty, 0) - IFNULL(s.qty, 0)) AS variance,
        ((IFNULL(a.qty, 0) - IFNULL(s.qty, 0)) * IFNULL(p.price, 0)) AS variance_rp,
        ((IFNULL(a.qty, 0) - IFNULL(s.qty, 0)) * IFNULL(p.price, 0)) AS price_variance
      FROM so_all_wh_master_size_db m
      LEFT JOIN so_all_wh_price_db p 
        ON m.item = p.item
      LEFT JOIN so_all_wh_snapshot_db s 
        ON m.item = s.item AND s.warehouse = ?
      LEFT JOIN (
        SELECT item, warehouse, SUM(qty) AS qty 
        FROM so_all_wh_appkso_db 
        WHERE warehouse = ? 
        GROUP BY item, warehouse
      ) a ON m.item = a.item AND m.warehouse = a.warehouse
      WHERE m.warehouse = ? AND m.pattern = ? AND m.grade = ?
      HAVING oracle_qty > 0 OR appkso_qty > 0
      ORDER BY variance ASC, m.item ASC
    `;
    const [rows] = await poolUtama.query(sql, [
      warehouse,
      warehouse,
      warehouse,
      pattern,
      grade,
    ]);

    let totalPcs = 0;
    let totalRp = 0;
    let skuMinus = 0;
    let skuPlus = 0;
    let missingPriceCount = 0;

    rows.forEach((r) => {
      const v = Number(r.variance) || 0;
      const pv = Number(r.variance_rp) || 0;
      totalPcs += v;
      totalRp += pv;
      if (v < 0) skuMinus++;
      if (v > 0) skuPlus++;
      if (Number(r.price) === 0) missingPriceCount++;
    });

    return res.json({
      success: true,
      data: rows,
      summary: {
        total_pcs_variance: totalPcs,
        total_rp_variance: totalRp,
        sku_minus: skuMinus,
        sku_plus: skuPlus,
        total_sku_dinamis: skuMinus + skuPlus,
        missing_price_count: missingPriceCount,
      },
    });
  } catch (error) {
    console.error("Error getDetailPricePattern:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Modal 6: Detail per Grade (Persis modal_detail_grade.blade.php)
const getDetailGrade = async (req, res) => {
  const { grade, warehouse } = req.query;

  try {
    let whereGrade = "m.grade = ?";
    const params = [warehouse, warehouse, warehouse];

    if (grade === "MIX") {
      whereGrade = "m.grade IN ('OE', 'OK')";
    } else {
      params.push(grade);
    }

    const sql = `
      SELECT 
        m.pattern,
        m.item,
        m.description,
        m.grade,
        IFNULL(s.qty, 0) AS oracle_qty,
        IFNULL(s.qty, 0) AS qty_oracle,
        IFNULL(a.qty, 0) AS appkso_qty,
        IFNULL(a.qty, 0) AS qty_appkso,
        (IFNULL(a.qty, 0) - IFNULL(s.qty, 0)) AS variance
      FROM so_all_wh_master_size_db m
      LEFT JOIN so_all_wh_snapshot_db s 
        ON m.item = s.item AND s.warehouse = ?
      LEFT JOIN (
        SELECT item, warehouse, SUM(qty) AS qty 
        FROM so_all_wh_appkso_db 
        WHERE warehouse = ? 
        GROUP BY item, warehouse
      ) a ON m.item = a.item AND m.warehouse = a.warehouse
      WHERE m.warehouse = ? AND ${whereGrade}
      HAVING (appkso_qty - oracle_qty) != 0
      ORDER BY variance ASC, m.pattern ASC
    `;
    const [rows] = await poolUtama.query(sql, params);

    let totalPcs = 0;
    let minusSku = 0;
    let plusSku = 0;

    rows.forEach((r) => {
      const v = Number(r.variance) || 0;
      totalPcs += v;
      if (v < 0) minusSku++;
      if (v > 0) plusSku++;
    });

    return res.json({
      success: true,
      data: rows,
      summary: {
        total_pcs: totalPcs,
        minus_sku: minusSku,
        plus_sku: plusSku,
      },
    });
  } catch (error) {
    console.error("Error getDetailGrade:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Modal 7: Detail Matriks PPM (Persis modal_detail_ppm.blade.php)
const getDetailPpm = async (req, res) => {
  const { warehouse } = req.query;

  try {
    const sql = `
      SELECT 
        IFNULL(NULLIF(m.pattern, ''), 'OTHER') AS product,
        m.grade,
        CAST(SUM(IFNULL(s.qty, 0)) AS SIGNED) AS on_hand,
        CAST(SUM(IFNULL(a.qty, 0)) AS SIGNED) AS counted
      FROM so_all_wh_master_size_db m
      LEFT JOIN so_all_wh_snapshot_db s 
        ON m.item = s.item AND s.warehouse = ?
      LEFT JOIN (
        SELECT item, warehouse, SUM(qty) AS qty 
        FROM so_all_wh_appkso_db 
        WHERE warehouse = ? 
        GROUP BY item, warehouse
      ) a ON m.item = a.item AND m.warehouse = a.warehouse
      WHERE m.warehouse = ?
      GROUP BY m.pattern, m.grade
      HAVING on_hand > 0 OR counted > 0
      ORDER BY product ASC, m.grade ASC
    `;
    const [rows] = await poolUtama.query(sql, [
      warehouse,
      warehouse,
      warehouse,
    ]);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error getDetailPpm:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getComparisonData,
  getDetailPattern,
  getScanHistory,
  getUnscannedItems,
  getDetailPricePattern,
  getDetailGrade,
  getDetailPpm,
};
