import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileInput,
  ScanBarcode,
  ShieldCheck,
  Database,
  Loader2,
  RefreshCw,
  ExternalLink,
  Check,
  Save,
  Building2,
} from "lucide-react";
import Swal from "sweetalert2";
import { getUserSession } from "../../utils/auth";

const API_BASE = "http://localhost:8010/api/input-kso";
const WAREHOUSE_LIST = ["BPW", "APW", "DPW", "RPW", "JMW"];

export default function InputKsoPage() {
  const navigate = useNavigate();
  const currentUser = getUserSession();

  // Jika superadmin / null warehouse, default ke BPW tapi bisa pilih gudang lain
  const isSuperUser =
    !currentUser?.warehouse || currentUser?.role === "superadmin";
  const [selectedWarehouse, setSelectedWarehouse] = useState(
    currentUser?.warehouse || "BPW",
  );

  const [activeSoEvent, setActiveSoEvent] = useState(null);
  const [eventList, setEventList] = useState([]);

  // Form Create New Event (Bagian Atas)
  const [setupForm, setSetupForm] = useState({
    so_name: "",
    def_counter: "",
    date_stock: new Date().toISOString().split("T")[0],
  });
  const [loadingSetup, setLoadingSetup] = useState(false);

  // Form Set As Default (Bagian Bawah)
  const [selectedEventName, setSelectedEventName] = useState("");
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);
  const [loadingSetDefault, setLoadingSetDefault] = useState(false);

  // Log Riwayat Scan
  const [recentScans, setRecentScans] = useState([]);

  // Load Data saat Gudang Terpilih Berubah
  const loadInitialData = async (wh = selectedWarehouse) => {
    try {
      // 1. Ambil Event Aktif Gudang Terpilih
      const resEvent = await fetch(
        `${API_BASE}/active-event?warehouse=${encodeURIComponent(wh)}`,
      );
      const jsonEvent = await resEvent.json();
      if (jsonEvent.success && jsonEvent.activeEvent) {
        setActiveSoEvent(jsonEvent.activeEvent);
        setSelectedEventName(jsonEvent.activeEvent.so_name);
        setSelectedEventDetail(jsonEvent.activeEvent);
      } else {
        setActiveSoEvent(null);
        setSelectedEventName("");
        setSelectedEventDetail(null);
      }

      // 2. Ambil Semua Event SO untuk Dropdown Gudang Terpilih
      const resList = await fetch(
        `${API_BASE}/all-events?warehouse=${encodeURIComponent(wh)}`,
      );
      const jsonList = await resList.json();
      if (jsonList.success) {
        setEventList(jsonList.data || []);
      } else {
        setEventList([]);
      }

      // 3. Ambil Recent Scans Gudang Terpilih
      const resScans = await fetch(
        `${API_BASE}/recent-scans?warehouse=${encodeURIComponent(wh)}`,
      );
      const jsonScans = await resScans.json();
      if (jsonScans.success) {
        setRecentScans(jsonScans.data || []);
      } else {
        setRecentScans([]);
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
    }
  };

  useEffect(() => {
    loadInitialData(selectedWarehouse);
    // Reset default form saat gudang berganti
    setSetupForm({
      so_name: `SO-${selectedWarehouse}-${new Date().toLocaleDateString("id-ID", { month: "short", year: "numeric" }).toUpperCase().replace(/\s+/g, "")}`,
      def_counter: `${selectedWarehouse}-CNT1`,
      date_stock: new Date().toISOString().split("T")[0],
    });
  }, [selectedWarehouse]);

  // Saat dropdown event dipilih
  const handleSelectEvent = (e) => {
    const name = e.target.value;
    setSelectedEventName(name);
    const found = eventList.find((ev) => ev.so_name === name);
    setSelectedEventDetail(found || null);
  };

  // Simpan Event Baru (Save)
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!setupForm.so_name.trim()) {
      return Swal.fire("Peringatan", "Nama Event SO wajib diisi!", "warning");
    }

    setLoadingSetup(true);
    try {
      const res = await fetch(`${API_BASE}/init-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...setupForm,
          warehouse: selectedWarehouse,
        }),
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire("Berhasil", json.message, "success");
        loadInitialData(selectedWarehouse);
      } else {
        Swal.fire("Gagal", json.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoadingSetup(false);
    }
  };

  // Set As Default Event
  const handleSetDefault = async () => {
    if (!selectedEventName) {
      return Swal.fire(
        "Pilih Event",
        "Silakan pilih Event SO dari dropdown!",
        "warning",
      );
    }

    setLoadingSetDefault(true);
    try {
      const res = await fetch(`${API_BASE}/set-default`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          so_name: selectedEventName,
          warehouse: selectedWarehouse,
        }),
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire("Event Aktif!", json.message, "success");
        loadInitialData(selectedWarehouse);
      } else {
        Swal.fire("Gagal", json.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoadingSetDefault(false);
    }
  };

  return (
    <div
      style={{
        padding: "16px",
        width: "100%",
        height: "calc(100vh - 84px)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER SECTION */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          flexShrink: 0,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FileInput size={20} color="var(--accent)" /> Transaksi Input KSO
            Lapangan
          </h3>
          <p
            style={{
              margin: "2px 0 0 0",
              color: "var(--text-secondary)",
              fontSize: "12px",
            }}
          >
            Pusat konfigurasi opname & pemantauan transaksi realtime
            multi-gudang (All Warehouse)
          </p>
        </div>

        {/* KONTROL HEADER: SELECTOR WAREHOUSE & TOMBOL MODE LAPANGAN */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* PILIH GUDANG */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--surface)",
              border: "1px solid var(--border-soft)",
              padding: "3px 8px",
              borderRadius: "8px",
            }}
          >
            <Building2 size={15} color="var(--accent)" />
            <span style={{ fontSize: "11.5px", fontWeight: 600 }}>Gudang:</span>
            {isSuperUser ? (
              <select
                className="field-select mono"
                style={{
                  height: "26px",
                  fontSize: "12px",
                  padding: "0 6px",
                  fontWeight: 700,
                }}
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
              >
                {WAREHOUSE_LIST.map((wh) => (
                  <option key={wh} value={wh}>
                    {wh}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className="badge-pill primary mono"
                style={{ fontSize: "11px" }}
              >
                {selectedWarehouse}
              </span>
            )}
          </div>

          {/* Navigasi Mobile Link */}
          <button
            type="button"
            className="btn-ctrl primary"
            style={{ height: "32px", fontSize: "12px", padding: "0 12px" }}
            onClick={() => navigate(`/InputKso/pic?wh=${selectedWarehouse}`)}
          >
            <ScanBarcode size={14} /> Mode PIC Lapangan{" "}
            <ExternalLink size={12} />
          </button>
          <button
            type="button"
            className="btn-ctrl solid-green"
            style={{
              height: "32px",
              fontSize: "12px",
              padding: "0 12px",
              background: "#059669",
            }}
            onClick={() =>
              navigate(`/InputKso/auditor?wh=${selectedWarehouse}`)
            }
          >
            <ShieldCheck size={14} /> Mode Validator <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* BODY KONTEN */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "400px 1fr",
          gap: "14px",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* PANEL KIRI: FORM SUSUNAN SESUAI EDP */}
        <div
          className="surface-card"
          style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              borderBottom: "1px solid var(--border-soft)",
              paddingBottom: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Database size={16} color="var(--accent)" />
              <span style={{ fontSize: "13px", fontWeight: 700 }}>
                Konfigurasi Event SO ({selectedWarehouse})
              </span>
            </div>
          </div>

          {/* 1. BAGIAN ATAS: INPUT BUAT EVENT BARU (SAVE) */}
          <form
            onSubmit={handleCreateEvent}
            style={{ display: "flex", flexDirection: "column", gap: "9px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <label style={{ fontSize: "12px", fontWeight: 600 }}>
                Name SO
              </label>
              <input
                type="text"
                required
                placeholder="Ketik nama event..."
                className="field-input mono"
                style={{ width: "100%", height: "32px", fontSize: "12px" }}
                value={setupForm.so_name}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, so_name: e.target.value })
                }
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <label style={{ fontSize: "12px", fontWeight: 600 }}>
                Default Counter
              </label>
              <input
                type="text"
                placeholder="PIC Counter..."
                className="field-input"
                style={{ width: "100%", height: "32px", fontSize: "12px" }}
                value={setupForm.def_counter}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, def_counter: e.target.value })
                }
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr auto",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <label style={{ fontSize: "12px", fontWeight: 600 }}>
                Date Stock
              </label>
              <input
                type="date"
                required
                className="field-input"
                style={{ width: "100%", height: "32px", fontSize: "12px" }}
                value={setupForm.date_stock}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, date_stock: e.target.value })
                }
              />
              <button
                type="submit"
                disabled={loadingSetup}
                className="btn-ctrl primary"
                style={{
                  height: "32px",
                  fontSize: "12px",
                  padding: "0 14px",
                  minWidth: "75px",
                  justifyContent: "center",
                }}
              >
                {loadingSetup ? (
                  <Loader2 size={13} className="spin" />
                ) : (
                  <>
                    <Save size={13} /> Save
                  </>
                )}
              </button>
            </div>
          </form>

          {/* PEMBATAS */}
          <div
            style={{ borderTop: "1px dashed var(--border)", margin: "14px 0" }}
          />

          {/* 2. BAGIAN BAWAH: PILIH EVENT & SET AS DEFAULT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <select
                className="field-select mono"
                style={{ width: "100%", height: "34px", fontSize: "12px" }}
                value={selectedEventName}
                onChange={handleSelectEvent}
              >
                <option value="">
                  -- Pilih Event SO ({selectedWarehouse}) --
                </option>
                {eventList.map((ev) => (
                  <option key={ev.so_name} value={ev.so_name}>
                    {ev.so_name} {ev.flag === "Y" ? "★ (Active Default)" : ""}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={loadingSetDefault || !selectedEventName}
                onClick={handleSetDefault}
                className="btn-ctrl"
                style={{
                  height: "34px",
                  fontSize: "11.5px",
                  padding: "0 10px",
                  whiteSpace: "nowrap",
                  background: "var(--surface-3)",
                  fontWeight: 600,
                }}
              >
                {loadingSetDefault ? (
                  <Loader2 size={13} className="spin" />
                ) : (
                  <>
                    <Check size={13} /> Set As Default
                  </>
                )}
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <label
                style={{ fontSize: "12px", color: "var(--text-secondary)" }}
              >
                Default Counter
              </label>
              <input
                type="text"
                readOnly
                disabled
                className="field-input"
                style={{
                  width: "100%",
                  height: "32px",
                  fontSize: "12px",
                  background: "var(--surface-2)",
                }}
                value={selectedEventDetail?.def_counter || "-"}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <label
                style={{ fontSize: "12px", color: "var(--text-secondary)" }}
              >
                Date Stock
              </label>
              <input
                type="text"
                readOnly
                disabled
                className="field-input"
                style={{
                  width: "100%",
                  height: "32px",
                  fontSize: "12px",
                  background: "var(--surface-2)",
                }}
                value={selectedEventDetail?.date_stock || "-"}
              />
            </div>
          </div>

          {/* STATUS EVENT AKTIF GUDANG INI */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "12px",
            }}
          >
            <div
              style={{
                background: "var(--ok-soft)",
                border: "1px solid rgba(23, 128, 63, 0.25)",
                padding: "8px 10px",
                borderRadius: "8px",
                fontSize: "11px",
                color: "var(--ok)",
              }}
            >
              Event Aktif Default Gudang <strong>{selectedWarehouse}</strong>:{" "}
              <br />
              <strong className="mono" style={{ fontSize: "12px" }}>
                {activeSoEvent
                  ? activeSoEvent.so_name
                  : "Belum ada event aktif"}
              </strong>
            </div>
          </div>
        </div>

        {/* PANEL KANAN: MONITORING LOG SCAN DESKTOP SESUAI GUDANG */}
        <div
          className="surface-card"
          style={{
            padding: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--border-soft)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 700 }}>
              Log Transaksi Fisik Terkini (cntso) - Gudang{" "}
              <span className="mono" style={{ color: "var(--accent)" }}>
                {selectedWarehouse}
              </span>
            </span>
            <button
              type="button"
              className="btn-ctrl"
              style={{ height: "26px", fontSize: "11px", padding: "0 10px" }}
              onClick={() => loadInitialData(selectedWarehouse)}
            >
              <RefreshCw size={12} /> Refresh Data
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            <table className="dtable" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: "40px", textAlign: "center" }}>No</th>
                  <th style={{ width: "110px" }}>NoDoc</th>
                  <th style={{ width: "110px" }}>Item Code</th>
                  <th>Deskripsi Ban</th>
                  <th style={{ width: "80px", textAlign: "right" }}>
                    Qty Fisik
                  </th>
                  <th style={{ width: "90px" }}>Operator</th>
                  <th style={{ width: "110px", textAlign: "center" }}>
                    Status
                  </th>
                  <th style={{ width: "100px" }}>Auditor</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="table-empty">
                      Belum ada rekaman scan fisik untuk event di gudang{" "}
                      {selectedWarehouse}.
                    </td>
                  </tr>
                ) : (
                  recentScans.map((r, i) => (
                    <tr key={r.recid}>
                      <td style={{ textAlign: "center" }}>{i + 1}</td>
                      <td className="cell-strong mono">{r.NoDoc}</td>
                      <td className="mono">{r.ItemCode}</td>
                      <td
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "200px",
                        }}
                      >
                        {r.description}
                      </td>
                      <td
                        style={{ textAlign: "right", fontWeight: 700 }}
                        className="mono"
                      >
                        {Number(r.QtyStk).toLocaleString("id-ID")}
                      </td>
                      <td>{r.opr || "-"}</td>
                      <td style={{ textAlign: "center" }}>
                        {r.opr_v ? (
                          <span className="badge-pill ok">
                            Sudah Verifikasi
                          </span>
                        ) : (
                          <span className="badge-pill warn">
                            Belum Verifikasi
                          </span>
                        )}
                      </td>
                      <td>{r.opr_v || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
