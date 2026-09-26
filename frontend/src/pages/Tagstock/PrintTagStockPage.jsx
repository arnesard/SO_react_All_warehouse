import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Barcode from "react-barcode";

const API_BASE = "http://localhost:8010/api/tagstock";

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

        /* HAPUS height: 297mm dan HAPUS overflow: hidden dari html & body */
        html, body { 
          width: 210mm !important;
          background: #fff !important; 
          color: #000 !important; 
          font-family: Arial, sans-serif; 
          margin: 0 !important; 
          padding: 0 !important; 
          overflow: visible !important; /* Wajib visible agar halaman 2, 3, dst tidak kepotong */
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
          break-after: page !important;      /* Standar pemisah halaman cetak modern */
          page-break-after: always !important; /* Kompatibilitas browser lama */
          box-sizing: border-box;
          overflow: hidden; /* Cukup di dalam lembar ini saja */
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
          padding: 6px 0;
          text-align: center;
          font-weight: bold;
          font-size: 19px;
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
                    <colgroup>
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "23%" }} />
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "5%" }} />
                      <col style={{ width: "19%" }} />
                    </colgroup>
                    <tbody>
                      {/* 1. Header */}
                      <tr>
                        <td colSpan="6" className="tag-title-cell">
                          TAG STOCK
                        </td>
                      </tr>

                      {/* 2. No Doc Label */}
                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            borderTop: "1px solid #000",
                            borderBottom: "none",
                            textAlign: "left",
                            textIndent: "5px",
                            padding: "1px 0",
                            fontSize: "10px",
                          }}
                        >
                          No. Doc :
                        </td>
                      </tr>

                      {/* 3. No Doc Value & Barcode (react-barcode) */}
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            borderTop: "none",
                            borderRight: "none",
                            borderBottom: "1px solid #000",
                            padding: "0 0 2px 8px",
                            textAlign: "left",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              fontSize: "19px",
                              lineHeight: "1",
                            }}
                          >
                            {t.no_doc || "-"}
                          </div>
                        </td>
                        <td
                          colSpan="3"
                          style={{
                            borderTop: "none",
                            borderLeft: "none",
                            borderBottom: "1px solid #000",
                            textAlign: "left",
                            paddingLeft: "4px",
                          }}
                        >
                          <div className="barcode-wrap">
                            {t.no_doc ? (
                              <Barcode
                                value={String(t.no_doc)}
                                format="CODE128"
                                width={1.2}
                                height={26}
                                displayValue={false}
                                margin={0}
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>

                      {/* 4. Lokasi Gedung & Lot */}
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            border: "1px solid #000",
                            borderBottom: "none",
                            padding: "4px 0",
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: "17px",
                          }}
                        >
                          {locPrefix}
                        </td>
                        <td
                          colSpan="3"
                          style={{
                            border: "1px solid #000",
                            borderBottom: "none",
                            padding: "4px 0",
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: "17px",
                          }}
                        >
                          {locSuffix}
                        </td>
                      </tr>

                      {/* 5. Pemisah Halus */}
                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            borderLeft: "1px solid #000",
                            borderRight: "1px solid #000",
                            borderTop: "none",
                            borderBottom: "none",
                            height: "1px",
                          }}
                        ></td>
                      </tr>

                      {/* 6. Item Code Label */}
                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            borderTop: "1px solid #000",
                            borderBottom: "none",
                            padding: "1px 6px 0 0",
                            textAlign: "right",
                            fontSize: "9.5px",
                          }}
                        >
                          Item Code :
                        </td>
                      </tr>

                      {/* 7. Barcode Item & Text Item (DIBAGI 3:3 BIAR GESER KE KIRI & TIDAK KEPOTONG) */}
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            border: "none",
                            borderLeft: "1px solid #000",
                            textAlign: "left",
                            paddingLeft: "6px",
                          }}
                        >
                          <div className="barcode-wrap">
                            {itemText ? (
                              <Barcode
                                value={itemText}
                                format="CODE128"
                                width={1.05}
                                height={25}
                                displayValue={false}
                                margin={0}
                              />
                            ) : null}
                          </div>
                        </td>
                        <td
                          colSpan="3"
                          style={{
                            border: "none",
                            borderRight: "1px solid #000",
                            fontSize: itemText.length > 9 ? "14px" : "16px",
                            fontWeight: "bold",
                            textAlign: "right",
                            paddingRight: "5px",
                            lineHeight: "1",
                            whiteSpace: "nowrap",
                            letterSpacing: "-0.3px",
                          }}
                        >
                          {itemText || "-"}
                        </td>
                      </tr>

                      {/* 8. Deskripsi Item */}
                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            borderLeft: "1px solid #000",
                            borderRight: "1px solid #000",
                            borderTop: "none",
                            borderBottom: "none",
                            padding: "0 5px 4px 0",
                            textAlign: "right",
                            fontSize: itemText.length > 9 ? "11.5px" : "13px",
                            fontWeight: "600",
                          }}
                        >
                          {t.description || itemText || "-"}
                        </td>
                      </tr>

                      {/* 9. Baris Label Jumlah Rak & Pcs */}
                      <tr>
                        <td
                          colSpan="2"
                          style={{
                            borderTop: "1px solid #000",
                            borderBottom: "none",
                            borderLeft: "1px solid #000",
                            borderRight: "1px solid #000",
                            padding: "3px 0 0 5px",
                            textAlign: "left",
                            fontSize: "9.5px",
                          }}
                        >
                          Jumlah Rak:
                        </td>
                        <td
                          colSpan="4"
                          style={{
                            borderTop: "1px solid #000",
                            borderBottom: "none",
                            borderLeft: "1px solid #000",
                            borderRight: "1px solid #000",
                            padding: "3px 0 0 5px",
                            textAlign: "left",
                            fontSize: "9.5px",
                          }}
                        >
                          Jumlah Pcs:
                        </td>
                      </tr>

                      {/* 10. Nilai Angka Rak, Pcs & Barcode Qty */}
                      <tr>
                        <td
                          colSpan="2"
                          style={{
                            borderTop: "none",
                            borderBottom: "1px solid #000",
                            borderLeft: "1px solid #000",
                            borderRight: "1px solid #000",
                            padding: "0 0 3px 0",
                            textAlign: "center",
                            fontSize: "24px",
                            fontWeight: "bold",
                            lineHeight: "1",
                          }}
                        >
                          {t.Rak || 0}
                        </td>
                        <td
                          colSpan="2"
                          style={{
                            borderTop: "none",
                            borderBottom: "1px solid #000",
                            borderLeft: "1px solid #000",
                            borderRight: "none",
                            padding: "0 6px 3px 0",
                            textAlign: "right",
                            fontSize: "24px",
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
                            padding:
                              "0 10px 3px 2px" /* Tambah padding kanan 10px biar geser ke kiri */,
                            textAlign:
                              "left" /* Ubah ke left biar barcode nempel ke arah teks angka */,
                          }}
                        >
                          <div
                            className="barcode-wrap"
                            style={{
                              display: "inline-block",
                              marginLeft:
                                "2px" /* Kontrol jarak geser dari angka */,
                            }}
                          >
                            <Barcode
                              value={String(totalPcs)}
                              format="CODE128"
                              width={1.15} /* Sedikit ramping biar kaga sesak */
                              height={26}
                              displayValue={false}
                              margin={0}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* 11. Label Rincian */}
                      <tr>
                        <td
                          colSpan="6"
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
                          style={{ padding: "1px 0" }}
                        >
                          Cell
                        </td>
                        <td
                          className="no-border-side"
                          style={{ padding: "1px 0" }}
                        >
                          Susun
                        </td>
                        <td
                          className="no-border-side"
                          style={{ padding: "1px 0" }}
                        >
                          Isi
                        </td>
                        <td
                          className="no-border-side"
                          colSpan="2"
                          style={{ padding: "1px 0" }}
                        >
                          Total
                        </td>
                      </tr>

                      {/* 13. Rumus A */}
                      <tr style={{ fontSize: "10px", textAlign: "center" }}>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          A :
                        </td>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          _________
                        </td>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          x _________
                        </td>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          x _________
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          =
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "left", paddingRight: "4px" }}
                        >
                          _________
                        </td>
                      </tr>

                      {/* 14. Rumus B */}
                      <tr style={{ fontSize: "10px", textAlign: "center" }}>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          B :
                        </td>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          _________
                        </td>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          x _________
                        </td>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          x _________
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          =
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "left", paddingRight: "4px" }}
                        >
                          _________
                        </td>
                      </tr>

                      {/* 15. Rumus C */}
                      <tr style={{ fontSize: "10px", textAlign: "center" }}>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          C :
                        </td>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          _________
                        </td>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          x _________
                        </td>
                        <td
                          className="no-border-side"
                          style={{ padding: "2px 0" }}
                        >
                          x _________
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center" }}
                        >
                          =
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "left", paddingRight: "4px" }}
                        >
                          _________
                        </td>
                      </tr>

                      {/* 16. PIC Header & Grand Total */}
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            border: "1px solid #000",
                            borderBottom: "1px solid #000",
                            padding: "2px 0",
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: "10.5px",
                          }}
                        >
                          PIC
                        </td>
                        <td
                          className="no-border-side"
                          style={{
                            textAlign: "right",
                            fontSize: "10px",
                            paddingRight: "4px",
                          }}
                        >
                          Grand Total
                        </td>
                        <td
                          className="no-border-side"
                          style={{ textAlign: "center", fontSize: "10px" }}
                        >
                          =
                        </td>
                        <td
                          className="no-border-side"
                          style={{
                            textAlign: "left",
                            fontSize: "10px",
                            paddingRight: "4px",
                          }}
                        >
                          _________
                        </td>
                      </tr>

                      {/* 17. Kotak Tanda Tangan */}
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            border: "1px solid #000",
                            borderTop: "none",
                            borderBottom: "1px solid #000",
                            height: "58px",
                          }}
                        ></td>
                        <td colSpan="3" className="no-border-side"></td>
                      </tr>

                      {/* 18. Nama PIC */}
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            border: "1px solid #000",
                            borderTop: "none",
                            padding: "3px 0",
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: "10.5px",
                          }}
                        >
                          {picName}
                        </td>
                        <td colSpan="3" className="no-border-side"></td>
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
