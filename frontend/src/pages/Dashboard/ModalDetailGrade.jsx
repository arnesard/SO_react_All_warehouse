import React from "react";
import { X } from "lucide-react";

export default function ModalDetailGrade({
  open,
  onClose,
  warehouse,
  grade,
  data = [],
  onItemClick,
}) {
  if (!open) return null;

  const minusData = data.filter((r) => Number(r.variance || 0) < 0);
  const plusData = data.filter((r) => Number(r.variance || 0) > 0);

  const totalMinusVar = minusData.reduce(
    (acc, curr) => acc + Number(curr.variance || 0),
    0,
  );
  const totalPlusVar = plusData.reduce(
    (acc, curr) => acc + Number(curr.variance || 0),
    0,
  );

  const gradeLabel = grade === "MIX" ? "GABUNGAN (OE + OK)" : grade;

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
            GRADE: <span style={{ color: "#ffc107" }}>{gradeLabel}</span> (
            {warehouse}) &nbsp;|&nbsp;{" "}
            {(totalPlusVar + totalMinusVar).toLocaleString("id-ID")} Pcs
            &nbsp;|&nbsp;{" "}
            <span style={{ color: "#dc3545" }}>
              SKU Minus (-) {minusData.length}
            </span>{" "}
            &nbsp;&amp;&nbsp;{" "}
            <span style={{ color: "#0d6efd" }}>
              SKU Plus (+) {plusData.length}
            </span>
          </h6>
          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: "2px",
            }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Modal: 2 Kolom Minus & Plus */}
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
                  <span>DATA MINUS (-) : {minusData.length} SKU</span>
                  <span
                    className="badge bg-white text-danger fw-black"
                    style={{ fontSize: "12px" }}
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
                      className="table table-sm table-hover table-bordered mb-0 align-middle text-nowrap"
                      style={{ fontSize: "11px" }}
                    >
                      <thead className="bg-light sticky-top">
                        <tr>
                          <th className="text-center" style={{ width: "5%" }}>
                            NO
                          </th>
                          <th>PATTERN</th>
                          <th>ITEM CODE</th>
                          <th className="text-start">DESCRIPTION</th>
                          <th className="text-end">COUNTED</th>
                          <th className="text-end">SNAPSHOT</th>
                          <th className="text-end">VAR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {minusData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="text-center text-success fw-bold py-4"
                            >
                              Tidak ada data minus. Aman!
                            </td>
                          </tr>
                        ) : (
                          minusData.map((row, index) => (
                            <tr
                              key={index}
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                onItemClick && onItemClick(row.item)
                              }
                              title="Klik untuk lihat riwayat scan"
                            >
                              <td className="text-center text-muted">
                                {index + 1}
                              </td>
                              <td className="fw-bold text-dark">
                                {row.pattern}
                              </td>
                              <td className="fw-bold text-primary">
                                {row.item}
                              </td>
                              <td
                                className="text-truncate text-start"
                                style={{ maxWidth: "160px" }}
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
                  <span>DATA PLUS (+) : {plusData.length} SKU</span>
                  <span
                    className="badge bg-white text-primary fw-black"
                    style={{ fontSize: "12px" }}
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
                      className="table table-sm table-hover table-bordered mb-0 align-middle text-nowrap"
                      style={{ fontSize: "11px" }}
                    >
                      <thead className="bg-light sticky-top">
                        <tr>
                          <th className="text-center" style={{ width: "5%" }}>
                            NO
                          </th>
                          <th>PATTERN</th>
                          <th>ITEM CODE</th>
                          <th className="text-start">DESCRIPTION</th>
                          <th className="text-end">COUNTED</th>
                          <th className="text-end">SNAPSHOT</th>
                          <th className="text-end">VAR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plusData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="text-center text-muted py-4"
                            >
                              Tidak ada data plus. Aman!
                            </td>
                          </tr>
                        ) : (
                          plusData.map((row, index) => (
                            <tr
                              key={index}
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                onItemClick && onItemClick(row.item)
                              }
                              title="Klik untuk lihat riwayat scan"
                            >
                              <td className="text-center text-muted">
                                {index + 1}
                              </td>
                              <td className="fw-bold text-dark">
                                {row.pattern}
                              </td>
                              <td className="fw-bold text-primary">
                                {row.item}
                              </td>
                              <td
                                className="text-truncate text-start"
                                style={{ maxWidth: "160px" }}
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
