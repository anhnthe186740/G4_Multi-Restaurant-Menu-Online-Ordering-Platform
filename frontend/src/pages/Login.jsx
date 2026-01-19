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
                alert("✓ Đăng nhập thành công!");
                setTimeout(() => navigate("/"), 500);
            } else {
                alert("Không nhận được token từ server");
            }
        } catch (err) {
            alert("❌ " + (err.response?.data?.message || "Lỗi đăng nhập"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-background-light dark:bg-background-dark transition-colors">

            {/* Background blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-primary/20 blur-[90px]" />
                <div className="absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full bg-primary/10 blur-[90px]" />
            </div>

            <div className="relative z-10 flex min-h-screen flex-col">

                {/* Header */}
                <header className="
  flex items-center justify-between
  px-6 py-2
  border-b border-orange-100 dark:border-gray-800
  bg-white/80 dark:bg-background-dark/80
  backdrop-blur
">

                    <div className="flex items-center gap-3 font-bold text-gray-1000 dark:text-white">
                        <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 8H4c-1.1 0-2 .9-2 2v3c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3c0-1.1-.9-2-2-2zm0 7H4c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2zM3 5c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2s-.9-2-2-2H5c-1.1 0-2 .9-2 2z" />
                        </svg>
                        OderEat
                    </div>

                    <div className="mt-auto  flex justify-center">
                        <Link
                            to="/register"
                            className="min-w-[84px] h-10 px-4 rounded-xl bg-primary/10 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition flex items-center justify-center"
                        >
                            Đăng ký
                        </Link>

                    </div>

                </header>

                {/* Main */}
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="w-full max-w-[420px] rounded-2xl bg-white dark:bg-[#1c1917]
            border border-orange-50 dark:border-gray-800
            shadow-[0_30px_60px_rgba(249,115,22,0.12)]
            p-6 sm:p-8">

                        {/* Title */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Chào mừng quay lại 👋
                            </h1>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Đăng nhập để quản lý đơn hàng hoặc nhà hàng
                            </p>
                        </div>

                        {/* Form */}
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="name@company.com"
                                    className="mt-1 h-12 w-full px-4 rounded-xl border border-gray-200 dark:border-gray-700
                  bg-gray-50 dark:bg-zinc-900 text-sm
                  focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        Mật khẩu
                                    </label>
                                    <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                                        Quên mật khẩu?
                                    </Link>
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="mt-1 h-12 w-full px-4 rounded-xl border border-gray-200 dark:border-gray-700
                  bg-gray-50 dark:bg-zinc-900 text-sm
                  focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="w-4 h-4 accent-primary"
                                />
                                <label htmlFor="remember" className="text-xs text-gray-500 dark:text-gray-400">
                                    Ghi nhớ đăng nhập
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 rounded-xl bg-orange-500 text-white font-bold
                shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60
                disabled:opacity-60 transition"
                            >
                                {loading ? "Đang xử lý..." : "Đăng nhập"}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="h-px bg-gray-100 dark:bg-gray-800" />
                            <span className="absolute inset-x-0 -top-2 mx-auto w-fit px-3 text-xs bg-white dark:bg-[#1c1917] text-gray-400">
                                Hoặc
                            </span>
                        </div>

                        {/* Social */}
                        <div className="flex justify-center">
                            <button
                                type="button"
                                className="flex items-center justify-center gap-3
      h-11 w-full rounded-xl
      border border-gray-200 dark:border-gray-700
      bg-white dark:bg-[#1c1917]
      text-sm font-semibold
      hover:bg-gray-50 dark:hover:bg-zinc-800
      transition"
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


                        <div className="mt-auto pt-8 flex justify-center">
                            <Link
                                to="/register"
                                className="
 h-9 px-10
         flex items-center justify-center
         rounded-xl bg-orange-500 text-white
         text-sm font-bold shadow-md
    "
                            >
                                Chưa có tài khoản? Đăng ký
                            </Link>
                        </div>


                    </div>
                </main>

                {/* Footer */}
                <footer className="py-4 text-center text-xs text-gray-400">
                    © 2026 OderEat. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
