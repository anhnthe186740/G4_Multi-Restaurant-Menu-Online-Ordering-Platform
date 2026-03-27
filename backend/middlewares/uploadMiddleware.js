import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đảm bảo thư mục uploads/ tồn tại
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer: lưu vào uploads/, tên file = timestamp + originalname
const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
        const folder = req.query.folder || "";
        const targetDir = path.join(uploadDir, folder);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext)
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_-]/g);
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

export default upload;
