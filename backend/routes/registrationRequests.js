import express from "express";
import {
    getRegistrationRequests,
    approveRequest,
    rejectRequest,
} from "../controllers/registrationController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken, adminOnly);

// GET /api/admin/registration-requests - List all with filters & pagination
router.get("/", getRegistrationRequests);

// POST /api/admin/registration-requests/:id/approve
router.post("/:id/approve", approveRequest);

// POST /api/admin/registration-requests/:id/reject
router.post("/:id/reject", rejectRequest);

export default router;
