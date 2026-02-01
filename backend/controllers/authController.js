import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key_dev";

/* ================= REGISTER (adjusted to new schema) ================= */
export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, username } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Vui lòng cung cấp username, email và password" });
    }

    // Check email
    const [exist] = await db.query(
      "SELECT UserID FROM Users WHERE Email = ?",
      [email]
    );
    if (exist.length > 0) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO Users (Username, FullName, Email, PasswordHash, Phone, Role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, fullName || null, email, passwordHash, phone || null, 'Staff']
    );

    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (err) {
    console.error('register error:', err?.stack || err);
    res.status(500).json({ message: err?.message || "Lỗi server" });
  }
};

/* ================= LOGIN (adjusted to new schema) ================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng cung cấp email và password" });
    }

    const [users] = await db.query(
      `SELECT UserID, FullName, Email, PasswordHash, Role
       FROM Users
       WHERE Email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const token = jwt.sign(
      {
        userId: user.UserID,
        role: user.Role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.UserID,
        fullName: user.FullName,
        email: user.Email,
        role: user.Role,
      },
    });
  } catch (error) {
    console.error('login error:', error?.stack || error);
    res.status(500).json({ message: error?.message || "Lỗi server" });
  }
};
