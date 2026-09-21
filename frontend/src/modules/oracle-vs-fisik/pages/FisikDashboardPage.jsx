import { Warehouse, ScanLine, Users, Gauge } from "lucide-react";
import StatCard from "../../../components/StatCard";
import SectionCard from "../../../components/SectionCard";
import DataTable from "../../../components/DataTable";
import StatusBadge from "../../../components/StatusBadge";
import {
  SCAN_ACTIVITY,
  PROGRESS_GEDUNG_A,
  PROGRESS_GEDUNG_B,
  PATTERN_SUMMARY,
} from "../data";

function ProgressCell(row) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}
    >
      <div className="progress-track" style={{ flex: 1 }}>
        <div className="progress-fill" style={{ width: `${row.progres}%` }} />
      </div>
      <span
        className="mono"
        style={{ fontSize: 11, color: "var(--text-secondary)" }}
      >
        {row.progres}%
      </span>
    </div>
  );
}

const progressColumns = [
  { key: "no", label: "No.", render: (_, i) => i + 1 },
  {
    key: "item",
    label: "Item",
    render: (r) => <span className="cell-code">{r.item}</span>,
  },
  { key: "desc", label: "Desc" },
  { key: "sisa", label: "Sisa", align: "right" },
  { key: "progres", label: "Progres", render: ProgressCell },
];

const scanColumns = [
  { key: "no", label: "No.", render: (_, i) => i + 1 },
  {
    key: "opr_id",
    label: "Opr ID",
    render: (r) => <span className="cell-code">{r.opr_id}</span>,
  },
  { key: "nama_opr", label: "Nama Opr" },
  { key: "no_kso", label: "No KSO" },
  {
    key: "item_code",
    label: "Item Code",
    render: (r) => <span className="cell-code">{r.item_code}</span>,
  },
  { key: "deskripsi", label: "Deskripsi" },
  { key: "qty_scan", label: "Qty Scan", align: "right" },
];

const patternColumns = [
  { key: "no", label: "No.", render: (_, i) => i + 1 },
  {
    key: "pattern",
    label: "Pattern (Grade)",
    render: (r) => <span className="cell-strong">{r.pattern}</span>,
  },
  { key: "counted", label: "Counted", align: "right" },
  { key: "onhand", label: "On-hand", align: "right" },
  {
    key: "variance",
    label: "Variance",
    align: "right",
    render: (r) => r.onhand - r.counted,
  },
  { key: "sku_minus", label: "SKU (-)", align: "right" },
  { key: "sku_plus", label: "SKU (+)", align: "right" },
  {
    key: "status",
    label: "Status",
    render: (r) =>
      r.onhand === r.counted ? (
        <StatusBadge tone="ok">MATCH</StatusBadge>
      ) : (
        <StatusBadge tone="warn">SELISIH</StatusBadge>
      ),
  },
];

function FisikDashboardPage() {
  const totalScan = SCAN_ACTIVITY.reduce((a, r) => a + r.qty_scan, 0);
  const activePic = new Set(SCAN_ACTIVITY.map((r) => r.opr_id)).size;

  return (
    <div>
      <div className="stat-grid">
        <StatCard
          icon={ScanLine}
          label="Qty Ter-scan Hari Ini"
          value={totalScan.toLocaleString("id-ID")}
          tone="accent"
        />
        <StatCard
          icon={Users}
          label="Operator Aktif"
          value={activePic}
          tone="cyan"
        />
        <StatCard
          icon={Warehouse}
          label="Gedung Berjalan"
          value="2"
          sub="Gedung A & Gedung B"
          tone="ok"
        />
        <StatCard
          icon={Gauge}
          label="Progres Rata-rata"
          value="78%"
          tone="warn"
        />
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <SectionCard icon={Warehouse} title="Progres Item — Gedung A">
          <DataTable columns={progressColumns} rows={PROGRESS_GEDUNG_A} />
        </SectionCard>
        <SectionCard icon={Warehouse} title="Progres Item — Gedung B">
          <DataTable columns={progressColumns} rows={PROGRESS_GEDUNG_B} />
        </SectionCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard icon={ScanLine} title="Aktivitas Scan Terbaru">
          <DataTable columns={scanColumns} rows={SCAN_ACTIVITY} />
        </SectionCard>
      </div>

      <SectionCard icon={Gauge} title="Ringkasan Pattern — Oracle vs Fisik">
        <DataTable columns={patternColumns} rows={PATTERN_SUMMARY} />
      </SectionCard>
    </div>
  );
}

export default FisikDashboardPage;
