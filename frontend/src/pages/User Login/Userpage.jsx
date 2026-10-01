import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Users, Plus, Trash2, ShieldCheck, Warehouse } from "lucide-react";
import Swal from "sweetalert2";
import { getUserSession } from "../../Utils/auth";
import { API_ORIGIN } from "../../lib/config";

export default function Userpage() {
  const currentUser = getUserSession();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "user_warehouse",
    warehouse: "BPW",
  });

  // Proteksi: Jika bukan super_user, lempar keluar
  if (!currentUser || currentUser.role !== "super_user") {
    return <Navigate to="/" replace />;
  }

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/auth/users`);
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_ORIGIN}/api/auth/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire("Berhasil", json.message, "success");
        setForm({
          username: "",
          password: "",
          role: "user_warehouse",
          warehouse: "BPW",
        });
        loadUsers();
      } else {
        Swal.fire("Gagal", json.message || "Gagal menyimpan akun", "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Hapus akun?",
      text: "Akun ini tidak akan bisa login lagi!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await fetch(`${API_ORIGIN}/api/auth/users/${id}`, {
          method: "DELETE",
        });
        loadUsers();
      }
    });
  };

  return (
    <div style={{ padding: "20px", width: "100%", boxSizing: "border-box" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontWeight: 700 }}>Manajemen Akun Gudang</h3>
          <p
            style={{
              margin: 0,
              color: "var(--text-secondary)",
              fontSize: "13px",
            }}
          >
            Khusus Super User untuk mengatur akses login tiap gudang
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "20px",
        }}
      >
        {/* Form Tambah */}
        <div
          className="surface-card"
          style={{ padding: "20px", height: "fit-content" }}
        >
          <h5
            style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 700 }}
          >
            <Plus size={16} style={{ display: "inline", marginRight: "6px" }} />{" "}
            Tambah Akun Baru
          </h5>
          <form
            onSubmit={handleAddUser}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600 }}>
                Username
              </label>
              <input
                type="text"
                required
                className="field-input"
                style={{ width: "100%" }}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600 }}>
                Password
              </label>
              <input
                type="password"
                required
                className="field-input"
                style={{ width: "100%" }}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600 }}>
                Role Akses
              </label>
              <select
                className="field-select"
                style={{ width: "100%" }}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="user_warehouse">User Warehouse (Gudang)</option>
                <option value="super_user">Super User (Admin)</option>
              </select>
            </div>
            {form.role === "user_warehouse" && (
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600 }}>
                  Target Gudang
                </label>
                <select
                  className="field-select"
                  style={{ width: "100%" }}
                  value={form.warehouse}
                  onChange={(e) =>
                    setForm({ ...form, warehouse: e.target.value })
                  }
                >
                  <option value="BPW">BPW</option>
                  <option value="APW">APW</option>
                  <option value="DPW">DPW</option>
                  <option value="RPW">RPW</option>
                  <option value="JMW">JMW</option>
                </select>
              </div>
            )}
            <button
              type="submit"
              className="btn-ctrl primary"
              style={{ marginTop: "10px" }}
            >
              Simpan Akun
            </button>
          </form>
        </div>

        {/* Tabel User */}
        <div
          className="surface-card"
          style={{ padding: "0", overflow: "hidden" }}
        >
          <table className="dtable" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: "50px", textAlign: "center" }}>No</th>
                <th>Username</th>
                <th>Role</th>
                <th>Akses Gudang</th>
                <th style={{ width: "80px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ textAlign: "center" }}>{i + 1}</td>
                  <td className="cell-strong">{u.username}</td>
                  <td>
                    {u.role === "super_user" ? (
                      <span className="badge-pill ok">
                        <ShieldCheck size={12} /> Super User
                      </span>
                    ) : (
                      <span className="badge-pill info">
                        <Warehouse size={12} /> Gudang
                      </span>
                    )}
                  </td>
                  <td className="mono">{u.warehouse || "Semua Gudang"}</td>
                  <td style={{ textAlign: "center" }}>
                    {u.username !== "superadmin" && (
                      <button
                        type="button"
                        className="btn-icon-action delete"
                        onClick={() => handleDelete(u.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
