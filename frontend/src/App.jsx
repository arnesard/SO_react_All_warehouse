import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import FisikDashboardPage from "./pages/Dashboard/FisikDashboardPage";
import MasterSizePage from "./pages/master size/MasterSizePage";
import BarcodeMonstockPage from "./pages/Barcode monstock/BarcodeMonstockPage";
import TagStockPage from "./pages/Tagstock/TagStockPage";
import PrintRekapPage from "./pages/Tagstock/PrintRekapPage";
import PrintTagStockPage from "./pages/Tagstock/PrintTagStockPage";
import TagStockNonBarcodePage from "./pages/Tagstock non barcode/TagStockNonBarcodePage";
import PrintTagStockNonBarcodePage from "./pages/Tagstock non barcode/PrintTagStockNonBarcodePage";
import PrintRekapNonBarcodePage from "./pages/Tagstock non barcode/PrintRekapNonBarcodePage";
import AppksoPage from "./pages/Appkso/AppksoPage";
import SnapshotPage from "./pages/Snapshot/SnapshotPage";
import ProgressSoPage from "./pages/Progress/ProgressSoPage";
import PicPage from "./pages/Master PIC/PicPage";

function App() {
  return (
    <Routes>
      {/* 1. Halaman utama yang membutuhkan Navbar (dibungkus MainLayout) */}
      <Route element={<MainLayout />}>
        <Route index element={<FisikDashboardPage />} />
        <Route path="master-size" element={<MasterSizePage />} />
        <Route path="barcode-monstock" element={<BarcodeMonstockPage />} />
        <Route path="tag-stock" element={<TagStockPage />} />
        <Route
          path="tag-stock-nonbarcode"
          element={<TagStockNonBarcodePage />}
        />
        <Route path="appkso" element={<AppksoPage />} />
        <Route path="snapshot" element={<SnapshotPage />} />
        <Route path="progress-so" element={<ProgressSoPage />} />
        <Route path="pic" element={<PicPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* 2. Rute Khusus Cetak: Berdiri sendiri di LUAR MainLayout (Bersih tanpa Navbar) */}
      <Route path="print/tagstock/rekap" element={<PrintRekapPage />} />
      <Route path="print/tagstock/kso" element={<PrintTagStockPage />} />
      <Route
        path="print/tagstock-nonbarcode/kso"
        element={<PrintTagStockNonBarcodePage />}
      />
      <Route
        path="print/tagstock-nonbarcode/rekap"
        element={<PrintRekapNonBarcodePage />}
      />
    </Routes>
  );
}

export default App;
