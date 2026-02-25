import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";

export default function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await loginApi(form);
            if (response?.data?.token) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));
                if (remember) localStorage.setItem("rememberEmail", form.email);

                // Redirect theo role
                const role = response.data.user?.role;
                if (role === "Admin") {
                    navigate("/admin/dashboard");
                } else {
                    navigate("/");
                }
            } else {
                alert("Không nhận được token từ server");
            }
        } catch (err) {
            alert("❌ " + (err.response?.data?.message || "Lỗi đăng nhập"));
        } finally {
            setLoading(false);
        }
    };

    // BẢNG MÀU (Dựa trên ảnh Admin):
    // Background chính: #02140c (Rất tối)
    // Card/Header: #062519 (Xanh rêu đậm)
    // Input/Box: #031a11
    // Border: #133827
    // Primary (Nút/Icon): #00c04b (Xanh lá tươi giống nút 'Phê duyệt')
    // Text: White & Gray-400

    return (
        <div className="relative min-h-screen bg-[#02140c] text-white font-sans selection:bg-[#00c04b] selection:text-white">

            {/* Background blobs (Hiệu ứng ánh sáng xanh) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#00c04b]/5 blur-[100px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#00c04b]/5 blur-[100px]" />
            </div>

            <div className="relative z-10 flex min-h-screen flex-col">

                {/* Header */}
                <header className="
                    flex items-center justify-between
                    px-6 py-4
                    border-b border-[#133827]
                    bg-[#062519]/80
                    backdrop-blur-md
                ">
                    <Link to="/" className="flex items-center gap-3 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 rounded-xl bg-[#00c04b] flex items-center justify-center shadow-lg shadow-[#00c04b]/20">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 8H4c-1.1 0-2 .9-2 2v3c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3c0-1.1-.9-2-2-2zm0 7H4c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2zM3 5c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2s-.9-2-2-2H5c-1.1 0-2 .9-2 2z" />
                            </svg>
                        </div>
                        <span className="text-white">RestoManager</span>
                    </Link>

                    <div className="flex justify-center">
                        <Link
                            to="/register"
                            className="h-10 px-5 rounded-lg bg-[#00c04b]/10 text-[#00c04b] text-sm font-bold border border-[#00c04b]/20 hover:bg-[#00c04b]/20 transition-all flex items-center justify-center"
                        >
                            Đăng ký
                        </Link>
                    </div>
                </header>

                {/* Main */}
                <main className="flex-1 flex items-center justify-center px-4 py-10">
                    <div className="w-full max-w-[440px] rounded-2xl bg-[#062519]
                        border border-[#133827]
                        shadow-[0_0_50px_rgba(0,0,0,0.5)]
                        p-6 sm:p-10 relative overflow-hidden">

                        {/* Top decorative line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00c04b] to-transparent opacity-50"></div>

                        {/* Title */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-white">
                                Chào mừng quay lại
                            </h1>
                            <p className="mt-2 text-sm text-gray-400">
                                Đăng nhập để quản lý hệ thống nhà hàng
                            </p>
                        </div>

                        {/* Form */}
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="admin@restaurant.com"
                                    className="h-12 w-full px-4 rounded-xl border border-[#133827]
                                    bg-[#031a11] text-white placeholder-gray-600 text-sm
                                    focus:ring-2 focus:ring-[#00c04b]/50 focus:border-[#00c04b] outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Mật khẩu
                                    </label>
                                    <Link to="/forgot-password" className="text-xs font-semibold text-[#00c04b] hover:text-[#00e05a] hover:underline transition-colors">
                                        Quên mật khẩu?
                                    </Link>
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="h-12 w-full px-4 rounded-xl border border-[#133827]
                                    bg-[#031a11] text-white placeholder-gray-600 text-sm
                                    focus:ring-2 focus:ring-[#00c04b]/50 focus:border-[#00c04b] outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative flex items-center">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-[#2d4b3b] bg-[#031a11] checked:border-[#00c04b] checked:bg-[#00c04b] transition-all"
                                    />
                                    <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none">
                                        <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <label htmlFor="remember" className="text-xs text-gray-400 cursor-pointer select-none hover:text-gray-300">
                                    Ghi nhớ đăng nhập
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 rounded-xl bg-[#00c04b] text-white font-bold text-sm tracking-wide
                                shadow-lg shadow-[#00c04b]/25 hover:shadow-[#00c04b]/40 hover:bg-[#00d654]
                                disabled:opacity-60 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                            >
                                {loading ? "Đang xử lý..." : "ĐĂNG NHẬP"}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="h-px bg-[#133827]" />
                            <span className="absolute inset-x-0 -top-2 mx-auto w-fit px-3 text-xs bg-[#062519] text-gray-500">
                                HOẶC
                            </span>
                        </div>

                        {/* Social */}
                        <div className="flex justify-center">
                            <button
                                type="button"
                                className="flex items-center justify-center gap-3
                                h-12 w-full rounded-xl
                                border border-[#133827]
                                bg-[#031a11] text-gray-300
                                text-sm font-semibold
                                hover:bg-[#0a2e22] hover:border-[#2d4b3b] hover:text-white
                                transition-all"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 48 48">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.02 1.54 7.4 2.82l5.47-5.47C33.58 3.7 29.18 1.5 24 1.5 14.98 1.5 7.44 7.98 4.69 16.55l6.98 5.42C13.1 15.3 18.13 9.5 24 9.5z" />
                                    <path fill="#4285F4" d="M46.5 24.5c0-1.67-.15-3.27-.43-4.82H24v9.12h12.68c-.55 2.96-2.18 5.47-4.64 7.16l7.18 5.57C43.52 37.18 46.5 31.42 46.5 24.5z" />
                                    <path fill="#FBBC05" d="M11.67 28.1c-.5-1.48-.79-3.06-.79-4.7 0-1.64.29-3.22.79-4.7l-6.98-5.42C3.03 16.45 2.5 20.15 2.5 23.4c0 3.25.53 6.95 2.19 10.12l6.98-5.42z" />
                                    <path fill="#34A853" d="M24 46.5c6.48 0 11.93-2.15 15.9-5.87l-7.18-5.57c-2 1.34-4.56 2.14-8.72 2.14-5.87 0-10.9-3.8-12.67-9.06l-6.98 5.42C7.44 40.02 14.98 46.5 24 46.5z" />
                                </svg>
                                Đăng nhập bằng Google
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[#133827] flex justify-center">
                            <p className="text-sm text-gray-400">
                                Chưa có tài khoản?{" "}
                                <Link
                                    to="/register"
                                    className="font-bold text-[#00c04b] hover:text-[#00e05a] hover:underline transition-colors"
                                >
                                    Đăng ký ngay
                                </Link>
                            </p>
                        </div>

                    </div>
                </main>

                {/* Footer */}
                <footer className="py-6 text-center text-xs text-gray-500">
                    © 2026 OderEat. All rights reserved.
                </footer>
            </div>
        </div>
    );
}