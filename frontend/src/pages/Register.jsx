import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { registerApi } from "../api/authApi";

export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get("redirect");
    const [form, setForm] = useState({
        username: "",
        fullName: "",
        email: "",
        phone: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            console.log("Gửi request register:", form);
            const response = await registerApi(form);
            console.log("Register response:", response);

            // Using modern toast-like alert or simple alert as before for consistency
            alert("✓ Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.");
            setTimeout(() => {
                if (redirectPath) {
                    navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
                } else {
                    navigate("/login");
                }
            }, 500);
        } catch (err) {
            console.error("Register error:", err);
            const errorMsg = err.response?.data?.message || err.message || "Lỗi đăng ký";
            alert("❌ " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#020617] text-white font-sans selection:bg-emerald-500/30 selection:text-white overflow-hidden">

            {/* Ambient Background Glows - Matching HeroSection & Login */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] animate-float-slow" />
            </div>

            <div className="relative z-10 flex min-h-screen flex-col">

                {/* Header - Matching Login Header Style */}
                <header className="
                    flex items-center justify-between
                    px-8 py-6
                    bg-slate-950/50
                    backdrop-blur-xl
                    border-b border-white/5
                ">
                    <Link to="/" className="flex items-center gap-3 font-bold text-2xl tracking-tight hover:opacity-80 transition-opacity group">
                        <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 8H4c-1.1 0-2 .9-2 2v3c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3c0-1.1-.9-2-2-2zm0 7H4c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2zM3 5c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2s-.9-2-2-2H5c-1.1 0-2 .9-2 2z" />
                            </svg>
                        </div>
                        <span className="text-white">RestoManager</span>
                    </Link>

                    <Link
                        to="/login"
                        className="h-11 px-6 rounded-2xl bg-white/5 text-white text-sm font-bold border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center backdrop-blur-md"
                    >
                        Đăng nhập
                    </Link>
                </header>

                {/* Main */}
                <main className="flex-1 flex items-center justify-center px-4 py-16 relative">
                    <div className="w-full max-w-[520px] animate-fade-in-up">
                        
                        <div className="glass-card p-8 sm:p-10 rounded-[2.5rem] relative group">
                            {/* Decorative Top Glow */}
                            <div className="absolute -top-px left-20 right-20 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

                            {/* Title Section */}
                            <div className="text-center mb-8">
                                <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                                    Tham gia <span className="text-gradient">RestoManager</span>
                                </h1>
                                <p className="text-gray-400 text-sm md:text-base">
                                    Hệ thống quản lý nhà hàng chuyên nghiệp thế hệ mới
                                </p>
                            </div>

                            {/* Form */}
                            <form className="grid grid-cols-1 sm:grid-cols-2 gap-5" onSubmit={handleSubmit}>
                                
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="block text-xs font-black tracking-widest uppercase text-gray-500 ml-1">
                                        Email công việc
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="your@email.com"
                                        className="h-14 w-full px-5 rounded-2xl border border-white/5
                                        bg-white/5 text-white placeholder-gray-600 text-sm
                                        focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all duration-300"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-black tracking-widest uppercase text-gray-500 ml-1">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={form.username}
                                        onChange={handleChange}
                                        placeholder="Tên đăng nhập"
                                        className="h-14 w-full px-5 rounded-2xl border border-white/5
                                        bg-white/5 text-white placeholder-gray-600 text-sm
                                        focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all duration-300"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-black tracking-widest uppercase text-gray-500 ml-1">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="0123 456 789"
                                        className="h-14 w-full px-5 rounded-2xl border border-white/5
                                        bg-white/5 text-white placeholder-gray-600 text-sm
                                        focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all duration-300"
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <label className="block text-xs font-black tracking-widest uppercase text-gray-500 ml-1">
                                        Họ và tên
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={form.fullName}
                                        onChange={handleChange}
                                        placeholder="Nguyễn Văn A"
                                        className="h-14 w-full px-5 rounded-2xl border border-white/5
                                        bg-white/5 text-white placeholder-gray-600 text-sm
                                        focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all duration-300"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <label className="block text-xs font-black tracking-widest uppercase text-gray-500 ml-1">
                                        Mật khẩu bảo mật
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="h-14 w-full px-5 rounded-2xl border border-white/5
                                        bg-white/5 text-white placeholder-gray-600 text-sm
                                        focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all duration-300"
                                        required
                                    />
                                </div>

                                <div className="sm:col-span-2 mt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-sm tracking-widest uppercase
                                        shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95
                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 overflow-hidden"
                                    >
                                        <div className="relative z-10 flex items-center justify-center gap-3">
                                            {loading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Đang xử lý</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Bắt đầu ngay</span>
                                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                    </button>
                                </div>
                            </form>

                            {/* Decorative Corner */}
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                        </div>

                        {/* Footer Link */}
                        <div className="mt-8 text-center animate-fade-in stagger-3">
                            <p className="text-gray-400 text-sm">
                                Đã là thành viên?{" "}
                                <Link
                                    to="/login"
                                    className="font-black text-emerald-400 hover:text-emerald-300 transition-all uppercase tracking-widest text-[11px]"
                                >
                                    Đăng nhập ngay
                                </Link>
                            </p>
                        </div>

                    </div>
                </main>

                {/* Footer */}
                <footer className="py-8 text-center text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">
                    © 2026 RestoManager. Digital Excellence.
                </footer>
            </div>
        </div>
    );
}