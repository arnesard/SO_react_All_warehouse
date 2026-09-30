import { useState, useEffect, useRef } from "react";
import {
  FileInput,
  CheckCircle,
  ScanBarcode,
  Search,
  Layers,
  Database,
  Loader2,
  Calendar,
  User,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";
import { getUserSession } from "../../utils/auth";

const API_BASE = "http://localhost:8010/api/input-kso";

export default function InputKsoPage() {
  const currentUser = getUserSession();
  const currentWarehouse = currentUser?.warehouse || "BPW";

  const [activeTab, setActiveTab] = useState("pic"); // 'pic', 'auditor', 'setup'
  const [activeSoEvent, setActiveSoEvent] = useState(null);

  // --- State Setup Event SO ---
  const [setupForm, setSetupForm] = useState({
    so_name: `SO-${currentWarehouse}-${new Date().toLocaleDateString("id-ID", { month: "short", year: "numeric" }).toUpperCase().replace(" ", "")}`,
    def_counter: `${currentWarehouse}-CNT1`,
    date_stock: new Date().toISOString().split("T")[0],
  });
  const [loadingSetup, setLoadingSetup] = useState(false);

  // --- State PIC Scan ---
  const [picForm, setPicForm] = useState({
    no_doc: "",
    item_code: "",
    qty_stk: "",
  });
  const [itemPreview, setItemPreview] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [savingPic, setSavingPic] = useState(false);

  // --- State Auditor Verifikasi ---
  const [auditorDoc, setAuditorDoc] = useState("");
  const [validating, setValidating] = useState(false);

  // --- Log Riwayat Scan ---
  const [recentScans, setRecentScans] = useState([]);
  const itemInputRef = useRef(null);
  const qtyInputRef = useRef(null);

  // 1. Ambil Event SO Aktif & Riwayat
  const loadActiveEventAndScans = async () => {
    try {
      const resEvent = await fetch(
        `${API_BASE}/active-event?warehouse=${encodeURIComponent(currentWarehouse)}`,
      );
      const jsonEvent = await resEvent.json();
      if (jsonEvent.success && jsonEvent.activeEvent) {
        setActiveSoEvent(jsonEvent.activeEvent);
      }

      const resScans = await fetch(
        `${API_BASE}/recent-scans?warehouse=${encodeURIComponent(currentWarehouse)}`,
      );
      const jsonScans = await resScans.json();

      if (jsonScans.success) {
        setRecentScans(jsonScans.data || []);
      }
    } catch (err) {
      console.error("Gagal load recent scans:", err);
    }
  };

  useEffect(() => {
    loadActiveEventAndScans();
  }, []);

  // 2. Lookup Item Info Saat Kode Barang Diketik/Discan
  const handleItemLookup = async (code) => {
    setPicForm((prev) => ({ ...prev, item_code: code }));
    if (!code || code.trim().length < 4) {
      setItemPreview(null);
      return;
    }

    setLoadingItem(true);
    try {
      const res = await fetch(
        `${API_BASE}/check-item?item=${encodeURIComponent(code.trim())}&warehouse=${encodeURIComponent(currentWarehouse)}`,
      );
      const json = await res.json();
      if (json.success) {
        setItemPreview(json.data);
      } else {
        setItemPreview(null);
      }
    } catch {
      setItemPreview(null);
    } finally {
      setLoadingItem(false);
    }
  };

  // 3. Simpan Scan PIC
  const handleSavePic = async (e) => {
    e.preventDefault();
    if (!picForm.no_doc || !picForm.item_code || !picForm.qty_stk) {
      return Swal.fire(
        "Field Belum Lengkap",
        "Isi NoDoc, Item Code, dan QTY!",
        "warning",
      );
    }

    setSavingPic(true);
    try {
      const res = await fetch(`${API_BASE}/scan-pic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          so_name: activeSoEvent?.so_name || setupForm.so_name,
          no_doc: picForm.no_doc.trim().toUpperCase(),
          item_code: picForm.item_code.trim().toUpperCase(),
          qty_stk: Number(picForm.qty_stk),
          opr_code: currentUser?.username || "OPR",
          opr_name: currentUser?.username || "OPR",
          warehouse: currentWarehouse,
        }),
      });
      const json = await res.json();

      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Scan Berhasil Tersimpan",
          text: json.message,
          timer: 1000,
          showConfirmButton: false,
        });

        // Reset form input item & qty, fokus kembali ke item
        setPicForm((prev) => ({ ...prev, item_code: "", qty_stk: "" }));
        setItemPreview(null);
        itemInputRef.current?.focus();
        loadActiveEventAndScans();
      } else {
        Swal.fire("Gagal", json.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSavingPic(false);
    }
  };

  // 4. Verifikasi Dokumen oleh Auditor
  const handleValidateDoc = async (e) => {
    e.preventDefault();
    if (!auditorDoc)
      return Swal.fire(
        "NoDoc Kosong",
        "Scan atau ketik NoDoc kartu!",
        "warning",
      );

    setValidating(true);
    try {
      const res = await fetch(`${API_BASE}/validate-doc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          no_doc: auditorDoc.trim().toUpperCase(),
          auditor_name: currentUser?.username || "AUDITOR",
          warehouse: currentWarehouse,
        }),
      });
      const json = await res.json();

      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Terverifikasi!",
          text: json.message,
          timer: 1200,
          showConfirmButton: false,
        });
        setAuditorDoc("");
        loadActiveEventAndScans();
      } else {
        Swal.fire("Validasi Gagal", json.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setValidating(false);
    }
  };

  // 5. Inisiasi Event SO
  const handleInitEvent = async (e) => {
    e.preventDefault();
    setLoadingSetup(true);
    try {
      const res = await fetch(`${API_BASE}/init-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...setupForm,
          warehouse: currentWarehouse,
        }),
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire("Event Aktif!", json.message, "success");
        loadActiveEventAndScans();
        setActiveTab("pic");
      } else {
        Swal.fire("Gagal Setup", json.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoadingSetup(false);
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
            Pencatatan scan fisik kartu opname & verifikasi auditor realtime
            gudang <strong>{currentWarehouse}</strong>
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            background: "var(--surface-2)",
            padding: "4px",
            borderRadius: "10px",
          }}
        >
          <button
            type="button"
            className={`btn-ctrl ${activeTab === "pic" ? "primary" : ""}`}
            style={{ height: "30px", fontSize: "12px", padding: "0 14px" }}
            onClick={() => setActiveTab("pic")}
          >
            <ScanBarcode size={14} /> Mode PIC Lapangan
          </button>
          <button
            type="button"
            className={`btn-ctrl ${activeTab === "auditor" ? "primary" : ""}`}
            style={{ height: "30px", fontSize: "12px", padding: "0 14px" }}
            onClick={() => setActiveTab("auditor")}
          >
            <ShieldCheck size={14} /> Mode Validasi Auditor
          </button>
          <button
            type="button"
            className={`btn-ctrl ${activeTab === "setup" ? "primary" : ""}`}
            style={{ height: "30px", fontSize: "12px", padding: "0 14px" }}
            onClick={() => setActiveTab("setup")}
          >
            <Database size={14} /> Setup Event SO
          </button>
        </div>
      </div>

      {/* BODY KONTEN */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: "14px",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* PANEL KIRI: FORM SESUAI TAB AKTIF */}
        <div
          className="surface-card"
          style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* TAB 1: FORM INPUT PIC */}
          {activeTab === "pic" && (
            <form
              onSubmit={handleSavePic}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                flex: 1,
              }}
            >
              <div
                style={{
                  background: "var(--accent-soft)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  color: "var(--accent-strong)",
                  fontSize: "11.5px",
                  fontWeight: 600,
                }}
              >
                Event Aktif:{" "}
                {activeSoEvent
                  ? activeSoEvent.so_name
                  : "Belum diinisiasi (Gunakan Setup)"}
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  No. Dokumen Kartu (NoDoc)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Scan NoDoc (misal: G1A01-001)"
                  className="field-input mono"
                  style={{ width: "100%", textTransform: "uppercase" }}
                  value={picForm.no_doc}
                  onChange={(e) =>
                    setPicForm({ ...picForm, no_doc: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") itemInputRef.current?.focus();
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Item Code Ban
                </label>
                <input
                  ref={itemInputRef}
                  type="text"
                  required
                  placeholder="Scan barcode item / ketik kode"
                  className="field-input mono"
                  style={{ width: "100%", textTransform: "uppercase" }}
                  value={picForm.item_code}
                  onChange={(e) => handleItemLookup(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") qtyInputRef.current?.focus();
                  }}
                />
                {loadingItem && (
                  <small style={{ color: "var(--accent)", fontSize: "11px" }}>
                    Memeriksa master item...
                  </small>
                )}
              </div>

              {/* Preview Deskripsi Ban */}
              {itemPreview && (
                <div
                  style={{
                    background: "var(--surface-zebra)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: "8px",
                    padding: "10px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {itemPreview.description}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "4px",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>
                      Pattern: <strong>{itemPreview.pattern || "-"}</strong>
                    </span>
                    <span>
                      Grade: <strong>{itemPreview.grade || "OK"}</strong>
                    </span>
                    <span>
                      Saldo Oracle:{" "}
                      <strong>
                        {Number(itemPreview.qty_oracle).toLocaleString("id-ID")}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Kuantitas Fisik (QtyStk)
                </label>
                <input
                  ref={qtyInputRef}
                  type="number"
                  required
                  min="1"
                  placeholder="Ketik jumlah fisik pcs"
                  className="field-input mono"
                  style={{ width: "100%" }}
                  value={picForm.qty_stk}
                  onChange={(e) =>
                    setPicForm({ ...picForm, qty_stk: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={savingPic}
                className="btn-ctrl primary"
                style={{
                  marginTop: "auto",
                  height: "40px",
                  justifyContent: "center",
                }}
              >
                {savingPic ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <>
                    <CheckCircle size={16} /> Simpan Hasil Hitung
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: FORM VALIDASI AUDITOR */}
          {activeTab === "auditor" && (
            <form
              onSubmit={handleValidateDoc}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                flex: 1,
              }}
            >
              <div
                style={{
                  background: "var(--ok-soft)",
                  padding: "10px",
                  borderRadius: "8px",
                  color: "var(--ok)",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Auditor: {currentUser?.username || "Auditor Lapangan"}
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Scan / Masukkan No. Dokumen (NoDoc)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Scan NoDoc kartu fisik"
                  className="field-input mono"
                  style={{
                    width: "100%",
                    height: "44px",
                    fontSize: "14px",
                    textTransform: "uppercase",
                  }}
                  value={auditorDoc}
                  onChange={(e) => setAuditorDoc(e.target.value)}
                />
              </div>

              <p
                style={{
                  fontSize: "11.5px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.4",
                }}
              >
                Setelah NoDoc discan dan fisik diverifikasi, tekan tombol di
                bawah untuk mengesahkan verifikasi kartu. Data otomatis
                ter-update di Live TV Progress SO.
              </p>

              <button
                type="submit"
                disabled={validating}
                className="btn-ctrl solid-green"
                style={{
                  marginTop: "auto",
                  height: "42px",
                  justifyContent: "center",
                }}
              >
                {validating ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <>
                    <ShieldCheck size={18} /> Sahkan & Verifikasi Kartu
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: SETUP EVENT SO */}
          {activeTab === "setup" && (
            <form
              onSubmit={handleInitEvent}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                flex: 1,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Nama Event SO (so_name)
                </label>
                <input
                  type="text"
                  required
                  className="field-input mono"
                  style={{ width: "100%" }}
                  value={setupForm.so_name}
                  onChange={(e) =>
                    setSetupForm({ ...setupForm, so_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Default Counter (def_counter)
                </label>
                <input
                  type="text"
                  className="field-input"
                  style={{ width: "100%" }}
                  value={setupForm.def_counter}
                  onChange={(e) =>
                    setSetupForm({ ...setupForm, def_counter: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Tanggal Cut-Off Stock
                </label>
                <input
                  type="date"
                  required
                  className="field-input"
                  style={{ width: "100%" }}
                  value={setupForm.date_stock}
                  onChange={(e) =>
                    setSetupForm({ ...setupForm, date_stock: e.target.value })
                  }
                />
              </div>

              <div
                style={{
                  background: "var(--warn-soft)",
                  padding: "10px",
                  borderRadius: "8px",
                  color: "var(--warn)",
                  fontSize: "11px",
                  lineHeight: "1.4",
                }}
              >
                Tombol di bawah akan mengaktifkan event SO di{" "}
                <code>ms_kso</code> sekaligus menarik seluruh saldo buku dari
                tabel <code>so_all_wh_snapshot_db</code> ke dalam{" "}
                <code>ms_cntso</code>.
              </div>

              <button
                type="submit"
                disabled={loadingSetup}
                className="btn-ctrl primary"
                style={{
                  marginTop: "auto",
                  height: "40px",
                  justifyContent: "center",
                }}
              >
                {loadingSetup ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <>
                    <RefreshCw size={16} /> Aktifkan & Tarik Saldo Snapshot
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* PANEL KANAN: TABEL LOG SCAN REALTIME */}
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
              Log Scan Transaksi Fisik Terkini (cntso)
            </span>
            <button
              type="button"
              className="btn-ctrl"
              style={{ height: "26px", fontSize: "11px", padding: "0 10px" }}
              onClick={loadActiveEventAndScans}
            >
              <RefreshCw size={12} /> Refresh
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
                      Belum ada rekaman scan fisik untuk event ini.
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
