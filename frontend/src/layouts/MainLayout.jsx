import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GitCompareArrows,
  Boxes,
  ChevronDown,
  Ruler,
  ScanBarcode,
  ClipboardList,
  FileSpreadsheet,
  ScanEye,
  Camera,
  Activity,
  Users,
  LayoutGrid,
} from "lucide-react";
import BrandMark from "../components/BrandMark";

const FISIK_SUBMENU = [
  { to: "/oracle-vs-fisik/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/oracle-vs-fisik/master-size", label: "Master Size", icon: Ruler },
  { to: "/oracle-vs-fisik/barcode-monstock", label: "Barcode MonStock", icon: ScanBarcode },
  { to: "/oracle-vs-fisik/tag-stock", label: "Tag Stock", icon: ClipboardList },
  { to: "/oracle-vs-fisik/tag-stock-nonbarcode", label: "Tag Stock Non Barcode", icon: FileSpreadsheet },
  { to: "/oracle-vs-fisik/appkso", label: "APPKSO", icon: ScanEye },
  { to: "/oracle-vs-fisik/snapshot", label: "Snapshot", icon: Camera },
  { to: "/oracle-vs-fisik/progress-so", label: "Progress SO", icon: Activity },
  { to: "/oracle-vs-fisik/pic", label: "PIC", icon: Users },
];

function MainLayout() {
  const [fisikOpen, setFisikOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const isFisikActive = location.pathname.startsWith("/oracle-vs-fisik");
  const closeDropdown = () => setFisikOpen(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setFisikOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="app-header">
        <div className="app-brand">
          <BrandMark />
          <div className="app-brand-text">
            <span className="app-brand-title">STOCK ACCURACY CONTROL</span>
            <span className="app-brand-sub">Gudang Ban Motor &middot; PT Gajah Tunggal Tbk</span>
          </div>
        </div>

        <nav className="app-nav">
          <div className="app-nav-item">
            <NavLink
              to="/"
              end
              onClick={closeDropdown}
              className={({ isActive }) => `app-nav-link${isActive ? " is-active" : ""}`}
            >
              <LayoutDashboard size={15} />
              Dashboard
            </NavLink>
          </div>

          <div className="app-nav-item">
            <NavLink
              to="/oracle-vs-barcode"
              onClick={closeDropdown}
              className={({ isActive }) => `app-nav-link${isActive ? " is-active" : ""}`}
            >
              <GitCompareArrows size={15} />
              Oracle vs Barcode
            </NavLink>
          </div>

          <div className={`app-nav-item${fisikOpen ? " is-open" : ""}`} ref={dropdownRef}>
            <button
              type="button"
              className={`app-nav-link${isFisikActive ? " is-active" : ""}`}
              onClick={() => setFisikOpen((v) => !v)}
            >
              <Boxes size={15} />
              Oracle vs Fisik
              <ChevronDown size={13} className="app-nav-caret" />
            </button>

            {fisikOpen && (
              <div className="app-nav-dropdown">
                {FISIK_SUBMENU.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeDropdown}
                    className={({ isActive }) => `app-nav-dropdown-link${isActive ? " is-active" : ""}`}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="app-status-pill">
          <span className="status-dot" />
          Live &middot; Sesi Hari Ini
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}

export default MainLayout;
