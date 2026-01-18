import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";

export default function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [remember, setRemember] = useState(false);
    
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            console.log("Gửi request login:", form);
            const response = await loginApi(form);
            console.log("Login response:", response);

            if (response?.data?.token) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));
                if (remember) {
                    localStorage.setItem("rememberEmail", form.email);
                }
                alert("✓ Đăng nhập thành công!");
                setTimeout(() => {
                    navigate("/");
                }, 500);
            } else {
                alert("Lỗi: Không nhận được token từ server");
            }
        } catch (err) {
            console.error("Login error:", err);
            const errorMsg = err.response?.data?.message || err.message || "Lỗi đăng nhập";
            alert("❌ " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-background-light dark:bg-background-dark flex flex-col transition-colors duration-300">

            {/* ===== Background blobs ===== */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[80px] opacity-30" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[80px] opacity-30" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">

                {/* ===== Header ===== */}
                <header className="flex items-center justify-between border-b border-orange-100 dark:border-gray-800 px-0 py-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
                    <div className="flex items-center gap-4 text-gray-900 dark:text-white">
                        <div className="w-6 h-6 text-primary">
                            <svg viewBox="0 0 48 48" fill="currentColor">
                                <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455Z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold tracking-tight">FoodHub</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Bạn mới đến?
                        </span>
                        <Link
                            to="/register"
                            className="min-w-[84px] h-10 px-4 rounded-xl bg-primary/10 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition flex items-center justify-center"
                        >
                            Đăng ký
                        </Link>
                    </div>
                </header>

                {/* ===== Main ===== */}
                <main className="flex-1 flex items-center justify-center p-0">
                    <div className="w-full max-w-[440px] bg-white dark:bg-[#1c1917] rounded-xl shadow-[0_20px_50px_rgba(249,115,22,0.1)] p-4 border border-orange-50 dark:border-gray-800">

                        {/* Title */}
                        <div className="mb-8 text-center">
                            <h1 className="text-[28px] font-bold text-gray-900 dark:text-white">
                                Đăng nhập
                            </h1>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Nhập thông tin của bạn để quản lý đơn hàng hoặc nhà hàng.
                            </p>
                        </div>

                        {/* Form */}
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Ví dụ: name@company.com"
                                    className="h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                        Mật khẩu
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs font-semibold text-primary hover:underline"
                                    >
                                        Quên mật khẩu?
                                    </Link>
                                </div>

                                <div className="relative">
                                    <input
                                        type="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Nhập mật khẩu của bạn"
                                        className="h-12 w-full px-4 rounded-xl
      border border-gray-200 dark:border-gray-700
      bg-gray-50 dark:bg-zinc-900
      text-sm text-gray-900 dark:text-white
      placeholder:text-gray-400
      focus:ring-2 focus:ring-primary/30
      focus:border-primary
      outline-none transition"
                                        required
                                    />
                                </div>

                            </div>

                            {/* Remember */}
                            <div className="flex items-center gap-2">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="w-4 h-4 rounded text-primary border-gray-300 dark:border-gray-700 focus:ring-primary accent-primary cursor-pointer"
                                />
                                <label
                                    htmlFor="remember"
                                    className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer"
                                >
                                    Ghi nhớ đăng nhập
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 rounded-xl
    bg-orange-500 text-white
    text-sm font-bold
    shadow-lg shadow-orange-500/40
    hover:shadow-orange-500/60
    active:scale-[0.98]
    disabled:opacity-60 disabled:cursor-not-allowed
    transition-all duration-200"
                            >
                                {loading ? "Đang xử lý..." : "Đăng nhập"}
                            </button>

                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100 dark:border-gray-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-[#1c1917] px-3 text-gray-400 font-medium tracking-wider">
                                    Hoặc tiếp tục với
                                </span>
                            </div>
                        </div>

                        {/* Social */}
                        <div className="grid grid-cols-2 gap-4">
                            <button type="button" className="h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1917] text-sm font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition">
                                Google
                            </button>
                            <button type="button" className="h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1917] text-sm font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition">
                                Apple
                            </button>
                        </div>

                        {/* Sign Up Link */}
                        <p className="mt-8 text-center text-xs text-gray-600 dark:text-gray-400">
                            Chưa có tài khoản?{" "}
                            <Link to="/register" className="text-primary font-bold hover:underline">Đăng ký</Link>
                        </p>
                    </div>
                </main>

                {/* ===== Footer ===== */}
                <footer className="p-0 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        Bằng cách đăng nhập, bạn đồng ý với{" "}
                        <a href="#" className="underline hover:text-primary">
                            Điều khoản Dịch vụ
                        </a>{" "}
                        và{" "}
                        <a href="#" className="underline hover:text-primary">
                            Chính sách Bảo mật
                        </a>
                        .
                    </p>
                </footer>
            </div>
        </div>
    );
}
