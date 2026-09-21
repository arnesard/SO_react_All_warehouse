import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import SectionCard from "../../../components/SectionCard";
import DataTable from "../../../components/DataTable";

function PicPage() {
  const columns = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "warehouse", label: "Warehouse" },
    {
      key: "penneng",
      label: "No. Penneng / Id",
      render: (r) => <span className="cell-code">{r.penneng}</span>,
    },
    {
      key: "nama",
      label: "Nama Personel",
      render: (r) => <span className="cell-strong">{r.nama}</span>,
    },
    { key: "gedung", label: "Gedung" },
    { key: "lot", label: "LOT" },
    {
      key: "aksi",
      label: "Aksi",
      render: () => (
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-ctrl" style={{ padding: "5px 8px" }}>
            <Pencil size={13} />
          </button>
          <button
            className="btn-ctrl"
            style={{ padding: "5px 8px", color: "var(--danger)" }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <SectionCard
      icon={Users}
      title="Master PIC / Personel"
      actions={
        <button className="btn-ctrl primary">
          <Plus size={14} /> Tambah PIC
        </button>
      }
    >
      <DataTable columns={columns} rows={PIC_ROWS} />
    </SectionCard>
  );
}

export default PicPage;
