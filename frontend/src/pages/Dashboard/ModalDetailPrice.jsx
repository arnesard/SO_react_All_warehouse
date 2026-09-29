import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ModalDetailPrice({
  open,
  onClose,
  warehouse,
  pattern,
  grade,
  data = [],
  summary = null,
  onItemClick,
}) {
  if (!open) return null;

  const minusData = data.filter((r) => Number(r.variance || 0) < 0);
  const plusData = data.filter((r) => Number(r.variance || 0) > 0);

  const totalMinusVarPcs = minusData.reduce(
    (acc, curr) => acc + Number(curr.variance || 0),
    0,
  );
  const totalMinusVarRp = minusData.reduce(
    (acc, curr) => acc + Number(curr.price_variance || 0),
    0,
  );

  const totalPlusVarPcs = plusData.reduce(
    (acc, curr) => acc + Number(curr.variance || 0),
    0,
  );
  const totalPlusVarRp = plusData.reduce(
    (acc, curr) => acc + Number(curr.price_variance || 0),
    0,
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        zIndex: 1060,
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
          <h5 style={{ margin: 0, fontWeight: "bold", fontSize: "14px" }}>
            PATTERN:{" "}
            <span style={{ color: "#ffc107" }}>
              {grade} {pattern}
            </span>{" "}
            ({warehouse}) &nbsp;|&nbsp;{" "}
            {summary && (
              <span>
                {summary.total_pcs_variance.toLocaleString("id-ID")} Pcs (Rp{" "}
                {summary.total_rp_variance.toLocaleString("id-ID")}) dari{" "}
                {summary.total_sku_dinamis} SKU &nbsp;|&nbsp;{" "}
                <span style={{ color: "#dc3545" }}>
                  SKU Minus (-) {summary.sku_minus}
                </span>{" "}
                &nbsp;&amp;&nbsp;{" "}
                <span style={{ color: "#0d6efd" }}>
                  SKU Plus (+) {summary.sku_plus}
                </span>
              </span>
            )}
          </h5>
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

        {/* Body Modal */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px",
            backgroundColor: "#f8f9fa",
          }}
        >
          {summary && summary.missing_price_count > 0 && (
            <div
              className="alert alert-warning py-2 mb-3 d-flex align-items-center shadow-sm"
              style={{ fontSize: "11.5px" }}
            >
              <AlertTriangle
                size={16}
                className="me-2 text-danger flex-shrink-0"
              />
              <div>
                <strong>Perhatian:</strong> Terdapat{" "}
                <span className="fw-bold text-danger">
                  {summary.missing_price_count}
                </span>{" "}
                Item pada pattern ini yang master harganya Rp 0 atau belum
                terdaftar.
              </div>
            </div>
          )}

          <div className="row g-3">
            {/* DATA MINUS (-) */}
            <div className="col-12 col-xl-6">
              <div className="card border-danger shadow-sm h-100">
                <div className="card-header bg-danger-subtle d-flex justify-content-between align-items-center w-100 py-2 px-3">
                  <span className="text-dark fw-semibold">
                    DATA MINUS (-) | {minusData.length} SKU
                  </span>
                  <span
                    className="fw-bold px-2 py-1 rounded bg-danger text-white"
                    style={{ fontSize: "12px" }}
                  >
                    TOTAL VAR: {totalMinusVarPcs.toLocaleString("id-ID")} PCS |
                    Rp {totalMinusVarRp.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="card-body p-0">
                  <div
                    className="table-responsive"
                    style={{ maxHeight: "75vh" }}
                  >
                    <table
                      className="table table-hover table-bordered table-sm mb-0 align-middle text-nowrap"
                      style={{ fontSize: "11px" }}
                    >
                      <thead className="bg-light text-dark text-center align-middle sticky-top">
                        <tr>
                          <th rowSpan="2" style={{ width: "3%" }}>
                            NO
                          </th>
                          <th rowSpan="2">ITEM CODE</th>
                          <th rowSpan="2" className="text-start">
                            DESCRIPTION
                          </th>
                          <th
                            rowSpan="2"
                            className="text-end"
                            style={{ color: "#f43f5e" }}
                          >
                            Price (Rp)
                          </th>
                          <th colSpan="2" className="bg-primary-subtle">
                            COUNTED
                          </th>
                          <th colSpan="2" className="bg-secondary-subtle">
                            SNAPSHOT
                          </th>
                          <th colSpan="2" className="bg-danger-subtle">
                            VARIANCE
                          </th>
                        </tr>
                        <tr>
                          <th className="bg-primary-subtle text-end">Pcs</th>
                          <th className="bg-primary-subtle text-end">Rp</th>
                          <th className="bg-secondary-subtle text-end">Pcs</th>
                          <th className="bg-secondary-subtle text-end">Rp</th>
                          <th className="bg-danger-subtle text-end">Pcs</th>
                          <th className="bg-danger-subtle text-end">Rp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {minusData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={10}
                              className="text-center py-4 text-success fw-bold"
                            >
                              Tidak ada data minus. Aman!
                            </td>
                          </tr>
                        ) : (
                          minusData.map((row, index) => {
                            const countedPcs = Number(row.qty_appkso || 0);
                            const countedRp =
                              countedPcs * Number(row.std_price || 0);
                            const snapshotPcs = Number(row.qty_oracle || 0);
                            const snapshotRp =
                              snapshotPcs * Number(row.std_price || 0);

                            return (
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
                                  {Number(row.std_price) === 0 && (
                                    <AlertTriangle
                                      size={12}
                                      className="text-danger me-1"
                                      style={{ display: "inline" }}
                                    />
                                  )}
                                  {Number(row.std_price).toLocaleString(
                                    "id-ID",
                                  )}
                                </td>
                                <td className="text-end">
                                  {countedPcs.toLocaleString("id-ID")}
                                </td>
                                <td className="text-end">
                                  {countedRp.toLocaleString("id-ID")}
                                </td>
                                <td className="text-end">
                                  {snapshotPcs.toLocaleString("id-ID")}
                                </td>
                                <td className="text-end">
                                  {snapshotRp.toLocaleString("id-ID")}
                                </td>
                                <td className="text-end fw-bold text-danger">
                                  {Number(row.variance).toLocaleString("id-ID")}
                                </td>
                                <td className="text-end fw-bold text-danger">
                                  {Number(row.price_variance).toLocaleString(
                                    "id-ID",
                                  )}
                                </td>
                              </tr>
                            );
                          })
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
                <div className="card-header bg-primary-subtle d-flex justify-content-between align-items-center w-100 py-2 px-3">
                  <span className="text-dark fw-semibold">
                    DATA PLUS (+) | {plusData.length} SKU
                  </span>
                  <span
                    className="fw-bold px-2 py-1 rounded bg-primary text-white"
                    style={{ fontSize: "12px" }}
                  >
                    TOTAL VAR: +{totalPlusVarPcs.toLocaleString("id-ID")} PCS |
                    Rp +{totalPlusVarRp.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="card-body p-0">
                  <div
                    className="table-responsive"
                    style={{ maxHeight: "75vh" }}
                  >
                    <table
                      className="table table-hover table-bordered table-sm mb-0 align-middle text-nowrap"
                      style={{ fontSize: "11px" }}
                    >
                      <thead className="bg-light text-dark text-center align-middle sticky-top">
                        <tr>
                          <th rowSpan="2" style={{ width: "3%" }}>
                            NO
                          </th>
                          <th rowSpan="2">ITEM CODE</th>
                          <th rowSpan="2" className="text-start">
                            DESCRIPTION
                          </th>
                          <th
                            rowSpan="2"
                            className="text-end"
                            style={{ color: "#f43f5e" }}
                          >
                            Price (Rp)
                          </th>
                          <th colSpan="2" className="bg-primary-subtle">
                            COUNTED
                          </th>
                          <th colSpan="2" className="bg-secondary-subtle">
                            SNAPSHOT
                          </th>
                          <th colSpan="2" className="bg-info-subtle">
                            VARIANCE
                          </th>
                        </tr>
                        <tr>
                          <th className="bg-primary-subtle text-end">Pcs</th>
                          <th className="bg-primary-subtle text-end">Rp</th>
                          <th className="bg-secondary-subtle text-end">Pcs</th>
                          <th className="bg-secondary-subtle text-end">Rp</th>
                          <th className="bg-info-subtle text-end text-dark">
                            Pcs
                          </th>
                          <th className="bg-info-subtle text-end text-dark">
                            Rp
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {plusData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={10}
                              className="text-center py-4 text-muted fw-bold"
                            >
                              Tidak ada data plus. Aman!
                            </td>
                          </tr>
                        ) : (
                          plusData.map((row, index) => {
                            const countedPcs = Number(row.qty_appkso || 0);
                            const countedRp =
                              countedPcs * Number(row.std_price || 0);
                            const snapshotPcs = Number(row.qty_oracle || 0);
                            const snapshotRp =
                              snapshotPcs * Number(row.std_price || 0);

                            return (
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
                                  {Number(row.std_price) === 0 && (
                                    <AlertTriangle
                                      size={12}
                                      className="text-danger me-1"
                                      style={{ display: "inline" }}
                                    />
                                  )}
                                  {Number(row.std_price).toLocaleString(
                                    "id-ID",
                                  )}
                                </td>
                                <td className="text-end">
                                  {countedPcs.toLocaleString("id-ID")}
                                </td>
                                <td className="text-end">
                                  {countedRp.toLocaleString("id-ID")}
                                </td>
                                <td className="text-end">
                                  {snapshotPcs.toLocaleString("id-ID")}
                                </td>
                                <td className="text-end">
                                  {snapshotRp.toLocaleString("id-ID")}
                                </td>
                                <td className="text-end fw-bold text-primary">
                                  +
                                  {Number(row.variance).toLocaleString("id-ID")}
                                </td>
                                <td className="text-end fw-bold text-primary">
                                  +
                                  {Number(row.price_variance).toLocaleString(
                                    "id-ID",
                                  )}
                                </td>
                              </tr>
                            );
                          })
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
