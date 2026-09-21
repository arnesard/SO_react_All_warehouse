import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Search, UploadCloud, RefreshCw } from "lucide-react";
import SectionCard from "../../../components/SectionCard";
import DataTable from "../../../components/DataTable";
import { api } from "../../../lib/api";

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
      setUploadMsg({ type: "error", text: "Pilih gudang tujuan upload terlebih dahulu bro!" });
      return;
    }
    if (!file) {
      setUploadMsg({ type: "error", text: "File Excel Snapshot belum lu pilih!" });
      return;
    }

    setUploading(true);
    setUploadMsg(null);
    try {
      // Bongkar file Excel di browser pakai ExcelJS (dari public/excel.min.js),
      // sama persis kayak versi Laravel — backend cuma nerima JSON hasil parse.
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
        setUploadMsg({ type: "error", text: "Struktur isi berkas Excel kosong bro!" });
        setUploading(false);
        return;
      }

      const sampleItem = sheetRows[1] && sheetRows[1][0] ? String(sheetRows[1][0]).trim() : "";

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

  const columns = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    {
      key: "warehouse",
      label: "WH",
      render: (r) => <span className="badge-pill neutral">{r.warehouse}</span>,
    },
    { key: "item", label: "Item Code", render: (r) => <span className="cell-code">{r.item}</span> },
    {
      key: "description",
      label: "Description (From Master)",
      render: (r) =>
        r.description ? (
          <span className="cell-strong">{r.description}</span>
        ) : (
          <span style={{ color: "var(--danger)", fontWeight: 600 }}>Item Not Found in Master Size DB</span>
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
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ flex: "0 0 320px", minWidth: 280 }}>
        <SectionCard icon={UploadCloud} title="Upload Snapshot Qty Oracle">
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: -4 }}>
            Snapshot merekam qty Oracle di satu titik waktu, dipakai sebagai baseline pembanding sebelum stock opname berjalan.
          </p>
          <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="field-group">
              <label>Gudang Tujuan</label>
              <select
                className="field-select"
                value={uploadWh}
                onChange={(e) => setUploadWh(e.target.value)}
                required
              >
                <option value="" disabled>-- PILIH GUDANG --</option>
                {["APW", "BPW", "DPW", "RPW"].map((w) => (
                  <option key={w} value={w}>{w}</option>
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

            <button className="btn-ctrl primary" type="submit" disabled={uploading}>
              <Camera size={14} /> {uploading ? "Memproses..." : "Ambil Snapshot Baru"}
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
        </SectionCard>
      </div>

      <div style={{ flex: "1 1 480px", minWidth: 320 }}>
        <SectionCard
          icon={Camera}
          title="Snapshot Qty Oracle"
          actions={
            <>
              <select
                className="field-select"
                value={selectedWh}
                onChange={(e) => handleWhChange(e.target.value)}
              >
                <option value="">⚠️ PILIH GUDANG</option>
                {warehouses.map((w) => (
                  <option key={w} value={w}>{w.toUpperCase()}</option>
                ))}
              </select>
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
          {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

          {!selectedWh ? (
            <div className="table-empty">⚠️ Silakan pilih target gudang di atas terlebih dahulu untuk menampilkan data.</div>
          ) : loading ? (
            <div style={{ padding: 24, opacity: 0.7 }}>Memuat Snapshot Database...</div>
          ) : (
            <>
              <DataTable columns={columns} rows={rows} emptyText="Data Snapshot kosong / tidak ditemukan bro." />
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
                <span>Total Baris: <strong>{rows.length.toLocaleString("id-ID")}</strong></span>
                <span>Total Qty: <strong>{totalQty.toLocaleString("id-ID")} PCS</strong></span>
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export default SnapshotPage;
