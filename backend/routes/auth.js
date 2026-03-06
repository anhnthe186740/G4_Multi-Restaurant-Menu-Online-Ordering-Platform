import express from "express";
import { register, login, refreshToken } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", verifyToken, refreshToken);

export default router;
