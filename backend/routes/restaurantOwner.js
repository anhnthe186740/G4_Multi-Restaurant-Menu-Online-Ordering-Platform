import express from "express";
import {
  getDashboardStats,
  getBranchRevenue,
  getTopProducts,
  getOrdersByHour,
  getBranchPerformance,
  getOwnerRestaurantInfo,
  updateOwnerRestaurantInfo,
  getOwnerBranches,
  getOwnerBranchById,
  updateOwnerBranch,
  toggleOwnerBranch,
  getPaymentHistory,
} from "../controllers/restaurantOwnerController.js";
import { authenticateToken, requireRole } from "../middlewares/authMiddleware.js";


const router = express.Router();

// Yêu cầu đăng nhập và role RestaurantOwner
router.use(authenticateToken);
router.use(requireRole("RestaurantOwner"));

router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/branch-revenue", getBranchRevenue);
router.get("/dashboard/top-products", getTopProducts);
router.get("/dashboard/orders-by-hour", getOrdersByHour);
router.get("/dashboard/branch-performance", getBranchPerformance);

// Restaurant info routes (owner manages their own restaurant)
router.get("/restaurant", getOwnerRestaurantInfo);
router.put("/restaurant", updateOwnerRestaurantInfo);
// Branch Management
router.get("/branches", getOwnerBranches);
router.get("/branches/:id", getOwnerBranchById);
router.put("/branches/:id", updateOwnerBranch);
router.patch("/branches/:id/toggle", toggleOwnerBranch);

// Payment History
router.get("/payment-history", getPaymentHistory);

export default router;

