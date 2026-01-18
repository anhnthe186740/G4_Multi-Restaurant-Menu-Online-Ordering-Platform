
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../api/authApi";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerApi(form);
      alert("Đăng ký thành công");
      // Chuyển sang trang Login
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi đăng ký");
    }
  };

  return (
    <div className="register-page">
      {/* LEFT IMAGE */}
      <div className="register-left">
        <div className="overlay" />
        <div className="brand">
          <div className="logo">🍽️</div>
          <h2>OrderEats</h2>
        </div>

        <div className="intro">
          <h1>Gia nhập cuộc cách mạng ẩm thực.</h1>
          <p>
            Trải nghiệm hệ thống quản lý thực phẩm trực quan nhất được thiết kế
            cho sự xuất sắc trong ẩm thực.
          </p>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="register-right">
        <form className="register-form" onSubmit={handleSubmit}>
          <h2>Đăng ký tài khoản</h2>
          <p className="desc">
            Tham gia cùng hàng ngàn đầu bếp và những người yêu ẩm thực.
          </p>

          <input
            name="fullName"
            placeholder="Họ và tên"
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />

          <input
            name="phone"
            placeholder="Số điện thoại"
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            onChange={handleChange}
            required
          />

          <label className="terms">
            <input type="checkbox" required />
            Tôi đồng ý với điều khoản & chính sách
          </label>

          <button type="submit">Tham gia ngay →</button>

          <p className="login-link">
            Bạn đã có tài khoản?
            <Link to="/login"> Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
