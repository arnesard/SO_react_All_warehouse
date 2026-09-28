const XLSX = require("xlsx-js-style");
const { poolUtama } = require("../../db/pool");

// Helper parse range lot: "B01-B65" -> { letter: 'B', from: 1, to: 65 }
const parseLotRange = (lotStr) => {
  if (!lotStr) return null;
  const match = String(lotStr)
    .trim()
    .match(/^([A-Z]+)(\d+)-[A-Z]+(\d+)$/i);
  if (match) {
    return {
      letter: match[1].toUpperCase(),
      from: parseInt(match[2], 10),
      to: parseInt(match[3], 10),
    };
  }
  return null;
};

// Helper parse nokso: "G2B2401" -> { gedung: 'BPW02', letter: 'B', number: 24 }
const parseNokso = (nokso) => {
  if (!nokso) return null;
  const match = String(nokso)
    .trim()
    .match(/^G(\d+)([A-Z]+)(\d{2})\d{2}$/i);
  if (match) {
    return {
      gedung: `BPW0${match[1]}`,
      letter: match[2].toUpperCase(),
      number: parseInt(match[3], 10),
    };
  }
  return null;
};

// 1. Ambil List Gudang
const getWarehouseList = async (req, res) => {
  try {
    const [rows] = await poolUtama.query(
      `SELECT DISTINCT warehouse FROM so_all_wh_appkso_db WHERE warehouse IS NOT NULL AND warehouse != '' ORDER BY warehouse ASC`,
    );
    const warehouses = rows.map((r) => r.warehouse);
    return res.json({ status: "success", warehouses });
  } catch (error) {
    console.error("Error getWarehouseList APPKSO:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// 2. Ambil Data Detail, Resume, dan Pattern
const getData = async (req, res) => {
  const { warehouse } = req.query;

  if (!warehouse) {
    return res.json({ detail: [], resume: [], pattern: [] });
  }

  try {
    // A. Tarik Data Mentah Detail + Master Size Pattern
    const sqlDetail = `
      SELECT 
        a.*,
        IFNULL(NULLIF(m.pattern, ''), 'KOSONG / UNMAPPED') AS pattern_name
      FROM so_all_wh_appkso_db a
      LEFT JOIN so_all_wh_master_size_db m 
        ON a.item = m.item AND a.warehouse = m.warehouse
      WHERE a.warehouse = ?
      ORDER BY a.id DESC
    `;
    const [rawDetail] = await poolUtama.query(sqlDetail, [warehouse]);

    // B. Tarik Daftar Auditor untuk warehouse ini
    const [auditorList] = await poolUtama.query(
      `SELECT nama, gedung, lot FROM so_all_wh_pic_auditor_db WHERE warehouse = ?`,
      [warehouse],
    );

    // C. Pemetaan Auditor ke baris Detail
    const detailData = rawDetail.map((row) => {
      let auditorNama = "-";
      const parsed = parseNokso(row.nokso);

      if (parsed) {
        for (const aud of auditorList) {
          if (
            String(aud.gedung || "")
              .trim()
              .toUpperCase() !== parsed.gedung
          )
            continue;
          const range = parseLotRange(aud.lot);
          if (!range) continue;

          if (
            range.letter === parsed.letter &&
            parsed.number >= range.from &&
            parsed.number <= range.to
          ) {
            auditorNama = String(aud.nama || "").trim();
            break;
          }
        }
      }

      return {
        ...row,
        auditor_nama: auditorNama,
      };
    });

    // D. Resume Operator (Kelompokkan per OPR & OPRNAME)
    const sqlResume = `
      SELECT 
        opr,
        oprname,
        COUNT(item) AS total_sku,
        SUM(qty) AS total_qty
      FROM so_all_wh_appkso_db
      WHERE warehouse = ?
      GROUP BY opr, oprname
      ORDER BY total_sku DESC, oprname ASC
    `;
    const [rawResume] = await poolUtama.query(sqlResume, [warehouse]);
    const resumeData = rawResume.map((r) => ({
      ...r,
      total_sku: Number(r.total_sku) || 0,
      total_qty: Number(r.total_qty) || 0,
    }));

    // E. Snapshot Pattern
    const sqlPattern = `
      SELECT 
        IFNULL(NULLIF(m.pattern, ''), 'KOSONG / UNMAPPED') AS pattern_name,
        COUNT(a.item) AS total_sku,
        SUM(a.qty) AS total_qty
      FROM so_all_wh_appkso_db a
      LEFT JOIN so_all_wh_master_size_db m 
        ON a.item = m.item AND a.warehouse = m.warehouse
      WHERE a.warehouse = ?
      GROUP BY IFNULL(NULLIF(m.pattern, ''), 'KOSONG / UNMAPPED')
      ORDER BY total_qty DESC
    `;
    const [rawPattern] = await poolUtama.query(sqlPattern, [warehouse]);
    const patternData = rawPattern.map((p) => ({
      ...p,
      total_sku: Number(p.total_sku) || 0,
      total_qty: Number(p.total_qty) || 0,
    }));

    return res.json({
      detail: detailData,
      resume: resumeData,
      pattern: patternData,
    });
  } catch (error) {
    console.error("Error getData APPKSO:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// 3. Import Data Excel
const importExcel = async (req, res) => {
  const warehouse = (req.body.warehouse || "").trim().toUpperCase();
  const file = req.file;

  if (!warehouse) {
    return res
      .status(400)
      .json({ status: "error", message: "Parameter Warehouse wajib dipilih!" });
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
        message: "Struktur isi berkas Excel kosong!",
      });
    }

    // Ambil Sampel Item Baris Pertama (Kolom Index 4)
    let sampleItem = "";
    if (rows[1] && rows[1][4]) {
      sampleItem = String(rows[1][4]).trim().toUpperCase();
    }

    if (!sampleItem) {
      return res.status(400).json({
        status: "error",
        message: "Kode item pada baris pertama kosong!",
      });
    }

    conn = await poolUtama.getConnection();
    await conn.beginTransaction();

    // 🔒 Proteksi Silang Asal-Usul File Gudang
    const [checkItem] = await conn.query(
      `SELECT 1 FROM so_all_wh_barcode_monstock_auto_db WHERE warehouse = ? AND item = ? LIMIT 1`,
      [warehouse, sampleItem],
    );

    if (checkItem.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        status: "error",
        message: `VALIDASI REJECTED: File Excel salah comot bro! Item Ban [${sampleItem}] tidak terdaftar di Gudang ${warehouse}.`,
      });
    }

    // 🪓 Hapus data lama untuk warehouse terkait
    await conn.query(`DELETE FROM so_all_wh_appkso_db WHERE warehouse = ?`, [
      warehouse,
    ]);

    const uniqueKeys = new Set();
    const insertData = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[4] || String(row[4]).trim() === "") continue;

      const noKso = row[3] ? String(row[3]).trim() : "";
      const item = String(row[4]).trim().toUpperCase();
      const qty = parseInt(row[6] || 0, 10);

      // Filter Duplikasi Kombinasi 3 Kolom Unik (nokso + item + qty)
      const uniqueKey = `${noKso}_${item}_${qty}`;
      if (uniqueKeys.has(uniqueKey)) continue;
      uniqueKeys.add(uniqueKey);

      // Format Tanggal Verifikasi
      let tglVerifikasi = null;
      if (row[8]) {
        const d = new Date(row[8]);
        if (!isNaN(d.getTime())) {
          tglVerifikasi = d.toISOString().slice(0, 19).replace("T", " ");
        }
      }

      insertData.push([
        warehouse,
        row[0] ? String(row[0]).trim() : null,
        row[1] ? String(row[1]).trim() : null,
        row[2] ? String(row[2]).trim() : null,
        noKso || null,
        item,
        row[5] ? String(row[5]).trim() : null,
        qty,
        row[7] ? String(row[7]).trim() : null,
        tglVerifikasi,
        new Date(),
        new Date(),
      ]);
    }

    if (insertData.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < insertData.length; i += chunkSize) {
        const chunk = insertData.slice(i, i + chunkSize);
        await conn.query(
          `INSERT INTO so_all_wh_appkso_db 
           (warehouse, tgl, opr, oprname, nokso, item, deskripsi, qty, verifikasi_nama, tanggal_verifikasi, created_at, updated_at) 
           VALUES ?`,
          [chunk],
        );
      }
    }

    await conn.commit();
    return res.json({
      status: "success",
      message: `Sukses membersihkan data lama & mengunggah ${insertData.length} baris data unik ke Gudang ${warehouse}!`,
      inserted: insertData.length,
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Error importExcel APPKSO:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  getWarehouseList,
  getData,
  importExcel,
};
