import { useState } from "react";
import { Link } from "react-router-dom";
import { loginApi } from "../api/authApi";
import "./login.css";

export default function Login() {
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await loginApi(form);
            alert("Đăng nhập thành công");
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi đăng nhập");
        }
    };

    return (
        <div className="login-page">
            {/* Background blobs */}
            <div className="bg-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            {/* Header */}
            <header className="login-header">
                <div className="logo">
                    <span className="logo-icon">🍽️</span>
                    <h2>OrderEats</h2>
                </div>

                <div className="header-action">
                    <span>Bạn mới đến?</span>
                    <Link to="/register" className="btn-outline">
                        Đăng ký
                    </Link>
                </div>
            </header>

            {/* Main */}
            <main className="login-main">
                <div className="login-card">
                    <div className="login-title">
                        <h1>Đăng nhập</h1>
                        <p>Nhập thông tin của bạn để quản lý đơn hàng hoặc nhà hàng.</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Ví dụ: name@company.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <div className="form-label-row">
                                <label>Mật khẩu</label>
                                <a href="#">Quên mật khẩu?</a>
                            </div>
                            <input
                                type="password"
                                name="password"
                                placeholder="Nhập mật khẩu của bạn"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="remember">
                            <input type="checkbox" id="remember" />
                            <label htmlFor="remember">Ghi nhớ đăng nhập</label>
                        </div>

                        <button type="submit" className="btn-primary">
                            Đăng nhập
                        </button>
                    </form>

                    <div className="divider">
                        <span>Hoặc tiếp tục với</span>
                    </div>

                    <div className="social-login">
                        <button className="btn-social">Google</button>
                    </div>

                    {/* Link sang register (footer trong card) */}
                    <div className="login-footer">
                        Chưa có tài khoản?{" "}
                        <Link to="/register">Đăng ký</Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="login-footer">
                <p>
                    Bằng cách đăng nhập, bạn đồng ý với{" "}
                    <a href="#">Điều khoản Dịch vụ</a> và{" "}
                    <a href="#">Chính sách Bảo mật</a>.
                </p>
            </footer>
        </div>
    );
}
