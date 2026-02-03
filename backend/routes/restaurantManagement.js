import express from "express";
import {
    getAllRestaurants,
    getRestaurantDetails,
    deactivateRestaurant,
    reactivateRestaurant,
    forceDeleteRestaurant,
    updateRestaurantInfo,
    getRestaurantStats
} from "../controllers/restaurantManagementController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken, adminOnly);

// GET /api/restaurants - Get all restaurants with filters
router.get("/", getAllRestaurants);

// GET /api/restaurants/:id - Get restaurant details
router.get("/:id", getRestaurantDetails);

// GET /api/restaurants/:id/stats - Get restaurant statistics
router.get("/:id/stats", getRestaurantStats);

// PATCH /api/restaurants/:id - Update restaurant info
router.patch("/:id", updateRestaurantInfo);

// POST /api/restaurants/:id/deactivate - Soft delete
router.post("/:id/deactivate", deactivateRestaurant);

// POST /api/restaurants/:id/reactivate - Reactivate
router.post("/:id/reactivate", reactivateRestaurant);

// DELETE /api/restaurants/:id - Force delete
router.delete("/:id", forceDeleteRestaurant);

export default router;
