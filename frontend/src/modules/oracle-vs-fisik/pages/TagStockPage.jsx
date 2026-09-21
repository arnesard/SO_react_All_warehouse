import { useState } from "react";
import { Search, ClipboardList, ScanLine } from "lucide-react";
import SectionCard from "../../../components/SectionCard";
import DataTable from "../../../components/DataTable";
import StatusBadge from "../../../components/StatusBadge";
import { TAG_STOCK, SCAN_ACTIVITY } from "../data";

function TagStockPage() {
  const [query, setQuery] = useState("");

  const rows = TAG_STOCK.filter((r) => r.item.toLowerCase().includes(query.toLowerCase()) || r.lot.toLowerCase().includes(query.toLowerCase()));

  const columns = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "lot", label: "Lot", render: (r) => <span className="cell-code">{r.lot}</span> },
    { key: "no_doc", label: "No. Doc" },
    { key: "item", label: "Item", render: (r) => <span className="cell-code">{r.item}</span> },
    { key: "desc", label: "Deskripsi Master Size", render: (r) => <span className="cell-strong">{r.desc}</span> },
    { key: "jml_rak", label: "Jumlah Rak", align: "right" },
    { key: "qty", label: "Qty", align: "right" },
    { key: "jml_aktual", label: "Jumlah Aktual", align: "right" },
    {
      key: "status",
      label: "Status",
      render: (r) =>
        r.qty === r.jml_aktual ? <StatusBadge tone="ok">SESUAI</StatusBadge> : <StatusBadge tone="danger">SELISIH {r.jml_aktual - r.qty}</StatusBadge>,
    },
  ];

  const scanColumns = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "opr_id", label: "Opr ID", render: (r) => <span className="cell-code">{r.opr_id}</span> },
    { key: "nama_opr", label: "Nama Opr" },
    { key: "no_kso", label: "No KSO" },
    { key: "item_code", label: "Item Code", render: (r) => <span className="cell-code">{r.item_code}</span> },
    { key: "deskripsi", label: "Deskripsi" },
    { key: "qty_scan", label: "Qty Scan", align: "right" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <SectionCard
          icon={ClipboardList}
          title="Tag Stock — Dokumen Lot"
          actions={
            <div className="search-box">
              <Search size={14} />
              <input
                className="field-input"
                placeholder="Cari lot / item..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          }
        >
          <DataTable columns={columns} rows={rows} />
        </SectionCard>
      </div>

      <SectionCard icon={ScanLine} title="Aktivitas Scan Terkait Tag Stock">
        <DataTable columns={scanColumns} rows={SCAN_ACTIVITY} />
      </SectionCard>
    </div>
  );
}

export default TagStockPage;
