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

// Restaurant info
export const getOwnRestaurantInfo = () => ownerAxios.get("/owner/restaurant");
export const updateOwnRestaurantInfo = (data) => ownerAxios.put("/owner/restaurant", data);

export default ownerAxios;

// Branch management
export const getOwnerBranches = () => ownerAxios.get("/owner/branches");
export const getOwnerBranchById = (id) => ownerAxios.get(`/owner/branches/${id}`);
export const updateOwnerBranch = (id, data) => ownerAxios.put(`/owner/branches/${id}`, data);
export const toggleOwnerBranch = (id) => ownerAxios.patch(`/owner/branches/${id}/toggle`);

// Payment History
export const getOwnerPaymentHistory = (params) =>
  ownerAxios.get("/owner/payment-history", { params });

export default ownerAxios;


