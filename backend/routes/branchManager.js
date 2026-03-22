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
  getBranchStaff,
  createBranchStaff,
  updateStaffStatus,
  deleteBranchStaff,
  getTableOrderDetails,
  cancelOrderItem,
  createManagerServiceRequest,
} from "../controllers/branchManagerController.js";
import { authenticateToken, requireRole } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(authenticateToken);
// Dashboard (Manager only)
router.get("/dashboard/stats",          requireRole("BranchManager"), getManagerDashboardStats);
router.get("/dashboard/revenue-trend",  requireRole("BranchManager"), getManagerRevenueTrend);
router.get("/dashboard/order-status",   requireRole("BranchManager"), getManagerOrderStatus);
router.get("/dashboard/top-products",   requireRole("BranchManager"), getManagerTopProducts);
router.get("/dashboard/orders-heatmap", requireRole("BranchManager"), getManagerOrdersHeatmap);

// Tables (Manager + Staff)
router.get("/tables",              requireRole("BranchManager", "Staff"), getTables);
router.post("/tables",             requireRole("BranchManager", "Staff"), createTable);
router.post("/tables/merge",       requireRole("BranchManager", "Staff"), mergeTables);
router.put("/tables/:id",          requireRole("BranchManager", "Staff"), updateTable);
router.patch("/tables/:id/status", requireRole("BranchManager", "Staff"), updateTableStatus);
router.delete("/tables/:id",       requireRole("BranchManager"), deleteTable);
router.post("/confirm-order",      requireRole("BranchManager", "Staff"), confirmManagerOrder);

router.get("/tables/:id/bill",           requireRole("BranchManager", "Staff"), getBillByTable);
router.post("/tables/:id/checkout",      requireRole("BranchManager", "Staff"), processManagerCheckout);
router.get("/tables/:id/order-details",  requireRole("BranchManager", "Staff"), getTableOrderDetails);

router.get("/tables/:id/bill",     getBillByTable);
router.post("/tables/:id/checkout", processManagerCheckout);
router.post("/tables/:id/payment-link", createTablePaymentLink);
router.get("/tables/:id/payment-status/:orderCode", checkTablePaymentStatus);
// Orders (Manager + Staff)
router.get("/orders",              requireRole("BranchManager", "Staff"), getOrders);
router.patch("/orders/:id/status", requireRole("BranchManager", "Staff"), updateOrderStatus);
// Order items
router.patch("/order-items/:detailId/cancel", requireRole("BranchManager", "Staff"), cancelOrderItem);

// Service Requests (Manager + Staff)
router.get("/service-requests",       requireRole("BranchManager", "Staff"), getServiceRequests);
router.post("/service-requests",      requireRole("BranchManager", "Staff"), createManagerServiceRequest);
router.patch("/service-requests/:id", requireRole("BranchManager", "Staff"), updateServiceRequestStatus);

// Branch Info (Manager + Staff + Kitchen)
router.get("/branch-info",            requireRole("BranchManager", "Staff", "Kitchen"), getBranchInfo);
router.patch("/branch-info/cover",    requireRole("BranchManager"), upload.single("cover"), uploadBranchCoverImage);

// Staff Management (Manager only)
router.get("/staff",              requireRole("BranchManager"), getBranchStaff);
router.post("/staff",             requireRole("BranchManager"), createBranchStaff);
router.patch("/staff/:id/status", requireRole("BranchManager"), updateStaffStatus);
router.delete("/staff/:id",       requireRole("BranchManager"), deleteBranchStaff);

export default router;


