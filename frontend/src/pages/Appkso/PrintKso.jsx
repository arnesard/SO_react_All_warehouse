import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Barcode from "react-barcode";

const API_BASE = "http://localhost:8010/api/appkso";

export default function PrintKso() {
  const [searchParams] = useSearchParams();
  const warehouse = searchParams.get("warehouse") || "";
  const picCode = searchParams.get("pic") || "";
  const docFrom = searchParams.get("doc_from") || "";
  const docTo = searchParams.get("doc_to") || "";
  const tglInputRaw = searchParams.get("tanggal") || "";

  const [cards, setCards] = useState([]);
  const [tglManual, setTglManual] = useState("");
  const [loading, setLoading] = useState(true);
  const hasPrintedRef = useRef(false);

  const plantMap = { APW: "A", BPW: "B", DPW: "D", RPW: "R" };
  const plantCode = plantMap[warehouse] || "B";

  useEffect(() => {
    if (tglInputRaw) {
      const [tahun, bulan, tanggal] = tglInputRaw.split("-");
      const bulanNama = [
        "JANUARI",
        "FEBRUARI",
        "MARET",
        "APRIL",
        "MEI",
        "JUNI",
        "JULI",
        "AGUSTUS",
        "SEPTEMBER",
        "OKTOBER",
        "NOVEMBER",
        "DESEMBER",
      ];
      setTglManual(
        `${parseInt(tanggal, 10)} / ${bulanNama[parseInt(bulan, 10) - 1]} / ${tahun}`,
      );
    }
  }, [tglInputRaw]);

  useEffect(() => {
    async function loadData() {
      if (!warehouse || !picCode) return;
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE}/data?warehouse=${encodeURIComponent(warehouse)}`,
        );
        const json = await res.json();
        const baseRows = json.detail || [];

        const matched = baseRows.filter(
          (row) =>
            String(row.opr || "").trim() === picCode.trim() &&
            row.nokso >= docFrom &&
            row.nokso <= docTo,
        );

        matched.sort((a, b) =>
          String(a.nokso).localeCompare(String(b.nokso), undefined, {
            numeric: true,
          }),
        );

        setCards(matched);
      } catch (err) {
        console.error("Gagal load kartu KSO:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [warehouse, picCode, docFrom, docTo]);

  useEffect(() => {
    if (!loading && cards.length > 0 && !hasPrintedRef.current) {
      hasPrintedRef.current = true;
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, cards]);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "50px",
          fontFamily: "sans-serif",
        }}
      >
        Merender kartu fisik KSO...
      </div>
    );
  }

  // Baris lingkaran angka 1 2 3 4 5 6 7 8 9 0
  const renderDigitRow = (digitValue) => {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "300px",
        }}
      >
        {digits.map((d) => {
          const isSelected =
            digitValue !== null && parseInt(digitValue, 10) === d;
          return (
            <div
              key={d}
              style={{
                position: "relative",
                width: "15px",
                height: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Arial, sans-serif",
                fontWeight: "bold",
                fontSize: "10px",
              }}
            >
              {isSelected ? (
                <div
                  style={{
                    position: "absolute",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    border: "1.5px solid #000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                  }}
                >
                  <span style={{ color: "#000" }}>{d}</span>
                </div>
              ) : (
                <span style={{ color: "#000" }}>{d}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderHalfCard = (t, isTopHalf) => {
    const qtyStr = String(t.qty || "0");
    const len = qtyStr.length;
    const getDigit = (idx) =>
      len - idx >= 0 ? parseInt(qtyStr[len - idx], 10) : null;

    const pRibu = getDigit(5);
    const ribu = getDigit(4);
    const ratus = getDigit(3);
    const puluh = getDigit(2);
    const sat = getDigit(1);

    const gradeStr = String(t.item || "").endsWith("0") ? "OE" : "OK";
    const auditorLabel =
      t.auditor_nama && t.auditor_nama !== "-"
        ? t.auditor_nama.trim()
        : "..........";

    return (
      <div className="card-half">
        <table
          className="kso-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            fontFamily: "'Times New Roman', Times, serif",
            border: "none",
          }}
        >
          <tbody>
            {/* Header Judul & Barcode Dokumen Kanan Atas */}
            <tr>
              <td
                colSpan="6"
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "18px",
                  position: "relative",
                  padding: "0 0 1px 0",
                }}
              >
                KARTU STOCK OPNAME
                <p
                  style={{
                    fontSize: "11px",
                    margin: "1px 0 0 0",
                    fontWeight: "normal",
                  }}
                >
                  TANGGAL : {tglManual}
                </p>
                <p
                  style={{
                    fontSize: "20px",
                    paddingTop: "3px",
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {gradeStr}
                </p>
                {isTopHalf && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "10px", fontWeight: "normal" }}>
                      KODE DOKUMEN & NO. DOC
                    </div>
                    <div style={{ marginTop: "1px" }}>
                      <Barcode
                        value={String(t.nokso || "")}
                        format="CODE39"
                        width={1.25}
                        height={26}
                        displayValue={false}
                        margin={0}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "10.5px",
                        fontWeight: "normal",
                        marginTop: "1px",
                      }}
                    >
                      {t.nokso}
                    </div>
                  </div>
                )}
              </td>
            </tr>

            {/* Baris PT Gajah Tunggal & Barang Milik Plant */}
            <tr>
              <td colSpan="4" style={{ padding: "1px 0" }}>
                PT GAJAH TUNGGAL Tbk
              </td>
              <td
                style={{
                  whiteSpace: "nowrap",
                  padding: "1px 0",
                  width: "165px",
                }}
              >
                BARANG MILIK PLANT
              </td>
              <td style={{ padding: "1px 0", width: "135px" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "125px",
                    borderBottom: "1.5px solid #000",
                    paddingBottom: "1px",
                  }}
                >
                  :&nbsp;<b>{plantCode}</b>
                </span>
              </td>
            </tr>

            {/* Baris Deskripsi Tebal & No. Document */}
            <tr>
              <td
                colSpan="4"
                style={{
                  fontWeight: "bold",
                  fontSize: "16px",
                  verticalAlign: "top",
                  padding: "1px 0",
                }}
              >
                <b>{t.deskripsi || "-"}</b>
              </td>
              <td style={{ verticalAlign: "top", padding: "1px 0" }}>
                NO. DOCUMENT
              </td>
              <td style={{ verticalAlign: "top", padding: "1px 0" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "125px",
                    borderBottom: "1.5px solid #000",
                    paddingBottom: "1px",
                  }}
                >
                  :&nbsp;<b>{t.nokso}</b>
                </span>
              </td>
            </tr>

            {/* Baris Barcode Item & No. Index */}
            <tr>
              <td colSpan="4" style={{ padding: "1px 0" }}>
                {isTopHalf ? (
                  <Barcode
                    value={String(t.item || "")}
                    format="CODE39"
                    width={1.3}
                    height={38}
                    displayValue={false}
                    margin={0}
                  />
                ) : (
                  <div style={{ height: "38px" }}></div>
                )}
              </td>
              <td style={{ verticalAlign: "top", padding: "1px 0" }}>
                NO. INDEX
              </td>
              <td style={{ verticalAlign: "top", padding: "1px 0" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "125px",
                    borderBottom: "1.5px solid #000",
                    paddingBottom: "1px",
                  }}
                >
                  :
                </span>
              </td>
            </tr>

            {/* Baris Kode Item Kecil & Line Number Header */}
            <tr>
              <td
                colSpan="4"
                style={{
                  fontWeight: "bold",
                  fontSize: "10px",
                  padding: "1px 0 2px 0",
                }}
              >
                {t.item}
              </td>
              <td
                colSpan="2"
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "11px",
                  padding: "1px 0 2px 0",
                }}
              >
                LINE NUMBER
              </td>
            </tr>

            {/* Baris Grade & Puluhan Ribu */}
            <tr>
              <td style={{ width: "65px", padding: "1px 0" }}>GRADE</td>
              <td style={{ width: "55px", padding: "1px 0" }}>
                :&nbsp;<b>{gradeStr}</b>
              </td>
              <td colSpan="2" style={{ padding: "1px 0" }}>
                PLANT :&nbsp;<b>{plantCode}</b>
              </td>
              <td colSpan="2" style={{ padding: "1px 0", textAlign: "center" }}>
                <div style={{ display: "inline-block" }}>
                  {renderDigitRow(pRibu)}
                </div>
              </td>
            </tr>

            {/* Baris Jenis & Ribuan */}
            <tr>
              <td style={{ padding: "1px 0" }}>JENIS</td>
              <td colSpan="3" style={{ padding: "1px 0" }}>
                :
              </td>
              <td colSpan="2" style={{ padding: "1px 0", textAlign: "center" }}>
                <div style={{ display: "inline-block" }}>
                  {renderDigitRow(ribu)}
                </div>
              </td>
            </tr>

            {/* Baris Ukuran & Ratusan */}
            <tr>
              <td style={{ padding: "1px 0" }}>UKURAN</td>
              <td colSpan="3" style={{ padding: "1px 0" }}>
                :&nbsp;<b>{t.deskripsi || "-"}</b>
              </td>
              <td colSpan="2" style={{ padding: "1px 0", textAlign: "center" }}>
                <div style={{ display: "inline-block" }}>
                  {renderDigitRow(ratus)}
                </div>
              </td>
            </tr>

            {/* Baris Code & Puluhan */}
            <tr>
              <td style={{ padding: "1px 0" }}>CODE</td>
              <td colSpan="3" style={{ padding: "1px 0" }}>
                :&nbsp;<b>{t.item}</b>
              </td>
              <td colSpan="2" style={{ padding: "1px 0", textAlign: "center" }}>
                <div style={{ display: "inline-block" }}>
                  {renderDigitRow(puluh)}
                </div>
              </td>
            </tr>

            {/* Baris Jumlah & Satuan + Barcode Qty */}
            <tr>
              <td style={{ padding: "1px 0" }}>JUMLAH</td>
              <td
                colSpan="3"
                style={{ padding: "1px 0", whiteSpace: "nowrap" }}
              >
                :&nbsp;<b>{Number(t.qty || 0).toLocaleString("id-ID")} PCS</b>
                {isTopHalf && (
                  <span
                    style={{
                      display: "inline-block",
                      verticalAlign: "middle",
                      marginLeft: "12px",
                    }}
                  >
                    <Barcode
                      value={String(t.qty || 0)}
                      format="CODE39"
                      width={1.2}
                      height={18}
                      displayValue={false}
                      margin={0}
                    />
                  </span>
                )}
              </td>
              <td colSpan="2" style={{ padding: "1px 0", textAlign: "center" }}>
                <div style={{ display: "inline-block" }}>
                  {renderDigitRow(sat)}
                </div>
              </td>
            </tr>

            {/* Garis Pemisah Hitam Tebal & Lembar Penerima */}
            <tr style={{ borderBottom: "2px solid #000" }}>
              <td colSpan="4" style={{ paddingBottom: "2px" }}></td>
              <td
                colSpan="2"
                style={{
                  textAlign: "center",
                  paddingBottom: "2px",
                  fontSize: "11px",
                }}
              >
                {isTopHalf ? "LEMBAR UNTUK GUDANG" : "LEMBAR UNTUK ARSIP"}
              </td>
            </tr>

            {/* Header Tanda Tangan */}
            <tr>
              <td
                colSpan="2"
                style={{
                  textAlign: "center",
                  paddingTop: "12px",
                  fontSize: "11px",
                }}
              >
                DIHITUNG OLEH
              </td>
              <td colSpan="2"></td>
              <td
                colSpan="2"
                style={{
                  textAlign: "center",
                  paddingTop: "12px",
                  fontSize: "11px",
                }}
              >
                DIPERIKSA OLEH
              </td>
            </tr>

            {/* Ruang Kosong Tanda Tangan */}
            <tr>
              <td colSpan="2" style={{ height: "36px" }}></td>
              <td colSpan="2"></td>
              <td colSpan="2"></td>
            </tr>

            {/* Nama PIC & Auditor */}
            <tr>
              <td colSpan="2" style={{ textAlign: "center", fontSize: "12px" }}>
                <b>{t.oprname || "-"}</b>
              </td>
              <td colSpan="2"></td>
              <td colSpan="2" style={{ textAlign: "center", fontSize: "12px" }}>
                <b>{auditorLabel}</b>
              </td>
            </tr>

            {/* Garis Bawah Jabatan */}
            <tr>
              <td
                colSpan="2"
                style={{ textAlign: "center", paddingTop: "1px" }}
              >
                <div
                  style={{
                    width: "70%",
                    margin: "0 auto",
                    borderTop: "2px solid #000",
                    fontSize: "11px",
                    paddingTop: "1px",
                  }}
                >
                  GUDANG BAN
                </div>
              </td>
              <td colSpan="2"></td>
              <td
                colSpan="2"
                style={{ textAlign: "center", paddingTop: "1px" }}
              >
                <div
                  style={{
                    width: "60%",
                    margin: "0 auto",
                    borderTop: "2px solid #000",
                    fontSize: "11px",
                    paddingTop: "1px",
                  }}
                >
                  TEAM S.O./AUDITOR
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0mm !important; /* Nolkan agar container mengunci ukuran 297mm persis */
        }

        *, *::before, *::after {
          box-sizing: border-box !important;
        }

        html, body {
          width: 210mm !important;
          background: #fff !important;
          color: #000 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Lembar A4 dikunci mutlak 297mm, pemisah gunting berada tepat di 50% */
        .kso-page {
          width: 210mm !important;
          height: 297mm !important;
          margin: 0 auto !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          align-items: center !important;
          page-break-after: always;
          break-after: page;
          box-sizing: border-box;
          padding: 6mm 10mm !important;
          position: relative;
        }

        /* Masing-masing kartu atas & bawah mengisi 135mm */
        .card-half {
          width: 100% !important;
          height: 136mm !important;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          overflow: hidden;
        }

        .kso-table td {
          border: none !important;
        }

       /* Garis Pemisah Gunting: Gunting di paling kiri, garis putus-putus ke kanan */
        .scissors-divider {
          width: 100%;
          height: 8mm;
          display: flex !important;
          align-items: center !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .scissors-icon-wrap {
          display: flex;
          align-items: center;
          padding-right: 6px; /* Jarak antara gunting dan awal garis putus-putus */
          flex-shrink: 0;
        }

        .scissors-icon-wrap svg {
          display: block;
          width: 22px;
          height: 22px;
          fill: #000;
        }

        .scissors-line {
          flex: 1; /* Garis otomatis ditarik dari kanan gunting sampai mentok ujung kanan */
          border-top: 1.5px dashed #000;
          height: 0;
        }
      `}</style>

      {cards.map((card, idx) => (
        <div key={idx} className="kso-page">
          {/* Bagian Atas: Lembar untuk Gudang */}
          {renderHalfCard(card, true)}

          {/* Garis Potong Gunting Pemisah: Ikon Gunting dulu, baru garis putus-putus ke kanan */}
          <div className="scissors-divider">
            <div className="scissors-icon-wrap">
              <svg viewBox="0 0 24 24">
                <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3h-3z" />
              </svg>
            </div>
            <div className="scissors-line"></div>
          </div>

          {/* Bagian Bawah: Lembar untuk Arsip */}
          {renderHalfCard(card, false)}
        </div>
      ))}
    </div>
  );
}
