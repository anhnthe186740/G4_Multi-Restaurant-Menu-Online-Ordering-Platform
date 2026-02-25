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
import OwnerPaymentHistory from "./pages/OwnerPaymentHistory";
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

        <Route path="/register-restaurant" element={<RegisterRestaurant />} />
        <Route path="/pending-status" element={<PendingStatus />} />

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
      </Routes>
    </BrowserRouter>
  );
}
