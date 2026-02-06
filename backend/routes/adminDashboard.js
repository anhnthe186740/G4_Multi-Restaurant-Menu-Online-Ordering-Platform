import express from "express";
import {
  getOverview,
  getRevenueChart,
  getPackageDistribution,
  getPendingRequests,
  getRecentTickets,
  getExpiringSubscriptions
} from "../controllers/adminDashboardController.js";
import { authenticateToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply authentication to ALL admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Test route to verify router is working
router.get("/test", (req, res) => {
  res.json({ message: "Admin dashboard routes are working!" });
});

// Dashboard statistics endpoints
router.get("/overview", getOverview);
router.get("/revenue-chart", getRevenueChart);
router.get("/package-distribution", getPackageDistribution);
router.get("/pending-requests", getPendingRequests);
router.get("/recent-tickets", getRecentTickets);
router.get("/expiring-subscriptions", getExpiringSubscriptions);

export default router;
