import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
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
import { UsersPage } from "./pages/UsersPage";

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center bg-[#f5f9fd] text-sm text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<Navigate to={user.role === "ADMIN" ? "/dashboard" : user.role === "INVOICE_CREATOR" ? "/bills" : "/orders"} replace />} />
      <Route path="dashboard" element={user.role === "ADMIN" ? <DashboardPage /> : <Navigate to="/orders" replace />} />
      <Route path="customers" element={user.role === "INVOICE_CREATOR" ? <Navigate to="/bills" replace /> : <CustomersPage />} />
      <Route path="customers/:id" element={user.role === "INVOICE_CREATOR" ? <Navigate to="/bills" replace /> : <CustomerDetailPage />} />
      <Route path="orders" element={user.role === "INVOICE_CREATOR" ? <Navigate to="/bills" replace /> : <OrdersPage />} />
      <Route path="orders/new" element={user.role === "INVOICE_CREATOR" ? <Navigate to="/bills" replace /> : <NewOrderPage />} />
      <Route path="orders/:id" element={user.role === "INVOICE_CREATOR" ? <Navigate to="/bills" replace /> : <OrderDetailPage />} />
      <Route path="shops" element={user.role === "INVOICE_CREATOR" ? <Navigate to="/bills" replace /> : <ShopsPage />} />
      <Route path="masters" element={user.role === "INVOICE_CREATOR" ? <Navigate to="/bills" replace /> : <MastersPage />} />
      <Route path="designs" element={user.role === "INVOICE_CREATOR" ? <Navigate to="/bills" replace /> : <DesignsPage />} />
      <Route path="production" element={user.role === "INVOICE_CREATOR" ? <Navigate to="/bills" replace /> : <ProductionPage />} />
      <Route path="bills" element={(user.role === "ADMIN" || user.role === "INVOICE_CREATOR") ? <BillsPage /> : <Navigate to="/orders" replace />} />
      <Route path="bills/:id" element={(user.role === "ADMIN" || user.role === "INVOICE_CREATOR") ? <BillPage /> : <Navigate to="/orders" replace />} />
      <Route path="payments" element={user.role === "ADMIN" ? <PaymentsPage /> : <Navigate to="/orders" replace />} />
      <Route path="users" element={user.role === "ADMIN" ? <UsersPage /> : <Navigate to="/orders" replace />} />
      <Route path="home" element={<Navigate to={user.role === "INVOICE_CREATOR" ? "/bills" : "/orders"} replace />} />
      <Route path="overview" element={user.role === "INVOICE_CREATOR" ? <Navigate to="/bills" replace /> : <LandingPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>;
}

export default function App() {
  return <AuthProvider><Routes><Route path="/login" element={<LoginPage />} /><Route path="*" element={<ProtectedRoutes />} /></Routes></AuthProvider>;
}
