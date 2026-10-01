import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // <-- DITAMBAHKAN useSearchParams
import {
  ArrowLeft,
  ShieldCheck,
  ScanBarcode,
  Loader2,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";
import Swal from "sweetalert2";
import { getUserSession } from "../../utils/auth";

const API_BASE = "http://localhost:8010/api/input-kso";

export default function ModeValidatorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // <-- Membaca URL parameter
  const currentUser = getUserSession();

  // BACA GUDANG dari URL
  const urlWarehouse = searchParams.get("wh");
  const currentWarehouse = urlWarehouse || currentUser?.warehouse || "BPW";

  const [docCode, setDocCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [verifiedList, setVerifiedList] = useState([]);
  const docInputRef = useRef(null);

  useEffect(() => {
    docInputRef.current?.focus();
  }, []);

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!docCode.trim()) {
      return Swal.fire(
        "NoDoc Kosong",
        "Scan atau ketik nomor kartu fisik!",
        "warning",
      );
    }

    setValidating(true);
    const targetDoc = docCode.trim().toUpperCase();

    try {
      const res = await fetch(`${API_BASE}/validate-doc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          no_doc: targetDoc,
          auditor_name: currentUser?.username || "AUDITOR",
          warehouse: currentWarehouse, // <-- Mengirim gudang yang benar
        }),
      });
      const json = await res.json();

      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Kartu Terverifikasi!",
          text: json.message,
          timer: 1100,
          showConfirmButton: false,
        });

        setVerifiedList((prev) => [
          {
            doc: targetDoc,
            time: new Date().toLocaleTimeString("id-ID"),
            auditor: currentUser?.username || "AUDITOR",
          },
          ...prev,
        ]);

        setDocCode("");
        docInputRef.current?.focus();
      } else {
        Swal.fire("Gagal Validasi", json.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        minHeight: "100vh",
        background: "var(--bg-app)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header Mobile */}
      <header
        style={{
          background: "#064e3b",
          color: "#fff",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 30,
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => navigate("/InputKso")}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ShieldCheck size={18} color="#34d399" /> Mode Validasi Auditor
            </h4>
            <span style={{ fontSize: "11px", color: "#a7f3d0" }}>
              Gudang: <strong>{currentWarehouse}</strong> • Auditor:{" "}
              {currentUser?.username || "AUDITOR"}
            </span>
          </div>
        </div>

        <span
          style={{
            background: "rgba(52, 211, 153, 0.2)",
            border: "1px solid rgba(52, 211, 153, 0.5)",
            color: "#34d399",
            padding: "3px 8px",
            borderRadius: "12px",
            fontSize: "10px",
            fontWeight: 700,
          }}
        >
          AUDIT PDT
        </span>
      </header>

      {/* Main Container */}
      <main
        style={{
          padding: "14px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Form Scanner Auditor */}
        <form
          onSubmit={handleValidate}
          className="surface-card"
          style={{
            padding: "18px 16px",
            borderRadius: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Scan / Ketik No. Dokumen (NoDoc)
            </label>
            <div style={{ position: "relative" }}>
              <input
                ref={docInputRef}
                type="text"
                required
                placeholder="Scan barcode NoDoc kartu..."
                className="field-input mono"
                style={{
                  width: "100%",
                  height: "50px",
                  fontSize: "16px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  paddingLeft: "40px",
                }}
                value={docCode}
                onChange={(e) => setDocCode(e.target.value)}
              />
              <ScanBarcode
                size={20}
                color="var(--text-muted)"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "5px",
                display: "block",
              }}
            >
              Arahkan scanner ke barcode form fisik kartu di gudang{" "}
              <strong>{currentWarehouse}</strong>.
            </span>
          </div>

          <button
            type="submit"
            disabled={validating}
            className="btn-ctrl solid-green"
            style={{
              height: "50px",
              fontSize: "15px",
              fontWeight: 700,
              justifyContent: "center",
              borderRadius: "12px",
              background: "#059669",
            }}
          >
            {validating ? (
              <Loader2 size={20} className="spin" />
            ) : (
              <>
                <ShieldCheck size={20} /> Sahkan & Verifikasi Kartu
              </>
            )}
          </button>
        </form>

        {/* Ringkasan Aktivitas Terverifikasi */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
              padding: "0 4px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-secondary)",
              }}
            >
              Kartu Terverifikasi Sesi Ini ({verifiedList.length})
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {verifiedList.length === 0 ? (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px dashed var(--border-soft)",
                  borderRadius: "12px",
                  padding: "24px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                }}
              >
                Belum ada kartu yang diverifikasi pada sesi ini.
              </div>
            ) : (
              verifiedList.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--ok-soft)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <CheckCircle2 size={18} color="var(--ok)" />
                    <div>
                      <span
                        className="mono"
                        style={{
                          fontWeight: 700,
                          fontSize: "13.5px",
                          color: "var(--text-primary)",
                        }}
                      >
                        {item.doc}
                      </span>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <UserCheck size={12} /> {item.auditor}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11.5px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Clock size={12} />
                    <span className="mono">{item.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
