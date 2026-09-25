import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const API_BASE = "http://localhost:8010/api/tagstock";

export default function PrintRekapPage() {
  const [searchParams] = useSearchParams();
  const warehouse = searchParams.get("warehouse") || "";
  const operatorId = searchParams.get("operator_id") || "";
  const docStart = searchParams.get("doc_start") || "";
  const docEnd = searchParams.get("doc_end") || "";

  const [data, setData] = useState([]);
  const [operatorInfo, setOperatorInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!warehouse || !operatorId) return;
      try {
        setLoading(true);
        // 1. Tarik info operator
        const opRes = await fetch(
          `${API_BASE}/operators?warehouse=${encodeURIComponent(warehouse)}`,
        );
        const opJson = await opRes.json();
        if (opJson.status === "success") {
          const currentOp = (opJson.operators || []).find(
            (o) => o.no_penneng === operatorId,
          );
          setOperatorInfo(currentOp || null);
        }

        // 2. Tarik rows data
        const rowRes = await fetch(`${API_BASE}/process-rows`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            warehouse,
            operator_id: operatorId,
            doc_start: docStart,
            doc_end: docEnd,
          }),
        });
        const rowJson = await rowRes.json();
        if (rowJson.status === "success") {
          setData(rowJson.master_data || []);
        }
      } catch (err) {
        console.error("Gagal load data print:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [warehouse, operatorId, docStart, docEnd]);

  useEffect(() => {
    if (!loading && data.length > 0) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, data]);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "50px",
          fontFamily: "sans-serif",
        }}
      >
        Menyiapkan dokumen rekap...
      </div>
    );
  }

  const totalRak = data.reduce((a, b) => a + (Number(b.Rak) || 0), 0);
  const totalQty = data.reduce((a, b) => a + (Number(b.Qty) || 0), 0);

  return (
    <div className="print-rekap-container">
      <style>{`
        @page { size: A4 portrait; margin: 8mm; }
        body { background: #fff !important; color: #000 !important; font-family: "Times New Roman", serif; font-size: 12px; margin: 0; }
        .header { text-align: center; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
        th, td { border: 1px solid #000; padding: 5px; }
        th { background: #eee; text-align: center; font-weight: bold; }
        tr { page-break-inside: avoid; }
      `}</style>

      <div className="header">
        <h2 style={{ margin: "0 0 6px 0", fontSize: "18px" }}>
          Monitoring Stock ({warehouse})
        </h2>
        <div
          style={{
            textAlign: "left",
            display: "inline-block",
            fontSize: "12px",
          }}
        >
          <b>
            {operatorInfo
              ? `${operatorInfo.nama} (${operatorInfo.no_penneng})`
              : "-"}
          </b>{" "}
          ||{" "}
          <b>
            {operatorInfo?.gedung || "-"} Lot{" "}
            {operatorInfo?.combined_lot || "-"}
          </b>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: "5%" }}>No.</th>
            <th style={{ width: "12%" }}>Lot</th>
            <th style={{ width: "12%" }}>No. Doc</th>
            <th style={{ width: "12%" }}>Item</th>
            <th>Deskripsi Master Size</th>
            <th style={{ width: "12%" }}>Jumlah Rak</th>
            <th style={{ width: "12%" }}>Qty</th>
            <th style={{ width: "12%" }}>Jumlah Aktual</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i}>
              <td style={{ textAlign: "center" }}>{i + 1}</td>
              <td>{r.lot_display || "-"}</td>
              <td>{r.no_doc || "-"}</td>
              <td>{r.item || "-"}</td>
              <td>{r.description || "-"}</td>
              <td style={{ textAlign: "center" }}>{r.Rak || 0}</td>
              <td style={{ textAlign: "right" }}>
                {Number(r.Qty || 0).toLocaleString("id-ID")}
              </td>
              <td></td>
            </tr>
          ))}
          <tr style={{ fontWeight: "bold", background: "#f2f2f2" }}>
            <td colSpan={5} style={{ textAlign: "center" }}>
              GRAND TOTAL
            </td>
            <td style={{ textAlign: "center" }}>{totalRak}</td>
            <td style={{ textAlign: "right" }}>
              {totalQty.toLocaleString("id-ID")}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
