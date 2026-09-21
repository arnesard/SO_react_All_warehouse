import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutGrid,
  Ruler,
  ScanBarcode,
  ClipboardList,
  FileSpreadsheet,
  ScanEye,
  Camera,
  Activity,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/master-size", label: "Master Size", icon: Ruler },
  { to: "/pic", label: "PIC", icon: Users },
  { to: "/barcode-monstock", label: "Barcode MonStock", icon: ScanBarcode },
  { to: "/tag-stock", label: "Tag Stock", icon: ClipboardList },
  {
    to: "/tag-stock-nonbarcode",
    label: "Tag Stock Non Barcode",
    icon: FileSpreadsheet,
  },
  { to: "/appkso", label: "APPKSO", icon: ScanEye },
  { to: "/snapshot", label: "Snapshot", icon: Camera },
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/progress-so", label: "Progress SO", icon: Activity },
];

function MainLayout() {
  return (
    <>
      <header className="app-header">
        <div className="app-brand">
          <img
            src="/images/logo-gt.png"
            alt="Logo GT"
            className="app-brand-logo"
          />

          <div className="app-brand-text">
            <span className="app-brand-title">PT GAJAH TUNGGAL TBK</span>
          </div>
        </div>

        <nav className="app-nav">
          {NAV_ITEMS.map((item) => (
            <div className="app-nav-item" key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `app-nav-link${isActive ? " is-active" : ""}`
                }
              >
                <item.icon size={15} />
                {item.label}
              </NavLink>
            </div>
          ))}
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}

export default MainLayout;
