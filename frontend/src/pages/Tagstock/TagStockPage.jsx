import { useEffect, useState, useMemo } from "react";
import {
  Printer,
  CheckCircle,
  RotateCcw,
  Tag,
  Loader2,
  X,
  History,
} from "lucide-react";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:8010/api/tagstock";

// Helper cetak memanggil URL page terpisah lewat hidden iframe (Tanpa New Tab & Tanpa Navbar)
function triggerPrintPageViaFrame(url) {
  const frameId = "print-isolated-iframe";
  let iframe = document.getElementById(frameId);
  if (iframe) {
    iframe.remove();
  }

  iframe = document.createElement("iframe");
  iframe.id = frameId;
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.src = url;
  document.body.appendChild(iframe);
}

export default function TagStockPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWh, setSelectedWh] = useState("");
  const [operators, setOperators] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [docList, setDocList] = useState([]);
  const [docStart, setDocStart] = useState("");
  const [docEnd, setDocEnd] = useState("");

  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  // Modal Scan History State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyTarget, setHistoryTarget] = useState({ doc: "", item: "" });
  const [historyLoading, setHistoryLoading] = useState(false);

  // 1. Load Warehouse Filter
  useEffect(() => {
    async function loadWh() {
      try {
        const res = await fetch(`${API_BASE}/init-filters`);
        const json = await res.json();
        if (json.status === "success") {
          setWarehouses(json.warehouses || []);
        }
      } catch (err) {
        console.error("Gagal load gudang:", err);
      }
    }
    loadWh();
  }, []);

  // 2. Load Operator saat Gudang berubah
  useEffect(() => {
    if (!selectedWh) {
      setOperators([]);
      setSelectedOperator("");
      setTableRows([]);
      setDocList([]);
      setIsValidated(false);
      return;
    }

    async function loadOps() {
      try {
        const res = await fetch(
          `${API_BASE}/operators?warehouse=${encodeURIComponent(selectedWh)}`,
        );
        const json = await res.json();
        if (json.status === "success") {
          setOperators(json.operators || []);
        }
      } catch (err) {
        console.error("Gagal load operator:", err);
      }
    }
    loadOps();
    setSelectedOperator("");
    setTableRows([]);
    setDocList([]);
    setDocStart("");
    setDocEnd("");
    setIsValidated(false);
  }, [selectedWh]);

  const currentOperatorObj = useMemo(() => {
    return operators.find((op) => op.no_penneng === selectedOperator) || null;
  }, [operators, selectedOperator]);

  // 3. Load Data & Dokumen saat Operator dipilih
  const loadRowsData = async (wh, opId, start = "", end = "") => {
    if (!wh || !opId) return;
    setLoading(true);
    setIsValidated(false);
    try {
      const res = await fetch(`${API_BASE}/process-rows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse: wh,
          operator_id: opId,
          doc_start: start,
          doc_end: end,
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        const data = json.master_data || [];
        setTableRows(data);

        if (!start && !end) {
          const docs = [...new Set(data.map((d) => d.no_doc))].filter(Boolean);
          setDocList(docs);
        }
      } else {
        setTableRows([]);
      }
    } catch (err) {
      console.error("Gagal load rows:", err);
      setTableRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorChange = (opId) => {
    setSelectedOperator(opId);
    setDocStart("");
    setDocEnd("");
    if (opId) {
      loadRowsData(selectedWh, opId);
    } else {
      setTableRows([]);
      setDocList([]);
    }
  };

  const handleDocFilterApply = (start, end) => {
    if (start && end && start > end) {
      Swal.fire({
        icon: "error",
        title: "Dokumen Terbalik!",
        text: "Doc Awal nggak boleh lebih besar dari Doc Akhir bro!",
        background: "var(--surface)",
        customClass: { popup: "swal-theme-popup" },
      });
      return;
    }
    loadRowsData(selectedWh, selectedOperator, start, end);
  };

  // 4. Tombol Validasi APPKSO
  const handleToggleValidation = async () => {
    if (isValidated) {
      setIsValidated(false);
      loadRowsData(selectedWh, selectedOperator, docStart, docEnd);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/validate-appkso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse: selectedWh,
          operator_id: selectedOperator,
          doc_start: docStart,
          doc_end: docEnd,
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        setTableRows(json.master_data || []);
        setIsValidated(true);
      }
    } catch (err) {
      console.error("Validasi gagal:", err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Reset Filter
  const handleResetFilters = () => {
    setSelectedWh("");
    setSelectedOperator("");
    setDocStart("");
    setDocEnd("");
    setTableRows([]);
    setDocList([]);
    setIsValidated(false);
  };

  // 6. Modal Riwayat Scan
  const handleOpenScanHistory = async (row) => {
    setHistoryTarget({ doc: row.no_doc, item: row.item });
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/scan-history?warehouse=${encodeURIComponent(selectedWh)}&doc=${encodeURIComponent(row.no_doc)}&item=${encodeURIComponent(row.item)}`,
      );
      const json = await res.json();
      if (json.status === "success") {
        setHistoryData(json.data || []);
      }
    } catch (err) {
      console.error("Gagal load histori:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 7. PRINT REKAP (Memanggil page PrintRekapPage tanpa tab baru)
  const handlePrintRekap = () => {
    if (!selectedWh || !selectedOperator) return;
    const url = `/print/tagstock/rekap?warehouse=${encodeURIComponent(selectedWh)}&operator_id=${encodeURIComponent(selectedOperator)}&doc_start=${encodeURIComponent(docStart)}&doc_end=${encodeURIComponent(docEnd)}`;
    triggerPrintPageViaFrame(url);
  };

  // 8. PRINT KARTU TAG (Memanggil page PrintTagStockPage tanpa tab baru)
  const handlePrintKartuTag = () => {
    if (!selectedWh || !selectedOperator) return;
    const url = `/print/tagstock/kso?warehouse=${encodeURIComponent(selectedWh)}&operator_id=${encodeURIComponent(selectedOperator)}&doc_start=${encodeURIComponent(docStart)}&doc_end=${encodeURIComponent(docEnd)}`;
    triggerPrintPageViaFrame(url);
  };

  const totalRack = tableRows.reduce((a, b) => a + (Number(b.Rak) || 0), 0);
  const totalQty = tableRows.reduce(
    (a, b) => a + (Number(b.Qty || b.qty_tag) || 0),
    0,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 82px)",
        paddingBottom: "10px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="surface-card"
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* HEADER CONTROLS */}
        <div
          className="surface-card-header"
          style={{ padding: "10px 16px", flexShrink: 0, gap: 10 }}
        >
          {/* SISI KIRI: GUDANG, OPERATOR, REKAP & VALIDASI */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <select
              className="field-select"
              style={{ minWidth: "200px" }}
              value={selectedWh}
              onChange={(e) => setSelectedWh(e.target.value)}
            >
              <option value="">⚠️ PILIH GUDANG</option>
              {warehouses.map((wh) => (
                <option key={wh.warehouse} value={wh.warehouse}>
                  {wh.warehouse}{" "}
                  {wh.last_upload !== "-" ? `(${wh.last_upload})` : ""}
                </option>
              ))}
            </select>

            <select
              className="field-select"
              style={{ minWidth: "230px" }}
              disabled={!selectedWh || operators.length === 0}
              value={selectedOperator}
              onChange={(e) => handleOperatorChange(e.target.value)}
            >
              <option value="">-- KUNCI OPERATOR --</option>
              {operators.map((op) => (
                <option key={op.no_penneng} value={op.no_penneng}>
                  {op.nama} ({op.no_penneng})
                </option>
              ))}
            </select>

            {selectedOperator && (
              <>
                <button
                  type="button"
                  className="btn-ctrl"
                  style={{
                    backgroundColor: "rgba(52, 199, 123, 0.15)",
                    borderColor: "var(--ok)",
                    color: "var(--ok)",
                    padding: "7px 12px",
                  }}
                  onClick={handlePrintRekap}
                >
                  <Printer size={14} /> REKAP
                </button>

                <button
                  type="button"
                  className={`btn-ctrl ${isValidated ? "primary" : ""}`}
                  style={{
                    padding: "7px 12px",
                    backgroundColor: isValidated
                      ? undefined
                      : "rgba(245, 166, 35, 0.15)",
                    borderColor: isValidated ? undefined : "var(--warn)",
                    color: isValidated ? undefined : "var(--warn)",
                  }}
                  onClick={handleToggleValidation}
                >
                  <CheckCircle size={14} />{" "}
                  {isValidated ? "TUTUP VALIDASI" : "VALIDASI"}
                </button>
              </>
            )}
          </div>

          {/* SISI KANAN: DOC AWAL, DOC AKHIR, TAG STOCK & RESET */}
          {selectedOperator && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <select
                className="field-select"
                style={{ width: "140px" }}
                value={docStart}
                onChange={(e) => {
                  setDocStart(e.target.value);
                  handleDocFilterApply(e.target.value, docEnd);
                }}
              >
                <option value="">-- DOC AWAL --</option>
                {docList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                className="field-select"
                style={{ width: "140px" }}
                value={docEnd}
                onChange={(e) => {
                  setDocEnd(e.target.value);
                  handleDocFilterApply(docStart, e.target.value);
                }}
              >
                <option value="">-- DOC AKHIR --</option>
                {docList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn-ctrl primary"
                style={{ padding: "7px 14px" }}
                onClick={handlePrintKartuTag}
              >
                <Tag size={14} /> TAG STOCK
              </button>

              <button
                type="button"
                className="btn-ctrl danger"
                style={{ padding: "7px 12px" }}
                onClick={handleResetFilters}
              >
                <RotateCcw size={14} /> RESET
              </button>
            </div>
          )}
        </div>

        {/* TABEL AREA UTAMA (KOLOM AKSI DIHAPUS 1:1 LARAVEL) */}
        <div
          className="dtable-wrap"
          style={{
            flex: 1,
            maxHeight: "none",
            border: "none",
            borderRadius: 0,
            overflowY: "auto",
          }}
        >
          <table className="dtable">
            <thead>
              <tr>
                <th style={{ width: "45px", textAlign: "center" }}>No.</th>
                <th style={{ width: "120px" }}>Lot</th>
                <th style={{ width: "120px" }}>No. Doc</th>
                <th style={{ width: "130px" }}>Item</th>
                <th>Deskripsi Master Size</th>
                <th style={{ width: "100px", textAlign: "center" }}>
                  Jumlah Rak
                </th>
                <th style={{ width: "120px", textAlign: "right" }}>Qty</th>
                {isValidated && (
                  <>
                    <th style={{ width: "120px", textAlign: "right" }}>
                      Qty APPKSO
                    </th>
                    <th style={{ width: "100px", textAlign: "center" }}>
                      Status
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isValidated ? 9 : 7} className="table-empty">
                    <Loader2
                      size={16}
                      className="spin"
                      style={{
                        display: "inline-block",
                        verticalAlign: "middle",
                        marginRight: 8,
                      }}
                    />
                    Menyisir database monitoring stock...
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr>
                  <td colSpan={isValidated ? 9 : 7} className="table-empty">
                    {selectedOperator
                      ? "Tidak ada data pada rentang dokumen ini."
                      : "Silakan pilih target gudang dan operator di atas untuk memilah baris area bro."}
                  </td>
                </tr>
              ) : (
                tableRows.map((row, index) => {
                  const qtyTag = Number(row.Qty || row.qty_tag || 0);
                  const qtyKso = Number(row.qty_appkso || 0);
                  const isMatch = qtyTag === qtyKso;

                  return (
                    <tr
                      key={index}
                      style={{ cursor: "pointer" }}
                      title="Klik baris untuk melihat riwayat scan APPKSO"
                      onClick={() => handleOpenScanHistory(row)}
                    >
                      <td style={{ textAlign: "center" }} className="mono">
                        {index + 1}
                      </td>
                      <td className="cell-code">{row.lot_display || "-"}</td>
                      <td className="mono">{row.no_doc || "-"}</td>
                      <td className="cell-strong">{row.item}</td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {row.description || "-"}
                      </td>
                      <td style={{ textAlign: "center" }} className="mono">
                        {row.Rak || 0}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        {qtyTag.toLocaleString("id-ID")}
                      </td>
                      {isValidated && (
                        <>
                          <td
                            style={{ textAlign: "right" }}
                            className="cell-code"
                          >
                            {qtyKso.toLocaleString("id-ID")}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {qtyKso === 0 ? (
                              <span className="badge-pill warn">BELUM</span>
                            ) : isMatch ? (
                              <span className="badge-pill ok">SESUAI</span>
                            ) : (
                              <span className="badge-pill danger">SELISIH</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>

            {tableRows.length > 0 && (
              <tfoot
                style={{
                  position: "sticky",
                  bottom: 0,
                  backgroundColor: "var(--surface-3)",
                  fontWeight: 700,
                  zIndex: 2,
                  boxShadow: "inset 0 1px 0 var(--border)",
                }}
              >
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "right",
                      padding: "10px 14px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    TOTAL RINGKASAN PENUGASAN :
                  </td>
                  <td
                    style={{ textAlign: "center", color: "var(--warn)" }}
                    className="mono"
                  >
                    {totalRack} RAK
                  </td>
                  <td
                    style={{ textAlign: "right", color: "var(--accent)" }}
                    className="mono"
                  >
                    {totalQty.toLocaleString("id-ID")} PCS
                  </td>
                  {isValidated && <td colSpan={2}></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL RIWAYAT SCAN APPKSO */}
      {historyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "720px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <History size={16} color="var(--accent)" />
                <span>
                  Riwayat Scan: {historyTarget.item} (Doc: {historyTarget.doc})
                </span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setHistoryModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div
                className="dtable-wrap"
                style={{ maxHeight: "50vh", border: "none" }}
              >
                <table className="dtable">
                  <thead>
                    <tr>
                      <th style={{ width: "45px", textAlign: "center" }}>No</th>
                      <th>Opr ID</th>
                      <th>Nama Opr</th>
                      <th>No KSO</th>
                      <th>Item Code</th>
                      <th style={{ width: "90px", textAlign: "right" }}>
                        Qty Scan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLoading ? (
                      <tr>
                        <td colSpan="6" className="table-empty">
                          <Loader2
                            size={16}
                            className="spin"
                            style={{
                              display: "inline-block",
                              verticalAlign: "middle",
                              marginRight: 8,
                            }}
                          />
                          Memuat histori scan...
                        </td>
                      </tr>
                    ) : historyData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="table-empty">
                          Belum ada aktivitas scan untuk item ini.
                        </td>
                      </tr>
                    ) : (
                      historyData.map((h, i) => (
                        <tr key={h.id || i}>
                          <td style={{ textAlign: "center" }} className="mono">
                            {i + 1}
                          </td>
                          <td className="cell-code">
                            {h.opr || h.opr_id || "-"}
                          </td>
                          <td>{h.operator || h.nama_opr || "-"}</td>
                          <td className="mono">{h.nokso || h.no_kso || "-"}</td>
                          <td className="cell-strong">
                            {h.item || h.item_code}
                          </td>
                          <td
                            style={{ textAlign: "right", fontWeight: 700 }}
                            className="cell-code"
                          >
                            {Number(h.qty || h.qty_scan || 0).toLocaleString(
                              "id-ID",
                            )}
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
      )}
    </div>
  );
}
