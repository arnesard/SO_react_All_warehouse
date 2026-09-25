import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Search,
  UploadCloud,
  RefreshCw,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import SectionCard from "../../components/SectionCard";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { api } from "../../lib/api";

function SnapshotPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWh, setSelectedWh] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [uploadWh, setUploadWh] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  // State untuk modal reset yang sebelumnya kurang
  const [resetOpen, setResetOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const fileInputRef = useRef(null);

  async function loadWarehouses() {
    try {
      const res = await api.get("/api/snapshot/get-warehouses");
      setWarehouses(res.warehouses || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadData(wh = selectedWh, search = query) {
    if (!wh) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ warehouse: wh });
      if (search) params.set("search", search);
      const res = await api.get(`/api/snapshot/data?${params.toString()}`);
      setRows(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWarehouses();
  }, []);

  function handleWhChange(wh) {
    setSelectedWh(wh);
    loadData(wh, query);
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") loadData(selectedWh, query);
  }

  const totalQty = useMemo(
    () => rows.reduce((a, r) => a + (parseInt(r.qty, 10) || 0), 0),
    [rows],
  );

  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadWh) {
      setUploadMsg({
        type: "error",
        text: "Pilih gudang tujuan upload terlebih dahulu bro!",
      });
      return;
    }
    if (!file) {
      setUploadMsg({
        type: "error",
        text: "File Excel Snapshot belum lu pilih!",
      });
      return;
    }

    setUploading(true);
    setUploadMsg(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new window.ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      const sheetRows = [];
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        const rowData = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          let val = cell.value;
          if (val && typeof val === "object" && val.result !== undefined) {
            val = val.result;
          }
          rowData[colNumber - 1] = val;
        });
        sheetRows.push(rowData);
      });

      if (sheetRows.length <= 1) {
        setUploadMsg({
          type: "error",
          text: "Struktur isi berkas Excel kosong bro!",
        });
        setUploading(false);
        return;
      }

      const sampleItem =
        sheetRows[1] && sheetRows[1][0] ? String(sheetRows[1][0]).trim() : "";

      const res = await api.post("/api/snapshot/import", {
        warehouse: uploadWh,
        excel_data: sheetRows,
        sample_item: sampleItem,
      });

      if (!res.success) {
        throw new Error(res.message || "Gagal memproses berkas server.");
      }

      setUploadMsg({ type: "success", text: res.message });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      await loadWarehouses();
      setSelectedWh(uploadWh);
      await loadData(uploadWh, "");
    } catch (err) {
      setUploadMsg({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  }

  async function handleResetAll() {
    setResetLoading(true);
    try {
      const res = await api.delete("/api/snapshot/reset");
      if (!res.success) throw new Error(res.message || "Gagal mereset data.");
      setRows([]);
      setSelectedWh("");
      setWarehouses([]);
      setResetOpen(false);
      await loadWarehouses();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setResetLoading(false);
    }
  }

  const columns = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    {
      key: "warehouse",
      label: "WH",
      render: (r) => <span className="badge-pill neutral">{r.warehouse}</span>,
    },
    {
      key: "item",
      label: "Item Code",
      render: (r) => <span className="cell-code">{r.item}</span>,
    },
    {
      key: "description",
      label: "Description (From Master)",
      render: (r) =>
        r.description ? (
          <span className="cell-strong">{r.description}</span>
        ) : (
          <span style={{ color: "var(--danger)", fontWeight: 600 }}>
            Item Not Found in Master Size DB
          </span>
        ),
    },
    {
      key: "qty",
      label: "Qty Oracle",
      align: "right",
      render: (r) => Number(r.qty || 0).toLocaleString("id-ID"),
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {/* Sisi Kiri: Panel Upload */}
      <div
        style={{
          flex: "0 0 320px",
          minWidth: 280,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <SectionCard icon={UploadCloud} title="Upload Snapshot Qty Oracle">
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              marginTop: -4,
            }}
          >
            Snapshot merekam qty Oracle di satu titik waktu, dipakai sebagai
            baseline pembanding sebelum stock opname berjalan.
          </p>
          <form
            onSubmit={handleUpload}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 8,
            }}
          >
            <div className="field-group">
              <label>Gudang Tujuan</label>
              <select
                className="field-select"
                value={uploadWh}
                onChange={(e) => setUploadWh(e.target.value)}
                required
              >
                <option value="" disabled>
                  -- PILIH GUDANG TARGET --
                </option>
                {["APW", "BPW", "DPW", "RPW"].map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label>Berkas Excel (.xlsx)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
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
                width: "100%",
                gap: 8,
              }}
            >
              <Camera size={14} />{" "}
              {uploading ? "Memproses..." : "Ambil Snapshot Baru"}
            </button>

            {uploadMsg && (
              <div
                className={uploadMsg.type === "error" ? "form-error" : ""}
                style={
                  uploadMsg.type === "success"
                    ? { color: "var(--ok)", fontSize: 12.5, marginTop: 4 }
                    : undefined
                }
              >
                {uploadMsg.text}
              </div>
            )}
          </form>
        </SectionCard>

        {/* Tombol Reset Dev Only */}
        <div style={{ padding: "0 4px" }}>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            style={{
              background: "transparent",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "var(--danger, #ef4444)",
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <ShieldAlert size={14} /> Reset Semua Data (Dev Only)
          </button>
        </div>
      </div>

      {/* Sisi Kanan: Tabel Data Snapshot */}
      <div style={{ flex: "1 1 480px", minWidth: 320 }}>
        <SectionCard
          icon={Camera}
          title="Snapshot Qty Oracle"
          actions={
            <>
              <div className="search-box">
                <Search size={14} />
                <input
                  className="field-input"
                  placeholder="Cari item..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
              <button className="btn-ctrl" onClick={() => loadData()}>
                <RefreshCw size={14} /> Refresh
              </button>
            </>
          }
        >
          {/* Dropdown Pilih Gudang dipindah ke dalam body card di pojok kiri atas */}
          <div style={{ marginBottom: 14, maxWidth: 220 }}>
            <select
              className="field-select"
              value={selectedWh}
              onChange={(e) => handleWhChange(e.target.value)}
            >
              <option value="">-- PILIH GUDANG --</option>
              {warehouses.map((w) => (
                <option key={w} value={w}>
                  {w.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="form-error" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}

          {!selectedWh ? (
            <div className="table-empty">
              ⚠️ Silakan pilih target gudang di atas terlebih dahulu untuk
              menampilkan data.
            </div>
          ) : loading ? (
            <div style={{ padding: 24, opacity: 0.7, textAlign: "center" }}>
              Memuat Snapshot Database...
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={rows}
                emptyText="Data Snapshot kosong / tidak ditemukan bro."
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 20,
                  fontSize: 12.5,
                  padding: "10px 4px 0",
                  color: "var(--text-secondary)",
                }}
              >
                <span>
                  Total Baris:{" "}
                  <strong>{rows.length.toLocaleString("id-ID")}</strong>
                </span>
                <span>
                  Total Qty:{" "}
                  <strong>{totalQty.toLocaleString("id-ID")} PCS</strong>
                </span>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Modal Konfirmasi Reset Data (Dev Only) */}
      {resetOpen && (
        <Modal
          title="⚠️ KONFIRMASI RESET SEMUA DATA"
          onClose={() => setResetOpen(false)}
          footer={
            <>
              <button
                className="btn-ctrl"
                type="button"
                onClick={() => setResetOpen(false)}
                disabled={resetLoading}
              >
                Batal
              </button>
              <button
                className="btn-ctrl"
                style={{
                  background: "var(--danger)",
                  color: "#fff",
                  border: "none",
                }}
                type="button"
                onClick={handleResetAll}
                disabled={resetLoading}
              >
                {resetLoading ? "Mereset..." : "Ya, Hapus & Reset Semua"}
              </button>
            </>
          }
        >
          <div
            style={{
              padding: "8px 0",
              fontSize: 13.5,
              lineHeight: 1.5,
              color: "var(--text-main)",
            }}
          >
            <p>
              Tindakan ini akan menghapus seluruh data Snapshot secara permanen
              dari database!
            </p>
            <p style={{ marginTop: 8, color: "var(--text-secondary)" }}>
              Apakah kamu yakin ingin melanjutkan?
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SnapshotPage;
