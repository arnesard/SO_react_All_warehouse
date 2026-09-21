const express = require("express");
const { poolUtama } = require("../db/pool");

const router = express.Router();
const TABLE = "so_all_wh_master_size_db";

router.use((req, res, next) => {
  if (!poolUtama) {
    return res.status(500).json({
      status: "error",
      message: "DB_MAIN belum dikonfigurasi (cek file .env backend).",
    });
  }
  next();
});

function clean(v) {
  const t = (v ?? "").toString().trim();
  return t.length ? t : "-";
}

/** Same rule as the Laravel controller: join grade/product/type/brand/category
 *  (skipping empty or "-" parts) into a single searchable "pattern" string. */
function buildPattern({ grade, product, type, brand, category }) {
  const parts = [grade, product, type, brand, category].filter(
    (v) => v && v !== "-",
  );
  const pattern = parts.join(" ").trim();
  return pattern.length ? pattern : null;
}

// GET /api/master-size/data
router.get("/data", async (req, res) => {
  try {
    const [masterData] = await poolUtama.query(
      `SELECT * FROM ${TABLE} ORDER BY id DESC`,
    );
    const [whRows] = await poolUtama.query(
      `SELECT DISTINCT warehouse FROM ${TABLE}
       WHERE warehouse IS NOT NULL AND warehouse != '' ORDER BY warehouse ASC`,
    );
    const [gradeRows] = await poolUtama.query(
      `SELECT DISTINCT grade FROM ${TABLE}
       WHERE grade IS NOT NULL AND grade != '' ORDER BY grade ASC`,
    );

    res.json({
      master_data: masterData,
      filter_wh: whRows.map((r) => r.warehouse),
      filter_grade: gradeRows.map((r) => r.grade),
    });
  } catch (err) {
    console.error("[master-size] getData error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// POST /api/master-size/store
router.post("/store", async (req, res) => {
  try {
    const body = req.body || {};
    const product = clean(body.product);
    const type = clean(body.type);
    const brand = clean(body.brand);
    const category = clean(body.category);
    const grade = clean(body.grade);
    const pattern = buildPattern({ grade, product, type, brand, category });

    await poolUtama.query(
      `INSERT INTO ${TABLE}
        (warehouse, item, description, grade, product, type, brand, category, pattern, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        body.warehouse ?? null,
        (body.item ?? "").toString().trim(),
        (body.description ?? "").toString().trim(),
        body.grade ?? null,
        product,
        type,
        brand,
        category,
        pattern,
      ],
    );

    res.json({ status: "success", message: "Data Master Size berhasil disimpan!" });
  } catch (err) {
    console.error("[master-size] store error:", err);
    res.status(500).json({ status: "error", message: "Error Backend: " + err.message });
  }
});

// POST /api/master-size/update/:id
router.post("/update/:id", async (req, res) => {
  try {
    const body = req.body || {};
    const product = clean(body.product);
    const type = clean(body.type);
    const brand = clean(body.brand);
    const category = clean(body.category);
    const grade = clean(body.grade);
    const pattern = buildPattern({ grade, product, type, brand, category });

    await poolUtama.query(
      `UPDATE ${TABLE} SET
        warehouse = ?, item = ?, description = ?, grade = ?, product = ?,
        type = ?, brand = ?, category = ?, pattern = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        body.warehouse ?? null,
        (body.item ?? "").toString().trim(),
        (body.description ?? "").toString().trim(),
        body.grade ?? null,
        product,
        type,
        brand,
        category,
        pattern,
        req.params.id,
      ],
    );

    res.json({ status: "success", message: "Data Master Size berhasil diupdate!" });
  } catch (err) {
    console.error("[master-size] update error:", err);
    res.status(500).json({ status: "error", message: "Error Backend: " + err.message });
  }
});

// DELETE /api/master-size/delete/:id
router.delete("/delete/:id", async (req, res) => {
  try {
    await poolUtama.query(`DELETE FROM ${TABLE} WHERE id = ?`, [req.params.id]);
    res.json({ status: "success", message: "Data Master Size berhasil dihapus!" });
  } catch (err) {
    console.error("[master-size] destroy error:", err);
    res.status(500).json({ status: "error", message: "Error Backend: " + err.message });
  }
});

module.exports = router;
