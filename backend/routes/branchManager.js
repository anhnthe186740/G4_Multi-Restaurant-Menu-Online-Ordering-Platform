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
  getServiceRequests,
  updateServiceRequestStatus,
  getBranchInfo,
  uploadBranchCoverImage,
  getBranchMenuItems,
  saveBranchMenu,
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

// Service Requests
router.get("/service-requests",       getServiceRequests);
router.patch("/service-requests/:id", updateServiceRequestStatus);

// Branch Info
router.get("/branch-info",            getBranchInfo);
router.patch("/branch-info/cover",    upload.single("cover"), uploadBranchCoverImage);

// Menu Management
router.get("/menu",                   getBranchMenuItems);
router.post("/menu/save",             saveBranchMenu);

export default router;


