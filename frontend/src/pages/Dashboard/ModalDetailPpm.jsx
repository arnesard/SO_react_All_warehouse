import React, { useMemo } from "react";
import { X } from "lucide-react";

export default function ModalDetailPpm({
  open,
  onClose,
  warehouse,
  rawData = [],
}) {
  if (!open) return null;

  const grades = ["OE", "OK", "2nd"];

  // Kelompokkan data per Product (Pattern)
  const { products, productNames, totalsPerGrade, grandTotal } = useMemo(() => {
    const pMap = {};
    const gTotals = {
      OE: { on_hand: 0, counted: 0, variance: 0 },
      OK: { on_hand: 0, counted: 0, variance: 0 },
      "2nd": { on_hand: 0, counted: 0, variance: 0 },
    };
    const grand = { on_hand: 0, counted: 0, variance: 0 };

    rawData.forEach((r) => {
      const p = r.product || "OTHER";
      const g = r.grade;
      const onHand = Number(r.on_hand) || 0;
      const counted = Number(r.counted) || 0;
      const varVal = counted - onHand;

      if (!pMap[p]) pMap[p] = {};
      pMap[p][g] = { on_hand: onHand, counted: counted, variance: varVal };

      if (gTotals[g]) {
        gTotals[g].on_hand += onHand;
        gTotals[g].counted += counted;
        gTotals[g].variance += varVal;
      }

      grand.on_hand += onHand;
      grand.counted += counted;
      grand.variance += varVal;
    });

    const pNames = Object.keys(pMap).sort();
    return {
      products: pMap,
      productNames: pNames,
      totalsPerGrade: gTotals,
      grandTotal: grand,
    };
  }, [rawData]);

  // Rumus PPM: (Total Variance / Total Oracle On-hand) * 1.000.000
  const ppm =
    grandTotal.on_hand > 0
      ? (Math.abs(grandTotal.variance) / grandTotal.on_hand) * 1000000
      : 0;

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
          <h5 style={{ margin: 0, fontWeight: "bold", fontSize: "14px" }}>
            Analisis Variance per Produk (PPM) - Gudang {warehouse}
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

        {/* Body Modal: Tabel Cross-Tabulation */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <div
            className="table-responsive bg-white rounded shadow-sm border"
            style={{ maxHeight: "70vh" }}
          >
            <table
              className="table table-bordered table-sm table-hover mb-0"
              style={{ fontSize: "11px" }}
            >
              <thead className="bg-dark text-white text-center align-middle sticky-top">
                <tr>
                  <th rowSpan="2" className="text-start ps-2">
                    Product
                  </th>
                  {grades.map((g) => (
                    <th
                      key={g}
                      colSpan="3"
                      className="border-start border-light"
                    >
                      {g}
                    </th>
                  ))}
                  <th
                    colSpan="3"
                    className="border-start border-light bg-primary"
                  >
                    TOTAL
                  </th>
                </tr>
                <tr>
                  {grades.map((g) => (
                    <React.Fragment key={g}>
                      <th className="border-start border-light">On Hand</th>
                      <th>Counted</th>
                      <th>Var</th>
                    </React.Fragment>
                  ))}
                  <th className="border-start border-light">On Hand</th>
                  <th>Counted</th>
                  <th>Var</th>
                </tr>
              </thead>
              <tbody className="text-end">
                {productNames.map((pName) => {
                  const pData = products[pName] || {};
                  let rowOnHand = 0;
                  let rowCounted = 0;
                  let rowVar = 0;

                  return (
                    <tr key={pName}>
                      <td className="text-start fw-bold ps-2">{pName}</td>
                      {grades.map((g) => {
                        const item = pData[g] || {
                          on_hand: 0,
                          counted: 0,
                          variance: 0,
                        };
                        rowOnHand += item.on_hand;
                        rowCounted += item.counted;
                        rowVar += item.variance;

                        const varClass =
                          item.variance < 0
                            ? "text-danger"
                            : item.variance > 0
                              ? "text-primary"
                              : "text-muted";
                        return (
                          <React.Fragment key={g}>
                            <td className="border-start">
                              {item.on_hand.toLocaleString("id-ID")}
                            </td>
                            <td>{item.counted.toLocaleString("id-ID")}</td>
                            <td className={`fw-bold ${varClass}`}>
                              {item.variance.toLocaleString("id-ID")}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="border-start fw-bold text-dark">
                        {rowOnHand.toLocaleString("id-ID")}
                      </td>
                      <td className="fw-bold text-dark">
                        {rowCounted.toLocaleString("id-ID")}
                      </td>
                      <td
                        className={`fw-bold ${rowVar < 0 ? "text-danger" : rowVar > 0 ? "text-primary" : "text-muted"}`}
                      >
                        {rowVar.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="table-dark fw-bold text-end">
                <tr>
                  <td className="text-start ps-2">TOTAL ALL</td>
                  {grades.map((g) => {
                    const tg = totalsPerGrade[g];
                    return (
                      <React.Fragment key={g}>
                        <td className="border-start">
                          {tg.on_hand.toLocaleString("id-ID")}
                        </td>
                        <td>{tg.counted.toLocaleString("id-ID")}</td>
                        <td>{tg.variance.toLocaleString("id-ID")}</td>
                      </React.Fragment>
                    );
                  })}
                  <td className="border-start">
                    {grandTotal.on_hand.toLocaleString("id-ID")}
                  </td>
                  <td>{grandTotal.counted.toLocaleString("id-ID")}</td>
                  <td>{grandTotal.variance.toLocaleString("id-ID")}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* AREA FORMULA PPM DI BAWAH (Persis Blade) */}
          <div className="mt-3 p-3 border rounded shadow-sm bg-white">
            <div className="d-flex align-items-center justify-content-center">
              <h4
                className="fw-bold mb-0 me-4"
                style={{ color: "#10b981", fontSize: "20px" }}
              >
                PPM :{" "}
                <span>
                  {ppm.toLocaleString("id-ID", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </h4>
              <div
                className="text-muted border-start ps-3"
                style={{ fontSize: "12px" }}
              >
                <div className="fw-bold">Detail Perhitungan:</div>
                <div>
                  ( Total Variance :{" "}
                  <strong>
                    {Math.abs(grandTotal.variance).toLocaleString("id-ID")}
                  </strong>{" "}
                  ) / ( Total On Hand :{" "}
                  <strong>{grandTotal.on_hand.toLocaleString("id-ID")}</strong>{" "}
                  ) × 1.000.000
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
