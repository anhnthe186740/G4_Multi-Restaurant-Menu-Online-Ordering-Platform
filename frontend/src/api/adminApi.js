// src/api/adminApi.js
import axios from "axios";

// Updated port to 5000 to match backend .env
const API_BASE_URL = "http://localhost:5000/api/admin";
const DASHBOARD_URL = `${API_BASE_URL}/dashboard`;
const PACKAGES_URL = `${API_BASE_URL}/service-packages`;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
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

