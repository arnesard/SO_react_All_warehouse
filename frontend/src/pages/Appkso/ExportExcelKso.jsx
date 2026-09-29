import { useState } from "react";
import XLSX from "xlsx-js-style";
import Swal from "sweetalert2";
import { Download, Loader2, X, Info } from "lucide-react";

export default function ExportExcelKso({
  open,
  onClose,
  warehouse,
  detailData,
}) {
  const [tglSo, setTglSo] = useState("");
  const [tglPosisi, setTglPosisi] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  if (!open) return null;

  const uniqueOperatorsCount = new Set(detailData.map((r) => r.opr)).size;

  const formatTglExport = (dateStr) => {
    if (!dateStr || !dateStr.includes("-")) return dateStr || "-";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y.slice(-2)}`;
  };

  const sanitizeSheetName = (name) => {
    return String(name || "SHEET")
      .replace(/[:\\/?*[\]]/g, "")
      .substring(0, 31)
      .trim();
  };

  // Helper definisi border cell
  const borderThin = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const borderMedium = {
    top: { style: "medium", color: { rgb: "000000" } },
    bottom: { style: "medium", color: { rgb: "000000" } },
    left: { style: "medium", color: { rgb: "000000" } },
    right: { style: "medium", color: { rgb: "000000" } },
  };

  const handleExport = (e) => {
    e.preventDefault();
    if (!detailData || detailData.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Data Kosong",
        text: "Tidak ada rekaman data APPKSO untuk di-export!",
        background: "var(--surface)",
      });
      return;
    }

    setIsExporting(true);

    setTimeout(() => {
      try {
        const displayTglSo = formatTglExport(tglSo);
        const displayTglPos = formatTglExport(tglPosisi);

        // Kelompokkan per operator (OPR)
        const operatorMap = {};
        detailData.forEach((row) => {
          const code = String(row.opr || "UNKNOWN").trim();
          if (!operatorMap[code]) {
            operatorMap[code] = {
              oprname: row.oprname ?? "Tanpa Nama",
              rows: [],
            };
          }
          operatorMap[code].rows.push(row);
        });

        const sortedOprKeys = Object.keys(operatorMap).sort((a, b) =>
          operatorMap[a].oprname
            .toLowerCase()
            .localeCompare(operatorMap[b].oprname.toLowerCase(), undefined, {
              sensitivity: "base",
            }),
        );

        const wb = XLSX.utils.book_new();

        sortedOprKeys.forEach((oprCode) => {
          const opr = operatorMap[oprCode];
          const oprName = opr.oprname;
          const rows = opr.rows;

          // Ambil nama auditor unik
          const uniqueAuditors = [
            ...new Set(
              rows
                .filter((r) => r.auditor_nama && r.auditor_nama !== "-")
                .map((r) => r.auditor_nama.trim()),
            ),
          ];
          const auditorNamaExcel =
            uniqueAuditors.length > 0
              ? uniqueAuditors.join(", ").toUpperCase()
              : "-";

          // Urutkan nomor dokumen
          rows.sort((a, b) =>
            String(a.nokso || "").localeCompare(
              String(b.nokso || ""),
              undefined,
              {
                numeric: true,
                sensitivity: "base",
              },
            ),
          );

          const ws = {};

          // Set lebar kolom pas
          ws["!cols"] = [
            { wch: 6 }, // A (NO)
            { wch: 18 }, // B (NO. DOCUMENT)
            { wch: 18 }, // C (ITEM CODE)
            { wch: 42 }, // D (DESCRIPTION)
            { wch: 14 }, // E (QTY)
            { wch: 22 }, // F (KET)
          ];

          // 1. Judul (Row 1)
          ws["A1"] = {
            v: "REKAP KARTU STOCK OPNAME",
            t: "s",
            s: {
              font: { name: "Arial", sz: 16, bold: true },
              alignment: { vertical: "center", horizontal: "left" },
            },
          };

          // 2. Baris Header Dokumen (Row 2, 3, 4)
          // Row 2: TGL SO + Nama PIC & Auditor (Merged D2:D3 & E2:F3)
          ws["A2"] = {
            v: "TGL STOCK OPNAME",
            t: "s",
            s: { font: { name: "Arial", sz: 10 } },
          };
          ws["C2"] = {
            v: `: ${displayTglSo}`,
            t: "s",
            s: { font: { name: "Arial", sz: 10, bold: true } },
          };

          ws["D2"] = {
            v: oprName.toUpperCase(),
            t: "s",
            s: {
              font: { name: "Arial", sz: 11, bold: true },
              alignment: {
                vertical: "center",
                horizontal: "center",
                wrapText: true,
              },
              border: borderThin,
            },
          };
          ws["E2"] = {
            v: auditorNamaExcel,
            t: "s",
            s: {
              font: { name: "Arial", sz: 11, bold: true },
              alignment: {
                vertical: "center",
                horizontal: "center",
                wrapText: true,
              },
              border: borderThin,
            },
          };
          ws["F2"] = { v: "", t: "s", s: { border: borderThin } };

          // Row 3: TGL Posisi + Sambungan Border Kotak Tanda Tangan
          ws["A3"] = {
            v: "TGL POSISI STOCK",
            t: "s",
            s: { font: { name: "Arial", sz: 10 } },
          };
          ws["C3"] = {
            v: `: ${displayTglPos}`,
            t: "s",
            s: { font: { name: "Arial", sz: 10, bold: true } },
          };
          ws["D3"] = { v: "", t: "s", s: { border: borderThin } };
          ws["E3"] = { v: "", t: "s", s: { border: borderThin } };
          ws["F3"] = { v: "", t: "s", s: { border: borderThin } };

          // Row 4: Jumlah Kartu + Label Team Gudang & Team SO
          ws["A4"] = {
            v: "JUMLAH KARTU STOCK",
            t: "s",
            s: { font: { name: "Arial", sz: 10 } },
          };
          ws["C4"] = {
            v: `: ${rows.length} Lembar`,
            t: "s",
            s: { font: { name: "Arial", sz: 10, bold: true } },
          };

          ws["D4"] = {
            v: "Team Gud. Ban",
            t: "s",
            s: {
              font: { name: "Arial", sz: 10 },
              alignment: { vertical: "center", horizontal: "center" },
              border: borderThin,
            },
          };
          ws["E4"] = {
            v: "Team SO / Audit",
            t: "s",
            s: {
              font: { name: "Arial", sz: 10 },
              alignment: { vertical: "center", horizontal: "center" },
              border: borderThin,
            },
          };
          ws["F4"] = { v: "", t: "s", s: { border: borderThin } };

          // 3. Header Tabel (Row 6)
          const headers = [
            { col: "A", label: "NO", align: "center" },
            { col: "B", label: "NO. DOCUMENT", align: "center" },
            { col: "C", label: "ITEM CODE", align: "center" },
            { col: "D", label: "DESCRIPTION", align: "left" },
            { col: "E", label: "QTY", align: "right" },
            { col: "F", label: "KET", align: "center" },
          ];

          headers.forEach((h) => {
            ws[`${h.col}6`] = {
              v: h.label,
              t: "s",
              s: {
                fill: { fgColor: { rgb: "1A1A1A" } },
                font: {
                  name: "Arial",
                  sz: 10,
                  bold: true,
                  color: { rgb: "FFFFFF" },
                },
                alignment: { vertical: "center", horizontal: h.align },
                border: borderMedium,
              },
            };
          });

          // 4. Data Rows (Mulai Row 7)
          let totalQty = 0;
          const startRow = 7;

          rows.forEach((row, idx) => {
            const rNum = startRow + idx;
            const qty = Number(row.qty || 0);
            totalQty += qty;
            const rowBg = idx % 2 === 0 ? "FFFFFF" : "F9F9F9";

            ws[`A${rNum}`] = {
              v: idx + 1,
              t: "n",
              s: {
                font: { name: "Arial", sz: 10 },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { fgColor: { rgb: rowBg } },
                border: borderThin,
              },
            };

            ws[`B${rNum}`] = {
              v: row.nokso || "-",
              t: "s",
              s: {
                font: { name: "Arial", sz: 10 },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { fgColor: { rgb: rowBg } },
                border: borderThin,
              },
            };

            ws[`C${rNum}`] = {
              v: row.item || "-",
              t: "s",
              s: {
                font: { name: "Arial", sz: 10 },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { fgColor: { rgb: rowBg } },
                border: borderThin,
              },
            };

            ws[`D${rNum}`] = {
              v: row.deskripsi || "-",
              t: "s",
              s: {
                font: { name: "Arial", sz: 10 },
                alignment: { horizontal: "left", vertical: "center" },
                fill: { fgColor: { rgb: rowBg } },
                border: borderThin,
              },
            };

            ws[`E${rNum}`] = {
              v: qty,
              t: "n",
              z: "#,##0",
              s: {
                font: { name: "Arial", sz: 10, bold: true },
                alignment: { horizontal: "right", vertical: "center" },
                fill: { fgColor: { rgb: rowBg } },
                border: borderThin,
              },
            };

            ws[`F${rNum}`] = {
              v: "",
              t: "s",
              s: {
                fill: { fgColor: { rgb: rowBg } },
                border: borderThin,
              },
            };
          });

          // 5. Total Row
          const totalRow = startRow + rows.length;

          ws[`A${totalRow}`] = {
            v: "TOTAL",
            t: "s",
            s: {
              fill: { fgColor: { rgb: "F2F2F2" } },
              font: { name: "Arial", sz: 12, bold: true },
              alignment: { horizontal: "center", vertical: "center" },
              border: borderMedium,
            },
          };
          ws[`B${totalRow}`] = {
            v: "",
            t: "s",
            s: { fill: { fgColor: { rgb: "F2F2F2" } }, border: borderMedium },
          };
          ws[`C${totalRow}`] = {
            v: "",
            t: "s",
            s: { fill: { fgColor: { rgb: "F2F2F2" } }, border: borderMedium },
          };
          ws[`D${totalRow}`] = {
            v: "",
            t: "s",
            s: { fill: { fgColor: { rgb: "F2F2F2" } }, border: borderMedium },
          };

          ws[`E${totalRow}`] = {
            v: totalQty,
            t: "n",
            z: "#,##0",
            s: {
              fill: { fgColor: { rgb: "F2F2F2" } },
              font: { name: "Arial", sz: 13, bold: true },
              alignment: { horizontal: "right", vertical: "center" },
              border: borderMedium,
            },
          };

          ws[`F${totalRow}`] = {
            v: "",
            t: "s",
            s: {
              fill: { fgColor: { rgb: "F2F2F2" } },
              border: borderMedium,
            },
          };

          // Definisi Penggabungan Sel (Merges)
          ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // A1:D1
            { s: { r: 1, c: 3 }, e: { r: 2, c: 3 } }, // D2:D3 (Kotak PIC)
            { s: { r: 1, c: 4 }, e: { r: 2, c: 5 } }, // E2:F3 (Kotak Auditor)
            { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } }, // E4:F4 (Label Team SO)
            { s: { r: totalRow - 1, c: 0 }, e: { r: totalRow - 1, c: 3 } }, // A:D Total Row
          ];

          // Rentang lembar kerja
          ws["!ref"] = `A1:F${totalRow}`;

          // FREEZE PANE ROW 6 (Header tetap diam saat discroll)
          ws["!views"] = [
            {
              state: "frozen",
              ySplit: 6,
              topLeftCell: "A7",
              activeCell: "A7",
            },
          ];

          // Tambah sheet ke workbook
          let sName = sanitizeSheetName(oprName);
          let counter = 2;
          while (wb.SheetNames.includes(sName)) {
            sName = sanitizeSheetName(
              `${oprName.substring(0, 27)}_${counter++}`,
            );
          }
          XLSX.utils.book_append_sheet(wb, ws, sName);
        });

        // Trigger Download
        const timestamp = new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "");
        const fileName = `APPKSO_${warehouse}_${timestamp}.xlsx`;
        XLSX.writeFile(wb, fileName);

        Swal.fire({
          icon: "success",
          title: "Export Sukses! 🎉",
          html: `File <strong>${fileName}</strong> berhasil di-download!<br>Total: <strong>${sortedOprKeys.length} sheet</strong> operator.`,
          background: "var(--surface)",
        });
        onClose();
      } catch (err) {
        console.error("Export Excel error:", err);
        Swal.fire({
          icon: "error",
          title: "Export Gagal",
          text: err.message,
          background: "var(--surface)",
        });
      } finally {
        setIsExporting(false);
      }
    }, 200);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "480px",
          background: "var(--surface)",
          borderRadius: "14px",
          border: "1.5px solid #fe6807",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            backgroundColor: "#fe6807",
            color: "#fff",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 800 }}>
            SETUP EXPORT EXCEL — REKAP APPKSO
          </div>
          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
            }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleExport} style={{ padding: "16px" }}>
          <div
            style={{
              backgroundColor: "rgba(14, 165, 233, 0.1)",
              border: "1px solid rgba(14, 165, 233, 0.4)",
              borderRadius: "8px",
              padding: "10px",
              fontSize: "11px",
              color: "var(--text-primary)",
              marginBottom: "14px",
              display: "flex",
              gap: "8px",
              alignItems: "flex-start",
            }}
          >
            <Info
              size={16}
              color="#0ea5e9"
              style={{ flexShrink: 0, marginTop: "2px" }}
            />
            <div>
              File Excel akan dibuat otomatis dengan{" "}
              <strong>1 sheet per operator</strong>.<br />
              Nama sheet = nama PIC, isi = rekap kartu SO persis seperti Print
              Rekap.
            </div>
          </div>

          <div
            style={{
              padding: "8px",
              border: "1px solid rgba(254, 104, 7, 0.5)",
              borderRadius: "8px",
              textAlign: "center",
              marginBottom: "14px",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            Total Sheet yang akan dibuat:{" "}
            <span style={{ color: "#ef4444", fontSize: "13px" }}>
              {uniqueOperatorsCount} Sheet
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                TGL STOCK OPNAME
              </label>
              <input
                type="date"
                required
                className="field-input"
                style={{
                  width: "100%",
                  height: "32px",
                  fontSize: "11px",
                  borderRadius: "6px",
                }}
                value={tglSo}
                onChange={(e) => setTglSo(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                TGL POSISI STOCK
              </label>
              <input
                type="date"
                required
                className="field-input"
                style={{
                  width: "100%",
                  height: "32px",
                  fontSize: "11px",
                  borderRadius: "6px",
                }}
                value={tglPosisi}
                onChange={(e) => setTglPosisi(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
          >
            <button
              type="button"
              className="btn-ctrl"
              style={{
                height: "32px",
                padding: "0 14px",
                borderRadius: "16px",
                fontSize: "11px",
              }}
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-ctrl primary"
              style={{
                height: "32px",
                padding: "0 16px",
                borderRadius: "16px",
                backgroundColor: "#fe6807",
                borderColor: "#fe6807",
                color: "#fff",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 size={14} className="spin" />
              ) : (
                <Download size={14} />
              )}
              Generate & Download Excel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
