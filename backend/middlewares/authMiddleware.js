import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

/* ================= AUTH MIDDLEWARE ================= */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  // Read at runtime (not module load time) to ensure dotenv is loaded
  const secret = process.env.JWT_SECRET || "secret_key_dev";

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      console.error("JWT verify error:", err.message);
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user; // Attach user info to request
    next();
  });
};

// Export alias for consistency
export const verifyToken = authenticateToken;

/* ================= ADMIN ROLE MIDDLEWARE ================= */
export const requireAdmin = (req, res, next) => {
  // This middleware must be used AFTER authenticateToken
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.user.role !== "Admin") {
    console.error(`Access denied: user role is "${req.user.role}", expected "Admin"`);
    return res.status(403).json({
      message: "Access denied. Admin role required.",
      yourRole: req.user.role
    });
  }

  next();
};
