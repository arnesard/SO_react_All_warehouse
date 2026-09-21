import { useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";
import SectionCard from "../../../components/SectionCard";
import DataTable from "../../../components/DataTable";
import StatusBadge from "../../../components/StatusBadge";
import { PROGRESS_SO, WAREHOUSES } from "../data";

function ProgressSoPage() {
  const [gedung, setGedung] = useState("");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      PROGRESS_SO.filter(
        (r) =>
          (!gedung || r.gedung === gedung) &&
          (r.item.toLowerCase().includes(query.toLowerCase()) || r.no_kso.toLowerCase().includes(query.toLowerCase())),
      ),
    [gedung, query],
  );

  const columns = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "gedung", label: "Gedung" },
    { key: "no_kso", label: "No KSO" },
    { key: "pic_stock", label: "Nama PIC Stock" },
    { key: "auditor", label: "Nama Auditor" },
    { key: "item", label: "Item", render: (r) => <span className="cell-code">{r.item}</span> },
    { key: "desc", label: "Deskripsi", render: (r) => <span className="cell-strong">{r.desc}</span> },
    { key: "qty", label: "Qty", align: "right" },
    {
      key: "keterangan",
      label: "Keterangan",
      render: (r) => (r.keterangan === "Sesuai" ? <StatusBadge tone="ok">{r.keterangan}</StatusBadge> : <StatusBadge tone="danger">{r.keterangan}</StatusBadge>),
    },
  ];

  return (
    <SectionCard
      icon={Activity}
      title="Monitoring Progress Stock Opname"
      actions={
        <>
          <select className="field-select" value={gedung} onChange={(e) => setGedung(e.target.value)}>
            <option value="">Semua Warehouse</option>
            {WAREHOUSES.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
          <div className="search-box">
            <Search size={14} />
            <input
              className="field-input"
              placeholder="Cari No KSO / item..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </>
      }
    >
      <DataTable columns={columns} rows={rows} />
    </SectionCard>
  );
}

export default ProgressSoPage;
