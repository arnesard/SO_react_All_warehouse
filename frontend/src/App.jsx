import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./modules/dashboard/DashboardPage";
import OracleVsBarcodePage from "./modules/oracle-vs-barcode/OracleVsBarcodePage";
import OracleVsFisikLayout from "./modules/oracle-vs-fisik/OracleVsFisikLayout";
import FisikDashboardPage from "./modules/oracle-vs-fisik/pages/FisikDashboardPage";
import MasterSizePage from "./modules/oracle-vs-fisik/pages/MasterSizePage";
import BarcodeMonstockPage from "./modules/oracle-vs-fisik/pages/BarcodeMonstockPage";
import TagStockPage from "./modules/oracle-vs-fisik/pages/TagStockPage";
import TagStockNonBarcodePage from "./modules/oracle-vs-fisik/pages/TagStockNonBarcodePage";
import AppksoPage from "./modules/oracle-vs-fisik/pages/AppksoPage";
import SnapshotPage from "./modules/oracle-vs-fisik/pages/SnapshotPage";
import ProgressSoPage from "./modules/oracle-vs-fisik/pages/ProgressSoPage";
import PicPage from "./modules/oracle-vs-fisik/pages/PicPage";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/oracle-vs-barcode" element={<OracleVsBarcodePage />} />

        <Route path="/oracle-vs-fisik" element={<OracleVsFisikLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<FisikDashboardPage />} />
          <Route path="master-size" element={<MasterSizePage />} />
          <Route path="barcode-monstock" element={<BarcodeMonstockPage />} />
          <Route path="tag-stock" element={<TagStockPage />} />
          <Route path="tag-stock-nonbarcode" element={<TagStockNonBarcodePage />} />
          <Route path="appkso" element={<AppksoPage />} />
          <Route path="snapshot" element={<SnapshotPage />} />
          <Route path="progress-so" element={<ProgressSoPage />} />
          <Route path="pic" element={<PicPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
