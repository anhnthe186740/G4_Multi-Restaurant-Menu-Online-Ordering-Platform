import "./env.js";   // ← PHẢI là import đầu tiên để load .env trước khi các middleware đọc process.env
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import adminDashboardRoutes from "./routes/adminDashboard.js";
import adminReportsRoutes from "./routes/adminReports.js";
import restaurantManagementRoutes from "./routes/restaurantManagement.js";
import adminServicePackageRoutes from "./routes/adminServicePackages.js";
import { getAllPackages } from "./controllers/adminServicePackageController.js";
import registrationRequestRoutes from "./routes/registrationRequests.js";
import restaurantOwnerRoutes from "./routes/restaurantOwner.js";
import uploadRoutes from "./routes/upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS Configuration — explicitly allow Authorization header
const corsOptions = {
  origin: true,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
};

app.use(cors(corsOptions));

// Handle preflight requests with SAME corsOptions (important!)
app.options(/(.*)/, cors(corsOptions));

app.use(express.json());

// Serve uploaded files as static assets
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

// ✅ Public route — không cần auth, cho homepage
app.get("/api/public/service-packages", getAllPackages);

app.use("/api/auth", authRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin", adminReportsRoutes);
app.use("/api/admin/restaurants", restaurantManagementRoutes);
app.use("/api/admin/service-packages", adminServicePackageRoutes);

// Public route — phải đặt TRƯỚC router admin để được khớp trước adminOnly
app.use("/api/admin/registration-requests", registrationRequestRoutes);
app.use("/api/owner", restaurantOwnerRoutes);
app.use("/api/upload", uploadRoutes);



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
