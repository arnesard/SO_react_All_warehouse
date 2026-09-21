import { Outlet } from "react-router-dom";
import PageHeader from "../../components/PageHeader";

function OracleVsFisikLayout() {
  return (
    <div>
      <PageHeader
        title="Stock Oracle vs Aktual Fisik"
        description="Analisa selisih data Oracle terhadap jumlah stok fisik di area penyimpanan, per gedung dan per lot."
      />
      <Outlet />
    </div>
  );
}

export default OracleVsFisikLayout;
