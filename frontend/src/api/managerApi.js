import axios from "axios";

const API_URL = `http://${window.location.hostname}:5000/api/`;

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

// Checkout & Bill
export const getManagerBillByTable     = (id)       => managerAxios.get(`manager/tables/${id}/bill`);
export const processManagerCheckout    = (id, data) => managerAxios.post(`manager/tables/${id}/checkout`, data);
export const createTablePaymentLink    = (id)       => managerAxios.post(`manager/tables/${id}/payment-link`);
export const checkTablePaymentStatus   = (id, orderCode) => managerAxios.get(`manager/tables/${id}/payment-status/${orderCode}`);

// Orders
export const getManagerOrders          = (status)   => managerAxios.get("manager/orders", { params: status ? { status } : {} });
export const updateManagerOrderStatus  = (id, orderStatus) => managerAxios.patch(`manager/orders/${id}/status`, { orderStatus });


// Branch Info
export const getManagerBranchInfo = () => managerAxios.get("manager/branch-info");
export const updateManagerBranchCover = (formData) => managerAxios.patch("manager/branch-info/cover", formData, {
    headers: { "Content-Type": "multipart/form-data" }
});

// Order Details per Table (with itemStatus from DB)
export const getManagerTableOrderDetails  = (id)       => managerAxios.get(`manager/tables/${id}/order-details`);
export const cancelManagerOrderItem       = (detailId, cancelQuantity) => managerAxios.patch(`manager/order-items/${detailId}/cancel`, { cancelQuantity });

// Service Requests
export const getManagerServiceRequests         = (params)     => managerAxios.get("manager/service-requests", { params });
export const createManagerServiceRequest       = (data)       => managerAxios.post("manager/service-requests", data);
export const updateManagerServiceRequestStatus = (id, status) => managerAxios.patch(`manager/service-requests/${id}`, { status });

// Staff Management
export const getBranchStaff = () => managerAxios.get("manager/staff");
export const createBranchStaff = (data) => managerAxios.post("manager/staff", data);
export const updateStaffStatus = (id, status) => managerAxios.patch(`manager/staff/${id}/status`, { status });
export const deleteBranchStaff = (id) => managerAxios.delete(`manager/staff/${id}`);

export default managerAxios;
