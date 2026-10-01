import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import MasterSizePage from "./pages/master size/MasterSizePage";
import BarcodeMonstockPage from "./pages/Barcode monstock/BarcodeMonstockPage";
import TagStockPage from "./pages/Tagstock/TagStockPage";
import PrintRekapPage from "./pages/Tagstock/PrintRekapPage";
import PrintTagStockPage from "./pages/Tagstock/PrintTagStockPage";
import TagStockNonBarcodePage from "./pages/Tagstock non barcode/TagStockNonBarcodePage";
import PrintTagStockNonBarcodePage from "./pages/Tagstock non barcode/PrintTagStockNonBarcodePage";
import PrintRekapNonBarcodePage from "./pages/Tagstock non barcode/PrintRekapNonBarcodePage";
import AppksoPage from "./pages/Appkso/AppksoPage";
import InputKso from "./pages/Input Kso/InputKsoPage";
import PrintRekapKso from "./pages/Appkso/PrintRekapKso";
import PrintKso from "./pages/Appkso/PrintKso";
import SnapshotPage from "./pages/Snapshot/SnapshotPage";
import ProgressSoPage from "./pages/Progress/ProgressSoPage";
import PicPage from "./pages/Master PIC/PicPage";
import InputKsoPage from "./pages/Input Kso/InputKsoPage";
import ModePicPage from "./pages/Input Kso/ModePicpage";
import ModeValidatorPage from "./pages/Input Kso/ModeValidatorPage";

// Import Login & User Management
import HalamanLoginpage from "./pages/User Login/HalamanLoginpage";
import Userpage from "./pages/User Login/Userpage";
import { getUserSession } from "./Utils/auth";

// Komponen Pembungkus Proteksi Login
function ProtectedRoute({ children }) {
  const user = getUserSession();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      {/* Rute Login Berdiri Sendiri */}
      <Route path="/login" element={<HalamanLoginpage />} />

      {/* Rute Utama dengan Navbar (Wajib Login) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="master-size" element={<MasterSizePage />} />
        <Route path="barcode-monstock" element={<BarcodeMonstockPage />} />
        <Route path="tag-stock" element={<TagStockPage />} />
        <Route
          path="tag-stock-nonbarcode"
          element={<TagStockNonBarcodePage />}
        />
        <Route path="appkso" element={<AppksoPage />} />
        <Route path="InputKSO" element={<InputKso />} />
        <Route path="InputKso" element={<InputKsoPage />} />
        <Route path="InputKso/pic" element={<ModePicPage />} />
        <Route path="InputKso/auditor" element={<ModeValidatorPage />} />
        <Route path="snapshot" element={<SnapshotPage />} />
        <Route path="progress-so" element={<ProgressSoPage />} />
        <Route path="pic" element={<PicPage />} />
        <Route path="InputKso" element={<InputKsoPage />} />

        {/* Khusus Super User */}
        <Route path="users" element={<Userpage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Rute Cetak */}
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
      <Route path="print/appkso/rekap" element={<PrintRekapKso />} />
      <Route path="print/appkso/kso" element={<PrintKso />} />
    </Routes>
  );
}

export default App;
