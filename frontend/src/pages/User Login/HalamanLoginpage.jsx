import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, ArrowRight, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { setUserSession } from "../../utils/auth";

export default function HalamanLoginpage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8010/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();

      if (json.success) {
        setUserSession(json.user);
        Swal.fire({
          icon: "success",
          title: "Login Berhasil",
          text: `Selamat datang ${json.user.username}`,
          timer: 1500,
          showConfirmButton: false,
        });

        // Langsung arahkan ke dashboard
        navigate("/");
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Masuk",
          text: json.message,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Koneksi Error",
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b0f19",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="glass"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "34px",
          borderRadius: "16px",
          border: "1px solid rgba(0, 246, 255, 0.25)",
          boxShadow: "0 0 35px rgba(0, 246, 255, 0.1)",
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img
            src="/images/logo-gt.png"
            alt="Logo GT"
            style={{
              height: "44px",
              filter: "brightness(0) invert(1)",
              marginBottom: "12px",
            }}
          />
          <h4
            style={{
              color: "#00f6ff",
              fontWeight: 800,
              margin: 0,
              letterSpacing: "1px",
            }}
          >
            PT GAJAH TUNGGAL TBK
          </h4>
          <span style={{ color: "#94a3b8", fontSize: "12px" }}>
            Sistem Stock Opname All Warehouse
          </span>
        </div>

        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label
              style={{
                color: "#e2e8f0",
                fontSize: "12px",
                fontWeight: 600,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Username / Gudang
            </label>
            <div style={{ position: "relative" }}>
              <User
                size={16}
                color="#64748b"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type="text"
                required
                placeholder="Contoh: BPW, APW, superadmin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px 0 38px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  color: "#fff",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                color: "#e2e8f0",
                fontSize: "12px",
                fontWeight: 600,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                color="#64748b"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type="password"
                required
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px 0 38px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  color: "#fff",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: "44px",
              marginTop: "8px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(90deg, #00f6ff 0%, #00ff99 100%)",
              color: "#0b0f19",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <>
                Masuk Aplikasi <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
