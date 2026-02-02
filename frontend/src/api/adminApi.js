// src/api/adminApi.js
import axios from "axios";

const API_URL = "http://localhost:5000/api/admin/dashboard";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export const getDashboardOverview = () => {
  return axios.get(`${API_URL}/overview`, getAuthHeaders());
};

export const getRevenueChart = () => {
  return axios.get(`${API_URL}/revenue-chart`, getAuthHeaders());
};

export const getPackageDistribution = () => {
  return axios.get(`${API_URL}/package-distribution`, getAuthHeaders());
};

export const getPendingRequests = () => {
  return axios.get(`${API_URL}/pending-requests`, getAuthHeaders());
};

export const getRecentTickets = () => {
  return axios.get(`${API_URL}/recent-tickets`, getAuthHeaders());
};

export const getExpiringSubscriptions = () => {
  return axios.get(`${API_URL}/expiring-subscriptions`, getAuthHeaders());
};

