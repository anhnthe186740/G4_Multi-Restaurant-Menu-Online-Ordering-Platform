import nodemailer from "nodemailer";

/**
 * Configure Nodemailer transporter.
 * If credentials are not provided in .env, it uses Ethereal Email for testing.
 */
const getTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Falls back to Ethereal Email for auto-testing without config
    const testAccount = await nodemailer.createTestAccount();
    console.log("⚠️ [Email Service] Using Ethereal Demo Mode (No .env config found)");
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
