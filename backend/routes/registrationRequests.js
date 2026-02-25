import express from "express";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/roleMiddleware.js";
import {
    getRegistrationRequests,
    approveRequest,
    rejectRequest,
    createRegistrationRequest,
    getMyRegistrationStatus,
} from "../controllers/registrationController.js";

const router = express.Router();

// Middleware optional: đọc token nếu có, không bắt buộc
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return next(); // Không có token → tiếp tục bình thường
    try {
        const secret = process.env.JWT_SECRET || "secret_key_dev";
        req.user = jwt.verify(token, secret);
    } catch {
        // Token không hợp lệ cũng không sao, bỏ qua
    }
    next();
};

// POST / — Public (nhưng đọc token nếu có để lưu userID)
router.post("/", optionalAuth, createRegistrationRequest);

// GET / — Admin only
router.get("/", verifyToken, adminOnly, getRegistrationRequests);

// POST /:id/approve — Admin only
router.post("/:id/approve", verifyToken, adminOnly, approveRequest);

// POST /:id/reject — Admin only
router.post("/:id/reject", verifyToken, adminOnly, rejectRequest);

// GET /my-status — User lấy trạng thái đơn của mình
router.get("/my-status", verifyToken, getMyRegistrationStatus);

export default router;
