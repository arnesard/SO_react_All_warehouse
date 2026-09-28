import { useEffect, useState, useMemo } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  FileCheck,
  RefreshCw,
  Search,
  Boxes,
  Users,
  TableProperties,
  Info,
  Loader2,
  X,
  Layers,
  Printer,
  Download,
} from "lucide-react";
import Swal from "sweetalert2";
import ExportExcelKso from "./ExportExcelKso";

const API_BASE = "http://localhost:8010/api/appkso";

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

export default function AppksoPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWh, setSelectedWh] = useState("");

  const [detailData, setDetailData] = useState([]);
  const [resumeData, setResumeData] = useState([]);
  const [patternData, setPatternData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Upload state
  const [uploadWh, setUploadWh] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Modal Drill-down state
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillModalTitle, setDrillModalTitle] = useState("");
  const [drillModalRows, setDrillModalRows] = useState([]);

  // Modal Print Rekap Setup State
  const [printRekapModalOpen, setPrintRekapModalOpen] = useState(false);
  const [rekapOpr, setRekapOpr] = useState("ALL");
  const [rekapTglSo, setRekapTglSo] = useState("");
  const [rekapTglPosisi, setRekapTglPosisi] = useState("");

  // Modal Print KSO Cards Setup State
  const [printKsoModalOpen, setPrintKsoModalOpen] = useState(false);
  const [ksoPic, setKsoPic] = useState("");
  const [ksoDocFrom, setKsoDocFrom] = useState("");
  const [ksoDocTo, setKsoDocTo] = useState("");
  const [ksoTanggal, setKsoTanggal] = useState("");

  // Modal Export Excel State
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Load Warehouse Options
  const loadWarehouses = async () => {
    try {
      const res = await fetch(`${API_BASE}/warehouses`);
      const json = await res.json();
      if (json.status === "success") {
        setWarehouses(json.warehouses || []);
      }
    } catch (err) {
      console.error("Gagal load gudang APPKSO:", err);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  // Load Data saat Warehouse berubah
  const loadData = async (wh) => {
    if (!wh) {
      setDetailData([]);
      setResumeData([]);
      setPatternData([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/data?warehouse=${encodeURIComponent(wh)}`,
      );
      const json = await res.json();
      setDetailData(json.detail || []);
      setResumeData(json.resume || []);
      setPatternData(json.pattern || []);
    } catch (err) {
      console.error("Gagal mengambil data APPKSO:", err);
      setDetailData([]);
      setResumeData([]);
      setPatternData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedWh);
    setSearchTerm("");
  }, [selectedWh]);

  // Handle Upload File
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadWh) {
      return Swal.fire({
        icon: "warning",
        title: "Pilih Gudang",
        text: "Pilih gudang tujuan upload terlebih dahulu bro!",
        background: "var(--surface)",
        customClass: { popup: "swal-theme-popup" },
      });
    }

    if (!uploadFile) {
      return Swal.fire({
        icon: "warning",
        title: "File Kosong",
        text: "File Excel opname APPKSO belum dipilih bro!",
        background: "var(--surface)",
        customClass: { popup: "swal-theme-popup" },
      });
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("warehouse", uploadWh);
      formData.append("file", uploadFile);

      const res = await fetch(`${API_BASE}/import`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json && json.status === "success") {
        Swal.fire({
          icon: "success",
          title: "MANTAP KILAT!",
          text: json.message,
          background: "var(--surface)",
          customClass: { popup: "swal-theme-popup" },
        });
        setUploadFile(null);
        loadWarehouses();
        setSelectedWh(uploadWh);
      } else {
        Swal.fire({
          icon: "error",
          title: "Validasi Rejected!",
          text: json?.message || `Server Error (Status: ${res.status})`,
          background: "var(--surface)",
          customClass: { popup: "swal-theme-popup" },
        });
      }
    } catch (err) {
      console.error("Upload error APPKSO:", err);
      Swal.fire({
        icon: "error",
        title: "Koneksi Bermasalah",
        text: err.message,
        background: "var(--surface)",
        customClass: { popup: "swal-theme-popup" },
      });
    } finally {
      setUploading(false);
    }
  };

  // Filtered rows untuk live search
  const filteredDetailRows = useMemo(() => {
    const val = searchTerm.toLowerCase().trim();
    if (!val) return detailData;

    return detailData.filter((r) => {
      const opr = String(r.opr || "").toLowerCase();
      const oprname = String(r.oprname || "").toLowerCase();
      const nokso = String(r.nokso || "").toLowerCase();
      const item = String(r.item || "").toLowerCase();
      return (
        opr.includes(val) ||
        oprname.includes(val) ||
        nokso.includes(val) ||
        item.includes(val)
      );
    });
  }, [detailData, searchTerm]);

  // Total summary ringkasan
  const summaryPattern = useMemo(() => {
    const totalSku = patternData.reduce(
      (acc, curr) => acc + (Number(curr.total_sku) || 0),
      0,
    );
    const totalQty = patternData.reduce(
      (acc, curr) => acc + (Number(curr.total_qty) || 0),
      0,
    );
    return { totalSku, totalQty };
  }, [patternData]);

  const summaryResume = useMemo(() => {
    const totalOperator = resumeData.length;
    const totalQty = resumeData.reduce(
      (acc, curr) => acc + (Number(curr.total_qty) || 0),
      0,
    );
    return { totalOperator, totalQty };
  }, [resumeData]);

  // List operator unik untuk modal cetak
  const uniqueOperators = useMemo(() => {
    const list = [];
    const seen = new Set();
    detailData.forEach((row) => {
      if (row.opr && !seen.has(row.opr)) {
        seen.add(row.opr);
        list.push({ opr: row.opr, oprname: row.oprname ?? "Tanpa Nama" });
      }
    });
    list.sort((a, b) =>
      String(a.oprname)
        .toLowerCase()
        .localeCompare(String(b.oprname).toLowerCase(), undefined, {
          sensitivity: "base",
        }),
    );
    return list;
  }, [detailData]);

  // Map PIC ke List Dokumen miliknya untuk Modal Cetak KSO
  const picDocsMap = useMemo(() => {
    const map = {};
    detailData.forEach((row) => {
      const pCode = row.opr;
      const pName = row.oprname ?? "Tanpa Nama";
      if (pCode) {
        if (!map[pCode]) {
          map[pCode] = { name: pName, docs: new Set() };
        }
        if (row.nokso) map[pCode].docs.add(row.nokso);
      }
    });
    return map;
  }, [detailData]);

  // List docs untuk PIC terpilih di modal KSO
  const currentPicDocs = useMemo(() => {
    if (!ksoPic || !picDocsMap[ksoPic]) return [];
    return Array.from(picDocsMap[ksoPic].docs).sort();
  }, [ksoPic, picDocsMap]);

  // Drilldown Click Handlers
  const handleDrilldownResume = (row) => {
    const oprCode = String(row.opr || "").trim();
    const matched = detailData.filter(
      (r) => String(r.opr || "").trim() === oprCode,
    );
    setDrillModalTitle(
      `DAFTAR BARANG OPNAME: ${String(row.oprname || "").toUpperCase()} (${oprCode})`,
    );
    setDrillModalRows(matched);
    setDrillModalOpen(true);
  };

  const handleDrilldownPattern = (row) => {
    const patternTarget = String(row.pattern_name || "")
      .trim()
      .toLowerCase();
    let matched = [];

    if (patternTarget === "kosong / unmapped") {
      matched = detailData.filter(
        (r) =>
          !r.pattern_name ||
          r.pattern_name === "" ||
          String(r.pattern_name).toLowerCase() === "kosong / unmapped",
      );
    } else {
      matched = detailData.filter((r) => {
        const curPattern = String(r.pattern_name || "").toLowerCase();
        const desc = String(r.deskripsi || "").toLowerCase();
        const codeItem = String(r.item || "").toLowerCase();
        return (
          curPattern === patternTarget ||
          desc.includes(patternTarget) ||
          codeItem.includes(patternTarget)
        );
      });
    }

    setDrillModalTitle(
      `RINCIAN DAFTAR SKU SIZE BAN: ${String(row.pattern_name || "").toUpperCase()}`,
    );
    setDrillModalRows(matched);
    setDrillModalOpen(true);
  };

  // Trigger Cetak Rekap APPKSO
  const handleExecutePrintRekap = (e) => {
    e.preventDefault();
    if (!selectedWh) return;
    const url = `/print/appkso/rekap?warehouse=${encodeURIComponent(selectedWh)}&operator=${encodeURIComponent(rekapOpr)}&tgl_so=${encodeURIComponent(rekapTglSo)}&tgl_posisi=${encodeURIComponent(rekapTglPosisi)}`;
    setPrintRekapModalOpen(false);
    triggerPrintPageViaFrame(url);
  };

  // Trigger Cetak Kartu KSO
  const handleExecutePrintKso = (e) => {
    e.preventDefault();
    if (!selectedWh || !ksoPic || !ksoDocFrom || !ksoDocTo) return;
    if (ksoDocFrom > ksoDocTo) {
      return Swal.fire({
        icon: "error",
        title: "Dokumen Terbalik",
        text: "Doc Awal tidak boleh lebih besar dari Doc Akhir bro!",
        background: "var(--surface)",
      });
    }
    const url = `/print/appkso/kso?warehouse=${encodeURIComponent(selectedWh)}&pic=${encodeURIComponent(ksoPic)}&doc_from=${encodeURIComponent(ksoDocFrom)}&doc_to=${encodeURIComponent(ksoDocTo)}&tanggal=${encodeURIComponent(ksoTanggal)}`;
    setPrintKsoModalOpen(false);
    triggerPrintPageViaFrame(url);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        height: "calc(100vh - 84px)",
        padding: "10px 14px",
        boxSizing: "border-box",
        alignItems: "stretch",
      }}
    >
      {/* 📥 1. PANEL KIRI: CARD UPLOAD */}
      <div
        style={{
          width: "240px",
          height: "100%",
          flexShrink: 0,
          background: "var(--surface)",
          border: "1.5px solid rgba(254, 104, 7, 0.5)",
          borderRadius: "14px",
          padding: "16px 14px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor: "rgba(254, 104, 7, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 10px auto",
            flexShrink: 0,
          }}
        >
          <FileSpreadsheet size={22} color="#fe6807" />
        </div>

        <h4
          style={{
            fontSize: "12px",
            fontWeight: 800,
            margin: "0 0 3px 0",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--text-primary)",
            flexShrink: 0,
          }}
        >
          UPLOAD APPKSO SCAN
        </h4>
        <p
          style={{
            fontSize: "10.5px",
            color: "var(--text-secondary)",
            margin: "0 0 12px 0",
            lineHeight: "1.3",
            flexShrink: 0,
          }}
        >
          Unggah file <strong>.xlsx</strong> hasil opname APPKSO asli.
        </p>

        <form
          onSubmit={handleUpload}
          style={{ display: "flex", flexDirection: "column", flex: 1 }}
        >
          <select
            className="field-select"
            style={{
              width: "100%",
              height: "34px",
              borderColor: "rgba(254, 104, 7, 0.7)",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "8px",
              marginBottom: "12px",
              boxSizing: "border-box",
              flexShrink: 0,
            }}
            value={uploadWh}
            onChange={(e) => setUploadWh(e.target.value)}
          >
            <option value="">-- PILIH GUDANG TUJUAN --</option>
            <option value="APW">APW</option>
            <option value="BPW">BPW</option>
            <option value="DPW">DPW</option>
            <option value="RPW">RPW</option>
          </select>

          <div
            style={{
              flex: 1,
              minHeight: "180px",
              border: "1.5px dashed #fe6807",
              borderRadius: "10px",
              padding: "16px 10px",
              position: "relative",
              cursor: "pointer",
              backgroundColor: "rgba(254, 104, 7, 0.02)",
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
              accept=".xlsx"
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
              color="#fe6807"
              style={{ marginBottom: "10px", opacity: 0.9 }}
            />
            <div
              style={{
                fontSize: "11px",
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

          <button
            type="submit"
            className="btn-ctrl primary"
            style={{
              width: "100%",
              height: "36px",
              borderRadius: "18px",
              backgroundColor: "#fe6807",
              borderColor: "#fe6807",
              color: "#fff",
              fontWeight: 700,
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              flexShrink: 0,
            }}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <FileCheck size={14} />
            )}
            PROSES IMPORT DATA
          </button>
        </form>
      </div>

      {/* 📊 2. PANEL KANAN */}
      <div
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          minWidth: 0,
        }}
      >
        {/* CARD FILTER ATAS & TOMBOL AKSI */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              className="field-select"
              style={{
                width: "200px",
                height: "34px",
                fontSize: "11px",
                fontWeight: 700,
                borderColor: "rgba(59, 130, 246, 0.7)",
                borderRadius: "8px",
                padding: "2px 8px",
              }}
              value={selectedWh}
              onChange={(e) => setSelectedWh(e.target.value)}
            >
              <option value="">⚠️ PILIH GUDANG</option>
              {warehouses.map((wh) => (
                <option key={wh} value={wh}>
                  {wh}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn-ctrl"
              style={{
                height: "34px",
                padding: "0 12px",
                fontSize: "10.5px",
                fontWeight: 700,
                borderRadius: "8px",
              }}
              onClick={() => {
                if (selectedWh) loadData(selectedWh);
              }}
            >
              <RefreshCw size={13} /> RESET DATA
            </button>
          </div>

          {/* 3 Tombol Aksi Kanan: Print Rekap, Print KSO, Export Excel */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              className="btn-ctrl"
              style={{
                height: "34px",
                padding: "0 12px",
                fontSize: "10.5px",
                fontWeight: 700,
                borderRadius: "8px",
                backgroundColor: "rgba(52, 199, 123, 0.15)",
                borderColor: "var(--ok)",
                color: "var(--ok)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
              disabled={!selectedWh || detailData.length === 0}
              onClick={() => {
                setRekapOpr("ALL");
                setRekapTglSo("");
                setRekapTglPosisi("");
                setPrintRekapModalOpen(true);
              }}
            >
              <Printer size={13} /> PRINT REKAP
            </button>

            <button
              type="button"
              className="btn-ctrl primary"
              style={{
                height: "34px",
                padding: "0 12px",
                fontSize: "10.5px",
                fontWeight: 700,
                borderRadius: "8px",
                backgroundColor: "#0d6efd",
                borderColor: "#0d6efd",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
              disabled={!selectedWh || detailData.length === 0}
              onClick={() => {
                setKsoPic("");
                setKsoDocFrom("");
                setKsoDocTo("");
                setKsoTanggal("");
                setPrintKsoModalOpen(true);
              }}
            >
              <Printer size={13} /> PRINT KSO
            </button>

            <button
              type="button"
              className="btn-ctrl"
              style={{
                height: "34px",
                padding: "0 12px",
                fontSize: "10.5px",
                fontWeight: 700,
                borderRadius: "8px",
                backgroundColor: "rgba(254, 104, 7, 0.15)",
                borderColor: "#fe6807",
                color: "#fe6807",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
              disabled={!selectedWh || detailData.length === 0}
              onClick={() => setExportModalOpen(true)}
            >
              <Download size={13} /> EXPORT EXCEL
            </button>
          </div>
        </div>

        {/* 2 KARTU RESUME TENGAH: PATTERN & PIC OPERATOR */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            height: "230px",
            flexShrink: 0,
          }}
        >
          {/* Card Resume Pattern */}
          <div
            style={{
              flex: 1,
              background: "var(--surface)",
              border: "1.5px solid rgba(239, 68, 68, 0.6)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "8px 14px",
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
                  color: "#ef4444",
                  fontWeight: 800,
                  fontSize: "11px",
                  textTransform: "uppercase",
                }}
              >
                <Boxes size={14} /> RESUME PATTERN
              </div>
              <div style={{ display: "flex", gap: "6px", fontSize: "10px" }}>
                <span
                  style={{
                    backgroundColor: "var(--surface-3)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                  }}
                >
                  Total SKU:{" "}
                  <strong className="mono">{summaryPattern.totalSku}</strong>
                </span>
                <span
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    color: "#ef4444",
                  }}
                >
                  Total QTY:{" "}
                  <strong className="mono">
                    {summaryPattern.totalQty.toLocaleString("id-ID")}
                  </strong>
                </span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              <table
                className="dtable"
                style={{ width: "100%", tableLayout: "fixed" }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "var(--surface-2)",
                    fontSize: "9.5px",
                  }}
                >
                  <tr>
                    <th style={{ width: "35px", textAlign: "center" }}>NO</th>
                    <th style={{ textAlign: "left" }}>PATTERN SIZE</th>
                    <th style={{ width: "85px", textAlign: "center" }}>
                      TOTAL SKU
                    </th>
                    <th style={{ width: "85px", textAlign: "right" }}>
                      TOTAL QTY
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedWh ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="table-empty"
                        style={{ padding: "30px 0" }}
                      >
                        Silakan saring target gudang di atas.
                      </td>
                    </tr>
                  ) : patternData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="table-empty"
                        style={{ padding: "30px 0" }}
                      >
                        Tidak ada ringkasan pattern di warehouse {selectedWh}.
                      </td>
                    </tr>
                  ) : (
                    patternData.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleDrilldownPattern(row)}
                        title={`Klik untuk melirik detail ban ukuran ${row.pattern_name}`}
                      >
                        <td style={{ textAlign: "center" }} className="mono">
                          {idx + 1}
                        </td>
                        <td
                          className="cell-strong"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.pattern_name}
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            color: "var(--text-secondary)",
                          }}
                          className="mono"
                        >
                          {row.total_sku} SKU
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            color: "#ef4444",
                            fontWeight: 700,
                          }}
                          className="mono"
                        >
                          {Number(row.total_qty || 0).toLocaleString("id-ID")}{" "}
                          PCS
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div
              style={{
                padding: "3px 10px",
                borderTop: "1px solid var(--border)",
                fontSize: "9.5px",
                color: "var(--text-secondary)",
                fontStyle: "italic",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "var(--surface-2)",
              }}
            >
              <Info size={11} /> Silakan klik baris untuk melihat detail rincian
              ban
            </div>
          </div>

          {/* Card Resume PIC Stock */}
          <div
            style={{
              flex: 1,
              background: "var(--surface)",
              border: "1.5px solid rgba(52, 199, 123, 0.6)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "8px 14px",
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
                  color: "var(--ok)",
                  fontWeight: 800,
                  fontSize: "11px",
                  textTransform: "uppercase",
                }}
              >
                <Users size={14} /> RESUME PIC STOCK
              </div>
              <div style={{ display: "flex", gap: "6px", fontSize: "10px" }}>
                <span
                  style={{
                    backgroundColor: "var(--surface-3)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                  }}
                >
                  Total Operator:{" "}
                  <strong className="mono">
                    {summaryResume.totalOperator}
                  </strong>
                </span>
                <span
                  style={{
                    backgroundColor: "rgba(52, 199, 123, 0.15)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    color: "var(--ok)",
                  }}
                >
                  Total QTY:{" "}
                  <strong className="mono">
                    {summaryResume.totalQty.toLocaleString("id-ID")}
                  </strong>
                </span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              <table
                className="dtable"
                style={{ width: "100%", tableLayout: "fixed" }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "var(--surface-2)",
                    fontSize: "9.5px",
                  }}
                >
                  <tr>
                    <th style={{ width: "35px", textAlign: "center" }}>NO</th>
                    <th style={{ textAlign: "left" }}>NAMA / OPERATOR</th>
                    <th style={{ width: "85px", textAlign: "center" }}>
                      TOTAL SKU
                    </th>
                    <th style={{ width: "85px", textAlign: "right" }}>
                      TOTAL QTY
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedWh ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="table-empty"
                        style={{ padding: "30px 0" }}
                      >
                        Silakan saring target gudang di atas.
                      </td>
                    </tr>
                  ) : resumeData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="table-empty"
                        style={{ padding: "30px 0" }}
                      >
                        Tidak ada ringkasan operator di warehouse {selectedWh}.
                      </td>
                    </tr>
                  ) : (
                    resumeData.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleDrilldownResume(row)}
                        title={`Klik untuk melirik data operator ${row.oprname}`}
                      >
                        <td style={{ textAlign: "center" }} className="mono">
                          {idx + 1}
                        </td>
                        <td
                          className="cell-strong"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.oprname} ({row.opr})
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            color: "#dc2626",
                            fontWeight: 700,
                          }}
                          className="mono"
                        >
                          {row.total_sku} SKU
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            color: "#3b82f6",
                            fontWeight: 700,
                          }}
                          className="mono"
                        >
                          {Number(row.total_qty || 0).toLocaleString("id-ID")}{" "}
                          PCS
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div
              style={{
                padding: "3px 10px",
                borderTop: "1px solid var(--border)",
                fontSize: "9.5px",
                color: "var(--text-secondary)",
                fontStyle: "italic",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "var(--surface-2)",
              }}
            >
              <Info size={11} /> Silakan klik baris untuk melihat detail data
              operator
            </div>
          </div>
        </div>

        {/* 📋 3. CARD DATA DETAIL UTAMA */}
        <div
          style={{
            flex: 1,
            background: "var(--surface)",
            border: "1.5px solid rgba(59, 130, 246, 0.6)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxSizing: "border-box",
            minHeight: 0,
          }}
        >
          <div
            style={{
              padding: "8px 14px",
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
                color: "#3b82f6",
                fontWeight: 800,
                fontSize: "11px",
                textTransform: "uppercase",
              }}
            >
              <TableProperties size={14} /> DETAIL DATA OPNAME APPKSO
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "var(--surface-2)",
                  border: "1px solid rgba(59, 130, 246, 0.5)",
                  borderRadius: "8px",
                  padding: "0 8px",
                  height: "30px",
                  width: "320px",
                }}
              >
                <Search
                  size={13}
                  color="#3b82f6"
                  style={{ marginRight: "6px" }}
                />
                <input
                  type="text"
                  placeholder="Ketik No Penneng / Nama PIC / No KSO / Item..."
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: "11px",
                    outline: "none",
                    width: "100%",
                    color: "var(--text-primary)",
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div
            className="dtable-wrap"
            style={{ flex: 1, overflowY: "auto", border: "none" }}
          >
            <table
              className="dtable"
              style={{ width: "100%", tableLayout: "fixed" }}
            >
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  backgroundColor: "var(--surface-2)",
                  zIndex: 2,
                  fontSize: "9.5px",
                }}
              >
                <tr style={{ textTransform: "uppercase" }}>
                  <th style={{ width: "35px", textAlign: "center" }}>NO</th>
                  <th style={{ width: "70px", textAlign: "center" }}>GUDANG</th>
                  <th style={{ width: "80px", textAlign: "center" }}>
                    TANGGAL
                  </th>
                  <th style={{ width: "65px", textAlign: "center" }}>OPR</th>
                  <th style={{ width: "120px" }}>OPERATOR</th>
                  <th style={{ width: "85px", textAlign: "center" }}>NO KSO</th>
                  <th style={{ width: "110px" }}>ITEM</th>
                  <th style={{ textAlign: "left" }}>DESKRIPSI</th>
                  <th style={{ width: "75px", textAlign: "right" }}>QTY</th>
                  <th style={{ width: "110px" }}>VERIFIKASI</th>
                  <th style={{ width: "120px", textAlign: "center" }}>
                    TGL VERIFIKASI
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="table-empty"
                      style={{ padding: "40px 0" }}
                    >
                      <Loader2
                        size={16}
                        className="spin"
                        style={{
                          display: "inline-block",
                          verticalAlign: "middle",
                          marginRight: 8,
                        }}
                      />
                      Menyisir database detail APPKSO...
                    </td>
                  </tr>
                ) : !selectedWh ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="table-empty"
                      style={{ padding: "40px 0" }}
                    >
                      ⚠️ Silakan pilih saringan gudang di panel filter atas
                      untuk memuat rekaman laporan.
                    </td>
                  </tr>
                ) : filteredDetailRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="table-empty"
                      style={{ padding: "40px 0" }}
                    >
                      Tidak ada rekaman data APPKSO di warehouse {selectedWh}.
                    </td>
                  </tr>
                ) : (
                  filteredDetailRows.map((row, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: "center" }} className="mono">
                        {i + 1}
                      </td>
                      <td
                        style={{ textAlign: "center" }}
                        className="cell-strong"
                      >
                        {row.warehouse || "-"}
                      </td>
                      <td style={{ textAlign: "center" }} className="mono">
                        {row.tgl || "-"}
                      </td>
                      <td
                        style={{ textAlign: "center" }}
                        className="mono cell-strong"
                      >
                        {row.opr || "-"}
                      </td>
                      <td
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {row.oprname || "-"}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          color: "var(--ok)",
                          fontWeight: 700,
                        }}
                        className="mono"
                      >
                        {row.nokso || "-"}
                      </td>
                      <td
                        style={{ color: "#ef4444", fontWeight: 700 }}
                        className="mono"
                      >
                        {row.item || "-"}
                      </td>
                      <td
                        style={{
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={row.deskripsi || ""}
                      >
                        {row.deskripsi || "-"}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color: "#3b82f6",
                          fontWeight: 700,
                        }}
                        className="mono"
                      >
                        {Number(row.qty || 0).toLocaleString("id-ID")}
                      </td>
                      <td
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {row.verifikasi_nama || "-"}
                      </td>
                      <td
                        style={{ textAlign: "center" }}
                        className="mono text-muted"
                      >
                        {row.tanggal_verifikasi || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 📥 MODAL DRILL-DOWN */}
      {drillModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "850px",
              maxHeight: "85vh",
              background: "var(--surface)",
              borderRadius: "14px",
              border: "1.5px solid #3b82f6",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                backgroundColor: "#1e293b",
                color: "#fff",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Layers size={15} /> {drillModalTitle}
              </div>
              <button
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  padding: 2,
                }}
                onClick={() => setDrillModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <table
                  className="dtable"
                  style={{ width: "100%", tableLayout: "fixed" }}
                >
                  <thead
                    style={{
                      backgroundColor: "var(--surface-2)",
                      fontSize: "9.5px",
                    }}
                  >
                    <tr>
                      <th style={{ width: "40px", textAlign: "center" }}>NO</th>
                      <th style={{ width: "70px", textAlign: "center" }}>
                        OPR
                      </th>
                      <th style={{ width: "140px" }}>NAMA / OPERATOR</th>
                      <th style={{ width: "120px" }}>ITEM</th>
                      <th style={{ textAlign: "left" }}>DESKRIPSI</th>
                      <th style={{ width: "90px", textAlign: "right" }}>QTY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drillModalRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="table-empty"
                          style={{ padding: "30px 0" }}
                        >
                          Tidak ada rincian data detail yang cocok.
                        </td>
                      </tr>
                    ) : (
                      drillModalRows.map((r, i) => (
                        <tr key={i}>
                          <td style={{ textAlign: "center" }} className="mono">
                            {i + 1}
                          </td>
                          <td
                            style={{ textAlign: "center" }}
                            className="mono cell-strong"
                          >
                            {r.opr || "-"}
                          </td>
                          <td
                            className="cell-strong"
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {r.oprname || "-"}
                          </td>
                          <td
                            style={{ color: "#ef4444", fontWeight: 700 }}
                            className="mono"
                          >
                            {r.item || "-"}
                          </td>
                          <td
                            style={{
                              color: "var(--text-secondary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={r.deskripsi || ""}
                          >
                            {r.deskripsi || "-"}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              color: "#3b82f6",
                              fontWeight: 700,
                            }}
                            className="mono"
                          >
                            {Number(r.qty || 0).toLocaleString("id-ID")} PCS
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              style={{
                padding: "8px 16px",
                borderTop: "1px solid var(--border)",
                backgroundColor: "var(--surface-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "11px",
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                Total SKU:{" "}
                <span style={{ color: "#ef4444" }}>
                  {new Set(drillModalRows.map((r) => r.item)).size}
                </span>{" "}
                Item
              </div>
              <button
                type="button"
                className="btn-ctrl"
                style={{
                  height: "28px",
                  padding: "0 14px",
                  borderRadius: "14px",
                  fontSize: "10.5px",
                }}
                onClick={() => setDrillModalOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📥 MODAL SETUP PRINT REKAP */}
      {printRekapModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "460px",
              background: "var(--surface)",
              borderRadius: "14px",
              border: "1.5px solid var(--ok)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                backgroundColor: "var(--ok)",
                color: "#fff",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 800 }}>
                SETUP DOKUMEN CETAK REKAP KSO
              </div>
              <button
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                }}
                onClick={() => setPrintRekapModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleExecutePrintRekap}
              style={{ padding: "16px" }}
            >
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  SARING NAMA / OPERATOR SCAN
                </label>
                <select
                  className="field-select"
                  style={{
                    width: "100%",
                    height: "34px",
                    fontSize: "11px",
                    borderRadius: "8px",
                  }}
                  value={rekapOpr}
                  onChange={(e) => setRekapOpr(e.target.value)}
                >
                  <option value="ALL">-- CETAK SEMUA REKAP OPERATOR --</option>
                  {uniqueOperators.map((op) => (
                    <option key={op.opr} value={op.opr}>
                      {op.oprname.toUpperCase()} ({op.opr})
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{ display: "flex", gap: "10px", marginBottom: "16px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    TANGGAL STOCK OPNAME
                  </label>
                  <input
                    type="date"
                    required
                    className="field-input"
                    style={{
                      width: "100%",
                      height: "34px",
                      fontSize: "11px",
                      borderRadius: "8px",
                    }}
                    value={rekapTglSo}
                    onChange={(e) => setRekapTglSo(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    TANGGAL POSISI STOCK
                  </label>
                  <input
                    type="date"
                    required
                    className="field-input"
                    style={{
                      width: "100%",
                      height: "34px",
                      fontSize: "11px",
                      borderRadius: "8px",
                    }}
                    value={rekapTglPosisi}
                    onChange={(e) => setRekapTglPosisi(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  className="btn-ctrl"
                  style={{
                    height: "32px",
                    padding: "0 14px",
                    borderRadius: "16px",
                    fontSize: "11px",
                  }}
                  onClick={() => setPrintRekapModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-ctrl primary"
                  style={{
                    height: "32px",
                    padding: "0 16px",
                    borderRadius: "16px",
                    backgroundColor: "var(--ok)",
                    borderColor: "var(--ok)",
                    color: "#fff",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Printer size={13} /> Proses & Cetak Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📥 MODAL SETUP PRINT KSO CARDS */}
      {printKsoModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "480px",
              background: "var(--surface)",
              borderRadius: "14px",
              border: "1.5px solid #0d6efd",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                backgroundColor: "#0d6efd",
                color: "#fff",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 800 }}>
                SETUP CETAK KARTU FISIK KSO
              </div>
              <button
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                }}
                onClick={() => setPrintKsoModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExecutePrintKso} style={{ padding: "16px" }}>
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  PILIH NAMA / OPERATOR PIC
                </label>
                <select
                  required
                  className="field-select"
                  style={{
                    width: "100%",
                    height: "34px",
                    fontSize: "11px",
                    borderRadius: "8px",
                  }}
                  value={ksoPic}
                  onChange={(e) => {
                    setKsoPic(e.target.value);
                    setKsoDocFrom("");
                    setKsoDocTo("");
                  }}
                >
                  <option value="">-- PILIH PIC LAPANGAN --</option>
                  {Object.keys(picDocsMap)
                    .sort((a, b) =>
                      picDocsMap[a].name.localeCompare(picDocsMap[b].name),
                    )
                    .map((code) => (
                      <option key={code} value={code}>
                        {picDocsMap[code].name.toUpperCase()} ({code})
                      </option>
                    ))}
                </select>
              </div>

              <div
                style={{ display: "flex", gap: "10px", marginBottom: "12px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    NO. DOC AWAL
                  </label>
                  <select
                    required
                    className="field-select"
                    style={{
                      width: "100%",
                      height: "34px",
                      fontSize: "11px",
                      borderRadius: "8px",
                    }}
                    value={ksoDocFrom}
                    onChange={(e) => setKsoDocFrom(e.target.value)}
                    disabled={!ksoPic}
                  >
                    <option value="">
                      {ksoPic ? "-- PILIH DOC AWAL --" : "⏳ Pilih PIC Dulu"}
                    </option>
                    {currentPicDocs.map((doc) => (
                      <option key={doc} value={doc}>
                        {doc}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    NO. DOC AKHIR
                  </label>
                  <select
                    required
                    className="field-select"
                    style={{
                      width: "100%",
                      height: "34px",
                      fontSize: "11px",
                      borderRadius: "8px",
                    }}
                    value={ksoDocTo}
                    onChange={(e) => setKsoDocTo(e.target.value)}
                    disabled={!ksoPic}
                  >
                    <option value="">
                      {ksoPic ? "-- PILIH DOC AKHIR --" : "⏳ Pilih PIC Dulu"}
                    </option>
                    {currentPicDocs
                      .filter((doc) => (ksoDocFrom ? doc >= ksoDocFrom : true))
                      .map((doc) => (
                        <option key={doc} value={doc}>
                          {doc}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  TANGGAL NOTA KARTU KSO
                </label>
                <input
                  type="date"
                  required
                  className="field-input"
                  style={{
                    width: "100%",
                    height: "34px",
                    fontSize: "11px",
                    borderRadius: "8px",
                  }}
                  value={ksoTanggal}
                  onChange={(e) => setKsoTanggal(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  className="btn-ctrl"
                  style={{
                    height: "32px",
                    padding: "0 14px",
                    borderRadius: "16px",
                    fontSize: "11px",
                  }}
                  onClick={() => setPrintKsoModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-ctrl primary"
                  style={{
                    height: "32px",
                    padding: "0 16px",
                    borderRadius: "16px",
                    backgroundColor: "#0d6efd",
                    borderColor: "#0d6efd",
                    color: "#fff",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Printer size={13} /> Proses & Print KSO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📥 MODAL EXPORT EXCEL */}
      <ExportExcelKso
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        warehouse={selectedWh}
        detailData={detailData}
      />
    </div>
  );
}
