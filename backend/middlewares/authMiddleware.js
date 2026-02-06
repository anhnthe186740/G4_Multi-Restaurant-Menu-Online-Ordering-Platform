import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key_dev";

/* ================= AUTH MIDDLEWARE ================= */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
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
    return res.status(403).json({
      message: "Access denied. Admin role required."
    });
  }

  next();
};
