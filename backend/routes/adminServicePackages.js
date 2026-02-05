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

// Middleware authentication setup
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
