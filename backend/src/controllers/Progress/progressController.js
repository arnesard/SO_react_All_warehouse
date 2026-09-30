const { poolUtama } = require("../../db/pool");

const prefixToGedung = {
  G1: "BPW01",
  G2: "BPW02",
  G3: "BPW03",
  G4: "BPW04",
};

const UNMAPPED_KEY = "BELUM TER-MAPPING";

function parseAuditorRules(auditorsRaw) {
  const auditorRules = [];
  const auditorStats = {};

  auditorsRaw.forEach((aud) => {
    const nama = (aud.nama || "").trim();
    const gedung = (aud.gedung || "").trim();

    if (!auditorStats[nama]) {
      auditorStats[nama] = {
        auditor: nama,
        gedung_list: [],
        total_data: 0,
        verified_data: 0,
        total_qty: 0,
        verified_qty: 0,
      };
    }

    if (gedung && !auditorStats[nama].gedung_list.includes(gedung)) {
      auditorStats[nama].gedung_list.push(gedung);
    }

    const lotStr = (aud.lot || "").replace(/\s+/g, "").toUpperCase().trim();
    let type = "list";
    let startLot = "";
    let endLot = "";
    let lots = [];

    if (lotStr.includes("-")) {
      const range = lotStr.split("-");
      type = "range";
      startLot = range[0] || "";
      endLot = range[1] && range[1] !== "" ? range[1] : startLot;
    } else {
      type = "list";
      lots = lotStr
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l !== "");
    }

    auditorRules.push({
      nama,
      gedung,
      type,
      start_lot: startLot,
      end_lot: endLot,
      lots,
    });
  });

  auditorStats[UNMAPPED_KEY] = {
    auditor: UNMAPPED_KEY,
    gedung_list: [],
    total_data: 0,
    verified_data: 0,
    total_qty: 0,
    verified_qty: 0,
  };

  return { auditorRules, auditorStats };
}

function findMappedAuditor(auditorRules, gedungApp, lotApp) {
  if (lotApp.length < 3) return UNMAPPED_KEY;

  const lotLetter = lotApp.substring(0, 1);
  const lotNumber = parseInt(lotApp.substring(1, 3), 10);

  for (const rule of auditorRules) {
    if (rule.gedung === gedungApp) {
      let matched = false;

      if (rule.type === "range") {
        const startLetter = rule.start_lot.substring(0, 1);
        const startNumber = parseInt(rule.start_lot.substring(1, 3), 10);
        const endLetter = rule.end_lot.substring(0, 1);
        const endNumber = parseInt(rule.end_lot.substring(1, 3), 10);

        if (lotLetter === startLetter && lotLetter === endLetter) {
          if (lotNumber >= startNumber && lotNumber <= endNumber) {
            matched = true;
          }
        }
      } else {
        if (rule.lots.includes(lotApp)) {
          matched = true;
        }
      }

      if (matched) {
        return rule.nama;
      }
    }
  }

  return UNMAPPED_KEY;
}

// 1. Ambil Summary Progress
const getProgressData = async (req, res) => {
  const selectedWarehouse = req.query.warehouse || "";
  const selectedGedung = req.query.gedung || "";
  const searchAuditor = req.query.auditor || "";

  try {
    // 1. List Sub-Gedung
    const [gedungRows] = await poolUtama.query(
      `SELECT DISTINCT gedung FROM so_all_wh_pic_auditor_db WHERE gedung IS NOT NULL AND gedung != '' ORDER BY gedung ASC`,
    );
    const gedungs = gedungRows.map((g) => g.gedung);

    // 2. Master Auditor Rules
    const [auditorsRaw] = await poolUtama.query(
      `SELECT * FROM so_all_wh_pic_auditor_db`,
    );
    const { auditorRules, auditorStats } = parseAuditorRules(auditorsRaw);

    // 3. Tarik Grouping APPKSO (Filter Warehouse jika ada)
    let sqlAppkso = `
      SELECT 
        LEFT(nokso, 2) AS prefix_gedung,
        SUBSTRING(nokso, 3, 3) AS extracted_lot,
        verifikasi_nama,
        COUNT(nokso) AS total_data,
        COUNT(CASE WHEN verifikasi_nama IS NOT NULL AND verifikasi_nama != '' THEN nokso END) AS verified_data,
        CAST(SUM(IFNULL(qty, 0)) AS SIGNED) AS total_qty,
        CAST(SUM(CASE WHEN verifikasi_nama IS NOT NULL AND verifikasi_nama != '' THEN IFNULL(qty, 0) ELSE 0 END) AS SIGNED) AS verified_qty
      FROM so_all_wh_appkso_db
    `;
    const params = [];
    if (selectedWarehouse) {
      sqlAppkso += ` WHERE warehouse = ? `;
      params.push(selectedWarehouse);
    }
    sqlAppkso += ` GROUP BY LEFT(nokso, 2), SUBSTRING(nokso, 3, 3), verifikasi_nama`;

    const [appksoData] = await poolUtama.query(sqlAppkso, params);

    const globalTotal = {
      total_data: 0,
      verified_data: 0,
      total_qty: 0,
      verified_qty: 0,
    };
    const gedungStats = {};

    // 4. Distribusi Teritori
    for (const app of appksoData) {
      const gedungApp = prefixToGedung[app.prefix_gedung] || "UNMAPPED";

      let lotApp = (app.extracted_lot || "").toUpperCase();
      const match = lotApp.match(/[A-Z]\d{2}/i);
      if (match) {
        lotApp = match[0].toUpperCase();
      }

      if (lotApp.length < 3) continue;

      const verifiedBy =
        app.verifikasi_nama && app.verifikasi_nama.trim() !== ""
          ? app.verifikasi_nama.trim()
          : null;

      const mappedAuditor = findMappedAuditor(auditorRules, gedungApp, lotApp);

      if (selectedGedung && gedungApp !== selectedGedung) {
        continue;
      }

      globalTotal.total_data += Number(app.total_data);
      globalTotal.verified_data += Number(app.verified_data);
      globalTotal.total_qty += Number(app.total_qty);
      globalTotal.verified_qty += Number(app.verified_qty);

      if (!gedungStats[gedungApp]) {
        gedungStats[gedungApp] = {
          lokasi: gedungApp,
          total_data: 0,
          verified_data: 0,
          total_qty: 0,
          verified_qty: 0,
        };
      }
      gedungStats[gedungApp].total_data += Number(app.total_data);
      gedungStats[gedungApp].verified_data += Number(app.verified_data);
      gedungStats[gedungApp].total_qty += Number(app.total_qty);
      gedungStats[gedungApp].verified_qty += Number(app.verified_qty);

      if (auditorStats[mappedAuditor]) {
        auditorStats[mappedAuditor].total_data += Number(app.total_data);
        auditorStats[mappedAuditor].total_qty += Number(app.total_qty);
      }

      if (verifiedBy && auditorStats[verifiedBy]) {
        auditorStats[verifiedBy].verified_data += Number(app.verified_data);
        auditorStats[verifiedBy].verified_qty += Number(app.verified_qty);
      }
    }

    let finalAuditorsData = [];
    Object.keys(auditorStats).forEach((key) => {
      const stat = auditorStats[key];
      if (key === UNMAPPED_KEY && stat.total_data === 0) return;

      stat.gedung_label =
        stat.gedung_list.length > 0 ? stat.gedung_list.join(", ") : "-";

      let statusText = "OPEN";
      if (stat.total_data > 0) {
        if (stat.verified_data === 0) {
          statusText = "OPEN";
        } else if (
          stat.verified_data > 0 &&
          stat.verified_data < stat.total_data
        ) {
          statusText = "PROSES";
        } else if (stat.verified_data === stat.total_data) {
          statusText = "SELESAI";
        }
      }
      stat.status = statusText;
      stat.isSiluman = stat.auditor === UNMAPPED_KEY;

      finalAuditorsData.push(stat);
    });

    if (searchAuditor) {
      const s = searchAuditor.toLowerCase();
      finalAuditorsData = finalAuditorsData.filter((item) =>
        item.auditor.toLowerCase().includes(s),
      );
    }

    finalAuditorsData.sort((a, b) => {
      if (a.auditor === UNMAPPED_KEY) return 1;
      if (b.auditor === UNMAPPED_KEY) return -1;
      return a.auditor.localeCompare(b.auditor);
    });

    const progressPerGedung = Object.values(gedungStats)
      .map((item) => ({
        ...item,
        progress:
          item.total_qty > 0
            ? Number(((item.verified_qty / item.total_qty) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => a.lokasi.localeCompare(b.lokasi));

    const globalProgress =
      globalTotal.total_qty > 0
        ? Number(
            ((globalTotal.verified_qty / globalTotal.total_qty) * 100).toFixed(
              2,
            ),
          )
        : 0;

    return res.json({
      success: true,
      gedungs,
      globalSummary: globalTotal,
      globalProgress,
      progressPerGedung,
      auditorsData: finalAuditorsData,
    });
  } catch (error) {
    console.error("Error getProgressData:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Ambil Modal Detail Data Auditor
const getAuditorDetail = async (req, res) => {
  const auditorName = req.query.auditor;
  const selectedWarehouse = req.query.warehouse || "";
  const selectedGedung = req.query.gedung || "";

  if (!auditorName) {
    return res
      .status(400)
      .json({ success: false, message: "Auditor tidak ditemukan" });
  }

  try {
    const [auditorsRaw] = await poolUtama.query(
      `SELECT * FROM so_all_wh_pic_auditor_db`,
    );
    const { auditorRules } = parseAuditorRules(auditorsRaw);

    let sqlAppkso = `SELECT warehouse, nokso, oprname, verifikasi_nama, item, deskripsi, qty FROM so_all_wh_appkso_db`;
    const params = [];
    if (selectedWarehouse) {
      sqlAppkso += ` WHERE warehouse = ? `;
      params.push(selectedWarehouse);
    }
    const [appksoData] = await poolUtama.query(sqlAppkso, params);

    const filteredData = [];
    const picStats = {};
    let totalKso = 0;
    let verifiedKso = 0;
    let totalPcs = 0;
    let verifiedPcs = 0;

    for (const app of appksoData) {
      const noDoc = (app.nokso || "").replace(/\s+/g, "").toUpperCase().trim();
      if (noDoc.length < 5) continue;

      const prefix = noDoc.substring(0, 2);
      const gedungApp = prefixToGedung[prefix] || "UNMAPPED";
      const lotApp = noDoc.substring(2, 5);

      if (selectedGedung && gedungApp !== selectedGedung) continue;

      const verifiedBy =
        app.verifikasi_nama && app.verifikasi_nama.trim() !== ""
          ? app.verifikasi_nama.trim()
          : null;

      const mappedAuditor = findMappedAuditor(auditorRules, gedungApp, lotApp);

      if (mappedAuditor !== auditorName && verifiedBy !== auditorName) {
        continue;
      }

      const isVerified = verifiedBy !== null;
      const picName =
        app.oprname && app.oprname.trim() !== ""
          ? app.oprname.trim()
          : "Unknown PIC";

      if (!picStats[picName]) {
        picStats[picName] = {
          total_kso: 0,
          verified_kso: 0,
          total_pcs: 0,
          verified_pcs: 0,
        };
      }

      if (mappedAuditor === auditorName) {
        picStats[picName].total_kso++;
        picStats[picName].total_pcs += Number(app.qty || 0);
        totalKso++;
        totalPcs += Number(app.qty || 0);
      }

      if (verifiedBy === auditorName) {
        picStats[picName].verified_kso++;
        picStats[picName].verified_pcs += Number(app.qty || 0);
        verifiedKso++;
        verifiedPcs += Number(app.qty || 0);
      }

      filteredData.push({
        gedung: gedungApp,
        nokso: app.nokso,
        pic_stock: picName,
        auditor: mappedAuditor,
        item: app.item,
        deskripsi: app.deskripsi,
        qty: Number(app.qty || 0),
        status: isVerified ? "Sudah" : "Belum",
      });
    }

    return res.json({
      success: true,
      data: filteredData,
      pic_list: Object.keys(picStats).sort(),
      matrixSummary: {
        picStats,
        totalKso,
        verifiedKso,
        totalPcs,
        verifiedPcs,
      },
    });
  } catch (error) {
    console.error("Error getAuditorDetail:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProgressData,
  getAuditorDetail,
};
