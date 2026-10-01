const { poolUtama } = require("../../db/pool");

// 1. Login Handler
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username dan password wajib diisi!" });
  }

  try {
    const [rows] = await poolUtama.query(
      "SELECT id, username, password, role, warehouse FROM so_all_wh_users_db WHERE BINARY username = ?",
      [username],
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Username atau password salah!" });
    }

    const user = rows[0];

    // Cek password langsung (plaintext sesuai permintaan, atau gunakan bcrypt jika dienkripsi)
    if (user.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Username atau password salah!" });
    }

    const isSuper = user.role === "super_user";
    const warehouse = String(user.warehouse || "").trim().toUpperCase();

    // Akun gudang wajib punya gudang, kalau tidak dia bisa lolos pilih gudang bebas
    if (!isSuper && !warehouse) {
      return res.status(403).json({
        success: false,
        message: "Akun ini belum punya gudang. Hubungi Super User.",
      });
    }

    return res.json({
      success: true,
      message: `Selamat datang, ${user.username}!`,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        // super_user tidak terikat gudang
        warehouse: isSuper ? null : warehouse,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. CRUD User (Khusus Super User)
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await poolUtama.query(
      "SELECT id, username, role, warehouse, created_at FROM so_all_wh_users_db ORDER BY id ASC",
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const VALID_ROLES = ["super_user", "user_warehouse"];

const createUser = async (req, res) => {
  const { username, password, role, warehouse } = req.body;
  if (!username || !password || !role) {
    return res
      .status(400)
      .json({ success: false, message: "Field tidak lengkap" });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: "Role tidak valid" });
  }

  const isSuper = role === "super_user";
  const wh = String(warehouse || "").trim().toUpperCase();
  if (!isSuper && !wh) {
    return res
      .status(400)
      .json({ success: false, message: "Akun gudang wajib punya gudang" });
  }

  try {
    const [exist] = await poolUtama.query(
      "SELECT id FROM so_all_wh_users_db WHERE BINARY username = ? LIMIT 1",
      [username],
    );
    if (exist.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "Username sudah dipakai" });
    }

    await poolUtama.query(
      "INSERT INTO so_all_wh_users_db (username, password, role, warehouse) VALUES (?, ?, ?, ?)",
      [username, password, role, isSuper ? null : wh],
    );
    return res.json({ success: true, message: "User berhasil ditambahkan" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await poolUtama.query(
      "SELECT role FROM so_all_wh_users_db WHERE id = ?",
      [id],
    );
    if (rows[0]?.role === "super_user") {
      const [[{ total }]] = await poolUtama.query(
        "SELECT COUNT(*) AS total FROM so_all_wh_users_db WHERE role = 'super_user'",
      );
      if (total <= 1) {
        return res.status(400).json({
          success: false,
          message: "Super User terakhir tidak boleh dihapus",
        });
      }
    }
    await poolUtama.query("DELETE FROM so_all_wh_users_db WHERE id = ?", [id]);
    return res.json({ success: true, message: "User berhasil dihapus" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  loginUser,
  getAllUsers,
  createUser,
  deleteUser,
};
