// File này phải được import ĐẦU TIÊN trong server.js
// Lý do: trong ESM, tất cả static imports chạy trước code trong file
// Nếu dotenv.config() nằm trong server.js sau các imports khác,
// thì các module như authMiddleware.js đã được load trước khi .env được đọc
// → process.env.JWT_SECRET = undefined → dùng fallback sai
import dotenv from "dotenv";
dotenv.config();
