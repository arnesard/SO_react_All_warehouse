import { ScanEye, Upload, Users, Layers } from "lucide-react";
import SectionCard from "../../../components/SectionCard";
import DataTable from "../../../components/DataTable";
import StatCard from "../../../components/StatCard";
import StatusBadge from "../../../components/StatusBadge";
import { APPKSO_PATTERN, APPKSO_OPERATOR, APPKSO_DETAIL } from "../data";

function AppksoPage() {
  const patternCols = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "pattern", label: "Pattern Size", render: (r) => <span className="cell-strong">{r.pattern}</span> },
    { key: "total_sku", label: "Total SKU", align: "right" },
    { key: "total_qty", label: "Total QTY", align: "right" },
  ];

  const operatorCols = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "operator", label: "Nama / Operator" },
    { key: "total_sku", label: "Total SKU", align: "right" },
    { key: "total_qty", label: "Total QTY", align: "right" },
  ];

  const detailCols = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "warehouse", label: "Warehouse" },
    { key: "tanggal", label: "Tanggal" },
    { key: "opr", label: "Opr", render: (r) => <span className="cell-code">{r.opr}</span> },
    { key: "operator", label: "Operator" },
    { key: "no_kso", label: "No KSO" },
    { key: "item", label: "Item", render: (r) => <span className="cell-code">{r.item}</span> },
    { key: "desc", label: "Deskripsi" },
    { key: "qty", label: "Qty", align: "right" },
    {
      key: "verifikasi",
      label: "Verifikasi",
      render: (r) => (r.verifikasi === "Sudah" ? <StatusBadge tone="ok">SUDAH</StatusBadge> : <StatusBadge tone="warn">BELUM</StatusBadge>),
    },
    { key: "tgl_verifikasi", label: "Tgl Verifikasi" },
  ];

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon={Layers} label="Total Pattern Ter-scan" value={APPKSO_PATTERN.length} tone="accent" />
        <StatCard icon={Users} label="Operator Aktif" value={APPKSO_OPERATOR.length} tone="cyan" />
        <StatCard icon={ScanEye} label="Menunggu Verifikasi" value={APPKSO_DETAIL.filter((r) => r.verifikasi === "Belum").length} tone="warn" />
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <SectionCard icon={Layers} title="Ringkasan per Pattern Size">
          <DataTable columns={patternCols} rows={APPKSO_PATTERN} />
        </SectionCard>
        <SectionCard icon={Users} title="Ringkasan per Operator">
          <DataTable columns={operatorCols} rows={APPKSO_OPERATOR} />
        </SectionCard>
      </div>

      <SectionCard
        icon={ScanEye}
        title="Detail Hasil Scan APPKSO"
        actions={
          <button className="btn-ctrl primary">
            <Upload size={14} /> Import Excel
          </button>
        }
      >
        <DataTable columns={detailCols} rows={APPKSO_DETAIL} />
      </SectionCard>
    </div>
  );
}

export default AppksoPage;
