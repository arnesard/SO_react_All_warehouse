import React from "react";
import XLSX from "xlsx-js-style";
import { FileSpreadsheet, Printer, X } from "lucide-react";

export default function ModalDetail({
  open,
  onClose,
  warehouse,
  pattern,
  grade,
  minusList = [],
  plusList = [],
  onItemClick,
}) {
  if (!open) return null;

  const totalMinusVar = minusList.reduce(
    (acc, curr) => acc + Number(curr.variance || 0),
    0,
  );
  const totalPlusVar = plusList.reduce(
    (acc, curr) => acc + Number(curr.variance || 0),
    0,
  );
  const totalGlobalVariance = totalPlusVar + totalMinusVar;
  const totalSkuDinamis = minusList.length + plusList.length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const borderThin = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };

    const maxRows = Math.max(minusList.length, plusList.length);
    const ws = {};
    ws["!cols"] = [
      { wch: 5 },
      { wch: 18 },
      { wch: 32 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 4 },
      { wch: 5 },
      { wch: 18 },
      { wch: 32 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
    ];

    ws["A1"] = {
      v: `Data Plus & Minus - PATTERN: ${grade} ${pattern}`,
      t: "s",
      s: { font: { bold: true, sz: 14 } },
    };

    ws["A3"] = {
      v: "DATA MINUS (-)",
      t: "s",
      s: {
        fill: { fgColor: { rgb: "DC3545" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center" },
      },
    };
    ws["H3"] = {
      v: "DATA PLUS (+)",
      t: "s",
      s: {
        fill: { fgColor: { rgb: "0D6EFD" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center" },
      },
    };

    const subHeaders = ["NO", "ITEM CODE", "DESCRIPTION", "BC", "ORA", "VAR"];
    subHeaders.forEach((sh, idx) => {
      const colL = String.fromCharCode(65 + idx);
      const colR = String.fromCharCode(72 + idx);
      ws[`${colL}4`] = {
        v: sh,
        t: "s",
        s: {
          font: { bold: true },
          border: borderThin,
          fill: { fgColor: { rgb: "F8F9FA" } },
          alignment: { horizontal: "center" },
        },
      };
      ws[`${colR}4`] = {
        v: sh,
        t: "s",
        s: {
          font: { bold: true },
          border: borderThin,
          fill: { fgColor: { rgb: "F8F9FA" } },
          alignment: { horizontal: "center" },
        },
      };
    });

    for (let i = 0; i < maxRows; i++) {
      const rowNum = 5 + i;
      const m = minusList[i];
      const p = plusList[i];

      if (m) {
        ws[`A${rowNum}`] = {
          v: i + 1,
          t: "n",
          s: { border: borderThin, alignment: { horizontal: "center" } },
        };
        ws[`B${rowNum}`] = { v: m.item, t: "s", s: { border: borderThin } };
        ws[`C${rowNum}`] = {
          v: m.description,
          t: "s",
          s: { border: borderThin },
        };
        ws[`D${rowNum}`] = {
          v: Number(m.qty_appkso),
          t: "n",
          s: { border: borderThin, alignment: { horizontal: "right" } },
        };
        ws[`E${rowNum}`] = {
          v: Number(m.qty_oracle),
          t: "n",
          s: { border: borderThin, alignment: { horizontal: "right" } },
        };
        ws[`F${rowNum}`] = {
          v: Number(m.variance),
          t: "n",
          s: { border: borderThin, alignment: { horizontal: "right" } },
        };
      }
      if (p) {
        ws[`H${rowNum}`] = {
          v: i + 1,
          t: "n",
          s: { border: borderThin, alignment: { horizontal: "center" } },
        };
        ws[`I${rowNum}`] = { v: p.item, t: "s", s: { border: borderThin } };
        ws[`J${rowNum}`] = {
          v: p.description,
          t: "s",
          s: { border: borderThin },
        };
        ws[`K${rowNum}`] = {
          v: Number(p.qty_appkso),
          t: "n",
          s: { border: borderThin, alignment: { horizontal: "right" } },
        };
        ws[`L${rowNum}`] = {
          v: Number(p.qty_oracle),
          t: "n",
          s: { border: borderThin, alignment: { horizontal: "right" } },
        };
        ws[`M${rowNum}`] = {
          v: Number(p.variance),
          t: "n",
          s: { border: borderThin, alignment: { horizontal: "right" } },
        };
      }
    }

    ws["!merges"] = [
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
      { s: { r: 2, c: 7 }, e: { r: 2, c: 12 } },
    ];
    ws["!ref"] = `A1:M${5 + maxRows}`;

    XLSX.utils.book_append_sheet(wb, ws, "Data Plus & Minus");
    XLSX.writeFile(wb, `Data_Plus_Minus_${pattern}.xlsx`);
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
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px",
      }}
    >
      <div
        style={{
          width: "96vw",
          height: "94vh",
          background: "#fff",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            backgroundColor: "#212529",
            color: "#fff",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h6 style={{ margin: 0, fontWeight: "bold", fontSize: "14px" }}>
            PATTERN:{" "}
            <span style={{ color: "#ffc107" }}>
              {grade} {pattern}
            </span>{" "}
            ({warehouse}) &nbsp;|&nbsp;{" "}
            {totalGlobalVariance.toLocaleString("id-ID")} Pcs dari{" "}
            {totalSkuDinamis} SKU &nbsp;|&nbsp;{" "}
            <span style={{ color: "#dc3545" }}>
              SKU Minus (-) {minusList.length}
            </span>{" "}
            &nbsp;&amp;&nbsp;{" "}
            <span style={{ color: "#0d6efd" }}>
              SKU Plus (+) {plusList.length}
            </span>
          </h6>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1"
              style={{ fontSize: "11px", padding: "4px 10px" }}
              onClick={handleExportExcel}
            >
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary fw-bold d-flex align-items-center gap-1"
              style={{ fontSize: "11px", padding: "4px 10px" }}
              onClick={handlePrint}
            >
              <Printer size={13} /> Print
            </button>
            <button
              type="button"
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: "2px",
                marginLeft: "8px",
              }}
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body Modal Kiri-Kanan */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <div className="row g-3">
            {/* DATA MINUS (-) */}
            <div className="col-12 col-xl-6">
              <div className="card border-danger shadow-sm h-100">
                <div className="card-header bg-danger text-white fw-bold d-flex justify-content-between align-items-center py-2 px-3">
                  <span>DATA MINUS (-) : {minusList.length} SKU</span>
                  <span
                    className="badge bg-white text-danger fw-bold"
                    style={{ fontSize: "13px" }}
                  >
                    TOTAL VAR: {totalMinusVar.toLocaleString("id-ID")} PCS
                  </span>
                </div>
                <div className="card-body p-0">
                  <div
                    className="table-responsive"
                    style={{ maxHeight: "75vh" }}
                  >
                    <table
                      className="table table-sm table-hover table-bordered mb-0 align-middle"
                      style={{ fontSize: "11px" }}
                    >
                      <thead className="bg-light sticky-top text-center">
                        <tr>
                          <th style={{ width: "5%" }}>NO</th>
                          <th style={{ width: "22%" }}>ITEM CODE</th>
                          <th>DESCRIPTION</th>
                          <th style={{ width: "12%", textAlign: "right" }}>
                            COUNTED
                          </th>
                          <th style={{ width: "12%", textAlign: "right" }}>
                            SNAPSHOT
                          </th>
                          <th style={{ width: "12%", textAlign: "right" }}>
                            VAR
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {minusList.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="text-center text-success fw-bold py-4"
                            >
                              Tidak ada data minus. Aman!
                            </td>
                          </tr>
                        ) : (
                          minusList.map((row, idx) => (
                            <tr
                              key={idx}
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                onItemClick && onItemClick(row.item)
                              }
                              title="Klik untuk lihat riwayat scan"
                            >
                              <td className="text-center text-muted">
                                {idx + 1}
                              </td>
                              <td className="fw-bold text-primary">
                                {row.item}
                              </td>
                              <td
                                className="text-truncate text-start"
                                style={{ maxWidth: "200px" }}
                              >
                                {row.description}
                              </td>
                              <td className="text-end fw-bold">
                                {Number(row.qty_appkso).toLocaleString("id-ID")}
                              </td>
                              <td className="text-end text-dark">
                                {Number(row.qty_oracle).toLocaleString("id-ID")}
                              </td>
                              <td className="text-end text-danger fw-bold">
                                {Number(row.variance).toLocaleString("id-ID")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* DATA PLUS (+) */}
            <div className="col-12 col-xl-6">
              <div className="card border-primary shadow-sm h-100">
                <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center py-2 px-3">
                  <span>DATA PLUS (+) : {plusList.length} SKU</span>
                  <span
                    className="badge bg-white text-primary fw-bold"
                    style={{ fontSize: "13px" }}
                  >
                    TOTAL VAR: +{totalPlusVar.toLocaleString("id-ID")} PCS
                  </span>
                </div>
                <div className="card-body p-0">
                  <div
                    className="table-responsive"
                    style={{ maxHeight: "75vh" }}
                  >
                    <table
                      className="table table-hover table-bordered table-sm mb-0 align-middle"
                      style={{ fontSize: "11px" }}
                    >
                      <thead className="bg-light sticky-top text-center">
                        <tr>
                          <th style={{ width: "5%" }}>NO</th>
                          <th style={{ width: "22%" }}>ITEM CODE</th>
                          <th>DESCRIPTION</th>
                          <th style={{ width: "12%", textAlign: "right" }}>
                            COUNTED
                          </th>
                          <th style={{ width: "12%", textAlign: "right" }}>
                            SNAPSHOT
                          </th>
                          <th style={{ width: "12%", textAlign: "right" }}>
                            VAR
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {plusList.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="text-center text-muted py-4"
                            >
                              Tidak ada data plus. Aman!
                            </td>
                          </tr>
                        ) : (
                          plusList.map((row, idx) => (
                            <tr
                              key={idx}
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                onItemClick && onItemClick(row.item)
                              }
                              title="Klik untuk lihat riwayat scan"
                            >
                              <td className="text-center text-muted">
                                {idx + 1}
                              </td>
                              <td className="fw-bold text-primary">
                                {row.item}
                              </td>
                              <td
                                className="text-truncate text-start"
                                style={{ maxWidth: "200px" }}
                              >
                                {row.description}
                              </td>
                              <td className="text-end fw-bold">
                                {Number(row.qty_appkso).toLocaleString("id-ID")}
                              </td>
                              <td className="text-end text-dark">
                                {Number(row.qty_oracle).toLocaleString("id-ID")}
                              </td>
                              <td className="text-end text-primary fw-bold">
                                +{Number(row.variance).toLocaleString("id-ID")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
