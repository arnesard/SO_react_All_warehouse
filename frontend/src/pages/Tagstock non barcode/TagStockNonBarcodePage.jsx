import { useEffect, useState, useMemo } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  FileCheck,
  Download,
  Printer,
  CheckCircle,
  RotateCcw,
  Tag,
  Loader2,
  TableProperties,
} from "lucide-react";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:8010/api/tagstock-nonbarcode";

function triggerPrintPageViaFrame(url) {
  const frameId = "print-isolated-iframe";
  let iframe = document.getElementById(frameId);
  if (iframe) iframe.remove();

  iframe = document.createElement("iframe");
  iframe.id = frameId;
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.src = url;
  document.body.appendChild(iframe);
}

export default function TagStockNonBarcodePage() {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWh, setSelectedWh] = useState("");
  const [operators, setOperators] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [docList, setDocList] = useState([]);
  const [docStart, setDocStart] = useState("");
  const [docEnd, setDocEnd] = useState("");

  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  // Upload State
  const [uploadWh, setUploadWh] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Inisialisasi Gudang
  const loadInitialFilters = async () => {
    try {
      const res = await fetch(`${API_BASE}/init-filters`);
      const json = await res.json();
      if (json.status === "success") {
        setWarehouses(json.warehouses || []);
      }
    } catch (err) {
      console.error("Gagal load gudang:", err);
    }
  };

  useEffect(() => {
    loadInitialFilters();
  }, []);

  // Load operator saat gudang filter berganti
  useEffect(() => {
    if (!selectedWh) {
      setOperators([]);
      setSelectedOperator("");
      setTableRows([]);
      setDocList([]);
      setIsValidated(false);
      return;
    }

    async function loadOps() {
      try {
        const res = await fetch(
          `${API_BASE}/operators?warehouse=${encodeURIComponent(selectedWh)}`,
        );
        const json = await res.json();
        if (json.status === "success") {
          setOperators(json.operators || []);
        }
      } catch (err) {
        console.error("Gagal load operator:", err);
      }
    }

    loadOps();
    setSelectedOperator("");
    setTableRows([]);
    setDocList([]);
    setDocStart("");
    setDocEnd("");
    setIsValidated(false);
  }, [selectedWh]);

  // Load rows data
  const loadRowsData = async (wh, opId, start = "", end = "") => {
    if (!wh || !opId) return;
    setLoading(true);
    setIsValidated(false);
    try {
      const res = await fetch(`${API_BASE}/process-rows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse: wh,
          operator_id: opId,
          doc_start: start,
          doc_end: end,
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        const data = json.master_data || [];
        setTableRows(data);

        if (!start && !end) {
          const docs = [...new Set(data.map((d) => d.no_doc))].filter(Boolean);
          setDocList(docs);
        }
      } else {
        setTableRows([]);
      }
    } catch (err) {
      console.error("Gagal load rows:", err);
      setTableRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorChange = (opId) => {
    setSelectedOperator(opId);
    setDocStart("");
    setDocEnd("");
    if (opId) {
      loadRowsData(selectedWh, opId);
    } else {
      setTableRows([]);
      setDocList([]);
    }
  };

  const handleDocFilterApply = (start, end) => {
    if (start && end && start > end) {
      Swal.fire({
        icon: "error",
        title: "Dokumen Terbalik!",
        text: "Doc Awal tidak boleh lebih besar dari Doc Akhir bro!",
        background: "var(--surface)",
        customClass: { popup: "swal-theme-popup" },
      });
      return;
    }
    loadRowsData(selectedWh, selectedOperator, start, end);
  };

  const handleResetFilters = () => {
    setSelectedWh("");
    setSelectedOperator("");
    setDocStart("");
    setDocEnd("");
    setTableRows([]);
    setDocList([]);
    setIsValidated(false);
  };

  // Upload Excel Handler via FormData
  const handleUploadExcel = async () => {
    if (!uploadWh) {
      return Swal.fire({
        icon: "warning",
        title: "Pilih Gudang",
        text: "Pilih Target Warehouse dulu bro!",
        background: "var(--surface)",
        customClass: { popup: "swal-theme-popup" },
      });
    }
    if (!uploadFile) {
      return Swal.fire({
        icon: "warning",
        title: "Pilih File",
        text: "Pilih file Excel .xlsx dulu bro!",
        background: "var(--surface)",
        customClass: { popup: "swal-theme-popup" },
      });
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("warehouse", uploadWh);
      formData.append("file", uploadFile);

      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json && json.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: `Upload sukses! ${json.inserted} data tersimpan bro!`,
          background: "var(--surface)",
          customClass: { popup: "swal-theme-popup" },
        });
        setUploadFile(null);
        loadInitialFilters();
      } else {
        const errorMsg =
          json?.message || `Server Error (Status: ${res.status})`;
        Swal.fire({
          icon: "error",
          title: "Gagal Upload",
          text: errorMsg,
          background: "var(--surface)",
          customClass: { popup: "swal-theme-popup" },
        });
      }
    } catch (err) {
      console.error("Gagal upload file:", err);
      Swal.fire({
        icon: "error",
        title: "Koneksi Bermasalah",
        text: `Error: ${err.message}. Pastikan backend server aktif!`,
        background: "var(--surface)",
        customClass: { popup: "swal-theme-popup" },
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePrintRekap = () => {
    if (!selectedWh || !selectedOperator) return;
    const url = `/print/tagstock-nonbarcode/rekap?warehouse=${encodeURIComponent(selectedWh)}&operator_id=${encodeURIComponent(selectedOperator)}&doc_start=${encodeURIComponent(docStart)}&doc_end=${encodeURIComponent(docEnd)}`;
    triggerPrintPageViaFrame(url);
  };

  const handlePrintKartuTag = () => {
    if (!selectedWh || !selectedOperator) return;
    const url = `/print/tagstock-nonbarcode/kso?warehouse=${encodeURIComponent(selectedWh)}&operator_id=${encodeURIComponent(selectedOperator)}&doc_start=${encodeURIComponent(docStart)}&doc_end=${encodeURIComponent(docEnd)}`;
    triggerPrintPageViaFrame(url);
  };

  const totalRack = useMemo(
    () => tableRows.reduce((a, b) => a + (Number(b.Rak) || 0), 0),
    [tableRows],
  );
  const totalQty = useMemo(
    () => tableRows.reduce((a, b) => a + (Number(b.Qty) || 0), 0),
    [tableRows],
  );

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        width: "100%" /* Wajib ada */,
        height: "calc(100vh - 84px)",
        padding: "4px 0",
        boxSizing: "border-box",
        alignItems: "stretch",
      }}
    >
      {/* 📥 1. PANEL KIRI: CARD UPLOAD (Sejajar bawah dengan tabel) */}
      <div
        style={{
          width: "240px",
          height: "100%", // Sejajar penuh dengan panel kanan
          flexShrink: 0,
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "14px",
          padding: "16px 14px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        {/* Ikon Bulat File */}
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 10px auto",
            flexShrink: 0,
          }}
        >
          <FileSpreadsheet size={22} color="var(--text-secondary)" />
        </div>

        <h4
          style={{
            fontSize: "12px",
            fontWeight: 600,
            margin: "0 0 3px 0",
            textTransform: "none",
            color: "var(--text-primary)",
            flexShrink: 0,
          }}
        >
          Upload Non-Barcode
        </h4>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-secondary)",
            margin: "0 0 12px 0",
            lineHeight: "1.3",
            flexShrink: 0,
          }}
        >
          Unggah file <strong>.xlsx</strong> Tag Stock Non-Barcode.
        </p>

        {/* Dropdown Gudang */}
        <select
          className="field-select"
          style={{
            width: "100%",
            height: "34px",
            borderColor: "transparent",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "8px",
            marginBottom: "12px",
            boxSizing: "border-box",
            flexShrink: 0,
          }}
          value={uploadWh}
          onChange={(e) => setUploadWh(e.target.value)}
        >
          <option value="">-- Pilih Gudang --</option>
          <option value="APW">APW</option>
          <option value="BPW">BPW</option>
          <option value="DPW">DPW</option>
          <option value="RPW">RPW</option>
        </select>

        {/* Kotak Dropzone File (Dibuat mengisi sisa ruang ke bawah tanpa batasan maxHeight) */}
        <div
          style={{
            flex: 1, // Otomatis memanjang mengisi seluruh ruang tengah
            minHeight: "220px",
            border: "1.5px dashed rgba(0, 0, 0, 0.2)",
            borderRadius: "10px",
            padding: "20px 10px",
            position: "relative",
            cursor: "pointer",
            backgroundColor: "transparent",
            marginBottom: "14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <input
            type="file"
            accept=".xlsx, .xls"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
            }}
            onChange={(e) => setUploadFile(e.target.files[0] || null)}
          />
          <UploadCloud
            size={36}
            color="var(--text-secondary)"
            style={{ marginBottom: "10px", opacity: 0.9 }}
          />
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              wordBreak: "break-all",
              lineHeight: "1.4",
              padding: "0 8px",
            }}
          >
            {uploadFile
              ? uploadFile.name
              : "Klik atau seret file Excel ke sini"}
          </div>
        </div>

        {/* Tombol Aksi Bawah */}
        <div style={{ flexShrink: 0, width: "100%" }}>
          <button
            type="button"
            className="btn-ctrl primary"
            style={{
              width: "100%",
              height: "36px",
              borderRadius: "18px",
              backgroundColor: "#111113",
              borderColor: "#111113",
              color: "#fff",
              fontWeight: 600,
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
            disabled={uploading}
            onClick={handleUploadExcel}
          >
            {uploading ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <FileCheck size={14} />
            )}
            Proses Upload Data
          </button>

          <a
            href="/template/tes tag stok kosong.xlsx"
            target="_blank"
            rel="noreferrer"
            className="btn-ctrl green"
            style={{
              width: "100%",
              height: "36px",
              borderRadius: "18px",
              fontWeight: 600,
              fontSize: "12px",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Download size={14} /> File Contoh Upload
          </a>
        </div>
      </div>

      {/* 📊 2. PANEL KANAN: CARD FILTER ATAS & CARD TABEL BAWAH */}
      <div
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          minWidth: 0,
        }}
      >
        {/* CARD FILTER ATAS */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
            flexShrink: 0,
          }}
        >
          {/* Sisi Kiri: Gudang, Operator, Validasi, Rekap */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              className="field-select"
              style={{
                width: "150px",
                height: "34px",
                fontSize: "12px",
                fontWeight: 600,
                borderColor: "transparent",
                borderRadius: "8px",
                padding: "2px 8px",
              }}
              value={selectedWh}
              onChange={(e) => setSelectedWh(e.target.value)}
            >
              <option value="">Pilih gudang</option>
              {warehouses.map((wh) => (
                <option key={wh} value={wh}>
                  {wh}
                </option>
              ))}
            </select>

            <select
              className="field-select"
              style={{
                width: "230px",
                height: "34px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "8px",
                padding: "2px 8px",
              }}
              disabled={!selectedWh || operators.length === 0}
              value={selectedOperator}
              onChange={(e) => handleOperatorChange(e.target.value)}
            >
              <option value="">Pilih operator</option>
              {operators.map((op) => (
                <option key={op.no_penneng} value={op.no_penneng}>
                  {op.nama} ({op.no_penneng})
                </option>
              ))}
            </select>

            {selectedOperator && (
              <>
                <button
                  type="button"
                  className={`btn-ctrl ${isValidated ? "solid-green" : "yellow"}`}
                  style={{
                    height: "34px",
                    padding: "0 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "8px",
                  }}
                  onClick={() => setIsValidated(!isValidated)}
                >
                  <CheckCircle size={13} />{" "}
                  {isValidated ? "Tutup Validasi" : "Validasi"}
                </button>

                <button
                  type="button"
                  className="btn-ctrl green"
                  style={{
                    height: "34px",
                    padding: "0 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "8px",
                  }}
                  onClick={handlePrintRekap}
                >
                  <Printer size={13} /> Rekap
                </button>
              </>
            )}
          </div>

          {/* Sisi Kanan: Doc Filter, Tag Stock, Reset */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {selectedOperator && (
              <>
                <select
                  className="field-select"
                  style={{
                    width: "125px",
                    height: "34px",
                    fontSize: "12px",
                    borderColor: "transparent",
                    borderRadius: "8px",
                    padding: "2px 8px",
                  }}
                  value={docStart}
                  onChange={(e) => {
                    setDocStart(e.target.value);
                    handleDocFilterApply(e.target.value, docEnd);
                  }}
                >
                  <option value="">Doc awal</option>
                  {docList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  className="field-select"
                  style={{
                    width: "125px",
                    height: "34px",
                    fontSize: "12px",
                    borderColor: "transparent",
                    borderRadius: "8px",
                    padding: "2px 8px",
                  }}
                  value={docEnd}
                  onChange={(e) => {
                    setDocEnd(e.target.value);
                    handleDocFilterApply(docStart, e.target.value);
                  }}
                >
                  <option value="">Doc akhir</option>
                  {docList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </>
            )}

            <button
              type="button"
              className="btn-ctrl primary"
              style={{
                height: "34px",
                padding: "0 14px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
              disabled={!selectedOperator}
              onClick={handlePrintKartuTag}
            >
              <Tag size={13} /> Tag Stock
            </button>

            <button
              type="button"
              className="btn-ctrl red"
              style={{
                height: "34px",
                padding: "0 14px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
              onClick={handleResetFilters}
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>

        {/* CARD TABEL DATA (Sejajar penuh ke bawah) */}
        <div
          style={{
            flex: 1,
            background: "var(--surface)",
            border: "1px solid var(--border-soft)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxSizing: "border-box",
            minHeight: 0, // Mencegah flex child overflow
          }}
        >
          {/* Header Title Card */}
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "11.5px",
                textTransform: "none",
              }}
            >
              <TableProperties size={15} /> Data Tag Stock Non-Barcode
            </div>

            {tableRows.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "12px",
                }}
              >
                <span
                  style={{
                    backgroundColor: "var(--surface-3)",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  Total Rak: <strong className="mono">{totalRack}</strong>
                </span>
                <span
                  style={{
                    backgroundColor: "var(--surface-2)",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Total Qty:{" "}
                  <strong className="mono">
                    {totalQty.toLocaleString("id-ID")}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Area Tabel (Scroll vertikal di dalam card jika data banyak) */}
          <div
            className="dtable-wrap"
            style={{
              flex: 1,
              maxHeight: "none",
              border: "none",
              borderRadius: 0,
              overflowY: "auto",
            }}
          >
            <table
              className="dtable"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
              }}
            >
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  backgroundColor: "var(--surface-2)",
                  zIndex: 3,
                  boxShadow: "inset 0 -1px 0 var(--border)",
                }}
              >
                <tr style={{ textTransform: "none", fontSize: "12px" }}>
                  <th style={{ width: "45px", textAlign: "center" }}>No.</th>
                  <th style={{ width: "100px" }}>Lot</th>
                  <th style={{ width: "120px" }}>No. Doc</th>
                  <th style={{ width: "120px" }}>Item</th>
                  <th style={{ textAlign: "left" }}>Deskripsi Master Size</th>
                  <th style={{ width: "90px", textAlign: "center" }}>
                    Jml Rak
                  </th>
                  <th style={{ width: "100px", textAlign: "right" }}>Qty</th>
                  <th style={{ width: "100px", textAlign: "right" }}>
                    Jml Aktual
                  </th>
                  {isValidated && (
                    <th style={{ width: "110px", textAlign: "center" }}>
                      Status
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={isValidated ? 9 : 8}
                      className="table-empty"
                      style={{ padding: "50px 0" }}
                    >
                      <Loader2
                        size={18}
                        className="spin"
                        style={{
                          display: "inline-block",
                          verticalAlign: "middle",
                          marginRight: 8,
                        }}
                      />
                      Menyisir data tag stock non-barcode...
                    </td>
                  </tr>
                ) : tableRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isValidated ? 9 : 8}
                      className="table-empty"
                      style={{
                        padding: "50px 0",
                        color: "var(--text-secondary)",
                        fontSize: "11.5px",
                      }}
                    >
                      {selectedOperator
                        ? "Tidak ada data pada rentang dokumen ini."
                        : "Silakan pilih gudang dan operator untuk menampilkan data."}
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row, index) => {
                    const qty = Number(row.Qty || 0);
                    const actual =
                      row.actual_qty !== null ? Number(row.actual_qty) : null;
                    const isMatch = actual !== null && qty === actual;

                    return (
                      <tr key={index}>
                        <td style={{ textAlign: "center" }} className="mono">
                          {index + 1}
                        </td>
                        <td className="cell-code">{row.lot_display || "-"}</td>
                        <td className="mono">{row.no_doc || "-"}</td>
                        <td className="cell-strong">{row.item}</td>
                        <td
                          style={{
                            color: "var(--text-secondary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={row.description || ""}
                        >
                          {row.description || "-"}
                        </td>
                        <td style={{ textAlign: "center" }} className="mono">
                          {row.Rak || 0}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {qty.toLocaleString("id-ID")}
                        </td>
                        <td
                          style={{ textAlign: "right" }}
                          className="cell-code"
                        >
                          {actual !== null
                            ? actual.toLocaleString("id-ID")
                            : ""}
                        </td>
                        {isValidated && (
                          <td style={{ textAlign: "center" }}>
                            {actual === null ? (
                              <span className="badge-pill warn">Belum</span>
                            ) : isMatch ? (
                              <span className="badge-pill ok">Sesuai</span>
                            ) : (
                              <span className="badge-pill danger">
                                Tidak Sesuai
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
