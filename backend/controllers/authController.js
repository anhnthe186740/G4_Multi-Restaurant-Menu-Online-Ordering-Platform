import bcrypt from "bcrypt";
import { db } from "../config/db.js";

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
