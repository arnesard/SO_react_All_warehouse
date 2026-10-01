import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // <-- DITAMBAHKAN useSearchParams
import {
  ArrowLeft,
  ScanBarcode,
  CheckCircle,
  Loader2,
  Package,
  Layers,
  History,
} from "lucide-react";
import Swal from "sweetalert2";
import { getUserSession } from "../../utils/auth";

const API_BASE = "http://localhost:8010/api/input-kso";

export default function ModePicPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // <-- Membaca URL parameter
  const currentUser = getUserSession();

  // BACA GUDANG: Utamakan dari URL (?wh=...), jika tidak ada ambil dari user login, default-nya BPW
  const urlWarehouse = searchParams.get("wh");
  const currentWarehouse = urlWarehouse || currentUser?.warehouse || "BPW";

  const [activeEvent, setActiveEvent] = useState(null);
  const [form, setForm] = useState({
    no_doc: "",
    item_code: "",
    qty_stk: "",
  });
  const [itemPreview, setItemPreview] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [saving, setSaving] = useState(false);
  const [myRecentScans, setMyRecentScans] = useState([]);

  const noDocRef = useRef(null);
  const itemInputRef = useRef(null);
  const qtyInputRef = useRef(null);

  // Ambil data event aktif & riwayat scan sesuai gudang
  const loadData = async () => {
    try {
      const resEvent = await fetch(
        `${API_BASE}/active-event?warehouse=${encodeURIComponent(currentWarehouse)}`,
      );
      const jsonEvent = await resEvent.json();
      if (jsonEvent.success && jsonEvent.activeEvent) {
        setActiveEvent(jsonEvent.activeEvent);
      } else {
        setActiveEvent(null);
      }

      const resScans = await fetch(
        `${API_BASE}/recent-scans?warehouse=${encodeURIComponent(currentWarehouse)}`,
      );
      const jsonScans = await resScans.json();
      if (jsonScans.success) {
        setMyRecentScans((jsonScans.data || []).slice(0, 10));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    noDocRef.current?.focus();
  }, [currentWarehouse]);

  // Lookup item info ban realtime
  const handleItemLookup = async (code) => {
    setForm((prev) => ({ ...prev, item_code: code }));
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

  // Simpan hasil hitung fisik
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.no_doc || !form.item_code || !form.qty_stk) {
      return Swal.fire(
        "Kurang Lengkap",
        "Pastikan NoDoc, Item Code, dan QTY terisi!",
        "warning",
      );
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/scan-pic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          so_name: activeEvent?.so_name || `SO-${currentWarehouse}`,
          no_doc: form.no_doc.trim().toUpperCase(),
          item_code: form.item_code.trim().toUpperCase(),
          qty_stk: Number(form.qty_stk),
          opr_code: currentUser?.username || "OPR",
          opr_name: currentUser?.username || "OPR",
          warehouse: currentWarehouse,
        }),
      });
      const json = await res.json();

      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Tersimpan!",
          text: `${form.no_doc} - ${Number(form.qty_stk).toLocaleString()} pcs`,
          timer: 1200,
          showConfirmButton: false,
        });

        setForm((prev) => ({ ...prev, item_code: "", qty_stk: "" }));
        setItemPreview(null);
        itemInputRef.current?.focus();
        loadData();
      } else {
        Swal.fire("Gagal Simpan", json.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        minHeight: "100vh",
        background: "var(--bg-app)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header Mobile */}
      <header
        style={{
          background: "var(--ink)",
          color: "#fff",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 30,
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => navigate("/InputKso")}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "none",
              color: "#fff",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ScanBarcode size={18} color="#00f6ff" /> Mode PIC Lapangan
            </h4>
            <span style={{ fontSize: "11px", color: "#a7a7ae" }}>
              Gudang: <strong>{currentWarehouse}</strong> • Opr:{" "}
              {currentUser?.username || "PIC"}
            </span>
          </div>
        </div>

        <span
          style={{
            background: "rgba(0, 246, 255, 0.15)",
            border: "1px solid rgba(0, 246, 255, 0.4)",
            color: "#00f6ff",
            padding: "3px 8px",
            borderRadius: "12px",
            fontSize: "10px",
            fontWeight: 700,
          }}
        >
          PDT / MOBILE
        </span>
      </header>

      {/* Main Container */}
      <main
        style={{
          padding: "14px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* Banner Event Aktif */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-soft)",
            padding: "10px 14px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={16} color="var(--accent)" />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Event Aktif:
            </span>
          </div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--accent)",
            }}
            className="mono"
          >
            {activeEvent?.so_name || "Belum ada event aktif"}
          </span>
        </div>

        {/* Form Input PIC */}
        <form
          onSubmit={handleSubmit}
          className="surface-card"
          style={{
            padding: "16px",
            borderRadius: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              1. No. Dokumen Kartu (NoDoc)
            </label>
            <input
              ref={noDocRef}
              type="text"
              required
              placeholder="Contoh: G1A01-001"
              className="field-input mono"
              style={{
                width: "100%",
                height: "46px",
                fontSize: "15px",
                textTransform: "uppercase",
              }}
              value={form.no_doc}
              onChange={(e) => setForm({ ...form, no_doc: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") itemInputRef.current?.focus();
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              2. Item Code Ban
            </label>
            <input
              ref={itemInputRef}
              type="text"
              required
              placeholder="Scan barcode / ketik item"
              className="field-input mono"
              style={{
                width: "100%",
                height: "46px",
                fontSize: "15px",
                textTransform: "uppercase",
              }}
              value={form.item_code}
              onChange={(e) => handleItemLookup(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") qtyInputRef.current?.focus();
              }}
            />
            {loadingItem && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--accent)",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                Memeriksa item...
              </span>
            )}
          </div>

          {/* Info Ban Realtime */}
          {itemPreview && (
            <div
              style={{
                background: "var(--surface-zebra)",
                border: "1px solid var(--accent-border)",
                borderRadius: "10px",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                }}
              >
                <Package size={15} color="var(--accent)" />
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {itemPreview.description}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11.5px",
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
                  Oracle:{" "}
                  <strong className="mono">
                    {Number(itemPreview.qty_oracle).toLocaleString()}
                  </strong>
                </span>
              </div>
            </div>
          )}

          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              3. Jumlah Fisik Pcs (QtyStk)
            </label>
            <input
              ref={qtyInputRef}
              type="number"
              required
              min="1"
              placeholder="Jumlah ban fisik"
              className="field-input mono"
              style={{
                width: "100%",
                height: "48px",
                fontSize: "18px",
                fontWeight: 700,
              }}
              value={form.qty_stk}
              onChange={(e) => setForm({ ...form, qty_stk: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-ctrl primary"
            style={{
              height: "48px",
              fontSize: "14px",
              fontWeight: 700,
              justifyContent: "center",
              borderRadius: "12px",
              marginTop: "4px",
            }}
          >
            {saving ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <>
                <CheckCircle size={18} /> Simpan Hasil Hitung
              </>
            )}
          </button>
        </form>

        {/* Riwayat Scan Lapangan */}
        <div style={{ marginTop: "4px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
              padding: "0 4px",
            }}
          >
            <History size={14} color="var(--text-secondary)" />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-secondary)",
              }}
            >
              10 Scan Fisik Terakhir ({currentWarehouse})
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {myRecentScans.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                }}
              >
                Belum ada transaksi di gudang {currentWarehouse}.
              </div>
            ) : (
              myRecentScans.map((s) => (
                <div
                  key={s.recid}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        className="mono"
                        style={{ fontWeight: 700, fontSize: "13px" }}
                      >
                        {s.NoDoc}
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {s.ItemCode}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginTop: "2px",
                      }}
                    >
                      {s.description || "-"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      className="mono"
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--accent)",
                      }}
                    >
                      {Number(s.QtyStk).toLocaleString()} pcs
                    </div>
                    <span
                      className={`badge-pill ${s.opr_v ? "ok" : "warn"}`}
                      style={{
                        fontSize: "9.5px",
                        padding: "1px 6px",
                        marginTop: "3px",
                      }}
                    >
                      {s.opr_v ? "Sudah Verif" : "Belum Verif"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
