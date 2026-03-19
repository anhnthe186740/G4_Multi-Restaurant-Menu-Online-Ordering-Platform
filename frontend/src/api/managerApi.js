import axios from "axios";

const API_URL = "http://localhost:5000/api/";

const managerAxios = axios.create({ baseURL: API_URL });

managerAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Dashboard
export const getManagerDashboardStats   = (period = "today") => managerAxios.get("manager/dashboard/stats",          { params: { period } });
export const getManagerRevenueTrend     = ()                  => managerAxios.get("manager/dashboard/revenue-trend");
export const getManagerOrderStatus      = (period = "today") => managerAxios.get("manager/dashboard/order-status",   { params: { period } });
export const getManagerTopProducts      = ()                  => managerAxios.get("manager/dashboard/top-products");
export const getManagerOrdersHeatmap    = ()                  => managerAxios.get("manager/dashboard/orders-heatmap");

// Tables
export const getManagerTables          = ()         => managerAxios.get("manager/tables");
export const createManagerTable        = (data)     => managerAxios.post("manager/tables", data);
export const mergeManagerTables        = (sourceTableId, targetTableId) => managerAxios.post("manager/tables/merge", { sourceTableId, targetTableId });
export const updateManagerTable        = (id, data) => managerAxios.put(`manager/tables/${id}`, data);
export const updateManagerTableStatus  = (id, status) => managerAxios.patch(`manager/tables/${id}/status`, { status });
export const deleteManagerTable        = (id)       => managerAxios.delete(`manager/tables/${id}`);
export const confirmManagerOrder       = (data)     => managerAxios.post("manager/confirm-order", data);

// Service Requests
export const getManagerServiceRequests         = (params)     => managerAxios.get("manager/service-requests", { params });
export const updateManagerServiceRequestStatus = (id, status) => managerAxios.patch(`manager/service-requests/${id}`, { status });

export default managerAxios;
