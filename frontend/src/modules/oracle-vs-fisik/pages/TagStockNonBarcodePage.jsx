import { FileSpreadsheet, Upload } from "lucide-react";
import SectionCard from "../../../components/SectionCard";
import DataTable from "../../../components/DataTable";
import StatusBadge from "../../../components/StatusBadge";
import { TAG_STOCK_NONBARCODE } from "../data";

function TagStockNonBarcodePage() {
  const columns = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "lot", label: "Lot", render: (r) => <span className="cell-code">{r.lot}</span> },
    { key: "no_doc", label: "No. Doc" },
    { key: "item", label: "Item", render: (r) => <span className="cell-code">{r.item}</span> },
    { key: "desc", label: "Deskripsi Master Size", render: (r) => <span className="cell-strong">{r.desc}</span> },
    { key: "jml_rak", label: "Jml Rak", align: "right" },
    { key: "qty", label: "Qty", align: "right" },
    { key: "jml_aktual", label: "Jml Aktual", align: "right" },
    {
      key: "status",
      label: "Status",
      render: (r) =>
        r.qty === r.jml_aktual ? <StatusBadge tone="ok">SESUAI</StatusBadge> : <StatusBadge tone="danger">SELISIH {r.jml_aktual - r.qty}</StatusBadge>,
    },
  ];

  return (
    <SectionCard
      icon={FileSpreadsheet}
      title="Tag Stock Non Barcode"
      actions={
        <button className="btn-ctrl primary">
          <Upload size={14} /> Import Excel
        </button>
      }
    >
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 0 }}>
        Dipakai untuk item yang dihitung manual (belum ter-cover barcode), input lewat upload Excel jumlah rak & aktual per lot.
      </p>
      <DataTable columns={columns} rows={TAG_STOCK_NONBARCODE} />
    </SectionCard>
  );
}

export default TagStockNonBarcodePage;
