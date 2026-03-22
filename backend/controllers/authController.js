// Import thư viện mã hóa mật khẩu
import bcrypt from "bcrypt";

// Import thư viện tạo và xác thực JWT token
import jwt from "jsonwebtoken";

// Import Prisma client để thao tác với database
import prisma from "../config/prismaClient.js";

import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { sendResetEmail, sendPasswordChangedEmail, sendOtpEmail } from "../config/emailService.js";

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
        role: "User", // Mặc định role là User
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
        branchID: true,
        managedBranches: {
          select: { branchID: true }
        }
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
        userID: user.userID,  // Thêm dự phòng
        role: user.role       // Lưu role để phân quyền
      },
      getSecret(),            // Secret key
      { expiresIn: "7d" }     // Token hết hạn sau 7 ngày
    );

    // Trả về token và thông tin user (không trả password)
    const userData = {
      id: user.userID,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    if (user.role === "BranchManager" && user.managedBranches && user.managedBranches.length > 0) {
      userData.branchID = user.managedBranches[0].branchID;
    } else if (user.branchID) {
      userData.branchID = user.branchID;
    }

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: userData,
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
        role: true,
        branchID: true,
        managedBranches: {
          select: { branchID: true }
        }
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

    const userData = {
      id: user.userID,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    if (user.role === "BranchManager" && user.managedBranches && user.managedBranches.length > 0) {
      userData.branchID = user.managedBranches[0].branchID;
    } else if (user.branchID) {
      userData.branchID = user.branchID;
    }

    // Trả về token mới và thông tin user cập nhật
    return res.json({
      token,
      user: userData,
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
        branchID: true,
        managedBranches: {
          select: { branchID: true }
        }
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
          role: "User",
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

    const userData = {
      id: user.userID,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    if (user.role === "BranchManager" && user.managedBranches && user.managedBranches.length > 0) {
      userData.branchID = user.managedBranches[0].branchID;
    } else if (user.branchID) {
      userData.branchID = user.branchID;
    }

    return res.json({
      message: "Đăng nhập Google thành công",
      token: jwtToken,
      user: userData,
    });

  } catch (error) {
    console.error("googleLogin error:", error?.stack || error);
    res.status(500).json({ message: error?.message || "Lỗi server khi đăng nhập Google" });
  }
};

/* ================= FORGOT PASSWORD ================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Vui lòng cung cấp email" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // For security, don't reveal if user exists or not
      return res.json({ message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu." });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.passwordResetToken.create({
      data: {
        userID: user.userID,
        token: token,
        expiresAt: expiresAt,
      },
    });

    await sendResetEmail(email, token);

    return res.json({ message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu." });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/* ================= RESET PASSWORD ================= */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Thiếu thông tin yêu cầu" });

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { userID: resetToken.userID },
      data: { passwordHash },
    });

    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    // Gửi email thông báo đổi mật khẩu thành công
    await sendPasswordChangedEmail(resetToken.user.email);

    return res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/* ================= SEND CHANGE PASSWORD OTP (authenticated) ================= */
export const sendChangePasswordOtp = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.userID;
    if (!userId) return res.status(401).json({ message: "Không xác thực được người dùng" });

    const { currentPassword } = req.body;
    if (!currentPassword) return res.status(400).json({ message: "Vui lòng nhập mật khẩu hiện tại" });

    const user = await prisma.user.findUnique({
      where: { userID: parseInt(userId) },
      select: { userID: true, email: true, passwordHash: true },
    });

    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });
    if (!user.email) return res.status(400).json({ message: "Tài khoản của bạn chưa có email để gửi mã" });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });

    // Tạo OTP 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Xoá các token OTP cũ của user này nếu có kẹt lại
    await prisma.passwordResetToken.deleteMany({
      where: {
        userID: user.userID,
        token: { startsWith: "OTP_" }
      }
    });

    await prisma.passwordResetToken.create({
      data: {
        userID: user.userID,
        token: `OTP_${otp}`, // Lưu với prefix để phân biệt với token reset password thường
        expiresAt: expiresAt,
      },
    });

    await sendOtpEmail(user.email, otp);

    return res.json({ message: "Mã OTP đã được gửi về email của bạn." });
  } catch (error) {
    console.error("sendChangePasswordOtp error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/* ================= CHANGE PASSWORD (authenticated) ================= */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.userID;
    if (!userId) return res.status(401).json({ message: "Không xác thực được người dùng" });

    const { currentPassword, newPassword, otp } = req.body;
    if (!currentPassword || !newPassword || !otp)
      return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin (mật khẩu hiện tại, mật khẩu mới, OTP)" });

    if (newPassword.length < 8)
      return res.status(400).json({ message: "Mật khẩu mới tối thiểu 8 ký tự" });

    const user = await prisma.user.findUnique({
      where: { userID: parseInt(userId) },
      select: { userID: true, email: true, passwordHash: true },
    });

    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });

    // Kiểm tra OTP
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        userID: user.userID,
        token: `OTP_${otp}`
      }
    });

    if (!resetToken) {
      return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({ message: "Mã OTP đã hết hạn. Vui lòng gửi lại mã mới." });
    }

    // Cập nhật mật khẩu mới
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { userID: user.userID }, data: { passwordHash } });

    // Xoá token OTP đã dùng
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    // Gửi email thông báo đổi mật khẩu thành công
    if (user.email) {
      await sendPasswordChangedEmail(user.email);
    }

    return res.json({ message: "Đổi mật khẩu thành công. Email xác nhận đã được gửi đến địa chỉ email của bạn." });
  } catch (error) {
    console.error("changePassword error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};