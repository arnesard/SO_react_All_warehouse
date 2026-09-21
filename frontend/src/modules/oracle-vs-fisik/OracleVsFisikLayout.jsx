import { Outlet } from "react-router-dom";
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
import PageHeader from "../../components/PageHeader";
import TabStrip from "../../components/TabStrip";

const TABS = [
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

function OracleVsFisikLayout() {
  return (
    <div>
      <PageHeader
        eyebrow="MODUL VALIDASI"
        title="Stock Oracle vs Aktual Fisik"
        description="Analisa selisih data Oracle terhadap jumlah stok fisik di area penyimpanan, per gedung dan per lot."
      />
      <TabStrip items={TABS} />
      <Outlet />
    </div>
  );
}

export default OracleVsFisikLayout;
