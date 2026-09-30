import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  ScanBarcode,
  ClipboardList,
  FileSpreadsheet,
  ScanEye,
  Camera,
  Activity,
  Users,
  Disc2,
  FileInput,
  UserCog,
  LogOut,
  Warehouse,
  ShieldCheck,
} from "lucide-react";
import { getUserSession, clearUserSession } from "../utils/auth";

const BASE_NAV_ITEMS = [
  { to: "/master-size", label: "Master Size", icon: Disc2 },
  { to: "/pic", label: "Master PIC", icon: Users },
  { to: "/barcode-monstock", label: "Barcode MonStock", icon: ScanBarcode },
  { to: "/tag-stock", label: "Tag Stock", icon: ClipboardList },
  {
    to: "/tag-stock-nonbarcode",
    label: "Tag Stock Non Barcode",
    icon: FileSpreadsheet,
  },
  { to: "/InputKso", label: "Input kso", icon: FileInput },
  { to: "/appkso", label: "APPKSO", icon: ScanEye },
  { to: "/snapshot", label: "Snapshot", icon: Camera },
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/progress-so", label: "Progress SO", icon: Activity },
];

function MainLayout() {
  const navigate = useNavigate();
  const currentUser = getUserSession();
  const isSuperUser = currentUser?.role === "super_user";

  // Tambahkan menu "Users" hanya jika akun adalah super_user
  const navItems = isSuperUser
    ? [...BASE_NAV_ITEMS, { to: "/users", label: "Users", icon: UserCog }]
    : BASE_NAV_ITEMS;

  const handleLogout = () => {
    clearUserSession();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <div className="app-brand-logo-wrap">
            <img
              src="/images/logo-gt.png"
              alt="Logo GT"
              className="app-brand-logo"
            />
          </div>

          <div className="app-brand-text">
            <span className="app-brand-title">PT GAJAH TUNGGAL TBK</span>
            <span className="app-brand-sep">||</span>
          </div>
        </div>

        {/* Daftar Navigasi Menu */}
        <nav className="app-nav">
          {navItems.map((item) => (
            <div className="app-nav-item" key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `app-nav-link${isActive ? " is-active" : ""}`
                }
              >
                <item.icon size={13.5} />
                {item.label}
              </NavLink>
            </div>
          ))}
        </nav>

        {/* Panel Profil Pengguna & Logout di Pojok Kanan Navbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
            marginLeft: "4px",
          }}
        >
          {/* Badge Identitas Gudang */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 8px",
              borderRadius: "20px",
              background: isSuperUser
                ? "rgba(16, 185, 129, 0.15)"
                : "rgba(0, 246, 255, 0.12)",
              border: `1px solid ${
                isSuperUser
                  ? "rgba(16, 185, 129, 0.4)"
                  : "rgba(0, 246, 255, 0.3)"
              }`,
              color: isSuperUser ? "#10b981" : "#00f6ff",
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: "var(--font-mono, monospace)",
              whiteSpace: "nowrap",
            }}
            title={`Login sebagai: ${currentUser?.username || "Guest"}`}
          >
            {isSuperUser ? <ShieldCheck size={13} /> : <Warehouse size={13} />}
            <span>
              {isSuperUser
                ? "SUPER USER"
                : currentUser?.warehouse || currentUser?.username || "GUDANG"}
            </span>
          </div>

          {/* Tombol Logout */}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              cursor: "pointer",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            title="Keluar dari Aplikasi"
          >
            <LogOut size={13} />
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
