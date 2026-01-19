import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ 
    message: "Internal server error",
    error: err.message 
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for all origins`);
});
