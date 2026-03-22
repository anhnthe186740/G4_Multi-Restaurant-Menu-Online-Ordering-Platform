import express from "express";
import {
  getManagerDashboardStats,
  getManagerRevenueTrend,
  getManagerOrderStatus,
  getManagerTopProducts,
  getManagerOrdersHeatmap,
  getTables,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
  mergeTables,
  confirmManagerOrder,
  getBillByTable,
  processManagerCheckout,
  getOrders,
  updateOrderStatus,
  getServiceRequests,
  updateServiceRequestStatus,
  getBranchInfo,
  uploadBranchCoverImage,
  getTableOrderDetails,
  cancelOrderItem,
  createManagerServiceRequest,
} from "../controllers/branchManagerController.js";
import { authenticateToken, requireRole } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole("BranchManager"));

// Dashboard
router.get("/dashboard/stats",          getManagerDashboardStats);
router.get("/dashboard/revenue-trend",  getManagerRevenueTrend);
router.get("/dashboard/order-status",   getManagerOrderStatus);
router.get("/dashboard/top-products",   getManagerTopProducts);
router.get("/dashboard/orders-heatmap", getManagerOrdersHeatmap);

// Tables
router.get("/tables",              getTables);
router.post("/tables",             createTable);
router.post("/tables/merge",       mergeTables);       // ← đặt TRƯỚC /:id
router.put("/tables/:id",          updateTable);
router.patch("/tables/:id/status", updateTableStatus);
router.delete("/tables/:id",       deleteTable);
router.post("/confirm-order",      confirmManagerOrder);

router.get("/tables/:id/bill",           getBillByTable);
router.post("/tables/:id/checkout",      processManagerCheckout);
router.get("/tables/:id/order-details",  getTableOrderDetails);

// Orders
router.get("/orders",              getOrders);
router.patch("/orders/:id/status", updateOrderStatus);
// Order items
router.patch("/order-items/:detailId/cancel", cancelOrderItem);

// Service Requests
router.get("/service-requests",       getServiceRequests);
router.post("/service-requests",      createManagerServiceRequest);
router.patch("/service-requests/:id", updateServiceRequestStatus);

// Branch Info
router.get("/branch-info",            getBranchInfo);
router.patch("/branch-info/cover",    upload.single("cover"), uploadBranchCoverImage);

export default router;


