import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";

const API_BASE = "http://localhost:8010/api/appkso";

export default function PrintRekapKso() {
  const [searchParams] = useSearchParams();
  const warehouse = searchParams.get("warehouse") || "";
  const filterOpr = searchParams.get("operator") || "ALL";
  const tglSoInput = searchParams.get("tgl_so") || "";
  const tglPosisiInput = searchParams.get("tgl_posisi") || "";

  const [rows, setRows] = useState([]);
  const [picLabel, setPicLabel] = useState("SEMUA PIC");
  const [auditorLabel, setAuditorLabel] = useState("-");
  const [loading, setLoading] = useState(true);
  const hasPrintedRef = useRef(false);

  const formatTgl = (dateStr) => {
    if (!dateStr) return "-";
    if (!dateStr.includes("-")) return dateStr;
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y.slice(-2)}`;
  };

  useEffect(() => {
    async function loadData() {
      if (!warehouse) return;
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE}/data?warehouse=${encodeURIComponent(warehouse)}`,
        );
        const json = await res.json();
        const baseRows = json.detail || [];

        let filtered = [];
        if (filterOpr === "ALL") {
          filtered = baseRows;
          setPicLabel("SEMUA PIC");
          const firstAud = baseRows.find(
            (r) => r.auditor_nama && r.auditor_nama !== "-",
          );
          setAuditorLabel(firstAud ? firstAud.auditor_nama : "-");
        } else {
          filtered = baseRows.filter(
            (r) => String(r.opr).trim() === filterOpr.trim(),
          );
          if (filtered.length > 0) {
            setPicLabel(
              filtered[0].oprname
                ? filtered[0].oprname.toUpperCase()
                : "SANG PIC",
            );
            const auditors = [
              ...new Set(
                filtered
                  .filter((r) => r.auditor_nama && r.auditor_nama !== "-")
                  .map((r) => r.auditor_nama.trim()),
              ),
            ];
            setAuditorLabel(auditors.length > 0 ? auditors.join(", ") : "-");
          }
        }

        // Sort by No. Document numeric
        filtered.sort((a, b) =>
          String(a.nokso || "").localeCompare(
            String(b.nokso || ""),
            undefined,
            {
              numeric: true,
              sensitivity: "base",
            },
          ),
        );

        setRows(filtered);
      } catch (err) {
        console.error("Gagal load data print rekap:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [warehouse, filterOpr]);

  useEffect(() => {
    if (!loading && rows.length > 0 && !hasPrintedRef.current) {
      hasPrintedRef.current = true;
      setTimeout(() => {
        window.print();
      }, 400);
    }
  }, [loading, rows]);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "50px",
          fontFamily: "sans-serif",
        }}
      >
        Menyiapkan dokumen Rekap APPKSO...
      </div>
    );
  }

  const totalQty = rows.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);

  return (
    <div className="rekap-print-wrapper">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm 6mm 6mm 6mm;
        }

        *, *::before, *::after {
          box-sizing: border-box !important;
        }

        html, body {
          width: 210mm !important;
          background: #fff !important;
          color: #000 !important;
          font-family: Arial, Helvetica, sans-serif;
          margin: 0 !important;
          padding: 0 !important;
        }

        .rekap-print-wrapper {
          width: 198mm !important;
          margin: 0 auto !important;
        }

        .header-table {
          width: 100%;
          border-collapse: collapse;
          border: none !important;
          margin-bottom: 12px;
        }

        .header-table td {
          border: none !important;
          padding: 3px 4px !important;
          font-size: 11px;
        }

        .box-signature {
          width: 170px;
          height: 68px;
          vertical-align: bottom;
          text-align: center;
          border: 1px solid #000 !important;
          padding: 4px !important;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .box-signature-label {
          text-align: center;
          border: 1px solid #000 !important;
          font-weight: bold;
          padding: 3px !important;
          font-size: 10px;
        }

        .main-data-table {
          width: 100%;
          border-collapse: collapse !important;
          font-size: 10.5px;
        }

        .main-data-table thead {
          display: table-row-group !important; /* Mencegah duplikasi header di halaman berikutnya */
        }

        .main-data-table th,
        .main-data-table td {
          border: 1px solid #000 !important;
          padding: 4px 6px !important;
          vertical-align: middle;
        }

        .main-data-table th {
          background-color: #f2f2f2 !important;
          font-weight: bold;
          text-transform: uppercase;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .main-data-table tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      `}</style>

      {/* Header Dokumen Rekap */}
      <table className="header-table">
        <tbody>
          <tr>
            <td colSpan="3" style={{ verticalAlign: "middle" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>
                REKAP KARTU STOCK OPNAME
              </h4>
            </td>
            <td style={{ width: "30px" }}></td>
            <td rowSpan="3" className="box-signature">
              {picLabel}
            </td>
            <td rowSpan="3" className="box-signature">
              {auditorLabel}
            </td>
          </tr>
          <tr>
            <td style={{ width: "140px" }}>TGL STOCK OPNAME</td>
            <td style={{ width: "6px", textAlign: "center" }}>:</td>
            <td style={{ fontWeight: "bold" }}>{formatTgl(tglSoInput)}</td>
            <td></td>
          </tr>
          <tr>
            <td>TGL POSISI STOCK</td>
            <td style={{ textAlign: "center" }}>:</td>
            <td style={{ fontWeight: "bold" }}>{formatTgl(tglPosisiInput)}</td>
            <td></td>
          </tr>
          <tr>
            <td>JUMLAH KARTU STOCK</td>
            <td style={{ textAlign: "center" }}>:</td>
            <td style={{ fontWeight: "bold" }}>{rows.length} Lembar</td>
            <td></td>
            <td className="box-signature-label">Team Gud. Ban</td>
            <td className="box-signature-label">Team SO / Audit</td>
          </tr>
        </tbody>
      </table>

      {/* Data Table */}
      <table className="main-data-table">
        <thead>
          <tr style={{ textAlign: "center" }}>
            <th style={{ width: "5%" }}>No</th>
            <th style={{ width: "15%" }}>No. Document</th>
            <th style={{ width: "15%" }}>Item Code</th>
            <th style={{ textAlign: "left" }}>Description</th>
            <th style={{ width: "12%", textAlign: "right" }}>Qty</th>
            <th style={{ width: "15%" }}>Ket</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const qty = Number(row.qty || 0);
            return (
              <tr key={index}>
                <td style={{ textAlign: "center", fontFamily: "monospace" }}>
                  {index + 1}
                </td>
                <td style={{ textAlign: "center", fontFamily: "monospace" }}>
                  {row.nokso || "-"}
                </td>
                <td style={{ textAlign: "center", fontFamily: "monospace" }}>
                  {row.item || "-"}
                </td>
                <td style={{ textAlign: "left" }}>{row.deskripsi || "-"}</td>
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  }}
                >
                  {qty.toLocaleString("id-ID")}
                </td>
                <td></td>
              </tr>
            );
          })}
          <tr
            style={{
              fontWeight: "bold",
              backgroundColor: "#f2f2f2",
              WebkitPrintColorAdjust: "exact",
            }}
          >
            <td
              colSpan="4"
              style={{
                textAlign: "center",
                fontSize: "12px",
                letterSpacing: "1px",
              }}
            >
              TOTAL
            </td>
            <td
              style={{
                textAlign: "right",
                fontFamily: "monospace",
                fontSize: "13px",
                fontWeight: 900,
              }}
            >
              {totalQty.toLocaleString("id-ID")}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
