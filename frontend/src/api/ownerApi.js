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
export const createOwnerBranch = (data) => ownerAxios.post("/owner/branches", data);
export const getOwnerBranchById = (id) => ownerAxios.get(`/owner/branches/${id}`);
export const updateOwnerBranch = (id, data) => ownerAxios.put(`/owner/branches/${id}`, data);
export const toggleOwnerBranch = (id) => ownerAxios.patch(`/owner/branches/${id}/toggle`);
export const deleteOwnerBranch = (id) => ownerAxios.delete(`/owner/branches/${id}`);

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
export const updateOwnerMultipleItemStatus = (orderDetailIDs, status) =>
  ownerAxios.patch("/owner/kitchen-orders/update-multiple-status", { orderDetailIDs, status });
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
export const exportOwnerReport = (params) =>
  ownerAxios.get("/owner/reports/export", { params, responseType: 'blob' });

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

// Support Tickets (Owner ↔ Admin)
export const createOwnerTicket = (data) => ownerAxios.post("/owner/tickets", data);
export const getOwnerTickets = (params) => ownerAxios.get("/owner/tickets", { params });
export const getOwnerTicketById = (id) => ownerAxios.get(`/owner/tickets/${id}`);
export const replyOwnerTicket = (id, data) => ownerAxios.post(`/owner/tickets/${id}/reply`, data);

// Staff / Branch Manager Management
export const getOwnerManagers = () => ownerAxios.get("/owner/managers");
export const createOwnerManager = (data) => ownerAxios.post("/owner/managers", data);
export const updateOwnerManager = (id, data) => ownerAxios.put(`/owner/managers/${id}`, data);
export const toggleOwnerManager = (id) => ownerAxios.patch(`/owner/managers/${id}/toggle`);
export const deleteOwnerManager = (id) => ownerAxios.delete(`/owner/managers/${id}`);

export default ownerAxios;
