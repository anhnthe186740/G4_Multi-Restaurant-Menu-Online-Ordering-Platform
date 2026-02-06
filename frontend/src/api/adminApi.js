import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Set default authorization header
const setAuthToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
};

setAuthToken();

// ========== ADMIN DASHBOARD APIs ==========
export const getDashboardOverview = () => axios.get(`${API_URL}/admin/dashboard/overview`);
export const getRevenueChart = () => axios.get(`${API_URL}/admin/dashboard/revenue-chart`);
export const getPackageDistribution = () => axios.get(`${API_URL}/admin/dashboard/package-distribution`);
export const getPendingRequests = () => axios.get(`${API_URL}/admin/dashboard/pending-requests`);
export const getRecentTickets = () => axios.get(`${API_URL}/admin/dashboard/recent-tickets`);
export const getExpiringSubscriptions = () => axios.get(`${API_URL}/admin/dashboard/expiring-subscriptions`);
export const getPaymentHistory = () => axios.get(`${API_URL}/admin/dashboard/payment-history`);

// ========== ADMIN REPORTS APIs ==========
export const getAllReports = (params) => axios.get(`${API_URL}/admin/reports`, { params });
export const getReportStats = () => axios.get(`${API_URL}/admin/reports/stats`);
export const getReportById = (id) => axios.get(`${API_URL}/admin/reports/${id}`);
export const updateReportStatus = (id, data) => axios.put(`${API_URL}/admin/reports/${id}/status`, data);
export const addReportResponse = (id, data) => axios.post(`${API_URL}/admin/reports/${id}/response`, data);

// ========== ADMIN RESTAURANT MANAGEMENT APIs ==========
export const getAllRestaurants = () => axios.get(`${API_URL}/admin/restaurants`);
export const getRestaurantById = (id) => axios.get(`${API_URL}/admin/restaurants/${id}`);
export const updateRestaurantStatus = (id, status) => 
  axios.patch(`${API_URL}/admin/restaurants/${id}/status`, { status });
export const getRestaurantStatistics = () => axios.get(`${API_URL}/admin/restaurants/statistics`);

export default {
  getDashboardOverview,
  getRevenueChart,
  getPackageDistribution,
  getPendingRequests,
  getRecentTickets,
  getExpiringSubscriptions,
  getPaymentHistory,
  getAllReports,
  getReportStats,
  getReportById,
  updateReportStatus,
  addReportResponse,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurantStatus,
  getRestaurantStatistics,
};
