import axios from "axios";

const API_URL = "http://localhost:5000/api";
// Updated port to 5000 to match backend .env
const API_BASE_URL = "http://localhost:5000/api/admin";
const DASHBOARD_URL = `${API_BASE_URL}/dashboard`;
const PACKAGES_URL = `${API_BASE_URL}/service-packages`;

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
// Dashboard APIs
export const getDashboardOverview = () => axios.get(`${DASHBOARD_URL}/overview`, getAuthHeaders());
export const getRevenueChart = () => axios.get(`${DASHBOARD_URL}/revenue-chart`, getAuthHeaders());
export const getPackageDistribution = () => axios.get(`${DASHBOARD_URL}/package-distribution`, getAuthHeaders());
export const getPendingRequests = () => axios.get(`${DASHBOARD_URL}/pending-requests`, getAuthHeaders());
export const getRecentTickets = () => axios.get(`${DASHBOARD_URL}/recent-tickets`, getAuthHeaders());
export const getExpiringSubscriptions = () => axios.get(`${DASHBOARD_URL}/expiring-subscriptions`, getAuthHeaders());

// Service Package APIs
export const getServicePackages = () => axios.get(PACKAGES_URL, getAuthHeaders());
export const createServicePackage = (data) => axios.post(PACKAGES_URL, data, getAuthHeaders());
export const updateServicePackage = (id, data) => axios.put(`${PACKAGES_URL}/${id}`, data, getAuthHeaders());
export const deleteServicePackage = (id) => axios.delete(`${PACKAGES_URL}/${id}`, getAuthHeaders());
export const renewSubscription = (data) => axios.post(`${PACKAGES_URL}/renew`, data, getAuthHeaders());
export const getSubscriptionHistory = () => axios.get(`${PACKAGES_URL}/history`, getAuthHeaders());
export const getRestaurantsForRenewal = () => axios.get(`${PACKAGES_URL}/restaurants-for-renewal`, getAuthHeaders());
export const getRestaurantStatuses = () => axios.get(`${PACKAGES_URL}/active-subscriptions`, getAuthHeaders());

