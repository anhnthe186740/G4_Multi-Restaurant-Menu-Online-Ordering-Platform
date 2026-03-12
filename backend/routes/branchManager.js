import express from "express";
import {
  getManagerDashboardStats,
  getManagerRevenueTrend,
  getManagerOrderStatus,
  getManagerTopProducts,
  getManagerOrdersHeatmap,
} from "../controllers/branchManagerController.js";
import { authenticateToken, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole("BranchManager"));

// Dashboard
router.get("/dashboard/stats",          getManagerDashboardStats);
router.get("/dashboard/revenue-trend",  getManagerRevenueTrend);
router.get("/dashboard/order-status",   getManagerOrderStatus);
router.get("/dashboard/top-products",   getManagerTopProducts);
router.get("/dashboard/orders-heatmap", getManagerOrdersHeatmap);

export default router;
