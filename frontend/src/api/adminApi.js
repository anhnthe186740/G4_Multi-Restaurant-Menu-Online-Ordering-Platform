import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Create a dedicated axios instance for admin APIs
const adminAxios = axios.create({
  baseURL: API_URL,
});

// Interceptor: tự động đính token MỚI NHẤT trước mỗi request
adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ========== ADMIN DASHBOARD APIs ==========
export const getDashboardOverview = () => adminAxios.get("/admin/dashboard/overview");
export const getRevenueChart = () => adminAxios.get("/admin/dashboard/revenue-chart");
export const getPackageDistribution = () => adminAxios.get("/admin/dashboard/package-distribution");
export const getPendingRequests = () => adminAxios.get("/admin/dashboard/pending-requests");
export const getRecentTickets = () => adminAxios.get("/admin/dashboard/recent-tickets");
export const getExpiringSubscriptions = () => adminAxios.get("/admin/dashboard/expiring-subscriptions");
export const getPaymentHistory = () => adminAxios.get("/admin/dashboard/payment-history");

// ========== ADMIN REPORTS APIs ==========
export const getAllReports = (params) => adminAxios.get("/admin/reports", { params });
export const getReportStats = () => adminAxios.get("/admin/reports/stats");
export const getReportById = (id) => adminAxios.get(`/admin/reports/${id}`);
export const updateReportStatus = (id, data) => adminAxios.put(`/admin/reports/${id}/status`, data);
export const addReportResponse = (id, data) => adminAxios.post(`/admin/reports/${id}/response`, data);

// ========== ADMIN RESTAURANT MANAGEMENT APIs ==========
export const getAllRestaurants = () => adminAxios.get("/admin/restaurants");
export const getRestaurantById = (id) => adminAxios.get(`/admin/restaurants/${id}`);
export const updateRestaurantStatus = (id, status) =>
  adminAxios.patch(`/admin/restaurants/${id}/status`, { status });
export const getRestaurantStatistics = () => adminAxios.get("/admin/restaurants/statistics");

// ========== ADMIN SERVICE PACKAGE APIs ==========
export const getServicePackages = () => adminAxios.get("/admin/service-packages");
export const createServicePackage = (data) => adminAxios.post("/admin/service-packages", data);
export const updateServicePackage = (id, data) => adminAxios.put(`/admin/service-packages/${id}`, data);
export const deleteServicePackage = (id) => adminAxios.delete(`/admin/service-packages/${id}`);
export const renewSubscription = (data) => adminAxios.post("/admin/service-packages/renew", data);
export const getSubscriptionHistory = () => adminAxios.get("/admin/service-packages/history");
export const getRestaurantsForRenewal = () => adminAxios.get("/admin/service-packages/restaurants-for-renewal");
export const getRestaurantStatuses = () => adminAxios.get("/admin/service-packages/active-subscriptions");

export default adminAxios;
