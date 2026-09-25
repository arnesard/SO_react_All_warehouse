import { useEffect, useState, useMemo } from "react";
import {
  UserPlus,
  Save,
  Check,
  Pencil,
  Trash2,
  Search,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:8010/api/pic";

export default function PicPage() {
  const [stockTeam, setStockTeam] = useState([]);
  const [auditorTeam, setAuditorTeam] = useState([]);
  const [activeTab, setActiveTab] = useState("STOCK");
  const [loading, setLoading] = useState(false);

  // Filter & Search
  const [filterWh, setFilterWh] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    entry_id: "",
    role_type: "STOCK",
    warehouse: "",
    no_penneng: "",
    nama: "",
    gedung: "",
    lot: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/data`);
      const json = await res.json();
      if (json.status === "success") {
        setStockTeam(json.stock_team || []);
        setAuditorTeam(json.auditor_team || []);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClearForm = () => {
    setFormData({
      entry_id: "",
      role_type: activeTab,
      warehouse: "",
      no_penneng: "",
      nama: "",
      gedung: "",
      lot: "",
    });
  };

  const handleSwitchTab = (role) => {
    setActiveTab(role);
    setFormData((prev) => ({ ...prev, role_type: role, entry_id: "" }));
  };

  const handleTriggerEdit = (row) => {
    setFormData({
      entry_id: row.id,
      role_type: activeTab,
      warehouse: row.warehouse,
      no_penneng: row.no_penneng,
      nama: row.nama,
      gedung: row.gedung,
      lot: row.lot,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    Swal.fire({
      title: "Sedang Menyimpan...",
      text: "Memproses perubahan personil di database bro.",
      background: "var(--surface)",
      customClass: { popup: "swal-theme-popup" },
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(`${API_BASE}/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      Swal.close();

      if (res.ok && result.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Berhasil Bro!",
          text: result.message,
          background: "var(--surface)",
          customClass: { popup: "swal-theme-popup" },
          timer: 1500,
          showConfirmButton: false,
        });
        handleClearForm();
        fetchData();
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Simpan!",
          text: result.message || "Terjadi kesalahan sistem.",
          background: "var(--surface)",
          customClass: { popup: "swal-theme-popup" },
        });
      }
    } catch {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Gagal Simpan!",
        text: "Terjadi kendala koneksi server.",
        background: "var(--surface)",
        customClass: { popup: "swal-theme-popup" },
      });
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Yakin Dihapus Bro?",
      text: "Personel area ini akan dicabut total hak aksesnya!",
      icon: "warning",
      background: "var(--surface)",
      customClass: { popup: "swal-theme-popup" },
      showCancelButton: true,
      confirmButtonColor: "var(--danger)",
      cancelButtonColor: "var(--surface-3)",
      confirmButtonText: "YA, HAPUS",
      cancelButtonText: "BATAL",
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Mencabut Akses...",
          background: "var(--surface)",
          customClass: { popup: "swal-theme-popup" },
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        try {
          const res = await fetch(
            `${API_BASE}/delete/${id}?role=${activeTab}`,
            {
              method: "DELETE",
            },
          );
          const json = await res.json();
          Swal.close();

          if (res.ok && json.status === "success") {
            Swal.fire({
              icon: "success",
              title: "Terhapus!",
              text: json.message,
              background: "var(--surface)",
              customClass: { popup: "swal-theme-popup" },
              timer: 1200,
              showConfirmButton: false,
            });
            fetchData();
          } else {
            Swal.fire({
              icon: "error",
              title: "Gagal Hapus!",
              text: json.message || "Kendala internal SQL.",
              background: "var(--surface)",
              customClass: { popup: "swal-theme-popup" },
            });
          }
        } catch {
          Swal.close();
          Swal.fire({
            icon: "error",
            title: "Gagal Hapus!",
            text: "Kendala internal server.",
            background: "var(--surface)",
            customClass: { popup: "swal-theme-popup" },
          });
        }
      }
    });
  };

  const filteredData = useMemo(() => {
    const raw = activeTab === "STOCK" ? stockTeam : auditorTeam;
    const q = searchQuery.toLowerCase().trim();

    return raw.filter((row) => {
      const matchWh =
        !filterWh || row.warehouse?.toLowerCase() === filterWh.toLowerCase();
      let matchSearch = true;
      if (q) {
        matchSearch =
          (row.no_penneng || "").toLowerCase().includes(q) ||
          (row.nama || "").toLowerCase().includes(q) ||
          (row.lot || "").toLowerCase().includes(q);
      }
      return matchWh && matchSearch;
    });
  }, [activeTab, stockTeam, auditorTeam, filterWh, searchQuery]);

  const isEditMode = Boolean(formData.entry_id);

  return (
    <div
      style={{
        display: "flex",
        gap: "14px",
        height: "calc(100vh - 82px)", // Mengunci tinggi pas dari bawah navbar ke dasar layar
        paddingBottom: "10px",
        boxSizing: "border-box",
      }}
    >
      {/* PANEL FORM KIRI (Tinggi penuh sampai bawah) */}
      <div style={{ width: "340px", flexShrink: 0, height: "100%" }}>
        <div
          className="surface-card"
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <div
            className="surface-card-header"
            style={{ padding: "12px 16px", flexShrink: 0 }}
          >
            <div className="surface-card-title">
              <UserPlus size={16} color="var(--accent)" />
              <span>Registrasi PIC Area</span>
            </div>
          </div>

          <div
            className="surface-card-body"
            style={{ padding: "16px", flex: 1, overflowY: "auto" }}
          >
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div className="field-group">
                <label>Tipe Penugasan / Role Tim</label>
                <select
                  className="field-select"
                  value={formData.role_type}
                  onChange={(e) =>
                    setFormData({ ...formData, role_type: e.target.value })
                  }
                  required
                >
                  <option value="STOCK">📦 TIM PENGHITUNG FISIK (STOCK)</option>
                  <option value="AUDITOR">🔍 TIM VALIDATOR (AUDITOR)</option>
                </select>
              </div>

              <div className="field-group">
                <label>Warehouse Area</label>
                <select
                  className="field-select"
                  value={formData.warehouse}
                  onChange={(e) =>
                    setFormData({ ...formData, warehouse: e.target.value })
                  }
                  required
                >
                  <option value="" disabled>
                    -- PILIH WAREHOUSE --
                  </option>
                  <option value="APW">APW</option>
                  <option value="BPW">BPW</option>
                  <option value="DPW">DPW</option>
                  <option value="RPW">RPW</option>
                  <option value="DCK">DCK</option>
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div className="field-group">
                  <label>No. Penneng / id</label>
                  <input
                    type="text"
                    className="field-input mono"
                    placeholder="Contoh: 01-0001"
                    value={formData.no_penneng}
                    onChange={(e) =>
                      setFormData({ ...formData, no_penneng: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Gedung</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Contoh: BPW01"
                    value={formData.gedung}
                    onChange={(e) =>
                      setFormData({ ...formData, gedung: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label>Nama Lengkap Personel</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Masukkan nama lengkap..."
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  required
                />
              </div>

              <div className="field-group">
                <label>LOT</label>
                <input
                  type="text"
                  className="field-input mono"
                  placeholder="Contoh: A01-A10"
                  value={formData.lot}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lot: e.target.value.toUpperCase(),
                    })
                  }
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  type="submit"
                  className="btn-ctrl primary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {isEditMode ? (
                    <>
                      <Check size={14} /> Update Personel
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Simpan Personel
                    </>
                  )}
                </button>

                {isEditMode && (
                  <button
                    type="button"
                    className="btn-ctrl"
                    onClick={handleClearForm}
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* PANEL TABEL KANAN (Tinggi penuh sampai dasar, tanpa batas buatan) */}
      <div
        className="surface-card"
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* HEADER CONTROLS (TABS & FILTERS) */}
        <div
          className="surface-card-header"
          style={{ padding: "10px 16px", flexShrink: 0 }}
        >
          {/* TAB ROLE */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className={`tab-btn ${activeTab === "STOCK" ? "is-active" : ""}`}
              onClick={() => handleSwitchTab("STOCK")}
            >
              📦 TIM PENGHITUNG STOCK
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "AUDITOR" ? "is-active" : ""}`}
              onClick={() => handleSwitchTab("AUDITOR")}
            >
              🔍 TIM AUDITOR / VALIDATOR
            </button>
          </div>

          {/* FILTER WH & LIVE SEARCH */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              className="field-select"
              style={{ minWidth: "150px" }}
              value={filterWh}
              onChange={(e) => setFilterWh(e.target.value)}
            >
              <option value="">🟢 SEMUA GUDANG</option>
              <option value="APW">APW</option>
              <option value="BPW">BPW</option>
              <option value="DPW">DPW</option>
              <option value="RPW">RPW</option>
              <option value="DCK">DCK</option>
            </select>

            <div className="search-box">
              <Search size={14} />
              <input
                type="text"
                className="field-input"
                placeholder="Cari Penneng / Nama / Lot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* TABEL AREA: Override max-height default agar mengisi 100% sisa tinggi container */}
        <div
          className="dtable-wrap"
          style={{
            flex: 1,
            maxHeight: "none", // Menghilangkan batasan calc(100vh - 235px) dari CSS
            border: "none",
            borderRadius: 0,
            overflowY: "auto",
          }}
        >
          <table className="dtable">
            <thead>
              <tr>
                <th style={{ width: "50px", textAlign: "center" }}>No.</th>
                <th style={{ width: "100px", textAlign: "center" }}>
                  Warehouse
                </th>
                <th style={{ width: "130px", textAlign: "center" }}>
                  No. Penneng / Id
                </th>
                <th>Nama Personel</th>
                <th style={{ width: "110px" }}>Gedung</th>
                <th style={{ width: "110px" }}>LOT</th>
                <th style={{ width: "90px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="table-empty">
                    <Loader2
                      size={16}
                      className="spin"
                      style={{
                        display: "inline-block",
                        verticalAlign: "middle",
                        marginRight: 8,
                      }}
                    />
                    Menyisir database personil...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty">
                    {searchQuery
                      ? `Data "${searchQuery}" tidak ditemukan.`
                      : `Belum ada personil [TIM ${activeTab}] terdaftar.`}
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: "center" }} className="mono">
                      {index + 1}
                    </td>
                    <td style={{ textAlign: "center" }} className="cell-strong">
                      {row.warehouse}
                    </td>
                    <td style={{ textAlign: "center" }} className="cell-code">
                      {row.no_penneng}
                    </td>
                    <td className="cell-strong">{row.nama}</td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {row.gedung}
                    </td>
                    <td>
                      <span className="badge-pill info mono">{row.lot}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          type="button"
                          className="btn-icon-action edit"
                          title="Edit Personel"
                          onClick={() => handleTriggerEdit(row)}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action delete"
                          title="Hapus Personel"
                          onClick={() => handleDelete(row.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
