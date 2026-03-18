import express from "express";
import {
  getPublicPackages,
  getMySubscription,
  createPaymentLink,
  checkPaymentStatus,
  payosWebhook,
} from "../controllers/restaurantSubscriptionController.js";
import { authenticateToken, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET /api/restaurant/subscription/packages (Public/Owner can both see, but we require Login for Owner flow)
router.get("/packages", authenticateToken, requireRole("RestaurantOwner"), getPublicPackages);

// GET /api/restaurant/subscription/my-subscription
router.get("/my-subscription", authenticateToken, requireRole("RestaurantOwner"), getMySubscription);

// POST /api/restaurant/subscription/create-payment
router.post("/create-payment", authenticateToken, requireRole("RestaurantOwner"), createPaymentLink);

// GET /api/restaurant/subscription/check-payment/:orderCode
router.get("/check-payment/:orderCode", authenticateToken, requireRole("RestaurantOwner"), checkPaymentStatus);

// POST /api/restaurant/subscription/webhook (No token auth, called by PayOS)
router.post("/webhook", payosWebhook);

export default router;
