import nodemailer from "nodemailer";

/**
 * Configure Nodemailer transporter.
 * If credentials are not provided in .env, it uses Ethereal Email for testing.
 */
const getTransporter = async () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    console.log(`✅ [Email Service] Using REAL Gmail Account: ${user}`);
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user,
        pass: pass,
      },
    });
  } else {
    // Falls back to Ethereal Email for auto-testing without config
    const testAccount = await nodemailer.createTestAccount();
    console.log("⚠️ [Email Service] Using Ethereal Demo Mode (No .env config found)");
    console.log(`📧 [Ethereal Credentials] User: ${testAccount.user}, Pass: ${testAccount.pass}`); // Added this
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
};

/**
 * Send a password reset email to the user.
 * @param {string} email - Recipient's email
 * @param {string} resetToken - The unique reset token
 */
export const sendResetEmail = async (email, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
  const transporter = await getTransporter();

  const mailOptions = {
    from: `"RMS Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #00c04b;">Yêu cầu đặt lại mật khẩu</h2>
        <p>Chào bạn,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tạo mật khẩu mới. <b>Liên kết này sẽ hết hạn sau 15 phút.</b></p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetLink}" style="background-color: #00c04b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Đặt lại mật khẩu</a>
        </div>
        <p>Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này. Bảo mật tài khoản của bạn là ưu tiên hàng đầu của chúng tôi.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không phản hồi.<br/>The RMS Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // If using Ethereal, log the preview URL
    if (nodemailer.getTestMessageUrl(info)) {
      console.log("---------------------------------------------------------");
      console.log("📧 [TEST EMAIL SENT]");
      console.log("Preview URL: ", nodemailer.getTestMessageUrl(info));
      console.log("---------------------------------------------------------");
    } else {
      console.log(`Password reset email sent to ${email}`);
      console.log(`Response from SMTP: ${info.response}`);
    }
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send reset email");
  }
};
/**
 * Send a notification email after a successful password change.
 * @param {string} email - Recipient's email
 */
export const sendPasswordChangedEmail = async (email) => {
  const transporter = await getTransporter();

  const mailOptions = {
    from: `"RMS Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Mật khẩu của bạn đã được thay đổi thành công",
    html: `
      <div style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #00c04b;">Mật khẩu đã được thay đổi</h2>
        <p>Chào bạn,</p>
        <p>Email này nhằm thông báo rằng mật khẩu cho tài khoản RMS của bạn đã được thay đổi thành công.</p>
        <p>Nếu bạn <b>không</b> thực hiện thay đổi này, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi ngay lập tức để bảo vệ tài khoản của bạn.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không phản hồi.<br/>The RMS Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password change confirmation sent to ${email}`);
    return info;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    // We don't throw here to avoid failing the password reset process if only the notification fails
  }
};

/**
 * Send a 6-digit OTP email for changing password verification.
 * @param {string} email - Recipient's email
 * @param {string} otp - The 6-digit OTP code
 */
export const sendOtpEmail = async (email, otp) => {
  const transporter = await getTransporter();

  const mailOptions = {
    from: `"RMS Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Mã xác nhận đổi mật khẩu",
    html: `
      <div style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #00c04b;">Bạn đang yêu cầu đổi mật khẩu</h2>
        <p>Chào bạn,</p>
        <p>Mã xác nhận OTP của bạn là:</p>
        <div style="margin: 30px 0; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #00c04b; background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
          ${otp}
        </div>
        <p>Mã này có hiệu lực trong vòng <b>10 phút</b>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và kiểm tra lại bảo mật tài khoản.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không phản hồi.<br/>The RMS Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return info;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};

/**
 * Send an email to a newly created account with their credentials.
 * @param {string} email - Recipient's email
 * @param {string} fullName - Full name of the user
 * @param {string} username - Account username
 * @param {string} password - Clear text password (temporary)
 * @param {string} role - User role (Staff, Kitchen, BranchManager)
 */
export const sendNewAccountEmail = async (email, fullName, username, password, role) => {
  const transporter = await getTransporter();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  
  const roleDisplay = {
    "Staff": "Nhân viên phục vụ",
    "Kitchen": "Nhân viên bếp",
    "BranchManager": "Quản lý chi nhánh"
  }[role] || role;

  const mailOptions = {
    from: `"RMS Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Thông tin tài khoản truy cập hệ thống RMS",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 24px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Chào mừng đến với RMS</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Tài khoản của bạn đã sẵn sàng</p>
        </div>
        
        <p>Chào <strong>${fullName || username}</strong>,</p>
        <p>Bạn đã được cấp tài khoản để truy cập vào hệ thống quản lý nhà hàng với vai trò <strong>${roleDisplay}</strong>. Dưới đây là thông tin đăng nhập của bạn:</p>
        
        <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 16px; padding: 25px; margin: 30px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="color: #64748b; font-size: 13px; font-weight: bold; width: 40%;">Tên đăng nhập:</td>
              <td style="color: #1e293b; font-size: 15px; font-weight: 800;">${username}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-size: 13px; font-weight: bold; padding-top: 10px;">Mật khẩu:</td>
              <td style="color: #1e293b; font-size: 15px; font-weight: 800; padding-top: 10px;">${password}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 40px 0;">
          <a href="${frontendUrl}/login" style="background-color: #059669; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2); text-transform: uppercase; letter-spacing: 1px;">Đăng nhập ngay</a>
        </div>

        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
          <p style="font-size: 12px; color: #92400e; margin: 0;"><strong>Lưu ý:</strong> Để đảm bảo an toàn, vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên.</p>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">Đây là email tự động từ hệ thống RMS. Vui lòng không trả lời email này.</p>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 5px;">&copy; 2026 RMS Team. All rights reserved.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email Service] New account credentials successfully sent to: ${email}`);
    return info;
  } catch (error) {
    console.error("Error sending account email:", error);
    // Silent error to prevent blocking account creation
  }
};

/**
 * Send an email notification when a registration request is approved.
 * @param {string} email - Recipient's email
 * @param {string} fullName - Recipient's full name
 * @param {string} restaurantName - The name of the approved restaurant
 * @param {object} credentials - Optional credentials for new users { username, password }
 */
export const sendRegistrationApprovedEmail = async (email, fullName, restaurantName, credentials = null) => {
  const transporter = await getTransporter();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  let contentHtml = "";
  if (credentials) {
    // Content for new users who didn't have an account
    contentHtml = `
      <p>Chào <strong>${fullName}</strong>,</p>
      <p>Chúc mừng! Đơn đăng ký tham gia hệ thống RMS cho nhà hàng <strong>${restaurantName}</strong> của bạn đã được phê duyệt thành công.</p>
      <p>Dưới đây là thông tin tài khoản để bạn truy cập vào hệ thống với vai trò <strong>Chủ nhà hàng</strong>:</p>
      
      <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 16px; padding: 25px; margin: 30px 0;">
        <table style="width: 100%;">
          <tr>
            <td style="color: #64748b; font-size: 13px; font-weight: bold; width: 40%;">Tên đăng nhập:</td>
            <td style="color: #1e293b; font-size: 15px; font-weight: 800;">${credentials.username}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 13px; font-weight: bold; padding-top: 10px;">Mật khẩu:</td>
            <td style="color: #1e293b; font-size: 15px; font-weight: 800; padding-top: 10px;">${credentials.password}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
        <p style="font-size: 12px; color: #92400e; margin: 0;"><strong>Lưu ý:</strong> Để đảm bảo an toàn, vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên.</p>
      </div>
    `;
  } else {
    // Content for existing users who already had an account
    contentHtml = `
      <p>Chào <strong>${fullName}</strong>,</p>
      <p>Chúc mừng! Đơn đăng ký tham gia hệ thống RMS cho nhà hàng <strong>${restaurantName}</strong> của bạn đã được phê duyệt thành công.</p>
      <p>Tài khoản của bạn đã được nâng cấp lên vai trò <strong>Chủ nhà hàng</strong>. Bây giờ bạn có thể đăng nhập vào hệ thống để bắt đầu quản lý nhà hàng của mình.</p>
    `;
  }

  const mailOptions = {
    from: `"RMS Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Đơn đăng ký nhà hàng ${restaurantName} đã được phê duyệt`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 24px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Yêu cầu đăng ký đã được phê duyệt</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Chào mừng bạn đến với hệ thống quản lý nhà hàng RMS</p>
        </div>
        
        ${contentHtml}

        <div style="text-align: center; margin: 40px 0;">
          <a href="${frontendUrl}/login" style="background-color: #059669; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2); text-transform: uppercase; letter-spacing: 1px;">Đăng nhập ngay</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">Đây là email tự động từ hệ thống RMS. Vui lòng không trả lời email này.</p>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 5px;">&copy; 2026 RMS Team. All rights reserved.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email Service] Registration approval email successfully sent to: ${email}`);
    return info;
  } catch (error) {
    console.error("Error sending approval email:", error);
  }
};

