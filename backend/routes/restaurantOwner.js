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
  exportOwnerReport,
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
  updateOwnerManager,
  // Promotions (Auto-Promotions)
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  approvePromotion,
  rejectPromotion,
  getPromotionReport,
  togglePromotion,
} from "../controllers/restaurantOwnerController.js";
import { authenticateToken, requireRole } from "../middlewares/authMiddleware.js";
import checkSubscription from "../middlewares/checkSub.js";

const router = express.Router();

// Yêu cầu đăng nhập
router.use(authenticateToken);

// Yêu cầu Subscription hợp lệ với owner (nếu chưa mua/hết hạn => báo lỗi 403)
router.use(checkSubscription);

// Dashboard (Owner only)
router.get("/dashboard/stats", requireRole("RestaurantOwner"), getDashboardStats);
router.get("/dashboard/branch-revenue", requireRole("RestaurantOwner"), getBranchRevenue);
router.get("/dashboard/top-products", requireRole("RestaurantOwner"), getTopProducts);
router.get("/dashboard/orders-by-hour", requireRole("RestaurantOwner"), getOrdersByHour);
router.get("/dashboard/branch-performance", requireRole("RestaurantOwner"), getBranchPerformance);

// Restaurant info (Owner only)
router.get("/restaurant", requireRole("RestaurantOwner"), getOwnerRestaurantInfo);
router.put("/restaurant", requireRole("RestaurantOwner"), updateOwnerRestaurantInfo);

// Branch Management (Owner only)
router.get("/branches", requireRole("RestaurantOwner"), getOwnerBranches);
router.post("/branches", requireRole("RestaurantOwner"), createOwnerBranch);
router.get("/branches/:id", requireRole("RestaurantOwner"), getOwnerBranchById);
router.put("/branches/:id", requireRole("RestaurantOwner"), updateOwnerBranch);
router.patch("/branches/:id/toggle", requireRole("RestaurantOwner"), toggleOwnerBranch);
router.delete("/branches/:id", requireRole("RestaurantOwner"), deleteOwnerBranch);

// Payment History (Owner only)
router.get("/payment-history", requireRole("RestaurantOwner"), getPaymentHistory);

// Kitchen Display System (KDS) - Shared between Manager and Kitchen
router.get("/branches/:branchID/kitchen-orders", requireRole("BranchManager", "Kitchen"), getKitchenOrders);
router.patch("/kitchen-orders/update-status", requireRole("BranchManager", "Kitchen"), updateItemStatus);
router.patch("/kitchen-orders/update-multiple-status", requireRole("BranchManager", "Kitchen"), updateMultipleItemStatus);

// Reports (Owner only)
router.get("/reports/revenue-trend", requireRole("RestaurantOwner"), getRevenueByPeriod);
router.get("/reports/branch-summary", requireRole("RestaurantOwner"), getBranchSummaryReport);
router.get("/reports/product-stats", requireRole("RestaurantOwner"), getProductRevenueStats);
router.get("/reports/orders-detail", requireRole("RestaurantOwner"), getDetailedOrdersReport);
router.get("/reports/orders-heatmap", requireRole("RestaurantOwner"), getOrdersHeatmap_Owner);
router.get("/reports/export", requireRole("RestaurantOwner"), exportOwnerReport);

// ===== MENU MANAGEMENT (Owner only) =====
// Categories
router.get("/menu/categories", requireRole("RestaurantOwner"), getMenuCategories);
router.post("/menu/categories", requireRole("RestaurantOwner"), createMenuCategory);
router.put("/menu/categories/:id", requireRole("RestaurantOwner"), updateMenuCategory);
router.delete("/menu/categories/:id", requireRole("RestaurantOwner"), deleteMenuCategory);

// Products (menu items)
router.get("/menu/items", requireRole("RestaurantOwner"), getMenuItems);
router.post("/menu/items", requireRole("RestaurantOwner"), createMenuItem);
router.put("/menu/items/:id", requireRole("RestaurantOwner"), updateMenuItem);
router.delete("/menu/items/:id", requireRole("RestaurantOwner"), deleteMenuItem);
router.patch("/menu/items/:id/toggle", requireRole("RestaurantOwner"), toggleMenuItem);

// ===== SUPPORT TICKETS (Owner ↔ Admin) =====
router.post("/tickets", requireRole("RestaurantOwner"), createOwnerTicket);
router.get("/tickets", requireRole("RestaurantOwner"), getOwnerTickets);
router.get("/tickets/:id", requireRole("RestaurantOwner"), getOwnerTicketById);
router.post("/tickets/:id/reply", requireRole("RestaurantOwner"), replyOwnerTicket);

// ===== MANAGER / STAFF MANAGEMENT (Owner only) =====
router.get("/managers", requireRole("RestaurantOwner"), getOwnerManagers);
router.post("/managers", requireRole("RestaurantOwner"), createOwnerManager);
router.put("/managers/:id", requireRole("RestaurantOwner"), updateOwnerManager);
router.patch("/managers/:id/toggle", requireRole("RestaurantOwner"), toggleOwnerManager);
router.delete("/managers/:id", requireRole("RestaurantOwner"), deleteOwnerManager);

// ===== PROMOTIONS / AUTO-PROMOTIONS (Owner only) =====
router.get("/promotions/report", requireRole("RestaurantOwner"), getPromotionReport);
router.get("/promotions",         requireRole("RestaurantOwner"), getPromotions);
router.post("/promotions",        requireRole("RestaurantOwner"), createPromotion);
router.put("/promotions/:id",     requireRole("RestaurantOwner"), updatePromotion);
router.delete("/promotions/:id",  requireRole("RestaurantOwner"), deletePromotion);
router.patch("/promotions/:id/approve", requireRole("RestaurantOwner"), approvePromotion);
router.patch("/promotions/:id/reject",  requireRole("RestaurantOwner"), rejectPromotion);
router.patch("/promotions/:id/toggle",  requireRole("RestaurantOwner"), togglePromotion);

export default router;
