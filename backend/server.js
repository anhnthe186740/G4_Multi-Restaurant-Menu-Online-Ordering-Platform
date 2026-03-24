import "./env.js";
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
import branchManagerRoutes from "./routes/branchManager.js";
import uploadRoutes from "./routes/upload.js";
import publicRoutes from "./routes/public.js";
import restaurantSubscriptionRoutes from "./routes/restaurantSubscription.js";


import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Trong thực tế nên giới hạn origin
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }
});

// Gắn io vào app để dùng trong controllers
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`📡 New client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174"
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
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
  res.json({ message: "Backend is running with Socket.io!" });
});

// ✅ Public route — không cần auth, cho homepage
app.get("/api/public/service-packages", getAllPackages);

app.use("/api/auth", authRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin", adminReportsRoutes);
app.use("/api/admin/restaurants", restaurantManagementRoutes);
app.use("/api/admin/service-packages", adminServicePackageRoutes);

app.use("/api/admin/registration-requests", registrationRequestRoutes);
app.use("/api/owner", restaurantOwnerRoutes);
app.use("/api/restaurant/subscription", restaurantSubscriptionRoutes);
app.use("/api/manager", branchManagerRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/public", publicRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
  console.log(`✅ Socket.io initialized`);
  console.log(`✅ CORS enabled for all origins`);
});
