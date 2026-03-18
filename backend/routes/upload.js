import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { verifyToken } from "../middlewares/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Đảm bảo thư mục uploads/ tồn tại
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer: lưu vào uploads/, tên file = timestamp + originalname
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext)
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_-]/g, "");
        cb(null, `${Date.now()}_${base}${ext}`);
    },
});

// Chỉ cho phép ảnh và PDF
const fileFilter = (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Chỉ cho phép file ảnh (jpg, png, gif, webp) hoặc PDF"));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/**
 * POST /api/upload
 * Body: multipart/form-data, field "file"
 * Returns: { url: "http://localhost:5000/uploads/<filename>" }
 */
router.post("/", verifyToken, upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Không có file được tải lên" });
    }
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
});

export default router;
