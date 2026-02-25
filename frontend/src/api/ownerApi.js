import axios from "axios";

const API_URL = "http://localhost:5000/api";

const ownerAxios = axios.create({ baseURL: API_URL });

ownerAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

export const getOwnerDashboardStats = () => ownerAxios.get("/owner/dashboard/stats");
export const getOwnerBranchRevenue = () => ownerAxios.get("/owner/dashboard/branch-revenue");
export const getOwnerTopProducts = () => ownerAxios.get("/owner/dashboard/top-products");
export const getOwnerOrdersByHour = () => ownerAxios.get("/owner/dashboard/orders-by-hour");
export const getOwnerBranchPerformance = () => ownerAxios.get("/owner/dashboard/branch-performance");

// Branch management
export const getOwnerBranches = () => ownerAxios.get("/owner/branches");
export const getOwnerBranchById = (id) => ownerAxios.get(`/owner/branches/${id}`);
export const updateOwnerBranch = (id, data) => ownerAxios.put(`/owner/branches/${id}`, data);
export const toggleOwnerBranch = (id) => ownerAxios.patch(`/owner/branches/${id}/toggle`);

// Payment History
export const getOwnerPaymentHistory = (params) =>
  ownerAxios.get("/owner/payment-history", { params });

// Kitchen Display System (KDS)
export const getOwnerKitchenOrders = (branchID, categoryID) =>
  ownerAxios.get(`/owner/branches/${branchID}/kitchen-orders`, {
    params: { categoryID },
  });
export const updateOwnerItemStatus = (orderDetailID, status) =>
  ownerAxios.patch("/owner/kitchen-orders/update-status", { orderDetailID, status });

export default ownerAxios;


