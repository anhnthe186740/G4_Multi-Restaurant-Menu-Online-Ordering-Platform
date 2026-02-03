import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import adminDashboardRoutes from "./routes/adminDashboard.js";
import restaurantManagementRoutes from "./routes/restaurantManagement.js";

dotenv.config();

const app = express();

// CORS Configuration - Cách 1: Sử dụng middleware đơn giản
app.use(cors({
  origin: true, // Cho phép tất cả origins trong development
  credentials: true
}));

// Handle preflight requests explicitly
app.options(/.*/, cors());

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/restaurants", restaurantManagementRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for all origins`);
});
