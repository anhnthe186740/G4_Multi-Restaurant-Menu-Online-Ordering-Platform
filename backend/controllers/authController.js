import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key_dev";

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, role } = req.body;

    // Check email
    const [exist] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (exist.length > 0) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Get role_id
    const [roles] = await db.query(
      "SELECT id FROM roles WHERE role_name = ?",
      [role]
    );
    if (roles.length === 0) {
      return res.status(400).json({ message: "Role không hợp lệ" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role_id)
       VALUES (?, ?, ?, ?, ?)`,
      [fullName, email, passwordHash, phone, roles[0].id]
    );

    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.password_hash, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role_name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role_name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
