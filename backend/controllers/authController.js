// Import thư viện mã hóa mật khẩu
import bcrypt from "bcrypt";

// Import thư viện tạo và xác thực JWT token
import jwt from "jsonwebtoken";

// Import Prisma client để thao tác với database
import prisma from "../config/prismaClient.js";

import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// Hàm lấy JWT secret từ biến môi trường
// Không khai báo cố định ở đầu file để đảm bảo khi .env load xong mới đọc giá trị
// Nếu không có JWT_SECRET thì dùng giá trị mặc định (dev)
const getSecret = () => process.env.JWT_SECRET || "secret_key_dev";


/* ================= REGISTER ================= */
// API đăng ký tài khoản
export const register = async (req, res) => {
  try {
    // Lấy dữ liệu từ body request
    const { fullName, email, password, phone, username } = req.body;

    // Kiểm tra dữ liệu bắt buộc
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Vui lòng cung cấp username, email và password"
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Mã hóa mật khẩu trước khi lưu vào DB
    // 10 là số salt rounds (độ phức tạp)
    const passwordHash = await bcrypt.hash(password, 10);

    // Tạo user mới trong database
    await prisma.user.create({
      data: {
        username,
        fullName: fullName || null,  // nếu không có thì lưu null
        email,
        passwordHash,
        phone: phone || null,
        role: "Staff", // Mặc định role là Staff
      },
    });

    // Trả về kết quả thành công
    res.status(201).json({ message: "Đăng ký thành công" });

  } catch (err) {
    // Log lỗi ra console để debug
    console.error("register error:", err?.stack || err);

    // Trả lỗi server
    res.status(500).json({ message: err?.message || "Lỗi server" });
  }
};


/* ================= LOGIN ================= */
// API đăng nhập
export const login = async (req, res) => {
  try {
    // Lấy email và password từ request
    const { email, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return res.status(400).json({
        message: "Vui lòng cung cấp email và password"
      });
    }

    // Tìm user theo email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        userID: true,
        fullName: true,
        email: true,
        passwordHash: true, // cần lấy để so sánh mật khẩu
        role: true,
        status: true,
        lockReason: true,
      },
    });

    // Nếu không tìm thấy user
    if (!user) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng"
      });
    }

    // So sánh mật khẩu nhập vào với mật khẩu đã mã hóa trong DB
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng"
      });
    }

    // Kiểm tra tài khoản có bị khoá không
    if (user.status === 'Inactive') {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị khoá",
        lockReason: user.lockReason || "Không có lý do cụ thể",
        locked: true,
      });
    }

    // Nếu đúng → tạo JWT token
    const token = jwt.sign(
      {
        userId: user.userID,  // Lưu userId trong token
        role: user.role       // Lưu role để phân quyền
      },
      getSecret(),            // Secret key
      { expiresIn: "7d" }     // Token hết hạn sau 7 ngày
    );

    // Trả về token và thông tin user (không trả password)
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
// API tạo lại token mới khi token cũ gần hết hạn
// Lấy role mới nhất từ DB để đảm bảo phân quyền cập nhật
export const refreshToken = async (req, res) => {
  try {
    // Lấy userID từ middleware đã decode token trước đó
    const userID = req.user?.userID || req.user?.userId;

    if (!userID)
      return res.status(401).json({ message: "Không tìm thấy userID" });

    // Tìm user trong database
    const user = await prisma.user.findUnique({
      where: { userID: parseInt(userID) },
      select: {
        userID: true,
        fullName: true,
        email: true,
        role: true
      },
    });

    if (!user)
      return res.status(404).json({ message: "Người dùng không tồn tại" });

    // Tạo token mới
    const token = jwt.sign(
      {
        userId: user.userID,
        role: user.role
      },
      getSecret(),
      { expiresIn: "7d" }
    );

    // Trả về token mới và thông tin user cập nhật
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


/* ================= GOOGLE LOGIN ================= */
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Thiếu token Google" });

    // Cần đảm bảo GOOGLE_CLIENT_ID đã có trong .env
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    if (!CLIENT_ID) {
      console.warn("Chưa cấu hình GOOGLE_CLIENT_ID trong .env");
    }

    // Lấy thông tin user từ Google sử dụng access_token
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const { email, name } = userInfoResponse.data;

    if (!email) {
      return res.status(400).json({ message: "Không lấy được email từ Google" });
    }

    // Tìm user bằng email
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        userID: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        lockReason: true,
      },
    });

    // Nếu không tồn tại, tự động tạo tài khoản (mặc định lấy role Staff)
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const newUser = await prisma.user.create({
        data: {
          username: email.split('@')[0] + "_" + Math.floor(Math.random() * 10000),
          fullName: name || null,
          email,
          passwordHash,
          role: "Staff",
        },
      });

      user = {
        userID: newUser.userID,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      }
    }

    // Kiểm tra khoá tài khoản
    if (user.status === 'Inactive') {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị khoá",
        lockReason: user.lockReason || "Không có lý do cụ thể",
        locked: true,
      });
    }

    // Tạo JWT token
    const jwtToken = jwt.sign(
      {
        userId: user.userID,
        role: user.role
      },
      getSecret(),
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Đăng nhập Google thành công",
      token: jwtToken,
      user: {
        id: user.userID,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("googleLogin error:", error?.stack || error);
    res.status(500).json({ message: error?.message || "Lỗi server khi đăng nhập Google" });
  }
};