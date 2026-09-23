import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { OrdersPage } from "./pages/OrdersPage";
import { NewOrderPage } from "./pages/NewOrderPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { ShopsPage } from "./pages/ShopsPage";
import { MastersPage } from "./pages/MastersPage";
import { DesignsPage } from "./pages/DesignsPage";
import { ProductionPage } from "./pages/ProductionPage";
import { BillsPage } from "./pages/BillsPage";
import { BillPage } from "./pages/BillPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/new" element={<NewOrderPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="shops" element={<ShopsPage />} />
        <Route path="masters" element={<MastersPage />} />
        <Route path="designs" element={<DesignsPage />} />
        <Route path="production" element={<ProductionPage />} />
        <Route path="bills" element={<BillsPage />} />
        <Route path="bills/:id" element={<BillPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="home" element={<Navigate to="/dashboard" replace />} />
        <Route path="overview" element={<LandingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
