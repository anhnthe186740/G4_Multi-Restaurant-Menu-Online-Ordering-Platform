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
  createOwnerBranch,
  deleteOwnerBranch,
  getPaymentHistory,
  getKitchenOrders,
  updateItemStatus,
  updateMultipleItemStatus,
  getRevenueByPeriod,
  getBranchSummaryReport,
  getProductRevenueStats,
  getDetailedOrdersReport,
  getOrdersHeatmap_Owner,
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
  // Support Tickets
  createOwnerTicket,
  getOwnerTickets,
  getOwnerTicketById,
  replyOwnerTicket,
  // Manager / Staff Management
  getOwnerManagers,
  createOwnerManager,
  toggleOwnerManager,
  deleteOwnerManager,
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
router.post("/branches", createOwnerBranch);
router.get("/branches/:id", getOwnerBranchById);
router.put("/branches/:id", updateOwnerBranch);
router.patch("/branches/:id/toggle", toggleOwnerBranch);
router.delete("/branches/:id", deleteOwnerBranch);

// Payment History
router.get("/payment-history", getPaymentHistory);

// Kitchen Display System (KDS)
router.get("/branches/:branchID/kitchen-orders", getKitchenOrders);
router.patch("/kitchen-orders/update-status", updateItemStatus);
router.patch("/kitchen-orders/update-multiple-status", updateMultipleItemStatus);

// Reports
router.get("/reports/revenue-trend", getRevenueByPeriod);
router.get("/reports/branch-summary", getBranchSummaryReport);
router.get("/reports/product-stats", getProductRevenueStats);
router.get("/reports/orders-detail", getDetailedOrdersReport);
router.get("/reports/orders-heatmap", getOrdersHeatmap_Owner);

// ===== MENU MANAGEMENT =====
// Categories
router.get("/menu/categories", getMenuCategories);
router.post("/menu/categories", createMenuCategory);
router.put("/menu/categories/:id", updateMenuCategory);
router.delete("/menu/categories/:id", deleteMenuCategory);

// Products (menu items)
router.get("/menu/items", getMenuItems);
router.post("/menu/items", createMenuItem);
router.put("/menu/items/:id", updateMenuItem);
router.delete("/menu/items/:id", deleteMenuItem);
router.patch("/menu/items/:id/toggle", toggleMenuItem);

// ===== SUPPORT TICKETS (Owner ↔ Admin) =====
router.post("/tickets", createOwnerTicket);
router.get("/tickets", getOwnerTickets);
router.get("/tickets/:id", getOwnerTicketById);
router.post("/tickets/:id/reply", replyOwnerTicket);

// ===== MANAGER / STAFF MANAGEMENT =====
router.get("/managers", getOwnerManagers);
router.post("/managers", createOwnerManager);
router.patch("/managers/:id/toggle", toggleOwnerManager);
router.delete("/managers/:id", deleteOwnerManager);

export default router;
