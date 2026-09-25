import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, UploadCloud, RotateCcw, ShieldAlert } from "lucide-react";
import SectionCard from "../../components/SectionCard";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { api } from "../../lib/api";

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
  const [searchTerm, setSearchTerm] = useState("");

  const [uploadWh, setUploadWh] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [uploadErrorModal, setUploadErrorModal] = useState("");
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
    let data = allRows.filter(
      (r) => (r.warehouse || "").toUpperCase() === selectedWh.toUpperCase(),
    );

    // Filter berdasarkan teks pencarian
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      data = data.filter((r) =>
        Object.values(r).some((val) =>
          String(val || "")
            .toLowerCase()
            .includes(q),
        ),
      );
    }

    return data;
  }, [allRows, selectedWh, searchTerm]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadWh) {
      setUploadMsg({
        type: "error",
        text: "Pilih target warehouse dulu, sebelum memproses file CSV!",
      });
      return;
    }
    if (!file) {
      setUploadMsg({
        type: "error",
        text: "Pilih berkas CSV terlebih dahulu.",
      });
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
      setUploadErrorModal(err.message);
      setUploadMsg(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    setResetBusy(true);
    setResetError("");
    try {
      const res = await api.post("/api/barcode-monstock/truncate-all", {
        password: resetPassword,
      });
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
    { key: "no", label: "No.", width: "52px", render: (_, i) => i + 1 },
    { key: "warehouse", label: "Warehouse", width: "100px" },
    {
      key: "rackcode",
      label: "Rack Code",
      width: "100px",
      render: (r) => <span className="cell-code">{r.rackcode}</span>,
    },
    {
      key: "item",
      label: "Item Code",
      width: "120px",
      render: (r) => <span className="cell-code">{r.item}</span>,
    },
    {
      key: "description",
      label: "Description",
      render: (r) => (
        <span className="cell-strong">{r.description || "-"}</span>
      ),
    },
    {
      key: "jml",
      label: "Jml (Pcs)",
      align: "right",
      width: "100px",
      render: (r) => Number(r.jml || 0).toLocaleString("id-ID"),
    },
    {
      key: "oem",
      label: "OEM (Pcs)",
      align: "right",
      width: "100px",
      render: (r) => Number(r.oem || 0).toLocaleString("id-ID"),
    },
    { key: "loccode", label: "Location Code", width: "130px" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 100px)",
        overflow: "hidden",
      }}
    >
      {error && (
        <div className="form-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Bagian Kiri (Form Upload) & Kanan (Tabel) berdampingan */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "stretch",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Sisi Kiri: Upload Card */}
        <div
          style={{
            flex: "0 0 320px",
            minWidth: 280,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SectionCard
            icon={UploadCloud}
            title="Upload Barcode Monitoring Stock"
            bodyStyle={{ display: "flex", flexDirection: "column", flex: 1 }}
          >
            <p
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginTop: -4,
              }}
            >
              Unggah berkas <strong>.csv</strong> hasil export dari Aplikasi
              Barcode Desktop.
            </p>
            <form
              onSubmit={handleUpload}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 28, // <-- Ditingkatkan dari 10 jadi 18 biar agak renggang dan turun ke bawah
                paddingTop: 8,
                paddingBottom: 8,
              }}
            >
              <div className="field-group">
                <label>Target Warehouse</label>
                <select
                  className="field-select"
                  value={uploadWh}
                  onChange={(e) => setUploadWh(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    -- PILIH WAREHOUSE TARGET --
                  </option>
                  {UPLOAD_WAREHOUSES.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
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

              <button
                className="btn-ctrl primary"
                type="submit"
                disabled={uploading}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%", // Supaya tombolnya memenuhi lebar card di sebelah kiri
                  gap: 8,
                }}
              >
                <UploadCloud size={14} />{" "}
                {uploading ? "Memproses..." : "Proses Import Data"}
              </button>

              {uploadMsg && (
                <div
                  className={uploadMsg.type === "error" ? "form-error" : ""}
                  style={
                    uploadMsg.type === "success"
                      ? { color: "var(--ok)", fontSize: 12.5 }
                      : undefined
                  }
                >
                  {uploadMsg.text}
                </div>
              )}
            </form>
            <div
              style={{
                marginTop: "auto",
                paddingTop: 12,
                borderTop: "1px solid var(--border)",
              }}
            >
              <button
                className="btn-ctrl"
                style={{
                  width: "100%",
                  color: "var(--danger)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                }}
                onClick={() => setResetOpen(true)}
                type="button"
              >
                <ShieldAlert size={14} /> Reset Semua Data (Dev Only)
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Sisi Kanan: Tabel Data */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SectionCard
            bodyStyle={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* Baris Filter & Pencarian (Pilih Gudang di kiri, Search & Refresh mentok di kanan) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              {/* Kiri: Pilih Gudang */}
              <select
                className="field-select"
                value={selectedWh}
                onChange={(e) => setSelectedWh(e.target.value)}
                style={{ width: "auto" }}
              >
                <option value="">PILIH GUDANG</option>
                {filterWh.map((w) => (
                  <option key={w} value={w}>
                    {w} — Terakhir Upload: {formatLastUpload(lastUpload[w])}
                  </option>
                ))}
              </select>

              {/* Kanan: Kotak Pencarian & Tombol Refresh (Dijamin Mentok Kanan) */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginLeft: "auto",
                }}
              >
                <input
                  type="text"
                  className="field-input"
                  placeholder="Cari data apapun..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "200px", height: "34px", fontSize: "12px" }}
                />
                <button
                  className="btn-ctrl"
                  onClick={loadData}
                  style={{ height: "34px" }}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>

            {/* Isi Tabel */}
            {loading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  padding: 40,
                  gap: 12,
                  color: "var(--text-secondary)",
                }}
              >
                {/* Spinner Animasi Berputar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    border: "3px solid var(--border)",
                    borderTop: "3px solid var(--primary, #c5f358)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Sedang memuat data gudang...
                </span>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : !selectedWh ? (
              <div className="table-empty">
                Silakan pilih warehouse terlebih dahulu untuk melihat data.
              </div>
            ) : (
              <DataTable
                columns={columns}
                rows={rows}
                wrapStyle={{
                  flex: 1,
                  minHeight: 0,
                  maxHeight: "calc(100vh - 220px)",
                }}
              />
            )}
          </SectionCard>
        </div>
      </div>

      {/* Modal Reset */}
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
              <button
                className="btn-ctrl"
                type="button"
                onClick={() => setResetOpen(false)}
              >
                Batal
              </button>
              <button
                className="btn-ctrl primary"
                type="submit"
                form="reset-monstock-form"
                disabled={resetBusy}
              >
                <RotateCcw size={14} />{" "}
                {resetBusy ? "Memproses..." : "Truncate Semua Data"}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Aksi ini akan mengosongkan seluruh data monstock (semua warehouse).
            Masukkan password developer untuk konfirmasi.
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

      {/* Modal Peringatan Salah Gudang (SweetAlert Style) */}
      {uploadErrorModal && (
        <Modal
          title=" PERINGATAN KESALAHAN UPLOAD"
          onClose={() => setUploadErrorModal("")}
          footer={
            <button
              className="btn-ctrl primary"
              type="button"
              onClick={() => setUploadErrorModal("")}
            >
              Saya Mengerti & Tutup
            </button>
          }
        >
          <div style={{ padding: "8px 0" }}>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--text-main)",
                lineHeight: 1.5,
              }}
            >
              {uploadErrorModal}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default BarcodeMonstockPage;
