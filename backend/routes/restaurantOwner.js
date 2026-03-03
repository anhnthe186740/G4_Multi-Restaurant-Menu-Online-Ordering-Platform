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
<<<<<<< HEAD
  getRevenueByPeriod,
  getBranchSummaryReport,
  getProductRevenueStats,
  getDetailedOrdersReport,
  getOrdersHeatmap_Owner,
=======
  // Menu management
  getMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItem,
>>>>>>> db60ffbbcba7219f9c539f7cea7e60467bb67366
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

// Restaurant info
router.get("/restaurant", getOwnerRestaurantInfo);
router.put("/restaurant", updateOwnerRestaurantInfo);

// Branch Management
router.get("/branches", getOwnerBranches);
router.get("/branches/:id", getOwnerBranchById);
router.put("/branches/:id", updateOwnerBranch);
router.patch("/branches/:id/toggle", toggleOwnerBranch);

// Payment History
router.get("/payment-history", getPaymentHistory);

<<<<<<< HEAD
// Reports
router.get("/reports/revenue-trend", getRevenueByPeriod);
router.get("/reports/branch-summary", getBranchSummaryReport);
router.get("/reports/product-stats", getProductRevenueStats);
router.get("/reports/orders-detail", getDetailedOrdersReport);
router.get("/reports/orders-heatmap", getOrdersHeatmap_Owner);

export default router;
=======
// ===== MENU MANAGEMENT =====
// Categories
router.get("/menu/categories", getMenuCategories);
router.post("/menu/categories", createMenuCategory);
router.put("/menu/categories/:id", updateMenuCategory);
router.delete("/menu/categories/:id", deleteMenuCategory);
>>>>>>> db60ffbbcba7219f9c539f7cea7e60467bb67366

// Products (menu items)
router.get("/menu/items", getMenuItems);
router.post("/menu/items", createMenuItem);
router.put("/menu/items/:id", updateMenuItem);
router.delete("/menu/items/:id", deleteMenuItem);
router.patch("/menu/items/:id/toggle", toggleMenuItem);

export default router;
