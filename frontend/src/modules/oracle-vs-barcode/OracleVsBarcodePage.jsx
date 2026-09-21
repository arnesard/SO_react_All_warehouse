import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Search, RefreshCw, Download, Calendar, GitCompareArrows } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import SectionCard from "../../components/SectionCard";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { CALENDAR_DAYS, PATTERN_ROWS, buildRowStatus } from "./data";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function OracleVsBarcodePage() {
  const [query, setQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState(19);

  const rows = useMemo(
    () => PATTERN_ROWS.filter((r) => r.pattern.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const matchCount = rows.filter((r) => r.onhand === r.counted).length;
  const varianceCount = rows.length - matchCount;
  const totalOnhand = rows.reduce((a, r) => a + r.onhand, 0);
  const totalCounted = rows.reduce((a, r) => a + r.counted, 0);
  const accuracy = totalOnhand ? ((1 - Math.abs(totalOnhand - totalCounted) / totalOnhand) * 100).toFixed(1) : "0.0";

  const chartData = {
    labels: rows.map((r) => r.pattern.split(" ")[0]),
    datasets: [
      { label: "Oracle (On-hand)", data: rows.map((r) => r.onhand), backgroundColor: "#4c8dff", borderRadius: 5, barThickness: 16 },
      { label: "Barcode (Counted)", data: rows.map((r) => r.counted), backgroundColor: "#22d3ee", borderRadius: 5, barThickness: 16 },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#a9b7d6", font: { size: 11, weight: "600" } } },
    },
    scales: {
      x: { ticks: { color: "#71809f", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.04)" } },
      y: { ticks: { color: "#71809f", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.06)" } },
    },
  };

  const columns = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "pattern", label: "Pattern (Grade)", render: (r) => <span className="cell-strong">{r.pattern}</span> },
    { key: "counted", label: "Counted (Barcode)", align: "right", render: (r) => r.counted.toLocaleString("id-ID") },
    { key: "onhand", label: "On-hand (Oracle)", align: "right", render: (r) => r.onhand.toLocaleString("id-ID") },
    {
      key: "variance",
      label: "Variance",
      align: "right",
      render: (r) => {
        const v = r.onhand - r.counted;
        return <span className={v === 0 ? "" : v > 0 ? "" : ""}>{v > 0 ? `+${v}` : v}</span>;
      },
    },
    { key: "sku_minus", label: "SKU (-)", align: "right" },
    { key: "sku_plus", label: "SKU (+)", align: "right" },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        const s = buildRowStatus(r);
        return <StatusBadge tone={s.tone}>{s.label}</StatusBadge>;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="MODUL VALIDASI"
        title="Stock Oracle vs Barcode"
        description="Validasi keselarasan data stok antara Oracle dengan hasil aktual scanning barcode."
        actions={
          <>
            <button className="btn-ctrl">
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn-ctrl primary">
              <Download size={14} /> Export
            </button>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard icon={GitCompareArrows} label="Akurasi Pattern" value={`${accuracy}%`} tone="ok" />
        <StatCard icon={Calendar} label="Pattern Match" value={matchCount} sub="Oracle = Barcode" tone="accent" />
        <StatCard icon={Search} label="Pattern Selisih" value={varianceCount} sub="Perlu ditelusuri" tone="warn" />
        <StatCard icon={GitCompareArrows} label="Total Qty Termonitor" value={totalOnhand.toLocaleString("id-ID")} tone="cyan" />
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <SectionCard icon={Calendar} title="Kalender Ketersediaan Data">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {CALENDAR_DAYS.map((d) => (
              <button
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                className="btn-ctrl"
                style={{
                  flexDirection: "column",
                  padding: "8px 0",
                  gap: 3,
                  background: selectedDay === d.day ? "var(--accent-soft)" : "var(--surface)",
                  borderColor: selectedDay === d.day ? "var(--accent-border)" : "var(--border-soft)",
                  color: selectedDay === d.day ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                {d.day}
                <span style={{ display: "flex", gap: 3 }}>
                  {d.hasOracle && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent)" }} />}
                  {d.hasBarcode && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--cyan)" }} />}
                </span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12, marginBottom: 0 }}>
            <span style={{ color: "var(--accent)" }}>&#9679;</span> Data Oracle &nbsp;
            <span style={{ color: "var(--cyan)" }}>&#9679;</span> Data Barcode
          </p>
        </SectionCard>

        <SectionCard icon={GitCompareArrows} title={`Perbandingan Qty per Pattern — Hari ke-${selectedDay}`}>
          <div style={{ height: 260 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: 16 }}>
        <SectionCard
          icon={Search}
          title="Detail Perbandingan per Pattern"
          actions={
            <div className="search-box">
              <Search size={14} />
              <input
                className="field-input"
                placeholder="Cari pattern / grade..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          }
        >
          <DataTable columns={columns} rows={rows} />
        </SectionCard>
      </div>
    </div>
  );
}

export default OracleVsBarcodePage;
