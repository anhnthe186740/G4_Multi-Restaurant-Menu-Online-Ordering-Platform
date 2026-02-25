import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prismaClient.js";

// JWT_SECRET đọc tại runtime (không cache ở module level) để đảm bảo .env đã được load
const getSecret = () => process.env.JWT_SECRET || "secret_key_dev";

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, username } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Vui lòng cung cấp username, email và password" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        fullName: fullName || null,
        email,
        passwordHash,
        phone: phone || null,
        role: "Staff",
      },
    });

    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (err) {
    console.error("register error:", err?.stack || err);
    res.status(500).json({ message: err?.message || "Lỗi server" });
  }
};

/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng cung cấp email và password" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        userID: true,
        fullName: true,
        email: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const token = jwt.sign(
      { userId: user.userID, role: user.role },
      getSecret(),
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.userID,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("login error:", error?.stack || error);
    res.status(500).json({ message: error?.message || "Lỗi server" });
  }
};

/* ================= REFRESH TOKEN ================= */
// Trả về JWT mới với role đã được cập nhật từ DB
export const refreshToken = async (req, res) => {
  try {
    const userID = req.user?.userID || req.user?.userId;
    if (!userID) return res.status(401).json({ message: "Không tìm thấy userID" });

    const user = await prisma.user.findUnique({
      where: { userID: parseInt(userID) },
      select: { userID: true, fullName: true, email: true, role: true },
    });

    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

    const token = jwt.sign(
      { userId: user.userID, role: user.role },
      getSecret(),
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.userID,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("refreshToken error:", error?.stack || error);
    res.status(500).json({ message: error?.message || "Lỗi server" });
  }
};
