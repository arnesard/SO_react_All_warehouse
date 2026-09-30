import { useState, useEffect, useRef } from "react";
import {
  Factory,
  User,
  AlertTriangle,
  CheckCircle,
  Loader2,
  CircleDashed,
  Search,
  ChevronDown,
  LogOut,
  Users,
  FileText,
  FolderOpen,
  RefreshCw,
  Warehouse,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:8010/api/progress";
const WAREHOUSE_LIST = ["APW", "BPW", "DPW", "RPW", "JMW"];

export default function ProgressSoPage() {
  const [clock, setClock] = useState("00:00:00");
  const [dateStr, setDateStr] = useState("");

  // Pilihan Gudang Utama (APW, BPW, DPW, RPW, JMW)
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [warehouseSelected, setWarehouseSelected] = useState(false);

  // Filter Sub-Gedung di dalam gudang terpilih (BPW01, BPW02, dll)
  const [gedungs, setGedungs] = useState([]);
  const [selectedGedung, setSelectedGedung] = useState("");
  const [searchAuditor, setSearchAuditor] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [globalSummary, setGlobalSummary] = useState({
    total_data: 0,
    verified_data: 0,
    total_qty: 0,
    verified_qty: 0,
  });
  const [globalProgress, setGlobalProgress] = useState(0);
  const [progressPerGedung, setProgressPerGedung] = useState([]);
  const [auditorsData, setAuditorsData] = useState([]);

  // Modal Detail State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAuditor, setSelectedAuditor] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [detailRows, setDetailRows] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [picList, setPicList] = useState([]);
  const [filterPic, setFilterPic] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const modalOpenRef = useRef(modalOpen);
  modalOpenRef.current = modalOpen;

  // 1. Live Clock & Date
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setClock(`${hours}:${minutes}:${seconds}`);

      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      setDateStr(now.toLocaleDateString("id-ID", options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch Progress Data
  const fetchData = async () => {
    if (!selectedWarehouse || modalOpenRef.current) return;

    try {
      const url = `${API_BASE}/data?warehouse=${encodeURIComponent(selectedWarehouse)}&gedung=${encodeURIComponent(selectedGedung)}&auditor=${encodeURIComponent(searchAuditor)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setGedungs(json.gedungs || []);
        setGlobalSummary(json.globalSummary || {});
        setGlobalProgress(json.globalProgress || 0);
        setProgressPerGedung(json.progressPerGedung || []);
        setAuditorsData(json.auditorsData || []);
      }
    } catch (err) {
      console.error("Gagal load progress data:", err);
    }
  };

  useEffect(() => {
    if (warehouseSelected) {
      fetchData();
    }
  }, [warehouseSelected, selectedWarehouse, selectedGedung, searchAuditor]);

  // Silent Auto-Refresh tiap 10 detik
  useEffect(() => {
    if (!warehouseSelected) return;
    const timer = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(timer);
  }, [warehouseSelected, selectedWarehouse, selectedGedung, searchAuditor]);

  // 3. Buka Modal Detail Auditor
  const openDetailModal = async (auditorName) => {
    setSelectedAuditor(auditorName);
    setFilterPic("All");
    setFilterStatus("All");
    setModalLoading(true);
    setModalOpen(true);

    try {
      let url = `${API_BASE}/detail?auditor=${encodeURIComponent(auditorName)}&warehouse=${encodeURIComponent(selectedWarehouse)}`;
      if (selectedGedung) {
        url += `&gedung=${encodeURIComponent(selectedGedung)}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDetailRows(json.data || []);
        setPicList(json.pic_list || []);
        setMatrixData(json.matrixSummary || null);
      }
    } catch (err) {
      console.error("Gagal load detail auditor:", err);
    } finally {
      setModalLoading(false);
    }
  };

  // Filter Baris Detail di Modal
  const filteredDetailRows = detailRows.filter((row) => {
    const matchStatus = filterStatus === "All" || row.status === filterStatus;
    const matchPic = filterPic === "All" || row.pic_stock === filterPic;
    return matchStatus && matchPic;
  });

  // SCREEN 1: PILIH GUDANG UTAMA (APW, BPW, DPW, RPW, JMW)
  if (!warehouseSelected) {
    return (
      <div
        style={{
          height: "calc(100vh - 84px)",
          backgroundColor: "#0b0f19",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          className="glass p-4 text-center"
          style={{
            maxWidth: "560px",
            width: "100%",
            borderColor: "rgba(0, 246, 255, 0.4)",
            boxShadow: "0 0 35px rgba(0, 246, 255, 0.15)",
          }}
        >
          <div className="d-flex justify-content-center mb-3">
            <img
              src="/images/logo-gt.png"
              alt="Logo GT"
              style={{ height: "46px", filter: "brightness(0) invert(1)" }}
            />
          </div>

          <h5 className="title-glow mb-1" style={{ fontSize: "17px" }}>
            LIVE PROGRESS MONITORING
          </h5>
          <p className="text-white-50 mb-4" style={{ fontSize: "12px" }}>
            Pilih gudang tujuan untuk memantau aktivitas stock opname:
          </p>

          {/* Grid Tombol Gudang */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {WAREHOUSE_LIST.map((wh) => (
              <button
                key={wh}
                type="button"
                className="btn btn-tv-wh"
                style={{
                  background:
                    selectedWarehouse === wh
                      ? "linear-gradient(135deg, rgba(0,246,255,0.3) 0%, rgba(0,255,153,0.3) 100%)"
                      : "rgba(255,255,255,0.04)",
                  borderColor:
                    selectedWarehouse === wh
                      ? "#00f6ff"
                      : "rgba(255,255,255,0.15)",
                  color: selectedWarehouse === wh ? "#00f6ff" : "#ffffff",
                  boxShadow:
                    selectedWarehouse === wh
                      ? "0 0 12px rgba(0,246,255,0.4)"
                      : "none",
                  padding: "16px 8px",
                  borderRadius: "10px",
                  fontWeight: 800,
                  fontSize: "15px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
                onClick={() => setSelectedWarehouse(wh)}
              >
                <Warehouse size={20} />
                {wh}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-outline-info w-100 fw-bold py-2"
            style={{
              fontSize: "13px",
              borderColor: "rgba(0, 246, 255, 0.5)",
              background: selectedWarehouse
                ? "rgba(0, 246, 255, 0.2)"
                : "transparent",
              color: selectedWarehouse ? "#00f6ff" : "rgba(255,255,255,0.4)",
            }}
            disabled={!selectedWarehouse}
            onClick={() => {
              if (selectedWarehouse) setWarehouseSelected(true);
            }}
          >
            {selectedWarehouse
              ? `Buka Monitor Gudang ${selectedWarehouse}`
              : "Silakan Pilih Salah Satu Gudang di Atas"}
          </button>
        </div>

        <style>{`
          .glass {
            background: rgba(255, 255, 255, 0.04);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
          }
          .title-glow {
            text-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
            color: #00f6ff;
            font-weight: bold;
          }
          .btn-tv-wh:hover {
            border-color: #00f6ff !important;
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    );
  }

  // SCREEN 2: MONITORING PROGRESS UTAMA
  return (
    <div className="progress-so-container">
      {/* HEADER SECTION */}
      <div className="row-header">
        <div className="glass px-4 py-2 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <img
              src="/images/logo-gt.png"
              alt="Logo"
              style={{ height: "38px", filter: "brightness(0) invert(1)" }}
            />
            <div className="d-flex flex-column lh-1">
              <span
                className="text-white"
                style={{
                  fontSize: "1rem",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                  textShadow: "0 0 10px rgba(255,255,255,0.3)",
                }}
              >
                PT. Gajah Tunggal Tbk.,
              </span>
              <span
                style={{
                  fontSize: "0.80rem",
                  fontWeight: 700,
                  color: "#00f6ff",
                  letterSpacing: "1px",
                }}
              >
                Logistic Dept.
              </span>
            </div>
          </div>

          <h5 className="title-glow mb-0 text-center flex-grow-1">
            LIVE PROGRESS STOCK OPNAME -{" "}
            <span className="text-warning">{selectedWarehouse}</span>
            {selectedGedung && (
              <span className="text-info"> ({selectedGedung})</span>
            )}
          </h5>

          <div className="text-end" style={{ minWidth: "150px" }}>
            <span
              id="liveClock"
              className="title-glow fs-5"
              style={{ fontFamily: "monospace" }}
            >
              {clock}
            </span>
            <br />
            <small
              className="text-white-50"
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              {dateStr}
            </small>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div
        className="row g-3 flex-grow-1 overflow-hidden"
        style={{ minHeight: 0 }}
      >
        {/* SISI KIRI (10 COLUMNS): GRID CARDS AUDITOR */}
        <div className="col-lg-10 h-100" style={{ minHeight: 0 }}>
          <div className="glass p-3 h-100 d-flex flex-column">
            <div className="flex-grow-1 pe-1" style={{ overflowY: "auto" }}>
              <div className="tv-grid">
                {auditorsData.length === 0 ? (
                  <div className="col-12 text-center text-white-50 py-5 w-100">
                    <div className="d-flex justify-content-center mb-2">
                      <FolderOpen size={40} style={{ opacity: 0.5 }} />
                    </div>
                    <small>
                      Data belum tersedia untuk warehouse {selectedWarehouse}.
                    </small>
                  </div>
                ) : (
                  auditorsData.map((row) => {
                    let bgClass = "";
                    if (row.status === "PROSES") bgClass = "card-process";
                    if (row.status === "SELESAI") bgClass = "card-completed";

                    return (
                      <div key={row.auditor}>
                        <div
                          className={`glass card-auditor ${bgClass} card-tv d-flex flex-column justify-content-between h-100`}
                          onClick={() => openDetailModal(row.auditor)}
                        >
                          <div className="d-flex justify-content-center mb-1 pb-1 border-bottom border-secondary">
                            {row.status === "SELESAI" ? (
                              <span className="badge bg-success d-flex align-items-center gap-1 shadow-sm">
                                <CheckCircle size={10} /> Selesai
                              </span>
                            ) : row.status === "PROSES" ? (
                              <span className="badge bg-light text-dark d-flex align-items-center gap-1 shadow-sm fw-bold">
                                <Loader2 size={10} className="lucide-spin" />{" "}
                                Proses
                              </span>
                            ) : (
                              <span className="badge bg-warning text-dark d-flex align-items-center gap-1 shadow-sm">
                                <CircleDashed size={10} /> Open
                              </span>
                            )}
                          </div>

                          <div className="d-flex justify-content-center align-items-center mt-1 mb-1">
                            <div className="d-flex align-items-center gap-1">
                              <Factory size={12} color="#8c98a4" />
                              <span
                                className="fw-bold text-info text-truncate"
                                style={{ fontSize: "11px", maxWidth: "100px" }}
                                title={row.gedung_label}
                              >
                                {row.gedung_label}
                              </span>
                            </div>
                          </div>

                          <div className="text-center mt-1 mb-2">
                            <span className="info-label text-white d-block mb-1">
                              AUDITOR
                            </span>
                            <span
                              className={`info-value ${row.isSiluman ? "text-danger" : "text-warning"} d-flex justify-content-center align-items-center gap-1`}
                              style={row.isSiluman ? { fontSize: "9px" } : {}}
                            >
                              {row.isSiluman ? (
                                <AlertTriangle size={10} />
                              ) : (
                                <User size={10} />
                              )}
                              {row.auditor}
                            </span>
                          </div>

                          <div className="d-flex flex-column gap-1 mt-auto">
                            <div className="box-stat p-1 d-flex justify-content-between align-items-center px-2">
                              <span className="info-label mb-0 text-start text-white">
                                KSO :
                              </span>
                              <div className="text-end">
                                <span className="text-success info-value">
                                  {Number(row.verified_data).toLocaleString(
                                    "id-ID",
                                  )}
                                </span>
                                <span
                                  className="text-white-50"
                                  style={{ fontSize: "8px" }}
                                >
                                  /{" "}
                                  {Number(row.total_data).toLocaleString(
                                    "id-ID",
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="box-stat p-1 d-flex justify-content-between align-items-center px-2">
                              <span className="info-label mb-0 text-start text-white">
                                PCS :
                              </span>
                              <div className="text-end">
                                <span className="text-success info-value">
                                  {Number(row.verified_qty).toLocaleString(
                                    "id-ID",
                                  )}
                                </span>
                                <span
                                  className="text-white-50"
                                  style={{ fontSize: "8px" }}
                                >
                                  /{" "}
                                  {Number(row.total_qty).toLocaleString(
                                    "id-ID",
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SISI KANAN (2 COLUMNS): PANEL FILTER & SUMMARY BREAKDOWN */}
        <div className="col-lg-2 h-100 d-flex flex-column gap-3">
          <div className="glass p-3">
            <div
              className="d-flex justify-content-between align-items-center"
              style={{ cursor: "pointer" }}
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <h6
                className="text-info mb-0"
                style={{ fontSize: "11px", letterSpacing: "1px" }}
              >
                <Search size={10} className="me-1 d-inline" /> PENCARIAN
              </h6>
              <ChevronDown
                size={14}
                color="#00f6ff"
                style={{
                  transition: "transform 0.3s",
                  transform: searchOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </div>

            {searchOpen && (
              <div className="border-top border-secondary pt-2 mt-2">
                <div className="d-flex flex-column gap-2">
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      className="form-control form-select-tv"
                      placeholder="Cari Auditor..."
                      value={searchAuditor}
                      onChange={(e) => setSearchAuditor(e.target.value)}
                    />
                  </div>

                  <select
                    className="form-select form-select-sm form-select-tv"
                    value={selectedGedung}
                    onChange={(e) => setSelectedGedung(e.target.value)}
                  >
                    <option value="">-- SEMUA SUB-GEDUNG --</option>
                    {gedungs.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>

                  {/* Tombol Ganti Gudang Utama */}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-info w-100 fw-bold mt-1 d-flex align-items-center justify-content-center gap-1"
                    style={{ fontSize: "9px", letterSpacing: "1px" }}
                    onClick={() => {
                      setSelectedGedung("");
                      setWarehouseSelected(false);
                    }}
                  >
                    <RefreshCw size={10} /> GANTI GUDANG ({selectedWarehouse})
                  </button>

                  <Link
                    to="/"
                    className="btn btn-sm btn-outline-danger w-100 fw-bold mt-1 d-flex align-items-center justify-content-center gap-1"
                    style={{ fontSize: "9px", letterSpacing: "1px" }}
                  >
                    <LogOut size={10} /> KEMBALI
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="glass p-3 text-center">
            <h6
              className="text-white-50 mb-0"
              style={{ fontSize: "10px", letterSpacing: "1px" }}
            >
              TOTAL PROGRESS ({selectedWarehouse})
            </h6>
            <h1 className="title-glow display-5 mb-2">{globalProgress}%</h1>

            <div
              className="progress-bg w-100 mx-auto mt-0 mb-0"
              style={{ maxWidth: "85%", height: "8px" }}
            >
              <div
                className="progress-bar-glow"
                style={{ width: `${Math.min(100, globalProgress)}%` }}
              ></div>
            </div>

            <div className="d-flex flex-column gap-1 mt-2 mb-0">
              <div className="box-stat p-1 d-flex justify-content-between align-items-center px-2">
                <span
                  className="text-white-50 fw-bold mb-0"
                  style={{ fontSize: "9px", letterSpacing: "0.5px" }}
                >
                  KSO :
                </span>
                <div>
                  <span
                    className="title-glow text-success fw-bold"
                    style={{ fontSize: "13px" }}
                  >
                    {Number(globalSummary.verified_data || 0).toLocaleString(
                      "id-ID",
                    )}
                  </span>
                  <span className="text-white-50" style={{ fontSize: "10px" }}>
                    /{" "}
                    {Number(globalSummary.total_data || 0).toLocaleString(
                      "id-ID",
                    )}
                  </span>
                </div>
              </div>

              <div className="box-stat p-1 d-flex justify-content-between align-items-center px-2">
                <span
                  className="text-white-50 fw-bold mb-0"
                  style={{ fontSize: "9px", letterSpacing: "0.5px" }}
                >
                  PCS :
                </span>
                <div>
                  <span
                    className="title-glow text-success fw-bold"
                    style={{ fontSize: "13px" }}
                  >
                    {Number(globalSummary.verified_qty || 0).toLocaleString(
                      "id-ID",
                    )}
                  </span>
                  <span className="text-white-50" style={{ fontSize: "10px" }}>
                    /{" "}
                    {Number(globalSummary.total_qty || 0).toLocaleString(
                      "id-ID",
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-3 flex-grow-1" style={{ overflowY: "auto" }}>
            <h6
              className="text-info border-bottom border-secondary pb-2 mb-3"
              style={{ fontSize: "11px" }}
            >
              Breakdown Per Gedung
            </h6>
            {progressPerGedung.length === 0 ? (
              <div
                className="text-center text-white-50 mt-4"
                style={{ fontSize: "10px" }}
              >
                Belum ada data lokasi.
              </div>
            ) : (
              progressPerGedung.map((gedung) => (
                <div
                  key={gedung.lokasi}
                  className="glass p-2 mb-2"
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    borderColor: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-end mb-1">
                    <span
                      className="fw-bold text-light"
                      style={{ fontSize: "11px" }}
                    >
                      {gedung.lokasi}
                    </span>
                    <small
                      className="text-info fw-bold"
                      style={{ fontSize: "10px" }}
                    >
                      {gedung.progress}%
                    </small>
                  </div>
                  <div
                    className="progress-bg w-100 mb-2"
                    style={{
                      height: "5px",
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      className="progress-bar-glow"
                      style={{ width: `${Math.min(100, gedung.progress)}%` }}
                    ></div>
                  </div>
                  <div
                    className="d-flex justify-content-between mb-1"
                    style={{ fontSize: "8px" }}
                  >
                    <span className="text-white-50">KSO :</span>
                    <span>
                      <span className="title-glow text-success fw-bold">
                        {Number(gedung.verified_data).toLocaleString("id-ID")}
                      </span>
                      {" / "}
                      <span className="text-white-50">
                        {Number(gedung.total_data).toLocaleString("id-ID")}
                      </span>
                    </span>
                  </div>
                  <div
                    className="d-flex justify-content-between"
                    style={{ fontSize: "8px" }}
                  >
                    <span className="text-white-50">PCS :</span>
                    <span>
                      <span className="title-glow text-success fw-bold">
                        {Number(gedung.verified_qty).toLocaleString("id-ID")}
                      </span>
                      {" / "}
                      <span className="text-white-50">
                        {Number(gedung.total_qty).toLocaleString("id-ID")}
                      </span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL DETAIL AUDITOR FULLSCREEN */}
      {modalOpen && (
        <div className="modal-backdrop-live">
          <div className="modal-fullscreen-live">
            <div
              className="modal-header border-secondary p-3 d-flex justify-content-between align-items-center"
              style={{ background: "rgba(255, 255, 255, 0.05)" }}
            >
              <h5
                className="modal-title title-glow mb-0"
                style={{ fontSize: "15px" }}
              >
                <FileText size={18} className="me-2 d-inline" />
                DETAIL DATA:{" "}
                <span className="text-warning">{selectedAuditor}</span> (
                {selectedWarehouse})
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setModalOpen(false)}
              ></button>
            </div>

            <div
              className="modal-body p-0"
              style={{ flex: 1, overflowY: "auto" }}
            >
              <div
                className="glass m-3 p-3"
                style={{
                  borderColor: "rgba(0, 246, 255, 0.4)",
                  boxShadow: "0 0 15px rgba(0, 246, 255, 0.1)",
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
                  <h6
                    className="title-glow mb-0 d-flex align-items-center gap-2"
                    style={{ fontSize: "13px", letterSpacing: "1px" }}
                  >
                    <Users size={16} /> MATRIX PIC STOCK
                  </h6>

                  <div className="d-flex gap-2">
                    <select
                      className="form-select form-select-sm form-select-tv"
                      style={{ width: "190px" }}
                      value={filterPic}
                      onChange={(e) => setFilterPic(e.target.value)}
                    >
                      <option value="All">-- SEMUA PIC STOCK --</option>
                      {picList.map((pic) => (
                        <option key={pic} value={pic}>
                          {pic}
                        </option>
                      ))}
                    </select>

                    <select
                      className="form-select form-select-sm form-select-tv"
                      style={{ width: "180px" }}
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="All">-- SEMUA STATUS --</option>
                      <option value="Sudah">SUDAH VERIFIKASI</option>
                      <option value="Belum">BELUM VERIFIKASI</option>
                    </select>
                  </div>
                </div>

                {modalLoading || !matrixData ? (
                  <div className="text-center py-3">
                    <Loader2
                      size={20}
                      className="lucide-spin text-info d-inline"
                    />
                    <span
                      className="text-white-50 ms-2"
                      style={{ fontSize: "11px" }}
                    >
                      Membangun matrix data...
                    </span>
                  </div>
                ) : (
                  <div className="table-responsive rounded">
                    <table
                      className="table table-borderless mb-0"
                      style={{ color: "#fff" }}
                    >
                      <thead
                        style={{
                          borderBottom: "1px dashed rgba(0, 246, 255, 0.3)",
                        }}
                      >
                        <tr>
                          <th
                            style={{
                              width: "70px",
                              textAlign: "center",
                              color: "#000",
                              fontSize: "10px",
                              fontWeight: "bold",
                              letterSpacing: "1px",
                              background: "#fff",
                            }}
                          >
                            METRIK
                          </th>
                          {Object.keys(matrixData.picStats).map((name) => (
                            <th
                              key={name}
                              className="text-center pb-2 border-start"
                              style={{
                                minWidth: "140px",
                                color: "#000",
                                fontSize: "11px",
                                background: "#fff",
                              }}
                            >
                              {name}
                            </th>
                          ))}
                          <th
                            className="text-center pb-2 border-start"
                            style={{
                              minWidth: "140px",
                              color: "#000",
                              fontSize: "11px",
                              background: "#fff",
                            }}
                          >
                            TOTAL KESELURUHAN
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td
                            className="text-center border-start border-secondary py-2"
                            style={{ color: "#fff", fontWeight: "bold" }}
                          >
                            KSO
                          </td>
                          {Object.keys(matrixData.picStats).map((name) => {
                            const stat = matrixData.picStats[name];
                            return (
                              <td
                                key={name}
                                className="text-center border-start border-info py-2"
                                style={{
                                  background: "rgba(0, 246, 255, 0.05)",
                                }}
                              >
                                <div
                                  className="box-stat p-1 mx-1"
                                  style={{
                                    borderColor: "rgba(0,255,255,0.2)",
                                    boxShadow: "0 0 5px rgba(0,255,255,0.1)",
                                  }}
                                >
                                  <span
                                    className="text-success fw-bold"
                                    style={{ fontSize: "13px" }}
                                  >
                                    {Number(stat.verified_kso).toLocaleString(
                                      "id-ID",
                                    )}
                                  </span>
                                  <span
                                    className="text-secondary"
                                    style={{ fontSize: "9px" }}
                                  >
                                    {" "}
                                    /{" "}
                                    {Number(stat.total_kso).toLocaleString(
                                      "id-ID",
                                    )}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                          <td
                            className="text-center border-start border-info py-2"
                            style={{ background: "rgba(0, 246, 255, 0.05)" }}
                          >
                            <div
                              className="box-stat p-1 mx-1"
                              style={{
                                borderColor: "rgba(0,255,255,0.2)",
                                boxShadow: "0 0 5px rgba(0,255,255,0.1)",
                              }}
                            >
                              <span
                                className="text-success fw-bold"
                                style={{ fontSize: "13px" }}
                              >
                                {Number(matrixData.verifiedKso).toLocaleString(
                                  "id-ID",
                                )}
                              </span>
                              <span
                                className="text-white-50"
                                style={{ fontSize: "9px" }}
                              >
                                {" "}
                                /{" "}
                                {Number(matrixData.totalKso).toLocaleString(
                                  "id-ID",
                                )}
                              </span>
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td
                            className="text-center border-start border-secondary py-2"
                            style={{ color: "#fff", fontWeight: "bold" }}
                          >
                            PCS
                          </td>
                          {Object.keys(matrixData.picStats).map((name) => {
                            const stat = matrixData.picStats[name];
                            return (
                              <td
                                key={name}
                                className="text-center border-start border-info py-2"
                                style={{
                                  background: "rgba(0, 246, 255, 0.05)",
                                }}
                              >
                                <div
                                  className="box-stat p-1 mx-1"
                                  style={{
                                    borderColor: "rgba(0,255,255,0.2)",
                                    boxShadow: "0 0 5px rgba(0,255,255,0.1)",
                                  }}
                                >
                                  <span
                                    className="text-success fw-bold"
                                    style={{ fontSize: "13px" }}
                                  >
                                    {Number(stat.verified_pcs).toLocaleString(
                                      "id-ID",
                                    )}
                                  </span>
                                  <span
                                    className="text-secondary"
                                    style={{ fontSize: "9px" }}
                                  >
                                    {" "}
                                    /{" "}
                                    {Number(stat.total_pcs).toLocaleString(
                                      "id-ID",
                                    )}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                          <td
                            className="text-center border-start border-info py-2"
                            style={{ background: "rgba(0, 246, 255, 0.05)" }}
                          >
                            <div
                              className="box-stat p-1 mx-1"
                              style={{
                                borderColor: "rgba(0,255,255,0.2)",
                                boxShadow: "0 0 5px rgba(0,255,255,0.1)",
                              }}
                            >
                              <span
                                className="text-success fw-bold"
                                style={{ fontSize: "13px" }}
                              >
                                {Number(matrixData.verifiedPcs).toLocaleString(
                                  "id-ID",
                                )}
                              </span>
                              <span
                                className="text-white-50"
                                style={{ fontSize: "9px" }}
                              >
                                {" "}
                                /{" "}
                                {Number(matrixData.totalPcs).toLocaleString(
                                  "id-ID",
                                )}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div
                className="table-responsive"
                style={{ maxHeight: "55vh", padding: "0 16px 16px 16px" }}
              >
                <table
                  className="table table-dark table-hover mb-0"
                  style={{
                    fontSize: "11px",
                    "--bs-table-bg": "transparent",
                    whiteSpace: "nowrap",
                  }}
                >
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      backgroundColor: "#1a202c",
                      borderBottom: "2px solid #00f6ff",
                    }}
                  >
                    <tr style={{ color: "#00f6ff" }}>
                      <th className="text-center" style={{ width: "5%" }}>
                        NO
                      </th>
                      <th className="text-center" style={{ width: "8%" }}>
                        GEDUNG
                      </th>
                      <th style={{ width: "12%" }}>NOKSO</th>
                      <th style={{ width: "15%" }}>NAMA PIC STOCK</th>
                      <th style={{ width: "15%" }}>NAMA AUDITOR</th>
                      <th style={{ width: "12%" }}>ITEM</th>
                      <th style={{ width: "15%" }}>DESKRIPSI</th>
                      <th className="text-center" style={{ width: "8%" }}>
                        QTY
                      </th>
                      <th className="text-center" style={{ width: "10%" }}>
                        KETERANGAN
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalLoading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-5">
                          <Loader2
                            size={24}
                            className="lucide-spin text-info mb-2 d-inline"
                          />
                          <p className="text-white-50 mb-0">
                            Sedang menarik data dari database...
                          </p>
                        </td>
                      </tr>
                    ) : filteredDetailRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center text-muted py-4">
                          Tidak ada data scan untuk auditor ini.
                        </td>
                      </tr>
                    ) : (
                      filteredDetailRows.map((row, index) => (
                        <tr
                          key={index}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <td className="text-center">{index + 1}</td>
                          <td className="text-center text-info fw-bold">
                            {row.gedung}
                          </td>
                          <td>{row.nokso}</td>
                          <td>{row.pic_stock}</td>
                          <td className="text-warning">{row.auditor}</td>
                          <td>{row.item}</td>
                          <td>
                            <small>{row.deskripsi}</small>
                          </td>
                          <td className="text-center text-success fw-bold">
                            {Number(row.qty).toLocaleString("id-ID")}
                          </td>
                          <td className="text-center">
                            {row.status === "Sudah" ? (
                              <span
                                className="badge bg-success"
                                style={{ fontSize: "9px" }}
                              >
                                <CheckCircle
                                  size={10}
                                  className="d-inline me-1"
                                />{" "}
                                Sudah Verifikasi
                              </span>
                            ) : (
                              <span
                                className="badge bg-warning text-dark"
                                style={{ fontSize: "9px" }}
                              >
                                <Loader2 size={10} className="d-inline me-1" />{" "}
                                Belum Verifikasi
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IN-PAGE STYLING IDENTIK DENGAN BLADE LARAVEL */}
      <style>{`
        .progress-so-container {
          background-color: #0b0f19;
          color: #fff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          height: calc(100vh - 84px);
          display: flex;
          flex-direction: column;
          padding: 10px 14px;
          overflow: hidden;
        }
        .tv-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          grid-auto-rows: 1fr;
          gap: 0.4rem;
        }
        .card-tv {
          padding: 8px !important;
          height: 100%;
          cursor: pointer;
        }
        .card-tv .info-label {
          font-size: 8px;
          color: #8c98a4;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .card-tv .info-value {
          font-size: 11px;
          font-weight: 700;
        }
        .card-tv .badge {
          font-size: 8px !important;
          padding: 3px 6px !important;
        }
        .glass {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
        .title-glow {
          text-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
          letter-spacing: 1px;
          color: #00f6ff;
          font-weight: bold;
        }
        .row-header {
          width: 100%;
          margin-bottom: 0.5rem;
        }
        .card-auditor {
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0.2) 100%);
        }
        .card-auditor:hover {
          border-color: rgba(0, 246, 255, 0.4);
          background: rgba(0, 246, 255, 0.05);
          transform: translateY(-3px);
        }
        .card-process {
          border-color: rgba(255, 255, 255, 0.5) !important;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.15) 0%, rgba(0, 0, 0, 0.3) 100%) !important;
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.2);
        }
        .card-completed {
          border-color: rgba(0, 255, 153, 0.5) !important;
          background: linear-gradient(145deg, rgba(0, 255, 153, 0.08) 0%, rgba(0, 0, 0, 0.3) 100%) !important;
          box-shadow: 0 0 10px rgba(0, 255, 153, 0.15);
        }
        .box-stat {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }
        .progress-bg {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
        }
        .progress-bar-glow {
          height: 100%;
          background: linear-gradient(90deg, #00f6ff, #00ff99);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
          transition: width 1s ease-in-out;
        }
        .form-select-tv {
          background-color: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 255, 255, 0.2);
          color: #00f6ff;
          font-size: 11px;
          font-weight: bold;
        }
        .form-select-tv:focus {
          background-color: rgba(0, 0, 0, 0.5);
          color: #00f6ff;
          box-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
          border-color: #00f6ff;
        }
        .modal-backdrop-live {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(10px);
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
        }
        .modal-fullscreen-live {
          width: 96vw;
          height: 94vh;
          background-color: #0b0f19;
          border: 1px solid rgba(0, 255, 255, 0.3) !important;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 255, 255, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
