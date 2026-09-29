import { useState, useEffect, useMemo } from "react";
import {
  Boxes,
  RefreshCw,
  GitCompare,
  Layers,
  Gauge,
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
  Target,
  Info,
  Search,
} from "lucide-react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";

// Import 4 Sub-Komponen Modal
import ModalDetail from "./ModalDetail";
import ModalDetailGrade from "./ModalDetailGrade";
import ModalDetailPpm from "./ModalDetailPpm";
import ModalDetailPrice from "./ModalDetailPrice";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

const API_BASE = "http://localhost:8010/api/dashboard";

const formatCompact = (num) => {
  if (num === null || num === undefined) return "0";
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (absNum >= 1000000000)
    return `${sign}${(absNum / 1000000000).toFixed(1).replace(".", ",")}B`;
  if (absNum >= 1000000)
    return `${sign}${(absNum / 1000000).toFixed(1).replace(".", ",")}M`;
  if (absNum >= 1000)
    return `${sign}${(absNum / 1000).toFixed(1).replace(".", ",")}K`;
  return num.toLocaleString("id-ID");
};

export default function DashboardPage() {
  const [warehouse, setWarehouse] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);

  // Modal 1: Detail Pattern (Plus & Minus)
  const [modalPatternOpen, setModalPatternOpen] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState({
    pattern: "",
    grade: "",
  });
  const [patternMinusList, setPatternMinusList] = useState([]);
  const [patternPlusList, setPatternPlusList] = useState([]);

  // Modal 2: Riwayat Scan Operator
  const [modalScanOpen, setModalScanOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [scanHistory, setScanHistory] = useState([]);
  const [totalScanQty, setTotalScanQty] = useState(0);

  // Modal 3: Unscanned SKU
  const [modalUnscannedOpen, setModalUnscannedOpen] = useState(false);
  const [unscannedList, setUnscannedList] = useState([]);
  const [searchUnscanned, setSearchUnscanned] = useState("");

  // Modal 4: Rekap Price Variance
  const [modalPriceRekapOpen, setModalPriceRekapOpen] = useState(false);

  // Modal 5: Detail Price Pattern
  const [modalPriceDetailOpen, setModalPriceDetailOpen] = useState(false);
  const [priceDetailList, setPriceDetailList] = useState([]);
  const [priceDetailSummary, setPriceDetailSummary] = useState(null);

  // Modal 6: Detail Grade
  const [modalGradeOpen, setModalGradeOpen] = useState(false);
  const [selectedGradeType, setSelectedGradeType] = useState("");
  const [gradeDetailList, setGradeDetailList] = useState([]);

  // Modal 7: PPM Matrix
  const [modalPpmOpen, setModalPpmOpen] = useState(false);
  const [ppmRawData, setPpmRawData] = useState([]);

  const loadData = async (wh) => {
    if (!wh) {
      setData([]);
      setSummary(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/comparison?warehouse=${wh}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
        setSummary(json.summary || null);
      } else {
        setData([]);
        setSummary(null);
      }
    } catch (err) {
      console.error(err);
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(warehouse);
  }, [warehouse]);

  // Open Modal 1: Detail Pattern
  const openModalDetail = async (pattern, grade) => {
    if (!warehouse) return;
    setSelectedPattern({ pattern, grade });
    setModalPatternOpen(true);
    try {
      const res = await fetch(
        `${API_BASE}/detail-pattern?pattern=${encodeURIComponent(pattern)}&grade=${encodeURIComponent(grade)}&warehouse=${warehouse}`,
      );
      const json = await res.json();
      if (json.success) {
        setPatternMinusList(json.minusList || []);
        setPatternPlusList(json.plusList || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Modal 2: Riwayat Scan Operator
  const openModalScanHistory = async (itemCode) => {
    if (!warehouse) return;
    setSelectedItem(itemCode);
    setModalScanOpen(true);
    try {
      const res = await fetch(
        `${API_BASE}/scan-history?item=${encodeURIComponent(itemCode)}&warehouse=${warehouse}`,
      );
      const json = await res.json();
      if (json.success) {
        setScanHistory(json.data || []);
        setTotalScanQty(json.total_qty || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Modal 3: Unscanned Items
  const openModalUnscanned = async () => {
    if (!warehouse) return;
    setModalUnscannedOpen(true);
    try {
      const res = await fetch(
        `${API_BASE}/unscanned-items?warehouse=${warehouse}`,
      );
      const json = await res.json();
      if (json.success) {
        setUnscannedList(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Modal 5: Detail Price Pattern
  const openModalDetailPrice = async (pattern, grade) => {
    if (!warehouse) return;
    setSelectedPattern({ pattern, grade });
    setModalPriceDetailOpen(true);
    try {
      const res = await fetch(
        `${API_BASE}/detail-price-pattern?pattern=${encodeURIComponent(pattern)}&grade=${encodeURIComponent(grade)}&warehouse=${warehouse}`,
      );
      const json = await res.json();
      if (json.success) {
        setPriceDetailList(json.data || []);
        setPriceDetailSummary(json.summary || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Modal 6: Detail per Grade
  const openModalGrade = async (grade) => {
    if (!warehouse) return;
    setSelectedGradeType(grade);
    setModalGradeOpen(true);
    try {
      const res = await fetch(
        `${API_BASE}/detail-grade?grade=${grade}&warehouse=${warehouse}`,
      );
      const json = await res.json();
      if (json.success) {
        setGradeDetailList(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Modal 7: PPM Matrix
  const openModalPpm = async () => {
    if (!warehouse) return;
    setModalPpmOpen(true);
    try {
      const res = await fetch(`${API_BASE}/detail-ppm?warehouse=${warehouse}`);
      const json = await res.json();
      if (json.success) {
        setPpmRawData(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Top 10 Chart data
  const top10Data = useMemo(() => {
    const problematic = data.filter((d) => Number(d.variance) !== 0);
    problematic.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
    const top = problematic.slice(0, 10).reverse();

    return {
      labels: top.map((d) => `${d.pattern} | ${d.grade}`),
      datasets: [
        {
          label: "Variance",
          data: top.map((d) => d.variance),
          backgroundColor: top.map((d) =>
            d.variance < 0 ? "#dc3545" : "#0d6efd",
          ),
          borderRadius: 4,
        },
      ],
    };
  }, [data]);

  return (
    <div
      style={{
        padding: "8px 14px",
        height: "calc(100vh - 84px)",
        overflowY: "auto",
      }}
    >
      {/* HEADER UTAMA */}
      <div
        className="card glass-card shadow-sm p-2 mb-2 d-flex flex-row align-items-center justify-content-between"
        style={{
          borderLeft: "5px solid #fe6807",
          background: "var(--surface)",
          borderRadius: "12px",
        }}
      >
        <div className="d-flex align-items-center gap-3 ps-2">
          <div
            className="p-2 rounded-3"
            style={{ background: "rgba(254, 104, 7, 0.15)" }}
          >
            <Boxes size={24} color="#fe6807" />
          </div>
          <div>
            <h5
              className="fw-black mb-0"
              style={{ letterSpacing: "-0.3px", fontSize: "16px" }}
            >
              Dashboard Stock Opname
            </h5>
            <small
              className="text-muted fw-semibold"
              style={{ fontSize: "11px" }}
            >
              Oracle vs Aktual Fisik
            </small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 pe-1">
          <select
            className="form-select form-select-sm fw-bold border-0 shadow-none"
            style={{
              width: "220px",
              background: "var(--surface-2)",
              fontSize: "11.5px",
            }}
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
          >
            <option value="">-- 🏭 PILIH GUDANG --</option>
            <option value="APW">APW</option>
            <option value="BPW">BPW</option>
            <option value="DPW">DPW</option>
            <option value="RPW">RPW</option>
          </select>

          {warehouse && (
            <button
              type="button"
              className="btn btn-sm p-2 rounded-3 border-0"
              style={{
                background: "rgba(254, 104, 7, 0.15)",
                color: "#fe6807",
              }}
              onClick={() => loadData(warehouse)}
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* PLACEHOLDER */}
      {!warehouse && (
        <div
          className="d-flex flex-column align-items-center justify-content-center w-100"
          style={{ height: "60vh" }}
        >
          <div
            className="alert alert-warning d-flex align-items-center justify-content-center py-2 px-4 border-0 rounded-3 shadow-sm"
            style={{ fontSize: "14px", maxWidth: "400px" }}
          >
            <Info size={18} className="me-2 text-warning" />
            <div className="fw-medium">Pilih gudang untuk menampilkan data</div>
          </div>
        </div>
      )}

      {/* METRIC CARDS ROW */}
      {warehouse && summary && (
        <div className="row g-2 mb-2">
          {/* CARD 1: Variance Grade OE */}
          <div className="col-12 col-sm-6 col-md-2">
            <div
              className="card glass-card border-start border-4 rounded-3 p-2 h-100"
              style={{
                cursor: "pointer",
                borderLeftColor: "#fe6807 !important",
              }}
              onClick={() => openModalGrade("OE")}
            >
              <span
                className="badge rounded-pill fw-bold text-uppercase px-2 py-0.5 mb-1"
                style={{
                  fontSize: "9px",
                  background: "rgba(254, 104, 7, 0.15)",
                  color: "#fe6807",
                  width: "fit-content",
                }}
              >
                Variance Grade OE
              </span>
              <div className="d-flex align-items-baseline justify-content-between">
                <h3 className="mb-0 fw-bold" style={{ fontSize: "1.5rem" }}>
                  {summary.oe_variance_pcs.toLocaleString("id-ID")}
                </h3>
                <GitCompare size={20} color="#fe6807" />
              </div>
              <div
                className="d-flex align-items-center gap-2 mt-1 pt-1 border-top"
                style={{ fontSize: "11px" }}
              >
                <span className="text-danger fw-bold d-flex align-items-center">
                  <TrendingDown size={12} className="me-1" />{" "}
                  {summary.oe_sku_minus} SKU
                </span>
                <span className="text-muted">|</span>
                <span className="text-success fw-bold d-flex align-items-center">
                  <TrendingUp size={12} className="me-1" />{" "}
                  {summary.oe_sku_plus} SKU
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: Variance Grade OK */}
          <div className="col-12 col-sm-6 col-md-2">
            <div
              className="card glass-card border-start border-4 rounded-3 p-2 h-100"
              style={{
                cursor: "pointer",
                borderLeftColor: "#06b6d4 !important",
              }}
              onClick={() => openModalGrade("OK")}
            >
              <span
                className="badge rounded-pill fw-bold text-uppercase px-2 py-0.5 mb-1"
                style={{
                  fontSize: "9px",
                  background: "rgba(6, 182, 212, 0.15)",
                  color: "#06b6d4",
                  width: "fit-content",
                }}
              >
                Variance Grade OK
              </span>
              <div className="d-flex align-items-baseline justify-content-between">
                <h3 className="mb-0 fw-bold" style={{ fontSize: "1.5rem" }}>
                  {summary.ok_variance_pcs.toLocaleString("id-ID")}
                </h3>
                <GitCompare size={20} color="#06b6d4" />
              </div>
              <div
                className="d-flex align-items-center gap-2 mt-1 pt-1 border-top"
                style={{ fontSize: "11px" }}
              >
                <span className="text-danger fw-bold d-flex align-items-center">
                  <TrendingDown size={12} className="me-1" />{" "}
                  {summary.ok_sku_minus} SKU
                </span>
                <span className="text-muted">|</span>
                <span className="text-success fw-bold d-flex align-items-center">
                  <TrendingUp size={12} className="me-1" />{" "}
                  {summary.ok_sku_plus} SKU
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: Variance OE + OK */}
          <div className="col-12 col-sm-6 col-md-2">
            <div
              className="card glass-card border-start border-4 rounded-3 p-2 h-100"
              style={{
                cursor: "pointer",
                borderLeftColor: "#8b5cf6 !important",
              }}
              onClick={() => openModalGrade("MIX")}
            >
              <span
                className="badge rounded-pill fw-bold text-uppercase px-2 py-0.5 mb-1"
                style={{
                  fontSize: "9px",
                  background: "rgba(139, 92, 246, 0.15)",
                  color: "#8b5cf6",
                  width: "fit-content",
                }}
              >
                Variance OE + OK
              </span>
              <div className="d-flex align-items-baseline justify-content-between">
                <h3 className="mb-0 fw-bold" style={{ fontSize: "1.5rem" }}>
                  {(
                    summary.oe_variance_pcs + summary.ok_variance_pcs
                  ).toLocaleString("id-ID")}
                </h3>
                <Layers size={20} color="#8b5cf6" />
              </div>
              <div
                className="d-flex align-items-center gap-2 mt-1 pt-1 border-top"
                style={{ fontSize: "11px" }}
              >
                <span className="text-danger fw-bold d-flex align-items-center">
                  <TrendingDown size={12} className="me-1" />{" "}
                  {summary.oe_sku_minus + summary.ok_sku_minus} SKU
                </span>
                <span className="text-muted">|</span>
                <span className="text-success fw-bold d-flex align-items-center">
                  <TrendingUp size={12} className="me-1" />{" "}
                  {summary.oe_sku_plus + summary.ok_sku_plus} SKU
                </span>
              </div>
            </div>
          </div>

          {/* CARD 4: Variance Rate (PPM) */}
          <div className="col-12 col-sm-6 col-md-2">
            <div
              className="card glass-card border-start border-4 rounded-3 p-2 h-100"
              style={{
                cursor: "pointer",
                borderLeftColor: "#f97316 !important",
              }}
              onClick={openModalPpm}
            >
              <span
                className="badge rounded-pill fw-bold text-uppercase px-2 py-0.5 mb-1"
                style={{
                  fontSize: "9px",
                  background: "rgba(249, 115, 22, 0.15)",
                  color: "#f97316",
                  width: "fit-content",
                }}
              >
                Variance Rate (PPM)
              </span>
              <div className="d-flex align-items-baseline justify-content-between">
                <h3 className="mb-0 fw-bold" style={{ fontSize: "1.5rem" }}>
                  {summary.variance_ppm.toLocaleString("id-ID")}
                </h3>
                <Gauge size={20} color="#f97316" />
              </div>
              <div
                className="d-flex align-items-center gap-2 mt-1 pt-1 border-top"
                style={{ fontSize: "11px" }}
              >
                <span className="text-danger fw-bold d-flex align-items-center">
                  <Target size={12} className="me-1" /> Target : 35 PPM
                </span>
              </div>
            </div>
          </div>

          {/* CARD 5: Price Variance */}
          <div className="col-12 col-sm-6 col-md-2">
            <div
              className="card glass-card border-start border-4 rounded-3 p-2 h-100"
              style={{
                cursor: "pointer",
                borderLeftColor: "#f43f5e !important",
              }}
              onClick={() => setModalPriceRekapOpen(true)}
            >
              <span
                className="badge rounded-pill fw-bold text-uppercase px-2 py-0.5 mb-1"
                style={{
                  fontSize: "9px",
                  background: "rgba(244, 63, 94, 0.15)",
                  color: "#f43f5e",
                  width: "fit-content",
                }}
              >
                Price Variance
              </span>
              <div className="d-flex align-items-baseline justify-content-between">
                <h3
                  className="mb-0 fw-bold text-truncate"
                  style={{ fontSize: "1.35rem" }}
                >
                  Rp {formatCompact(summary.total_price_variance)}
                </h3>
                <DollarSign size={20} color="#f43f5e" />
              </div>
              <div
                className="d-flex align-items-center gap-2 mt-1 pt-1 border-top"
                style={{ fontSize: "10px" }}
              >
                <span>OE: {formatCompact(summary.oe_price_variance)}</span>
                <span className="text-muted">|</span>
                <span>OK: {formatCompact(summary.ok_price_variance)}</span>
              </div>
            </div>
          </div>

          {/* CARD 6: Persentase SKU */}
          <div className="col-12 col-sm-6 col-md-2">
            <div
              className="card glass-card border-start border-4 rounded-3 p-2 h-100"
              style={{
                cursor: "pointer",
                borderLeftColor: "#f59e0b !important",
              }}
              onClick={openModalUnscanned}
            >
              <span
                className="badge rounded-pill fw-bold text-uppercase px-2 py-0.5 mb-1"
                style={{
                  fontSize: "9px",
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "#f59e0b",
                  width: "fit-content",
                }}
              >
                Persentase SKU
              </span>
              <div className="d-flex align-items-baseline justify-content-between">
                <h3 className="mb-0 fw-bold" style={{ fontSize: "1.5rem" }}>
                  {summary.sku_percentage}%
                </h3>
                <Percent size={20} color="#f59e0b" />
              </div>
              <div
                className="d-flex align-items-center gap-2 mt-1 pt-1 border-top"
                style={{ fontSize: "10.5px" }}
              >
                <span className="text-primary fw-bold">
                  {summary.total_item_appkso} Counted
                </span>
                <span className="text-muted">/</span>
                <span className="text-dark fw-bold">
                  {summary.total_item_oracle} On-hand
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHARTS & TABLE CONTAINER */}
      {warehouse && summary && (
        <div className="row g-2 mb-2">
          {/* Kolom Kiri: Charts Ringkasan */}
          <div className="col-12 col-lg-3 d-flex flex-column gap-2">
            {/* Speedometer Doughnut */}
            <div className="card glass-card rounded-3 p-2 shadow-sm text-center">
              <h6
                className="fw-bold mb-1"
                style={{ fontSize: "12px", color: "var(--text-secondary)" }}
              >
                Progress Akurasi Fisik
              </h6>
              <div style={{ height: "130px", position: "relative" }}>
                <Doughnut
                  data={{
                    datasets: [
                      {
                        data: [
                          summary.accuracy_rate,
                          Math.max(0, 100 - summary.accuracy_rate),
                        ],
                        backgroundColor: ["#10b981", "#e2e8f0"],
                        circumference: 180,
                        rotation: 270,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { tooltip: { enabled: false } },
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "15px",
                    left: 0,
                    right: 0,
                    fontSize: "20px",
                    fontWeight: 900,
                  }}
                >
                  {summary.accuracy_rate}%
                </div>
              </div>
            </div>

            {/* Total Qty Counted vs On-hand */}
            <div className="card glass-card rounded-3 p-2 shadow-sm text-center">
              <h6
                className="fw-bold mb-1"
                style={{ fontSize: "12px", color: "var(--text-secondary)" }}
              >
                Total Qty (Counted Vs On-hand)
              </h6>
              <div style={{ height: "140px", position: "relative" }}>
                <Doughnut
                  data={{
                    labels: ["On-hand", "Counted"],
                    datasets: [
                      {
                        data: [summary.total_oracle, summary.total_appkso],
                        backgroundColor: ["#495057", "#0d6efd"],
                        cutout: "68%",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { boxWidth: 10, font: { size: 10 } },
                      },
                    },
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "35%",
                    left: 0,
                    right: 0,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#6c757d" }}>
                    Variance
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 900,
                      color: summary.net_variance >= 0 ? "#198754" : "#dc3545",
                    }}
                  >
                    {summary.net_variance >= 0
                      ? `+${summary.net_variance.toLocaleString("id-ID")}`
                      : summary.net_variance.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Variance Bar Chart Top 10 */}
          <div className="col-12 col-lg-9">
            <div className="card glass-card rounded-3 p-3 shadow-sm h-100">
              <h6
                className="fw-bold mb-2 text-center"
                style={{ fontSize: "13px", color: "#495057" }}
              >
                Top 10 Pattern dengan Selisih Terbesar (Klik bar untuk melihat
                detail)
              </h6>
              <div style={{ height: "290px" }}>
                <Bar
                  data={top10Data}
                  options={{
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { borderDash: [2, 4] } },
                      y: { ticks: { font: { size: 10, weight: "bold" } } },
                    },
                    onClick: (event, elements) => {
                      if (elements.length > 0) {
                        const idx = elements[0].index;
                        const label = top10Data.labels[idx];
                        const [pat, grd] = label.split(" | ");
                        openModalDetail(pat.trim(), grd.trim());
                      }
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* TABEL COMPARISON OE & OK */}
          <div className="col-12 mt-2">
            <div className="row g-2">
              {["OE", "OK"].map((grade) => {
                const list = data.filter((d) => d.grade === grade);
                return (
                  <div key={grade} className="col-12 col-xl-6">
                    <div
                      className="border rounded bg-white shadow-sm"
                      style={{ maxHeight: "380px", overflowY: "auto" }}
                    >
                      <table
                        className="table table-hover table-sm align-middle mb-0"
                        style={{ fontSize: "11px" }}
                      >
                        <thead className="sticky-top bg-dark text-white">
                          <tr>
                            <th className="ps-2 py-1">Pattern ({grade})</th>
                            <th className="text-end py-1">Counted</th>
                            <th className="text-end py-1">On-hand</th>
                            <th className="text-end py-1">Variance</th>
                            <th className="text-center py-1">SKU (-)</th>
                            <th className="text-center py-1">SKU (+)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((row, i) => {
                            const v = Number(row.variance);
                            const varColor =
                              v < 0
                                ? "text-danger"
                                : v > 0
                                  ? "text-primary"
                                  : "text-success";
                            return (
                              <tr
                                key={i}
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                  openModalDetail(row.pattern, row.grade)
                                }
                              >
                                <td className="ps-2 fw-bold text-dark">
                                  {row.pattern}
                                </td>
                                <td className="text-end">
                                  {Number(row.qty_appkso).toLocaleString(
                                    "id-ID",
                                  )}
                                </td>
                                <td className="text-end">
                                  {Number(row.qty_oracle).toLocaleString(
                                    "id-ID",
                                  )}
                                </td>
                                <td className={`text-end fw-bold ${varColor}`}>
                                  {v.toLocaleString("id-ID")}
                                </td>
                                <td className="text-center text-danger fw-bold">
                                  {row.sku_minus}
                                </td>
                                <td className="text-center text-primary fw-bold">
                                  {row.sku_plus}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📥 1. MODAL DETAIL PATTERN (PLUS & MINUS) */}
      {/* ========================================================================= */}
      <ModalDetail
        open={modalPatternOpen}
        onClose={() => setModalPatternOpen(false)}
        warehouse={warehouse}
        pattern={selectedPattern.pattern}
        grade={selectedPattern.grade}
        minusList={patternMinusList}
        plusList={patternPlusList}
        onItemClick={(item) => openModalScanHistory(item)}
      />

      {/* ========================================================================= */}
      {/* 📥 2. MODAL RIWAYAT SCAN OPERATOR */}
      {/* ========================================================================= */}
      {modalScanOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 1060,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
          }}
        >
          <div
            className="card shadow-lg border-0"
            style={{ width: "850px", maxHeight: "80vh", overflow: "hidden" }}
          >
            <div className="bg-primary text-white p-2 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold">
                ITEM: <span className="text-warning">{selectedItem}</span>
              </h6>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setModalScanOpen(false)}
              />
            </div>
            <div
              className="p-0"
              style={{ maxHeight: "60vh", overflowY: "auto" }}
            >
              <table
                className="table table-hover table-bordered table-sm mb-0 align-middle"
                style={{ fontSize: "11px" }}
              >
                <thead className="bg-light sticky-top">
                  <tr>
                    <th>NO</th>
                    <th>OPR ID</th>
                    <th>NAMA OPR</th>
                    <th>NO KSO</th>
                    <th>ITEM</th>
                    <th>DESKRIPSI</th>
                    <th className="text-end">QTY SCAN</th>
                  </tr>
                </thead>
                <tbody>
                  {scanHistory.map((s, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className="fw-bold">{s.opr}</td>
                      <td>{s.oprname}</td>
                      <td>
                        <span className="badge bg-secondary">{s.nokso}</span>
                      </td>
                      <td className="fw-bold">{s.item}</td>
                      <td className="text-truncate" style={{ maxWidth: 180 }}>
                        {s.deskripsi}
                      </td>
                      <td className="text-end text-primary fw-bold">
                        {Number(s.qty).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-light fw-bold">
                    <td colSpan={6} className="text-end">
                      TOTAL COUNTED:
                    </td>
                    <td className="text-end text-primary fs-6">
                      {totalScanQty.toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📥 3. MODAL UNSCANNED SKU */}
      {/* ========================================================================= */}
      {modalUnscannedOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 1050,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
          }}
        >
          <div
            className="card shadow-lg border-0"
            style={{ width: "950px", maxHeight: "85vh", overflow: "hidden" }}
          >
            <div className="bg-warning text-dark p-2 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold">Stock On-hand (Belum Di SCAN)</h6>
              <button
                type="button"
                className="btn-close"
                onClick={() => setModalUnscannedOpen(false)}
              />
            </div>
            <div className="p-3" style={{ overflowY: "auto" }}>
              <div className="input-group input-group-sm mb-2">
                <span className="input-group-text">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari item atau deskripsi..."
                  value={searchUnscanned}
                  onChange={(e) => setSearchUnscanned(e.target.value)}
                />
              </div>
              <div className="row g-2">
                {["OE", "OK"].map((grd) => {
                  const items = unscannedList.filter((u) => {
                    const matchGrd = u.grade === grd;
                    const matchSearch =
                      !searchUnscanned ||
                      u.item
                        .toLowerCase()
                        .includes(searchUnscanned.toLowerCase()) ||
                      (u.description &&
                        u.description
                          .toLowerCase()
                          .includes(searchUnscanned.toLowerCase()));
                    return matchGrd && matchSearch;
                  });

                  return (
                    <div key={grd} className="col-12 col-md-6">
                      <div className="d-flex justify-content-between mb-1">
                        <span
                          className={`badge ${grd === "OE" ? "bg-orange" : "bg-info"} text-white fw-bold`}
                        >
                          GRADE {grd}
                        </span>
                        <span className="badge bg-secondary">
                          {items.length} Data
                        </span>
                      </div>
                      <div
                        className="border rounded"
                        style={{ maxHeight: "55vh", overflowY: "auto" }}
                      >
                        <table
                          className="table table-hover table-sm mb-0"
                          style={{ fontSize: "11px" }}
                        >
                          <thead className="bg-light sticky-top">
                            <tr>
                              <th>NO</th>
                              <th>ITEM</th>
                              <th>DESC</th>
                              <th className="text-end">SISA</th>
                              <th className="text-center">PROGRES</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((it, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td className="fw-bold">{it.item}</td>
                                <td
                                  className="text-truncate"
                                  style={{ maxWidth: 120 }}
                                >
                                  {it.description}
                                </td>
                                <td className="text-end text-danger fw-bold">
                                  {Number(it.qty_sisa).toLocaleString("id-ID")}
                                </td>
                                <td className="text-center">{it.persen}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📥 4. MODAL REKAP PRICE VARIANCE (LIST PATTERN) */}
      {/* ========================================================================= */}
      {modalPriceRekapOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 1050,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
          }}
        >
          <div
            className="card shadow-lg border-0"
            style={{ width: "950px", maxHeight: "85vh", overflow: "hidden" }}
          >
            <div
              className="text-white p-2 d-flex justify-content-between align-items-center"
              style={{ background: "#f43f5e" }}
            >
              <h6 className="mb-0 fw-bold">Rekap Price Variance (Pattern)</h6>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setModalPriceRekapOpen(false)}
              />
            </div>
            <div
              className="p-3"
              style={{ maxHeight: "65vh", overflowY: "auto" }}
            >
              <table
                className="table table-hover table-sm align-middle mb-0"
                style={{ fontSize: "11.5px" }}
              >
                <thead className="bg-dark text-white sticky-top">
                  <tr>
                    <th>Pattern (Grade)</th>
                    <th className="text-end">Counted</th>
                    <th className="text-end">On-hand</th>
                    <th className="text-end">Variance</th>
                    <th className="text-center">SKU (-)</th>
                    <th className="text-center">SKU (+)</th>
                  </tr>
                </thead>
                <tbody>
                  {data
                    .filter((d) => Number(d.variance) !== 0)
                    .map((row, i) => (
                      <tr
                        key={i}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          openModalDetailPrice(row.pattern, row.grade)
                        }
                      >
                        <td className="fw-bold text-dark">
                          {row.pattern} ({row.grade})
                        </td>
                        <td className="text-end">
                          {Number(row.qty_appkso).toLocaleString("id-ID")}
                        </td>
                        <td className="text-end">
                          {Number(row.qty_oracle).toLocaleString("id-ID")}
                        </td>
                        <td
                          className={`text-end fw-bold ${row.variance < 0 ? "text-danger" : "text-primary"}`}
                        >
                          {Number(row.variance).toLocaleString("id-ID")}
                        </td>
                        <td className="text-center text-danger fw-bold">
                          {row.sku_minus}
                        </td>
                        <td className="text-center text-primary fw-bold">
                          {row.sku_plus}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📥 5. MODAL DETAIL PRICE PATTERN */}
      {/* ========================================================================= */}
      <ModalDetailPrice
        open={modalPriceDetailOpen}
        onClose={() => setModalPriceDetailOpen(false)}
        warehouse={warehouse}
        pattern={selectedPattern.pattern}
        grade={selectedPattern.grade}
        data={priceDetailList}
        summary={priceDetailSummary}
        onItemClick={(item) => openModalScanHistory(item)}
      />

      {/* ========================================================================= */}
      {/* 📥 6. MODAL DETAIL PER GRADE */}
      {/* ========================================================================= */}
      <ModalDetailGrade
        open={modalGradeOpen}
        onClose={() => setModalGradeOpen(false)}
        warehouse={warehouse}
        grade={selectedGradeType}
        data={gradeDetailList}
        onItemClick={(item) => openModalScanHistory(item)}
      />

      {/* ========================================================================= */}
      {/* 📥 7. MODAL DETAIL PPM MATRIX */}
      {/* ========================================================================= */}
      <ModalDetailPpm
        open={modalPpmOpen}
        onClose={() => setModalPpmOpen(false)}
        warehouse={warehouse}
        rawData={ppmRawData}
      />

      {/* STYLE TAMBAHAN */}
      <style>{`
        .bg-orange {
          background-color: #fe6807 !important;
        }
      `}</style>
    </div>
  );
}
