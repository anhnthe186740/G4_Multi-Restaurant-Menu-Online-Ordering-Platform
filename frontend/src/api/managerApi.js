import axios from "axios";

const API_URL = "http://localhost:5000/api";

const managerAxios = axios.create({ baseURL: API_URL });

managerAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Dashboard
export const getManagerDashboardStats   = (period = "today") => managerAxios.get("/manager/dashboard/stats",          { params: { period } });
export const getManagerRevenueTrend     = ()                  => managerAxios.get("/manager/dashboard/revenue-trend");
export const getManagerOrderStatus      = (period = "today") => managerAxios.get("/manager/dashboard/order-status",   { params: { period } });
export const getManagerTopProducts      = ()                  => managerAxios.get("/manager/dashboard/top-products");
export const getManagerOrdersHeatmap    = ()                  => managerAxios.get("/manager/dashboard/orders-heatmap");

export default managerAxios;
