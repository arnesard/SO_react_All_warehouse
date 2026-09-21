import { useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, Ruler } from "lucide-react";
import SectionCard from "../../../components/SectionCard";
import DataTable from "../../../components/DataTable";
import { MASTER_SIZE } from "../data";

function MasterSizePage() {
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      MASTER_SIZE.filter(
        (r) =>
          r.item.toLowerCase().includes(query.toLowerCase()) ||
          r.desc.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const columns = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "warehouse", label: "Warehouse" },
    { key: "item", label: "Item", render: (r) => <span className="cell-code">{r.item}</span> },
    { key: "desc", label: "Description", render: (r) => <span className="cell-strong">{r.desc}</span> },
    { key: "grade", label: "Grade" },
    { key: "product", label: "Product" },
    { key: "type", label: "Type" },
    { key: "brand", label: "Brand" },
    { key: "category", label: "Category" },
    { key: "pattern", label: "Pattern" },
    {
      key: "action",
      label: "Action",
      render: () => (
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-ctrl" style={{ padding: "5px 8px" }}>
            <Pencil size={13} />
          </button>
          <button className="btn-ctrl" style={{ padding: "5px 8px", color: "var(--danger)" }}>
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <SectionCard
      icon={Ruler}
      title={`Master Size (${rows.length} item)`}
      actions={
        <>
          <div className="search-box">
            <Search size={14} />
            <input
              className="field-input"
              placeholder="Cari item / deskripsi..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="btn-ctrl primary">
            <Plus size={14} /> Tambah Master Size
          </button>
        </>
      }
    >
      <DataTable columns={columns} rows={rows} />
    </SectionCard>
  );
}

export default MasterSizePage;
