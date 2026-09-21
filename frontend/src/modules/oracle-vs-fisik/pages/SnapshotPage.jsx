import { Camera } from "lucide-react";
import SectionCard from "../../../components/SectionCard";
import DataTable from "../../../components/DataTable";
import { SNAPSHOT_ROWS } from "../data";

function SnapshotPage() {
  const columns = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "wh", label: "WH" },
    { key: "item_code", label: "Item Code", render: (r) => <span className="cell-code">{r.item_code}</span> },
    { key: "desc", label: "Description (From Master)", render: (r) => <span className="cell-strong">{r.desc}</span> },
    { key: "qty_oracle", label: "Qty Oracle", align: "right" },
  ];

  return (
    <SectionCard
      icon={Camera}
      title="Snapshot Qty Oracle"
      actions={
        <button className="btn-ctrl primary">
          <Camera size={14} /> Ambil Snapshot Baru
        </button>
      }
    >
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 0 }}>
        Snapshot merekam qty Oracle di satu titik waktu, dipakai sebagai baseline pembanding sebelum stock opname berjalan.
      </p>
      <DataTable columns={columns} rows={SNAPSHOT_ROWS} />
    </SectionCard>
  );
}

export default SnapshotPage;
