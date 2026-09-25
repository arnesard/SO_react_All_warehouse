import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const API_BASE = "http://localhost:8010/api/tagstock";

export default function PrintTagKsoPage() {
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
        // Tarik PIC
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

        // Tarik rows
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
        console.error("Gagal load tag data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [warehouse, operatorId, docStart, docEnd]);

  useEffect(() => {
    if (!loading && data.length > 0) {
      document.fonts.ready.then(() => {
        setTimeout(() => {
          window.print();
        }, 500);
      });
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
        Merender kartu barcode tag stock...
      </div>
    );
  }

  // Pecah per 4 tag per halaman (grid 2x2)
  const pages = [];
  for (let i = 0; i < data.length; i += 4) {
    pages.push(data.slice(i, i + 4));
  }

  const picName = operatorInfo?.nama || "-";

  return (
    <div className="print-tag-kso-container">
      {/* Import font barcode Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="true"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @page { size: A4 portrait; margin: 10mm 4mm 4mm 4mm; }
        body { background: #fff !important; color: #000 !important; font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .print-page {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-auto-rows: 156mm;
          gap: 4mm;
          page-break-after: always;
        }
        .form-card { box-sizing: border-box; padding: 1mm; }
        .tag-table-single {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          font-size: 13px;
          table-layout: fixed;
        }
        .tag-table-single td { border: 1px solid #000; vertical-align: middle; }
        .tag-title-cell {
          padding: 14px;
          text-align: center;
          font-weight: bold;
          font-size: 22px;
          background: #f2f2f2;
        }
      `}</style>

      {pages.map((pageRows, pageIdx) => (
        <div key={pageIdx} className="print-page">
          {pageRows.map((t, idx) => {
            const isOe = String(t.item || "").endsWith("0");
            const qtyNum = Number(t.Qty || 0);
            const totalPcs = qtyNum;
            const loccode = t.lot_display || "-";
            const locPrefix =
              loccode.length >= 5 ? loccode.substring(0, 5) : loccode;
            const locSuffix = loccode.length >= 3 ? loccode.slice(-3) : "-";

            return (
              <div key={idx} className="form-card">
                <table className="tag-table-single">
                  <tbody>
                    <tr>
                      <td colSpan="4" className="tag-title-cell">
                        TAG STOCK
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          borderTop: "1px solid #000",
                          borderBottom: "none",
                          textAlign: "left",
                          textIndent: "5px",
                          padding: "1px",
                        }}
                      >
                        No. Doc :
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="2"
                        style={{
                          borderTop: "none",
                          borderRight: "none",
                          borderBottom: "1px solid #000",
                          padding: "1px",
                          textAlign: "left",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: "22px",
                            lineHeight: "1",
                            marginLeft: "10px",
                          }}
                        >
                          {t.no_doc || "-"}
                        </div>
                      </td>
                      <td
                        colSpan="2"
                        style={{
                          borderTop: "none",
                          borderLeft: "none",
                          borderBottom: "1px solid #000",
                          padding: 0,
                          textAlign: "left",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'Libre Barcode 39', cursive",
                            fontSize: "38px",
                            lineHeight: "0.6",
                            marginLeft: "-15px",
                          }}
                        >
                          *{t.no_doc || "-"}*
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="2"
                        style={{
                          border: "1px solid #000",
                          borderBottom: "none",
                          padding: "5px",
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: "20px",
                        }}
                      >
                        {locPrefix}
                      </td>
                      <td
                        colSpan="2"
                        style={{
                          border: "1px solid #000",
                          borderBottom: "none",
                          padding: "5px",
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: "20px",
                        }}
                      >
                        {locSuffix}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          borderLeft: "1px solid #000",
                          borderRight: "1px solid #000",
                          borderTop: "none",
                          borderBottom: "none",
                          padding: 0,
                        }}
                      ></td>
                    </tr>
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          borderTop: "1px solid #000",
                          borderBottom: "none",
                          padding: "1px",
                          textAlign: "right",
                          paddingRight: "8px",
                        }}
                      >
                        Item Code :
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="3"
                        style={{
                          border: "none",
                          borderLeft: "1px solid #000",
                          padding: 0,
                          fontFamily: "'Libre Barcode 39', cursive",
                          fontSize: "34px",
                          textAlign: "left",
                          paddingLeft: "18px",
                          lineHeight: "0.6",
                        }}
                      >
                        *{t.item || "-"}*
                      </td>
                      <td
                        colSpan="1"
                        style={{
                          border: "none",
                          borderRight: "1px solid #000",
                          fontSize: "20px",
                          fontWeight: "bold",
                          textAlign: "right",
                          paddingRight: "8px",
                          lineHeight: "1",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.item || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          borderLeft: "1px solid #000",
                          borderRight: "1px solid #000",
                          borderTop: "none",
                          borderBottom: "none",
                          padding: 0,
                          textAlign: "right",
                          paddingRight: "8px",
                          fontSize: "18px",
                        }}
                      >
                        {t.description || t.item || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="1"
                        style={{
                          border: "1px solid #000",
                          borderBottom: "none",
                          padding: 0,
                          textIndent: "5px",
                          textAlign: "left",
                        }}
                      >
                        Jumlah Rak:
                      </td>
                      <td
                        colSpan="3"
                        style={{
                          border: "1px solid #000",
                          borderBottom: "none",
                          padding: 0,
                          textIndent: "5px",
                          textAlign: "left",
                        }}
                      >
                        Jumlah Pcs:
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="1"
                        style={{
                          border: "1px solid #000",
                          padding: 0,
                          textAlign: "center",
                          fontSize: "28px",
                          fontWeight: "bold",
                          lineHeight: "1",
                        }}
                      >
                        {t.Rak || 0}
                      </td>
                      <td
                        colSpan="1"
                        style={{
                          border: "1px solid #000",
                          borderRight: "none",
                          padding: 0,
                          textAlign: "right",
                          fontSize: "28px",
                          fontWeight: "bold",
                          lineHeight: "1",
                          paddingRight: "8px",
                        }}
                      >
                        {totalPcs.toLocaleString("id-ID")}
                      </td>
                      <td
                        colSpan="2"
                        style={{
                          border: "1px solid #000",
                          borderLeft: "none",
                          padding: 0,
                          fontFamily: "'Libre Barcode 39', cursive",
                          fontSize: "38px",
                          textAlign: "center",
                          lineHeight: "0.8",
                        }}
                      >
                        *{totalPcs}*
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          border: "1px solid #000",
                          padding: 0,
                          textAlign: "left",
                          textIndent: "5px",
                        }}
                      >
                        Rincian :
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="1"
                        style={{
                          border: "none",
                          padding: "3px",
                          textAlign: "center",
                        }}
                      >
                        Cell
                      </td>
                      <td
                        colSpan="1"
                        style={{
                          border: "none",
                          padding: "3px",
                          textAlign: "center",
                        }}
                      >
                        Susun
                      </td>
                      <td
                        colSpan="1"
                        style={{
                          border: "none",
                          padding: "3px",
                          textAlign: "center",
                        }}
                      >
                        Isi
                      </td>
                      <td
                        colSpan="1"
                        style={{
                          border: "none",
                          padding: "3px",
                          textAlign: "center",
                        }}
                      >
                        Total
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          border: "none",
                          padding: "8px",
                          textAlign: "center",
                        }}
                      >
                        A : __________ x __________ x __________ = ___________
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          border: "none",
                          padding: "8px",
                          textAlign: "center",
                        }}
                      >
                        B : __________ x __________ x __________ = ___________
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          border: "none",
                          padding: "8px",
                          textAlign: "center",
                        }}
                      >
                        C : __________ x __________ x __________ = ___________
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="2"
                        style={{
                          border: "1px solid #000",
                          padding: "4px",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        PIC
                      </td>
                      <td
                        colSpan="2"
                        style={{
                          border: "none",
                          padding: 0,
                          textAlign: "right",
                          paddingRight: "8px",
                        }}
                      >
                        Grand Total = ___________
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="2"
                        style={{
                          border: "1px solid #000",
                          padding: "18px",
                          textAlign: "center",
                        }}
                      ></td>
                      <td colSpan="2" style={{ border: "none" }}></td>
                    </tr>
                    <tr>
                      <td
                        colSpan="2"
                        style={{
                          border: "1px solid #000",
                          padding: "10px",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {picName}
                      </td>
                      <td colSpan="2" style={{ border: "none" }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
