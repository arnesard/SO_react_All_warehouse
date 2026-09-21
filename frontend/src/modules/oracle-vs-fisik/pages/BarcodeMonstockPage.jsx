import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  RefreshCw,
  ScanBarcode,
  MapPin,
  UploadCloud,
  Trash2,
  Clock,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import SectionCard from "../../../components/SectionCard";
import DataTable from "../../../components/DataTable";
import StatCard from "../../../components/StatCard";
import Modal from "../../../components/Modal";
import { api } from "../../../lib/api";

const UPLOAD_WAREHOUSES = ["APW", "BPW", "DPW", "RPW"];

function formatLastUpload(value) {
  if (!value) return "Belum pernah diupload";
  const [datePart, timePart] = String(value).split(" ");
  if (!datePart) return value;
  const [y, m, d] = datePart.split("-");
  const hm = (timePart || "").slice(0, 5);
  return `${d}/${m}/${y} - Jam ${hm}`;
}

function BarcodeMonstockPage() {
  const [allRows, setAllRows] = useState([]);
  const [filterWh, setFilterWh] = useState([]);
  const [lastUpload, setLastUpload] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedWh, setSelectedWh] = useState("");
  const [query, setQuery] = useState("");

  const [uploadWh, setUploadWh] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null); // { type: 'success'|'error', text }
  const fileInputRef = useRef(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/barcode-monstock/data");
      setAllRows(res.master_data || []);
      setFilterWh(res.filter_wh || []);
      setLastUpload(res.last_upload || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const rows = useMemo(() => {
    if (!selectedWh) return [];
    const q = query.trim().toLowerCase();
    return allRows.filter((r) => {
      if ((r.warehouse || "").toUpperCase() !== selectedWh.toUpperCase()) return false;
      if (!q) return true;
      return (
        (r.rackcode || "").toLowerCase().includes(q) ||
        (r.item || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        (r.loccode || "").toLowerCase().includes(q)
      );
    });
  }, [allRows, selectedWh, query]);

  const totalPcs = rows.reduce((a, r) => a + Number(r.jml || 0), 0);
  const totalOem = rows.reduce((a, r) => a + Number(r.oem || 0), 0);

  async function handleDelete(row) {
    if (!confirm(`Hapus baris "${row.item}" (rack ${row.rackcode})?`)) return;
    try {
      await api.del(`/api/barcode-monstock/delete/${row.id}`);
      setAllRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadWh) {
      setUploadMsg({ type: "error", text: "Pilih target warehouse dulu, sebelum memproses file CSV!" });
      return;
    }
    if (!file) {
      setUploadMsg({ type: "error", text: "Pilih berkas CSV terlebih dahulu." });
      return;
    }

    setUploading(true);
    setUploadMsg(null);
    try {
      const fd = new FormData();
      fd.append("target_warehouse", uploadWh);
      fd.append("file_csv", file);

      const resRaw = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8010"}/api/barcode-monstock/import`,
        { method: "POST", body: fd },
      );
      const res = await resRaw.json();
      if (!resRaw.ok || res.status !== "success") {
        throw new Error(res.message || "Gagal memproses file CSV.");
      }

      setUploadMsg({ type: "success", text: res.message });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadData();
    } catch (err) {
      setUploadMsg({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    setResetBusy(true);
    setResetError("");
    try {
      const res = await api.post("/api/barcode-monstock/truncate-all", { password: resetPassword });
      if (res.status === "wrong_password") {
        setResetError(res.message);
        return;
      }
      if (res.status === "error") {
        setResetError(res.message);
        return;
      }
      setResetOpen(false);
      setResetPassword("");
      setSelectedWh("");
      await loadData();
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetBusy(false);
    }
  }

  const columns = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "warehouse", label: "Warehouse" },
    { key: "rackcode", label: "Rack Code", render: (r) => <span className="cell-code">{r.rackcode}</span> },
    { key: "item", label: "Item Code", render: (r) => <span className="cell-code">{r.item}</span> },
    { key: "description", label: "Description", render: (r) => <span className="cell-strong">{r.description || "-"}</span> },
    { key: "jml", label: "Jml (Pcs)", align: "right", render: (r) => Number(r.jml || 0).toLocaleString("id-ID") },
    { key: "oem", label: "OEM (Pcs)", align: "right", render: (r) => Number(r.oem || 0).toLocaleString("id-ID") },
    { key: "loccode", label: "Location Code" },
    {
      key: "action",
      label: "",
      render: (row) => (
        <button
          className="btn-ctrl"
          style={{ padding: "5px 8px", color: "var(--danger)" }}
          onClick={() => handleDelete(row)}
        >
          <Trash2 size={13} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon={ScanBarcode} label="Rack Termonitor" value={rows.length} tone="accent" />
        <StatCard icon={MapPin} label="Total Pcs" value={totalPcs.toLocaleString("id-ID")} tone="cyan" />
        <StatCard icon={MapPin} label="Total OEM Pcs" value={totalOem.toLocaleString("id-ID")} tone="warn" />
      </div>

      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 320px", minWidth: 280 }}>
          <SectionCard icon={UploadCloud} title="Upload Barcode Monitoring Stock">
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: -4 }}>
              Unggah berkas <strong>.csv</strong> hasil export dari Aplikasi Barcode Desktop.
            </p>
            <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="field-group">
                <label>Target Warehouse</label>
                <select
                  className="field-select"
                  value={uploadWh}
                  onChange={(e) => setUploadWh(e.target.value)}
                  required
                >
                  <option value="" disabled>-- PILIH WAREHOUSE TARGET --</option>
                  {UPLOAD_WAREHOUSES.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label>Berkas CSV</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="field-input"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <button className="btn-ctrl primary" type="submit" disabled={uploading}>
                <UploadCloud size={14} /> {uploading ? "Memproses..." : "Proses Import Data"}
              </button>

              {uploadMsg && (
                <div
                  className={uploadMsg.type === "error" ? "form-error" : ""}
                  style={uploadMsg.type === "success" ? { color: "var(--ok)", fontSize: 12.5 } : undefined}
                >
                  {uploadMsg.text}
                </div>
              )}
            </form>

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <button
                className="btn-ctrl"
                style={{ width: "100%", color: "var(--danger)" }}
                onClick={() => setResetOpen(true)}
                type="button"
              >
                <ShieldAlert size={14} /> Reset Semua Data (Dev Only)
              </button>
            </div>
          </SectionCard>
        </div>

        <div style={{ flex: "1 1 480px", minWidth: 320 }}>
          <SectionCard
            icon={ScanBarcode}
            title="Barcode Monitoring Stock"
            actions={
              <>
                <select
                  className="field-select"
                  value={selectedWh}
                  onChange={(e) => setSelectedWh(e.target.value)}
                >
                  <option value="">⚠️ PILIH GUDANG</option>
                  {filterWh.map((w) => (
                    <option key={w} value={w}>
                      {w} — Terakhir Upload: {formatLastUpload(lastUpload[w])}
                    </option>
                  ))}
                </select>
                <div className="search-box">
                  <Search size={14} />
                  <input
                    className="field-input"
                    placeholder="Cari item, rack, atau location..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <button className="btn-ctrl" onClick={loadData}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </>
            }
          >
            {selectedWh && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  marginBottom: 10,
                }}
              >
                <Clock size={13} />
                Terakhir Upload: <strong>{formatLastUpload(lastUpload[selectedWh])}</strong>
              </div>
            )}

            {loading ? (
              <div style={{ padding: 24, opacity: 0.7 }}>Memuat data...</div>
            ) : !selectedWh ? (
              <div className="table-empty">Silakan pilih warehouse terlebih dahulu untuk melihat data.</div>
            ) : (
              <DataTable columns={columns} rows={rows} />
            )}
          </SectionCard>
        </div>
      </div>

      {resetOpen && (
        <Modal
          title="Reset Semua Data Barcode Monstock"
          onClose={() => {
            setResetOpen(false);
            setResetError("");
            setResetPassword("");
          }}
          footer={
            <>
              <button className="btn-ctrl" type="button" onClick={() => setResetOpen(false)}>
                Batal
              </button>
              <button className="btn-ctrl primary" type="submit" form="reset-monstock-form" disabled={resetBusy}>
                <RotateCcw size={14} /> {resetBusy ? "Memproses..." : "Truncate Semua Data"}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Aksi ini akan mengosongkan seluruh data monstock (semua warehouse). Masukkan password developer untuk konfirmasi.
          </p>
          <form id="reset-monstock-form" onSubmit={handleResetSubmit}>
            <div className="field-group">
              <label>Password</label>
              <input
                type="password"
                className="field-input"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                autoFocus
              />
            </div>
          </form>
          {resetError && <div className="form-error">{resetError}</div>}
        </Modal>
      )}
    </div>
  );
}

export default BarcodeMonstockPage;
