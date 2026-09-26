import { useEffect, useState, useRef } from "react";
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
  const hasPrintedRef = useRef(false);

  useEffect(() => {
    async function loadData() {
      if (!warehouse || !operatorId) return;
      try {
        setLoading(true);
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
    if (!loading && data.length > 0 && !hasPrintedRef.current) {
      hasPrintedRef.current = true;
      setTimeout(() => {
        window.print();
      }, 300);
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
    <div className="print-page-wrapper">
      <style>{`
        @page { 
          size: A4 portrait; 
          margin: 8mm 8mm 8mm 8mm; 
        }

        *, *::before, *::after {
          box-sizing: border-box !important;
        }

        html, body { 
          width: 210mm !important;
          background: #fff !important; 
          color: #000 !important; 
          font-family: "Times New Roman", serif; 
          font-size: 11px; 
          margin: 0 !important; 
          padding: 0 !important;
        }

        /* Container dikunci pas di dalam area print A4 */
        .print-page-wrapper {
          width: 194mm !important;
          max-width: 194mm !important;
          margin: 0 auto !important;
          padding: 0 !important;
        }

        .header { 
          text-align: center; 
          margin-bottom: 12px; 
          width: 100%;
        }

       /* Ubah ke border-collapse: collapse agar border atas tiap baris baru otomatis tertutup rapat */
        .print-table { 
          width: 100% !important; 
          table-layout: fixed !important; 
          border-collapse: collapse !important;
          font-size: 10.5px; 
          margin-top: 4px;
        }

        /* Mencegah pengulangan header di halaman 2 */
        .print-table thead {
          display: table-row-group !important;
        }

        /* Pasang 1px solid #000 merata di 4 sisi sel */
        .print-table th, 
        .print-table td { 
          border: 1px solid #000 !important; 
          padding: 4px 6px !important; 
          vertical-align: middle !important; 
          word-wrap: break-word !important; 
          overflow-wrap: break-word !important;
        }

        .print-table th { 
          background: #f0f0f0 !important; 
          text-align: center !important; 
          font-weight: bold !important; 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important;
        }

        .print-table tr { 
          page-break-inside: avoid !important; 
          break-inside: avoid !important;
        }
      `}</style>

      <div className="header">
        <h2
          style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "bold" }}
        >
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

      <table className="print-table">
        <thead>
          <tr>
            {/* Total pas 194mm di kertas A4 */}
            <th style={{ width: "9mm" }}>No.</th>
            <th style={{ width: "24mm" }}>Lot</th>
            <th style={{ width: "22mm" }}>No. Doc</th>
            <th style={{ width: "22mm" }}>Item</th>
            <th>Deskripsi Master Size</th>
            <th style={{ width: "18mm" }}>Jumlah Rak</th>
            <th style={{ width: "18mm" }}>Qty</th>
            <th style={{ width: "20mm" }}>Jumlah Aktual</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i}>
              <td style={{ textAlign: "center" }}>{i + 1}</td>
              <td style={{ textAlign: "left" }}>{r.lot_display || "-"}</td>
              <td style={{ textAlign: "left" }}>{r.no_doc || "-"}</td>
              <td style={{ textAlign: "left" }}>{r.item || "-"}</td>
              <td style={{ textAlign: "left" }}>{r.description || "-"}</td>
              <td style={{ textAlign: "center" }}>{r.Rak || 0}</td>
              <td style={{ textAlign: "right" }}>
                {Number(r.Qty || 0).toLocaleString("id-ID")}
              </td>
              <td>&nbsp;</td>
            </tr>
          ))}
          <tr
            style={{
              fontWeight: "bold",
              background: "#f2f2f2",
              WebkitPrintColorAdjust: "exact",
            }}
          >
            <td colSpan={5} style={{ textAlign: "center" }}>
              GRAND TOTAL
            </td>
            <td style={{ textAlign: "center" }}>{totalRak}</td>
            <td style={{ textAlign: "right" }}>
              {totalQty.toLocaleString("id-ID")}
            </td>
            <td>&nbsp;</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
