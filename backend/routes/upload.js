import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

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
    const folder = req.query.folder ? `${req.query.folder}/` : "";
    const url = `${baseUrl}/uploads/${folder}${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
});

export default router;
