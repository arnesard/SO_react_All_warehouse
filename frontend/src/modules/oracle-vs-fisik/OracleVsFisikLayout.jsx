import { Outlet } from "react-router-dom";
import PageHeader from "../../components/PageHeader";

function OracleVsFisikLayout() {
  return (
    <div>
      <PageHeader />
      <Outlet />
    </div>
  );
}

export default OracleVsFisikLayout;
