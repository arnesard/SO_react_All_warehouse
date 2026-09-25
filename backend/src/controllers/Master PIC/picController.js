const { poolUtama } = require("../../db/pool");

const TABLE_STOCK = "so_all_wh_pic_stock_db";
const TABLE_AUDITOR = "so_all_wh_pic_auditor_db";

const checkDbConnection = (req, res, next) => {
  if (!poolUtama) {
    return res.status(500).json({
      status: "error",
      message: "DB_MAIN belum dikonfigurasi (cek file .env backend).",
    });
  }
  next();
};

// GET /api/pic/data
const getData = async (req, res) => {
  try {
    const [stockTeam] = await poolUtama.query(
      `SELECT * FROM ${TABLE_STOCK} ORDER BY id DESC`,
    );
    const [auditorTeam] = await poolUtama.query(
      `SELECT * FROM ${TABLE_AUDITOR} ORDER BY id DESC`,
    );

    res.json({
      status: "success",
      stock_team: stockTeam,
      auditor_team: auditorTeam,
    });
  } catch (err) {
    console.error("[master-pic] getData error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// POST /api/pic/store-or-update
const storeOrUpdate = async (req, res) => {
  const { role_type, entry_id, warehouse, no_penneng, nama, gedung, lot } =
    req.body || {};

  if (!role_type || !["STOCK", "AUDITOR"].includes(role_type)) {
    return res
      .status(400)
      .json({ status: "error", message: "Tipe role tidak valid!" });
  }
  if (!warehouse || !no_penneng || !nama || !gedung || !lot) {
    return res
      .status(400)
      .json({ status: "error", message: "Semua field formulir wajib diisi!" });
  }

  const table = role_type === "STOCK" ? TABLE_STOCK : TABLE_AUDITOR;
  const cleanWarehouse = warehouse.trim().toUpperCase();
  const cleanGedung = gedung.trim().toUpperCase();
  const inputLotRaw = lot.replace(/\s+/g, "").toUpperCase();

  // =========================================================================
  // FASE 1: VALIDASI FORMAT & LINTAS HURUF ABJAD
  // =========================================================================
  const lotRegex = /^([A-Z]+)(\d+)-([A-Z]+)(\d+)$/;
  const matches = inputLotRaw.match(lotRegex);

  if (!matches) {
    return res.status(400).json({
      status: "error",
      message:
        "Format LOT tidak valid bro! Gunakan format AbjadAngka-AbjadAngka, contoh: A01-A10.",
    });
  }

  const startPrefix = matches[1];
  const startNum = parseInt(matches[2], 10);
  const endPrefix = matches[3];
  const endNum = parseInt(matches[4], 10);

  if (startPrefix !== endPrefix) {
    return res.status(400).json({
      status: "error",
      message:
        "Gagal! Huruf awalan LOT harus sama (contoh yang benar: A01-A10). Lintas abjad seperti A01-B10 tidak diizinkan.",
    });
  }

  if (startNum > endNum) {
    return res.status(400).json({
      status: "error",
      message:
        "Logika kebalik bro! Angka awal LOT tidak boleh lebih besar dari angka akhir.",
    });
  }

  // =========================================================================
  // FASE 2: VALIDASI TUMPANG TINDIH (OVERLAP LOGIC)
  // =========================================================================
  try {
    let queryExisting = `SELECT nama, lot, no_penneng FROM ${table} WHERE warehouse = ? AND gedung = ?`;
    const params = [cleanWarehouse, cleanGedung];

    if (entry_id) {
      queryExisting += " AND id != ?";
      params.push(entry_id);
    }

    const [existingRows] = await poolUtama.query(queryExisting, params);

    for (const row of existingRows) {
      const dbLot = (row.lot || "").replace(/\s+/g, "").toUpperCase();
      const dbMatches = dbLot.match(lotRegex);

      if (dbMatches) {
        const dbStartPrefix = dbMatches[1];
        const dbStartNum = parseInt(dbMatches[2], 10);
        const dbEndNum = parseInt(dbMatches[4], 10);

        if (startPrefix === dbStartPrefix) {
          // Matematika irisan rentang
          if (startNum <= dbEndNum && endNum >= dbStartNum) {
            return res.status(400).json({
              status: "error",
              message: `Gagal Bro! Rencana LOT [${inputLotRaw}] bertabrakan dengan rentang [${row.lot}] yang sudah ditugaskan ke ${row.nama} (${row.no_penneng}) di Gedung ${cleanGedung}.`,
            });
          }
        }
      }
    }

    // =========================================================================
    // FASE 3: LOLOS UJI - SIMPAN KE DATABASE
    // =========================================================================
    const cleanPenneng = no_penneng.trim().toUpperCase();
    const cleanNama = nama.trim();

    if (entry_id) {
      await poolUtama.query(
        `UPDATE ${table} SET warehouse = ?, no_penneng = ?, nama = ?, gedung = ?, lot = ?, updated_at = NOW() WHERE id = ?`,
        [
          cleanWarehouse,
          cleanPenneng,
          cleanNama,
          cleanGedung,
          inputLotRaw,
          entry_id,
        ],
      );
      return res.json({
        status: "success",
        message: `Data personil ${role_type} berhasil diperbarui tanpa bentrok LOT!`,
      });
    } else {
      await poolUtama.query(
        `INSERT INTO ${table} (warehouse, no_penneng, nama, gedung, lot, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [cleanWarehouse, cleanPenneng, cleanNama, cleanGedung, inputLotRaw],
      );
      return res.json({
        status: "success",
        message: `Personel baru ${role_type} sukses didaftarkan dan LOT aman!`,
      });
    }
  } catch (err) {
    console.error("[master-pic] storeOrUpdate error:", err);
    res
      .status(500)
      .json({ status: "error", message: "Gagal simpan SQL: " + err.message });
  }
};

// DELETE /api/pic/delete/:id?role=STOCK|AUDITOR
const destroy = async (req, res) => {
  const role = req.query.role;
  if (!["STOCK", "AUDITOR"].includes(role)) {
    return res
      .status(400)
      .json({ status: "error", message: "Spesifikasi tim tidak valid!" });
  }

  const table = role === "STOCK" ? TABLE_STOCK : TABLE_AUDITOR;

  try {
    await poolUtama.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
    res.json({
      status: "success",
      message: "Personel lapangan resmi dihapus dari area!",
    });
  } catch (err) {
    console.error("[master-pic] destroy error:", err);
    res
      .status(500)
      .json({ status: "error", message: "Gagal hapus SQL: " + err.message });
  }
};

module.exports = {
  checkDbConnection,
  getData,
  storeOrUpdate,
  destroy,
};
