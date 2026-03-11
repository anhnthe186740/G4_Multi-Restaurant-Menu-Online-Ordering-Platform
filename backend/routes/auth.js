import express from "express";
import { register, login, refreshToken, googleLogin } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/refresh-token", verifyToken, refreshToken);

export default router;
