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

  const renderDigitRow = (digitValue) => {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "280px",
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
                fontSize: "9px",
              }}
            >
              {isSelected ? (
                <div
                  style={{
                    position: "absolute",
                    width: "15px",
                    height: "15px",
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
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          fontFamily: "'Times New Roman', Times, serif",
          border: "none",
        }}
      >
        <tbody>
          <tr>
            <td
              colSpan="6"
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "18px",
                position: "relative",
                paddingBottom: "4px",
              }}
            >
              KARTU STOCK OPNAME
              <p style={{ fontSize: "12px", margin: 0, fontWeight: "normal" }}>
                TANGGAL : {tglManual || "-"}
              </p>
              <p style={{ fontSize: "20px", paddingTop: "6px", margin: 0 }}>
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
                  <div style={{ fontSize: "10px" }}>KODE DOKUMEN & NO. DOC</div>
                  <Barcode
                    value={String(t.nokso || "")}
                    width={1.2}
                    height={30}
                    fontSize={11}
                    displayValue={true}
                    margin={0}
                  />
                </div>
              )}
            </td>
          </tr>

          <tr>
            <td colSpan="4">PT GAJAH TUNGGAL Tbk</td>
            <td style={{ whiteSpace: "nowrap" }}>BARANG MILIK PLANT</td>
            <td>
              <span
                style={{
                  borderBottom: "1px solid #000",
                  paddingBottom: "1px",
                  marginLeft: "20px",
                }}
              >
                : <b>{plantCode}</b>
              </span>
            </td>
          </tr>

          <tr>
            <td
              colSpan="4"
              style={{
                fontWeight: "bold",
                fontSize: "16px",
                verticalAlign: "top",
              }}
            >
              {t.deskripsi || "-"}
            </td>
            <td>NO. DOCUMENT</td>
            <td>
              <span
                style={{
                  borderBottom: "1px solid #000",
                  paddingBottom: "1px",
                  marginLeft: "20px",
                }}
              >
                : <b>{t.nokso || "-"}</b>
              </span>
            </td>
          </tr>

          <tr>
            <td colSpan="4" style={{ padding: "4px 0" }}>
              {isTopHalf ? (
                <Barcode
                  value={String(t.item || "")}
                  width={1.2}
                  height={32}
                  displayValue={false}
                  margin={0}
                />
              ) : (
                <div style={{ height: "32px" }}></div>
              )}
            </td>
            <td>NO. INDEX</td>
            <td>
              <span
                style={{
                  borderBottom: "1px solid #000",
                  paddingBottom: "1px",
                  marginLeft: "20px",
                }}
              >
                :&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </span>
            </td>
          </tr>

          <tr>
            <td colSpan="4" style={{ fontWeight: "bold", fontSize: "11px" }}>
              {t.item || "-"}
            </td>
            <td colSpan="2" style={{ textAlign: "center", fontWeight: "bold" }}>
              LINE NUMBER
            </td>
          </tr>

          <tr>
            <td style={{ width: "70px" }}>GRADE</td>
            <td>
              : <b>{gradeStr}</b>
            </td>
            <td colSpan="2">
              PLANT : <b>{plantCode}</b>
            </td>
            <td colSpan="2">{renderDigitRow(pRibu)}</td>
          </tr>

          <tr>
            <td>JENIS</td>
            <td colSpan="3">:</td>
            <td colSpan="2">{renderDigitRow(ribu)}</td>
          </tr>

          <tr>
            <td>UKURAN</td>
            <td colSpan="3">
              : <b>{t.deskripsi || "-"}</b>
            </td>
            <td colSpan="2">{renderDigitRow(ratus)}</td>
          </tr>

          <tr>
            <td>CODE</td>
            <td colSpan="3">
              : <b>{t.item || "-"}</b>
            </td>
            <td colSpan="2">{renderDigitRow(puluh)}</td>
          </tr>

          <tr>
            <td>JUMLAH</td>
            <td colSpan="3" style={{ whiteSpace: "nowrap" }}>
              : <b>{Number(t.qty || 0).toLocaleString("id-ID")} PCS</b>
            </td>
            <td colSpan="2">{renderDigitRow(sat)}</td>
          </tr>

          <tr style={{ borderBottom: "2px solid #000" }}>
            <td colSpan="4" style={{ paddingBottom: "4px" }}></td>
            <td
              colSpan="2"
              style={{ textAlign: "center", paddingBottom: "4px" }}
            >
              {isTopHalf ? "LEMBAR UNTUK GUDANG" : "LEMBAR UNTUK ARSIP"}
            </td>
          </tr>

          <tr>
            <td colSpan="2" style={{ textAlign: "center", paddingTop: "12px" }}>
              DIHITUNG OLEH
            </td>
            <td colSpan="2"></td>
            <td colSpan="2" style={{ textAlign: "center", paddingTop: "12px" }}>
              DIPERIKSA OLEH
            </td>
          </tr>

          <tr>
            <td colSpan="2" style={{ height: "40px" }}></td>
            <td colSpan="2"></td>
            <td colSpan="2"></td>
          </tr>

          <tr>
            <td colSpan="2" style={{ textAlign: "center" }}>
              <b>{t.oprname || "-"}</b>
            </td>
            <td colSpan="2"></td>
            <td colSpan="2" style={{ textAlign: "center" }}>
              <b>{auditorLabel}</b>
            </td>
          </tr>

          <tr>
            <td colSpan="2" style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "80%",
                  margin: "0 auto",
                  borderTop: "2px solid #000",
                  fontSize: "11px",
                }}
              >
                GUDANG BAN
              </div>
            </td>
            <td colSpan="2"></td>
            <td colSpan="2" style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "70%",
                  margin: "0 auto",
                  borderTop: "2px solid #000",
                  fontSize: "11px",
                }}
              >
                TEAM S.O. / AUDITOR
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm 6mm;
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
        }

        .kso-page {
          width: 198mm !important;
          min-height: 280mm !important;
          margin: 0 auto !important;
          break-after: page;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
        }

        .scissors-line {
          width: 100%;
          border-top: 1.5px dashed #000;
          margin: 12px 0;
          position: relative;
          text-align: center;
        }

        .scissors-icon {
          position: absolute;
          top: -10px;
          left: 10px;
          background: #fff;
          padding: 0 4px;
          font-size: 14px;
        }
      `}</style>

      {cards.map((card, idx) => (
        <div key={idx} className="kso-page">
          {/* Bagian Atas: Lembar Gudang */}
          <div>{renderHalfCard(card, true)}</div>

          {/* Garis Potong Gunting Pemisah */}
          <div className="scissors-line">
            <span className="scissors-icon">
              ✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              - - - - - - - - -
            </span>
          </div>

          {/* Bagian Bawah: Lembar Arsip */}
          <div>{renderHalfCard(card, false)}</div>
        </div>
      ))}
    </div>
  );
}
