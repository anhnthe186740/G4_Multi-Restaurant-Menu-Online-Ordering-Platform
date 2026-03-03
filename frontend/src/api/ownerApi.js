import axios from "axios";

const API_URL = "http://localhost:5000/api";

const ownerAxios = axios.create({ baseURL: API_URL });

ownerAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

export const getOwnerDashboardStats = (params) => ownerAxios.get("/owner/dashboard/stats", { params });
export const getOwnerBranchRevenue = () => ownerAxios.get("/owner/dashboard/branch-revenue");
export const getOwnerTopProducts = () => ownerAxios.get("/owner/dashboard/top-products");
export const getOwnerOrdersByHour = () => ownerAxios.get("/owner/dashboard/orders-by-hour");
export const getOwnerBranchPerformance = () => ownerAxios.get("/owner/dashboard/branch-performance");

// Restaurant info
export const getOwnRestaurantInfo = () => ownerAxios.get("/owner/restaurant");
export const updateOwnRestaurantInfo = (data) => ownerAxios.put("/owner/restaurant", data);

// Branch management
export const getOwnerBranches = () => ownerAxios.get("/owner/branches");
export const getOwnerBranchById = (id) => ownerAxios.get(`/owner/branches/${id}`);
export const updateOwnerBranch = (id, data) => ownerAxios.put(`/owner/branches/${id}`, data);
export const toggleOwnerBranch = (id) => ownerAxios.patch(`/owner/branches/${id}/toggle`);

// Payment History
export const getOwnerPaymentHistory = (params) =>
  ownerAxios.get("/owner/payment-history", { params });

// Reports
export const getOwnerRevenueTrend = (params) =>
  ownerAxios.get("/owner/reports/revenue-trend", { params });
export const getOwnerBranchSummary = (params) =>
  ownerAxios.get("/owner/reports/branch-summary", { params });
export const getOwnerProductStats = (params) =>
  ownerAxios.get("/owner/reports/product-stats", { params });
export const getOwnerOrdersDetail = (params) =>
  ownerAxios.get("/owner/reports/orders-detail", { params });
export const getOwnerOrdersHeatmap = (params) =>
  ownerAxios.get("/owner/reports/orders-heatmap", { params });

// Menu management
export const getOwnerMenuCategories = () => ownerAxios.get("/owner/menu/categories");
export const getOwnerMenuItems = (params) => ownerAxios.get("/owner/menu/items", { params });
export const createOwnerMenuItem = (data) => ownerAxios.post("/owner/menu/items", data);
export const updateOwnerMenuItem = (id, data) => ownerAxios.put(`/owner/menu/items/${id}`, data);
export const deleteOwnerMenuItem = (id) => ownerAxios.delete(`/owner/menu/items/${id}`);
export const toggleOwnerMenuItem = (id) => ownerAxios.patch(`/owner/menu/items/${id}/toggle`);

// Menu categories (not previously exported)
export const createOwnerMenuCategory = (data) => ownerAxios.post("/owner/menu/categories", data);
export const updateOwnerMenuCategory = (id, data) => ownerAxios.put(`/owner/menu/categories/${id}`, data);
export const deleteOwnerMenuCategory = (id) => ownerAxios.delete(`/owner/menu/categories/${id}`);

// generic upload endpoint (must use FormData with field "file")
export const uploadOwnerFile = (formData) => ownerAxios.post("/upload", formData);

export default ownerAxios;
