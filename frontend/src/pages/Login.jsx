import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginApi, loginWithGoogleApi } from "../api/authApi";
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get("redirect");
    const [form, setForm] = useState({ email: "", password: "" });
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lockedInfo, setLockedInfo] = useState(null);

    const loginGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError(null);
            setLockedInfo(null);
            try {
                const response = await loginWithGoogleApi(tokenResponse.access_token);
                if (response?.data?.token) {
                    localStorage.setItem("token", response.data.token);
                    localStorage.setItem("user", JSON.stringify(response.data.user));

                    const role = response.data.user?.role;
                    if (redirectPath) {
                        navigate(redirectPath);
                    } else if (role === "Admin") {
                        navigate("/admin/dashboard");
                    } else if (role === "RestaurantOwner") {
                        navigate("/owner/dashboard");
                    } else if (role === "BranchManager") {
                        navigate("/manager/dashboard");
                    } else {
                        navigate("/");
                    }
                } else {
                    setError("Không nhận được token từ server");
                }
            } catch (err) {
                const data = err.response?.data;
                if (data?.locked) {
                    setLockedInfo({ lockReason: data.lockReason });
                } else {
                    setError(data?.message || "Lỗi đăng nhập Google");
                }
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setError("Đăng nhập Google thất bại");
        }
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setLockedInfo(null);
        try {
            const response = await loginApi(form);
            if (response?.data?.token) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));
                if (remember) localStorage.setItem("rememberEmail", form.email);

                // Redirect sau khi login
                const role = response.data.user?.role;
                if (redirectPath) {
                    navigate(redirectPath);
                } else if (role === "Admin") {
                    navigate("/admin/dashboard");
                } else if (role === "RestaurantOwner") {
                    navigate("/owner/dashboard");
                } else if (role === "BranchManager") {
                    navigate("/manager/dashboard");
                } else if (role === "Staff") {
                    navigate("/manager/tables");
                } else if (role === "Kitchen") {
                    navigate("/kitchen/kds");
                } else {
                    navigate("/");
                }
            } else {
                setError("Không nhận được token từ server");
            }
        } catch (err) {
            const data = err.response?.data;
            if (data?.locked) {
                setLockedInfo({ lockReason: data.lockReason });
            } else {
                setError(data?.message || "Email hoặc mật khẩu không đúng");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#020617] text-white font-sans selection:bg-emerald-500/30 selection:text-white overflow-hidden">

            {/* Ambient Background Glows - Matching HeroSection */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] animate-float-slow" />
            </div>

            <div className="relative z-10 flex min-h-screen flex-col">

                {/* Header - Matching Home Header Style */}
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
                        to="/register"
                        className="h-11 px-6 rounded-2xl bg-white/5 text-white text-sm font-bold border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center backdrop-blur-md"
                    >
                        Tạo tài khoản
                    </Link>
                </header>

                {/* Main */}
                <main className="flex-1 flex items-center justify-center px-4 py-20 relative">
                    <div className="w-full max-w-[460px] animate-fade-in-up">
                        
                        <div className="glass-card p-8 sm:p-12 rounded-[2.5rem] relative group">
                            {/* Decorative Top Glow */}
                            <div className="absolute -top-px left-20 right-20 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

                            {/* Title Section */}
                            <div className="text-center mb-10">
                                <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                                    Chào mừng <span className="text-gradient">quay lại</span>
                                </h1>
                                <p className="text-gray-400 text-sm md:text-base">
                                    Đăng nhập để quản lý hệ thống nhà hàng của bạn
                                </p>
                            </div>

                            {/* === THÔNG BÁO KHOÁ TÀI KHOẢN === */}
                            {lockedInfo && (
                                <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 animate-shake">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 rounded-xl bg-red-500/10 shrink-0">
                                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0-6V9m4-3h-1.5M4.5 9h15.2M12 3v18m-9-9h18" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-red-400 text-sm">Tài khoản này đã bị tạm khoá</p>
                                            <p className="mt-1 text-red-400/70 text-xs leading-relaxed">
                                                Lý do: {lockedInfo.lockReason}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* === LỖI THÔNG THƯỜNG === */}
                            {error && (
                                <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-3 animate-fade-in">
                                    <p className="text-red-400 text-sm font-medium text-center">{error}</p>
                                </div>
                            )}

                            {/* Form */}
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-300 ml-1">
                                        Email truy cập
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
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-sm font-bold text-gray-300">
                                            Mật khẩu
                                        </label>
                                        <Link to="/forgot-password" title="Lấy lại mật khẩu" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                                            Quên mật khẩu?
                                        </Link>
                                    </div>
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

                                <div className="flex items-center gap-3 px-1">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                id="remember"
                                                type="checkbox"
                                                checked={remember}
                                                onChange={(e) => setRemember(e.target.checked)}
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 checked:border-emerald-500 checked:bg-emerald-500 transition-all"
                                            />
                                            <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none">
                                                <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Duy trì đăng nhập</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-sm tracking-widest uppercase
                                    shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Đang xử lý</span>
                                        </div>
                                    ) : "Đăng nhập ngay"}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="relative my-10 px-4">
                                <div className="h-px bg-white/5" />
                                <span className="absolute inset-x-0 -top-2.5 mx-auto w-fit px-4 text-[10px] font-black tracking-widest uppercase bg-[#0f172a] text-gray-500 rounded-full border border-white/5">
                                    Hoặc tiếp tục với
                                </span>
                            </div>

                            {/* Social */}
                            <div className="px-1">
                                <button
                                    type="button"
                                    onClick={() => loginGoogle()}
                                    disabled={loading}
                                    className="flex items-center justify-center gap-4
                                    h-14 w-full rounded-2xl
                                    border border-white/5
                                    bg-white/5 text-gray-300
                                    text-sm font-bold
                                    hover:bg-white/10 hover:border-white/10 hover:text-white
                                    transition-all duration-300 disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.02 1.54 7.4 2.82l5.47-5.47C33.58 3.7 29.18 1.5 24 1.5 14.98 1.5 7.44 7.98 4.69 16.55l6.98 5.42C13.1 15.3 18.13 9.5 24 9.5z" />
                                        <path fill="#4285F4" d="M46.5 24.5c0-1.67-.15-3.27-.43-4.82H24v9.12h12.68c-.55 2.96-2.18 5.47-4.64 7.16l7.18 5.57C43.52 37.18 46.5 31.42 46.5 24.5z" />
                                        <path fill="#FBBC05" d="M11.67 28.1c-.5-1.48-.79-3.06-.79-4.7 0-1.64.29-3.22.79-4.7l-6.98-5.42C3.03 16.45 2.5 20.15 2.5 23.4c0 3.25.53 6.95 2.19 10.12l6.98-5.42z" />
                                        <path fill="#34A853" d="M24 46.5c6.48 0 11.93-2.15 15.9-5.87l-7.18-5.57c-2 1.34-4.56 2.14-8.72 2.14-5.87 0-10.9-3.8-12.67-9.06l-6.98 5.42C7.44 40.02 14.98 46.5 24 46.5z" />
                                    </svg>
                                    Google Account
                                </button>
                            </div>

                            {/* Decorative Corner */}
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                        </div>

                        {/* Footer Link */}
                        <div className="mt-10 text-center animate-fade-in stagger-3">
                            <p className="text-gray-400 text-sm">
                                Bạn là đối tác mới?{" "}
                                <Link
                                    to="/register"
                                    className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-all"
                                >
                                    Tham gia ngay
                                </Link>
                            </p>
                        </div>

                    </div>
                </main>

                {/* Footer */}
                <footer className="py-10 text-center text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">
                    © 2026 RestoManager. Digital Excellence.
                </footer>
            </div>
        </div>
    );
}