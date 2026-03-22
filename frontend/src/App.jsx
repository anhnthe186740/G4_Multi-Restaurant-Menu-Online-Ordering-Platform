import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
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
import OwnerSettings from "./pages/OwnerSettings";
import RegisterRestaurant from "./pages/RegisterRestaurant";
import PendingStatus from "./pages/PendingStatus";
import OwnerBranches from "./pages/OwnerBranches";
import OwnerBranchSettings from "./pages/OwnerBranchSettings";
import OwnerCreateBranch from "./pages/OwnerCreateBranch";
import OwnerPaymentHistory from "./pages/OwnerPaymentHistory";
import OwnerKitchenTracking from "./pages/OwnerKitchenTracking";
import KitchenDisplaySystem from "./pages/KitchenDisplaySystem";
import OwnerOverview from "./pages/OwnerOverview";
import OwnerMenu from "./pages/OwnerMenu";
import OwnerTickets from "./pages/OwnerTickets";
import OwnerStaff from "./pages/OwnerStaff";
import OwnerCreateManager from "./pages/OwnerCreateManager";
import RestaurantServicePackage from "./pages/RestaurantServicePackage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import BranchManagerDashboard from "./pages/BranchManagerDashboard";
import TableManagement from "./pages/TableManagement";
import ManagerServiceRequests from "./pages/ManagerServiceRequests";
import ManagerBranchInfo from "./pages/ManagerBranchInfo";
import CustomerMenu from "./pages/CustomerMenu";
import OrderManagement from "./pages/OrderManagement";
import ManagerPaymentHistory from "./pages/ManagerPaymentHistory";
import ManagerStaff from "./pages/ManagerStaff";
import ManagerCreateStaff from "./pages/ManagerCreateStaff";
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionGuard from "./components/SubscriptionGuard";
import SelfOrderingMenu from "./pages/SelfOrderingMenu";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
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
        <Route path="/self-order" element={<SelfOrderingMenu />} />

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

              <SubscriptionGuard>
                
              <OwnerOverview />
              </SubscriptionGuard>


            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/service-packages"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <RestaurantServicePackage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/settings"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <SubscriptionGuard>
                <OwnerSettings />
              </SubscriptionGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/branches"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <SubscriptionGuard>
                <OwnerBranches />
              </SubscriptionGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/branches/new"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <SubscriptionGuard>
                <OwnerCreateBranch />
              </SubscriptionGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/branches/:id"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <SubscriptionGuard>
                <OwnerBranchSettings />
              </SubscriptionGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/payment-history"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <SubscriptionGuard>
                <OwnerPaymentHistory />
              </SubscriptionGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/kitchen-tracking"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <SubscriptionGuard>
                <OwnerKitchenTracking />
              </SubscriptionGuard>
            </ProtectedRoute>
          }
        />



        <Route
          path="/owner/kds/:branchID"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <SubscriptionGuard>
                <KitchenDisplaySystem />
              </SubscriptionGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/menu"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <SubscriptionGuard>
                <OwnerMenu />
              </SubscriptionGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/tickets"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <SubscriptionGuard>
                <OwnerTickets />
              </SubscriptionGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/staff"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <SubscriptionGuard>
                <OwnerStaff />
              </SubscriptionGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/staff/new"
          element={
            <ProtectedRoute requiredRole="RestaurantOwner">
              <SubscriptionGuard>
                <OwnerCreateManager />
              </SubscriptionGuard>
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
            <ProtectedRoute requiredRole={["BranchManager", "Staff"]}>
              <TableManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/kds"
          element={
            <ProtectedRoute requiredRole={["BranchManager", "Staff", "Kitchen"]}>
              <KitchenDisplaySystem />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/service-requests"
          element={
            <ProtectedRoute requiredRole={["BranchManager", "Staff"]}>
              <ManagerServiceRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen/kds"
          element={
            <ProtectedRoute requiredRole={["BranchManager", "Kitchen", "Staff"]}>
              <KitchenDisplaySystem />
            </ProtectedRoute>
          }
        />
          <Route
          path="/manager/info"
          element={
            <ProtectedRoute requiredRole="BranchManager">
              <ManagerBranchInfo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/payment-history"
          element={
            <ProtectedRoute requiredRole="BranchManager">
              <ManagerPaymentHistory />
       </ProtectedRoute>
           
           <Route 
          path="/manager/staff"
          element={
            <ProtectedRoute requiredRole="BranchManager">
              <ManagerStaff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/staff/new"
          element={
            <ProtectedRoute requiredRole="BranchManager">
              <ManagerCreateStaff />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}