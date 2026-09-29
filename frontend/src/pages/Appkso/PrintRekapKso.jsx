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

        /* Container KOP Atas */
        .kop-container {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        /* Tabel Keterangan Dokumen (Sisi Kiri) */
        .info-table {
          border-collapse: collapse;
          border: none !important;
        }

        .info-table td {
          border: none !important;
          padding: 2.5px 4px;
          font-size: 11px;
        }

        /* Tabel Kotak Tanda Tangan (Sisi Kanan) - PERSIS LARAVEL */
        .signature-table {
          width: 380px;
          border-collapse: collapse !important;
          border: 1.5px solid #000 !important;
        }

        .signature-table td {
          border: 1.5px solid #000 !important;
        }

        .box-signature-top {
          width: 190px;
          height: 64px;
          vertical-align: bottom !important;
          text-align: center;
          padding: 4px !important;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .box-signature-bottom {
          text-align: center;
          font-weight: bold;
          padding: 4px !important;
          font-size: 10.5px;
          background-color: #fff;
        }

        /* Tabel Data Utama */
        .main-data-table {
          width: 100%;
          border-collapse: collapse !important;
          border: 1.5px solid #000 !important;
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
          background-color: #fff !important;
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

      {/* Header Dokumen Rekap: Kiri Info, Kanan Kotak Tanda Tangan */}
      <div className="kop-container">
        {/* Sisi Kiri */}
        <div>
          <h4
            style={{
              fontSize: "15px",
              fontWeight: "900",
              margin: "0 0 6px 0",
              letterSpacing: "0.5px",
            }}
          >
            REKAP KARTU STOCK OPNAME
          </h4>
          <table className="info-table">
            <tbody>
              <tr>
                <td style={{ width: "150px" }}>TGL STOCK OPNAME</td>
                <td style={{ width: "6px", textAlign: "center" }}>:</td>
                <td style={{ fontWeight: "bold" }}>{formatTgl(tglSoInput)}</td>
              </tr>
              <tr>
                <td>TGL POSISI STOCK</td>
                <td style={{ textAlign: "center" }}>:</td>
                <td style={{ fontWeight: "bold" }}>
                  {formatTgl(tglPosisiInput)}
                </td>
              </tr>
              <tr>
                <td>JUMLAH KARTU STOCK</td>
                <td style={{ textAlign: "center" }}>:</td>
                <td style={{ fontWeight: "bold" }}>{rows.length} Lembar</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sisi Kanan: Kotak Tanda Tangan (Bergaris Nyata) */}
        <div>
          <table className="signature-table">
            <tbody>
              <tr>
                <td className="box-signature-top">{picLabel}</td>
                <td className="box-signature-top">{auditorLabel}</td>
              </tr>
              <tr>
                <td className="box-signature-bottom">Team Gud. Ban</td>
                <td className="box-signature-bottom">Team SO / Audit</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Table */}
      <table className="main-data-table">
        <thead>
          <tr style={{ textAlign: "center" }}>
            <th style={{ width: "5%" }}>NO</th>
            <th style={{ width: "15%" }}>NO. DOCUMENT</th>
            <th style={{ width: "15%" }}>ITEM CODE</th>
            <th style={{ textAlign: "left" }}>DESCRIPTION</th>
            <th style={{ width: "12%", textAlign: "right" }}>QTY</th>
            <th style={{ width: "15%" }}>KET</th>
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
              backgroundColor: "#fff",
              WebkitPrintColorAdjust: "exact",
            }}
          >
            <td
              colSpan="4"
              style={{
                textAlign: "center",
                fontSize: "11px",
                fontWeight: "900",
                letterSpacing: "1px",
              }}
            >
              TOTAL
            </td>
            <td
              style={{
                textAlign: "right",
                fontFamily: "monospace",
                fontSize: "12.5px",
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
