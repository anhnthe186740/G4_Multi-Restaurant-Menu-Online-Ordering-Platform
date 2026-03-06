import express from "express";
import {
    getAllPackages,
    createPackage,
    updatePackage,
    deletePackage,
    renewSubscription,
    getSubscriptionHistory,
    getRestaurantsForRenewal,
    getRestaurantStatuses
} from "../controllers/adminServicePackageController.js";
import { authenticateToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ PUBLIC route — không cần auth, cho homepage fetch
router.get("/public", getAllPackages);

// Middleware authentication setup (chỉ áp dụng cho các route bên dưới)
router.use(authenticateToken);
router.use(requireAdmin);

// CRUD Routes
router.get("/", getAllPackages);
router.post("/", createPackage);
router.put("/:id", updatePackage);
router.delete("/:id", deletePackage);

// Action Routes
router.post("/renew", renewSubscription);
router.get("/history", getSubscriptionHistory);

router.get("/restaurants-for-renewal", getRestaurantsForRenewal);
router.get("/active-subscriptions", getRestaurantStatuses);

export default router;
