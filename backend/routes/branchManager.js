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
  createTablePaymentLink,
  checkTablePaymentStatus,
  getOrders,
  updateOrderStatus,
  getServiceRequests,
  updateServiceRequestStatus,
  getBranchInfo,
  uploadBranchCoverImage,
  getPaymentHistory,
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

router.get("/tables/:id/bill",     getBillByTable);
router.post("/tables/:id/checkout", processManagerCheckout);
router.post("/tables/:id/payment-link", createTablePaymentLink);
router.get("/tables/:id/payment-status/:orderCode", checkTablePaymentStatus);

// Orders
router.get("/orders",              getOrders);
router.patch("/orders/:id/status", updateOrderStatus);
router.get("/payment-history",    getPaymentHistory);
// Service Requests
router.get("/service-requests",       getServiceRequests);
router.patch("/service-requests/:id", updateServiceRequestStatus);

// Branch Info
router.get("/branch-info",            getBranchInfo);
router.patch("/branch-info/cover",    upload.single("cover"), uploadBranchCoverImage);

export default router;


