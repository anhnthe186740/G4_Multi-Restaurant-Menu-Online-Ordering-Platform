import axios from "axios";

const API_URL = "http://localhost:5000/api";

const ownerAxios = axios.create({ baseURL: API_URL });

ownerAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

export const getOwnerDashboardStats   = () => ownerAxios.get("/owner/dashboard/stats");
export const getOwnerBranchRevenue    = () => ownerAxios.get("/owner/dashboard/branch-revenue");
export const getOwnerTopProducts      = () => ownerAxios.get("/owner/dashboard/top-products");
export const getOwnerOrdersByHour     = () => ownerAxios.get("/owner/dashboard/orders-by-hour");
export const getOwnerBranchPerformance = () => ownerAxios.get("/owner/dashboard/branch-performance");

export default ownerAxios;
