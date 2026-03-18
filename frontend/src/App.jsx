import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import AuthLayout from "./components/layout/AuthLayout";
import AdminLayout from "./components/admin/AdminLayout";

import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import AdminReports from "./pages/AdminReports";
import RestaurantManagement from "./pages/RestaurantManagement";
import AdminServicePackages from "./pages/AdminServicePackages";
import AdminRequests from "./pages/AdminRequests";
import RestaurantOwnerDashboard from "./pages/RestaurantOwnerDashboard";
import OwnerSettings from "./pages/OwnerSettings";
import RegisterRestaurant from "./pages/RegisterRestaurant";
import PendingStatus from "./pages/PendingStatus";
import OwnerBranches from "./pages/OwnerBranches";
import OwnerBranchSettings from "./pages/OwnerBranchSettings";
import OwnerCreateBranch from "./pages/OwnerCreateBranch";
import OwnerPaymentHistory from "./pages/OwnerPaymentHistory";
<<<<<<< HEAD
import OwnerKitchenTracking from "./pages/OwnerKitchenTracking";
import KitchenDisplaySystem from "./pages/KitchenDisplaySystem";
=======
import OwnerReports from "./pages/OwnerReports";
import OwnerMenu from "./pages/OwnerMenu";
import OwnerTickets from "./pages/OwnerTickets";
import OwnerStaff from "./pages/OwnerStaff";
import OwnerCreateManager from "./pages/OwnerCreateManager";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import BranchManagerDashboard from "./pages/BranchManagerDashboard";
import TableManagement from "./pages/TableManagement";
import CustomerMenu from "./pages/CustomerMenu";
>>>>>>> 57de24ba0c4f5f54eda132a094c4a7479e7c30d9
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <HomePage />
            </MainLayout>
          }
        />

        <Route
          path="/login"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />

        <Route
          path="/register"
          element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <AuthLayout>
              <ForgotPassword />
            </AuthLayout>
          }
        />

        <Route
          path="/reset-password"
          element={
            <AuthLayout>
              <ResetPassword />
            </AuthLayout>
          }
        />

        <Route path="/register-restaurant" element={<RegisterRestaurant />} />
        <Route path="/pending-status" element={<PendingStatus />} />
        <Route path="/menu" element={<CustomerMenu />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute requiredRole="Admin">
              <AdminReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/restaurants"
          element={
            <ProtectedRoute requiredRole="Admin">
              <AdminLayout>
                <RestaurantManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/service-packages"
          element={
            <ProtectedRoute requiredRole="Admin">
              <AdminServicePackages />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/requests"
          element={
            <ProtectedRoute requiredRole="Admin">
              <AdminRequests />
            </ProtectedRoute>
          }
        />

        {/* ===== RESTAURANT OWNER ROUTES ===== */}
        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <RestaurantOwnerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/settings"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <OwnerSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/branches"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <OwnerBranches />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/branches/new"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <OwnerCreateBranch />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/branches/:id"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <OwnerBranchSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/payment-history"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <OwnerPaymentHistory />
            </ProtectedRoute>
          }
        />

        <Route
<<<<<<< HEAD
          path="/owner/kitchen-tracking"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <OwnerKitchenTracking />
=======
          path="/owner/reports"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <OwnerReports />
>>>>>>> 57de24ba0c4f5f54eda132a094c4a7479e7c30d9
            </ProtectedRoute>
          }
        />

        <Route
<<<<<<< HEAD
          path="/owner/kds/:branchID"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <KitchenDisplaySystem />
            </ProtectedRoute>
          }
        />
=======
          path="/owner/menu"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <OwnerMenu />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/tickets"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <OwnerTickets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/staff"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <OwnerStaff />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/staff/new"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <OwnerCreateManager />
            </ProtectedRoute>
          }
        />

        {/* ===== BRANCH MANAGER ROUTES ===== */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute requiredRole="BranchManager">
              <BranchManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/tables"
          element={
            <ProtectedRoute requiredRole="BranchManager">
              <TableManagement />
            </ProtectedRoute>
          }
        />


>>>>>>> 57de24ba0c4f5f54eda132a094c4a7479e7c30d9
      </Routes>
    </BrowserRouter>
  );
}