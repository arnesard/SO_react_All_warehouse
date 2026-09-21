import { useMemo, useState } from "react";
import { Search, RefreshCw, ScanBarcode, MapPin } from "lucide-react";
import SectionCard from "../../../components/SectionCard";
import DataTable from "../../../components/DataTable";
import StatCard from "../../../components/StatCard";
import { BARCODE_MONSTOCK, WAREHOUSES } from "../data";

function BarcodeMonstockPage() {
  const [query, setQuery] = useState("");
  const [wh, setWh] = useState("");

  const rows = useMemo(
    () =>
      BARCODE_MONSTOCK.filter(
        (r) =>
          (!wh || r.warehouse === wh) &&
          (r.item_code.toLowerCase().includes(query.toLowerCase()) ||
            r.rack_code.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, wh],
  );

  const totalPcs = rows.reduce((a, r) => a + r.jml_pcs, 0);
  const totalOem = rows.reduce((a, r) => a + r.oem_pcs, 0);

  const columns = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "warehouse", label: "Warehouse" },
    { key: "rack_code", label: "Rack Code", render: (r) => <span className="cell-code">{r.rack_code}</span> },
    { key: "item_code", label: "Item Code", render: (r) => <span className="cell-code">{r.item_code}</span> },
    { key: "desc", label: "Description", render: (r) => <span className="cell-strong">{r.desc}</span> },
    { key: "jml_pcs", label: "Jml (Pcs)", align: "right" },
    { key: "oem_pcs", label: "OEM (Pcs)", align: "right" },
    { key: "loc_code", label: "Location Code" },
  ];

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon={ScanBarcode} label="Rack Termonitor" value={rows.length} tone="accent" />
        <StatCard icon={MapPin} label="Total Pcs" value={totalPcs.toLocaleString("id-ID")} tone="cyan" />
        <StatCard icon={MapPin} label="Total OEM Pcs" value={totalOem.toLocaleString("id-ID")} tone="warn" />
      </div>

      <SectionCard
        icon={ScanBarcode}
        title="Barcode Monitoring Stock"
        actions={
          <>
            <select className="field-select" value={wh} onChange={(e) => setWh(e.target.value)}>
              <option value="">Semua Warehouse</option>
              {WAREHOUSES.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <div className="search-box">
              <Search size={14} />
              <input
                className="field-input"
                placeholder="Cari rack / item code..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button className="btn-ctrl">
              <RefreshCw size={14} /> Refresh
            </button>
          </>
        }
      >
        <DataTable columns={columns} rows={rows} />
      </SectionCard>
    </div>
  );
}

export default BarcodeMonstockPage;
