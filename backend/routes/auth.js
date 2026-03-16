import express from "express";
import { register, login, refreshToken, googleLogin, forgotPassword, resetPassword, sendChangePasswordOtp, changePassword } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/refresh-token", verifyToken, refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/send-change-password-otp", verifyToken, sendChangePasswordOtp);
router.post("/change-password", verifyToken, changePassword);


export default router;
