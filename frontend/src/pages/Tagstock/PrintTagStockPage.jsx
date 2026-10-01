import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Barcode from "react-barcode";
import { API_ORIGIN } from "../../lib/config";

const API_BASE = `${API_ORIGIN}/api/tagstock`;

export default function PrintTagStockPage() {
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
        Merender kartu barcode tag stock...
      </div>
    );
  }

  // Pecah per 4 kartu per lembar
  const pages = [];
  for (let i = 0; i < data.length; i += 4) {
    pages.push(data.slice(i, i + 4));
  }

  const picName = operatorInfo?.nama || "-";

  return (
    <div className="print-tag-kso-container">
      <style>{`
        @page { 
          size: A4 portrait; 
          margin: 0mm !important; 
        }

        *, *::before, *::after {
          box-sizing: border-box !important;
        }

        html, body { 
          width: 210mm !important;
          background: #fff !important; 
          color: #000 !important; 
          font-family: Arial, sans-serif; 
          margin: 0 !important; 
          padding: 0 !important; 
          overflow: visible !important;
        }

        /* Lembar A4 presisi per 4 kartu */
        .print-page {
          width: 210mm !important;
          height: 297mm !important;
          display: grid !important;
          grid-template-columns: 95mm 95mm !important;
          grid-template-rows: 141mm 141mm !important;
          column-gap: 4mm !important; 
          row-gap: 5mm !important;    
          justify-content: center !important; 
          align-content: center !important;   
          break-after: page !important;
          page-break-after: always !important;
          box-sizing: border-box;
          overflow: hidden;
        }

        .form-card { 
          width: 95mm !important;
          height: 141mm !important;
          overflow: hidden;
          padding: 0;
          box-sizing: border-box;
          border: 2px solid #000;
          background: #fff;
        }

        .tag-table-main {
          width: 100%;
          height: 100%;
          border-collapse: collapse;
          border: none;
          table-layout: fixed;
          font-size: 11px;
        }

        .tag-table-main td { 
          border: 1px solid #000; 
          vertical-align: middle; 
          padding: 0;
        }

        .tag-title-cell {
          padding: 4px 0;
          text-align: center;
          font-weight: bold;
          font-size: 17px;
          background: #f2f2f2;
          letter-spacing: 1px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .no-border-side {
          border-left: none !important;
          border-right: none !important;
          border-top: none !important;
          border-bottom: none !important;
        }

        .barcode-wrap svg {
          display: block;
          max-width: 100%;
          height: auto;
        }
      `}</style>

      {pages.map((pageRows, pageIdx) => {
        return (
          <div key={pageIdx} className="print-page">
            {pageRows.map((t, idx) => {
              const totalPcs = Number(t.Qty || 0);
              const loccode = t.lot_display || "-";
              const locPrefix =
                loccode.length >= 5 ? loccode.substring(0, 5) : loccode;
              const locSuffix = loccode.length >= 3 ? loccode.slice(-3) : "-";
              const itemText = String(t.item || "").trim();

              return (
                <div key={idx} className="form-card">
                  <table className="tag-table-main">
                    {/* Pembagian Kolom Presisi agar rumus x tepat di tengah */}
                    <colgroup>
                      <col style={{ width: "7%" }} /> {/* A / B / C */}
                      <col style={{ width: "23%" }} /> {/* Cell line */}
                      <col style={{ width: "6%" }} /> {/* x */}
                      <col style={{ width: "22%" }} /> {/* Susun line */}
                      <col style={{ width: "6%" }} /> {/* x */}
                      <col style={{ width: "17%" }} /> {/* Isi line */}
                      <col style={{ width: "5%" }} /> {/* = */}
                      <col style={{ width: "14%" }} /> {/* Total line */}
                    </colgroup>
                    <tbody>
                      {/* 1. Header */}
                      <tr>
                        <td colSpan="8" className="tag-title-cell">
                          TAG STOCK
                        </td>
                      </tr>

                      {/* 2. No Doc Label (DIPENDEKIN) */}
                      <tr>
                        <td
                          colSpan="8"
                          style={{
                            borderTop: "1px solid #000",
                            borderBottom: "none",
                            textAlign: "left",
                            textIndent: "5px",
                            padding: "1px 0 0 0",
                            fontSize: "9px",
                            lineHeight: "1",
                          }}
                        >
                          No. Doc :
                        </td>
                      </tr>

                      {/* 3. No Doc Value & Barcode (DIPENDEKIN) */}
                      <tr>
                        <td
                          colSpan="4"
                          style={{
                            borderTop: "none",
                            borderRight: "none",
                            borderBottom: "1px solid #000",
                            padding: "0 0 2px 6px",
                            textAlign: "left",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              fontSize: "17px",
                              lineHeight: "1.1",
                            }}
                          >
                            {t.no_doc || "-"}
                          </div>
                        </td>
                        <td
                          colSpan="4"
                          style={{
                            borderTop: "none",
                            borderLeft: "none",
                            borderBottom: "1px solid #000",
                            textAlign: "right",
                            paddingRight: "6px",
                            paddingBottom: "2px",
                          }}
                        >
                          <div
                            className="barcode-wrap"
                            style={{ display: "inline-block" }}
                          >
                            {t.no_doc ? (
                              <Barcode
                                value={String(t.no_doc)}
                                format="CODE128"
                                width={1.2}
                                height={20}
                                displayValue={false}
                                margin={0}
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>

                      {/* 4. Lokasi Gedung & Lot (DIPENDEKIN) */}
                      <tr>
                        <td
                          colSpan="4"
                          style={{
                            border: "1px solid #000",
                            borderBottom: "none",
                            padding: "1px 0",
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: "15px",
                            height: "22px",
                          }}
                        >
                          {locPrefix}
                        </td>
                        <td
                          colSpan="4"
                          style={{
                            border: "1px solid #000",
                            borderBottom: "none",
                            padding: "1px 0",
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: "15px",
                            height: "22px",
                          }}
                        >
                          {locSuffix}
                        </td>
                      </tr>

                      {/* 5. Pemisah Halus */}
                      <tr>
                        <td
                          colSpan="8"
                          style={{
                            borderLeft: "1px solid #000",
                            borderRight: "1px solid #000",
                            borderTop: "none",
                            borderBottom: "none",
                            height: "1px",
                          }}
                        ></td>
                      </tr>

                      {/* 6. Item Code Label (DIPENDEKIN) */}
                      <tr>
                        <td
                          colSpan="8"
                          style={{
                            borderTop: "1px solid #000",
                            borderBottom: "none",
                            padding: "1px 6px 0 0",
                            textAlign: "right",
                            fontSize: "9px",
                            lineHeight: "1",
                          }}
                        >
                          Item Code :
                        </td>
                      </tr>

                      {/* 7. Barcode Item & Text Item (DIPENDEKIN) */}
                      <tr>
                        <td
                          colSpan="4"
                          style={{
                            border: "none",
                            borderLeft: "1px solid #000",
                            textAlign: "left",
                            paddingLeft: "6px",
                            paddingBottom: "1px",
                          }}
                        >
                          <div className="barcode-wrap">
                            {itemText ? (
                              <Barcode
                                value={itemText}
                                format="CODE128"
                                width={1.05}
                                height={20}
                                displayValue={false}
                                margin={0}
                              />
                            ) : null}
                          </div>
                        </td>
                        <td
                          colSpan="4"
                          style={{
                            border: "none",
                            borderRight: "1px solid #000",
                            fontSize: itemText.length > 9 ? "13.5px" : "15.5px",
                            fontWeight: "bold",
                            textAlign: "right",
                            paddingRight: "6px",
                            lineHeight: "1",
                            whiteSpace: "nowrap",
                            letterSpacing: "-0.3px",
                          }}
                        >
                          {itemText || "-"}
                        </td>
                      </tr>

                      {/* 8. Deskripsi Item (DIPENDEKIN) */}
                      <tr>
                        <td
                          colSpan="8"
                          style={{
                            borderLeft: "1px solid #000",
                            borderRight: "1px solid #000",
                            borderTop: "none",
                            borderBottom: "none",
                            padding: "0 6px 2px 0",
                            textAlign: "right",
                            fontSize: itemText.length > 9 ? "11px" : "12px",
                            fontWeight: "600",
                            lineHeight: "1.1",
                          }}
                        >
                          {t.description || itemText || "-"}
                        </td>
                      </tr>

                      {/* 9. Baris Label Jumlah Rak & Pcs (DIPENDEKIN) */}
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            borderTop: "1px solid #000",
                            borderBottom: "none",
                            borderLeft: "1px solid #000",
                            borderRight: "1px solid #000",
                            padding: "2px 0 0 5px",
                            textAlign: "left",
                            fontSize: "9px",
                            lineHeight: "1",
                          }}
                        >
                          Jumlah Rak:
                        </td>
                        <td
                          colSpan="5"
                          style={{
                            borderTop: "1px solid #000",
                            borderBottom: "none",
                            borderLeft: "1px solid #000",
                            borderRight: "1px solid #000",
                            padding: "2px 0 0 5px",
                            textAlign: "left",
                            fontSize: "9px",
                            lineHeight: "1",
                          }}
                        >
                          Jumlah Pcs:
                        </td>
                      </tr>

                      {/* 10. Nilai Angka Rak, Pcs & Barcode Qty (DIPENDEKIN) */}
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            borderTop: "none",
                            borderBottom: "1px solid #000",
                            borderLeft: "1px solid #000",
                            borderRight: "1px solid #000",
                            padding: "0 0 2px 0",
                            textAlign: "center",
                            fontSize: "20px",
                            fontWeight: "bold",
                            lineHeight: "1",
                          }}
                        >
                          {t.Rak || 0}
                        </td>
                        <td
                          colSpan="3"
                          style={{
                            borderTop: "none",
                            borderBottom: "1px solid #000",
                            borderLeft: "1px solid #000",
                            borderRight: "none",
                            padding: "0 6px 2px 0",
                            textAlign: "right",
                            fontSize: "20px",
                            fontWeight: "bold",
                            lineHeight: "1",
                          }}
                        >
                          {totalPcs.toLocaleString("id-ID")}
                        </td>
                        <td
                          colSpan="2"
                          style={{
                            borderTop: "none",
                            borderBottom: "1px solid #000",
                            borderLeft: "none",
                            borderRight: "1px solid #000",
                            padding: "0 6px 2px 0",
                            textAlign: "right",
                          }}
                        >
                          <div
                            className="barcode-wrap"
                            style={{ display: "inline-block" }}
                          >
                            <Barcode
                              value={String(totalPcs)}
                              format="CODE128"
                              width={1.1}
                              height={20}
                              displayValue={false}
                              margin={0}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* 11. Label Rincian */}
                      <tr>
                        <td
                          colSpan="8"
                          style={{
                            border: "1px solid #000",
                            padding: "2px 0 2px 5px",
                            textAlign: "left",
                            fontSize: "9.5px",
                          }}
                        >
                          Rincian :
                        </td>
                      </tr>

                      {/* 12. Sub Header Rincian */}
                      <tr style={{ fontSize: "9px", textAlign: "center" }}>
                        <td className="no-border-side"></td>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          Cell
                        </td>
                        <td className="no-border-side"></td>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          Susun
                        </td>
                        <td className="no-border-side"></td>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          Isi
                        </td>
                        <td className="no-border-side"></td>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0", textAlign: "center" }}
                        >
                          Total
                        </td>
                      </tr>

                      {/* 13. Rumus A */}
                      <tr style={{ fontSize: "10.5px" }}>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", padding: "5px 0" }}
                        >
                          A :
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "90%",
                              borderBottom: "1px solid #000",
                              height: "12px",
                            }}
                          ></span>
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          x
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "90%",
                              borderBottom: "1px solid #000",
                              height: "12px",
                            }}
                          ></span>
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          x
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "90%",
                              borderBottom: "1px solid #000",
                              height: "12px",
                            }}
                          ></span>
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          =
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", paddingRight: "6px" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "85%",
                              borderBottom: "1px solid #000",
                              height: "12px",
                            }}
                          ></span>
                        </td>
                      </tr>

                      {/* 14. Rumus B */}
                      <tr style={{ fontSize: "10.5px" }}>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", padding: "5px 0" }}
                        >
                          B :
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "90%",
                              borderBottom: "1px solid #000",
                              height: "12px",
                            }}
                          ></span>
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          x
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "90%",
                              borderBottom: "1px solid #000",
                              height: "12px",
                            }}
                          ></span>
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          x
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "90%",
                              borderBottom: "1px solid #000",
                              height: "12px",
                            }}
                          ></span>
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          =
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", paddingRight: "6px" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "85%",
                              borderBottom: "1px solid #000",
                              height: "12px",
                            }}
                          ></span>
                        </td>
                      </tr>

                      {/* 15. Rumus C */}
                      <tr style={{ fontSize: "10.5px" }}>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", padding: "5px 0" }}
                        >
                          C :
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "90%",
                              borderBottom: "1px solid #000",
                              height: "12px",
                            }}
                          ></span>
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          x
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "90%",
                              borderBottom: "1px solid #000",
                              height: "12px",
                            }}
                          ></span>
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          x
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "90%",
                              borderBottom: "1px solid #000",
                              height: "12px",
                            }}
                          ></span>
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          =
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", paddingRight: "6px" }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "85%",
                              borderBottom: "1px solid #000",
                              height: "12px",
                            }}
                          ></span>
                        </td>
                      </tr>

                      {/* 16. PIC Header & Grand Total */}
                      <tr>
                        <td
                          colSpan="4"
                          style={{
                            border: "1px solid #000",
                            borderBottom: "1px solid #000",
                            padding: "3px 0",
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: "11px",
                          }}
                        >
                          PIC
                        </td>
                        <td
                          colSpan="2"
                          className="no-border-side"
                          style={{
                            textAlign: "right",
                            fontSize: "10.5px",
                            paddingRight: "2px",
                          }}
                        >
                          Grand Total
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", fontSize: "10.5px" }}
                        >
                          =
                        </td>
                        <td
                          className="no-border-side"
                          style={{
                            textAlign: "center",
                            paddingRight: "6px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "85%",
                              borderBottom: "1px solid #000",
                              height: "12px",
                            }}
                          ></span>
                        </td>
                      </tr>

                      {/* 17. Kotak Tanda Tangan (DITINGGIKAN) */}
                      <tr>
                        <td
                          colSpan="4"
                          style={{
                            border: "1px solid #000",
                            borderTop: "none",
                            borderBottom: "1px solid #000",
                            height: "56px",
                          }}
                        ></td>
                        <td colSpan="4" className="no-border-side"></td>
                      </tr>

                      {/* 18. Nama PIC */}
                      <tr>
                        <td
                          colSpan="4"
                          style={{
                            border: "1px solid #000",
                            borderTop: "none",
                            padding: "4px 0",
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: "11px",
                          }}
                        >
                          {picName}
                        </td>
                        <td colSpan="4" className="no-border-side"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
