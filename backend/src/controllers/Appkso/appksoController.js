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

module.exports = {
  getWarehouseList,
  getData,
};
