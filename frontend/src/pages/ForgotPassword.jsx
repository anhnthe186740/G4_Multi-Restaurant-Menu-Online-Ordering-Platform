import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        try {
            const response = await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#020617] text-white font-sans selection:bg-emerald-500/30 selection:text-white overflow-hidden flex items-center justify-center">

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] animate-float-slow" />
            </div>

            <div className="relative z-10 w-full max-w-[440px] px-4 animate-fade-in-up">
                
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10 group">
                    <Link to="/" className="flex items-center gap-3 font-black text-3xl tracking-tighter hover:opacity-80 transition-all">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 group-hover:scale-110 transition-transform duration-500">
                            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 8H4c-1.1 0-2 .9-2 2v3c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3c0-1.1-.9-2-2-2zm0 7H4c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2zM3 5c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2s-.9-2-2-2H5c-1.1 0-2 .9-2 2z" />
                            </svg>
                        </div>
                        <span className="text-white">RestoManager</span>
                    </Link>
                </div>

                <div className="glass-card p-8 sm:p-10 rounded-[2.5rem] relative overflow-hidden group">
                    {/* Decorative Top Glow */}
                    <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

                    {/* Icon Section */}
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 shadow-inner group-hover:bg-emerald-500/20 transition-all duration-500">
                            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                    </div>

                    {/* Title Section */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Quên mật khẩu?</h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Đừng lo lắng, hãy nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-black tracking-widest uppercase text-gray-500 ml-1">
                                Email xác nhận
                            </label>
                            <div className="relative group/input">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-emerald-500 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    className="h-14 w-full pl-14 pr-5 rounded-2xl border border-white/5
                                    bg-white/5 text-white placeholder-gray-600 text-sm
                                    focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all duration-300"
                                />
                            </div>
                        </div>

                        {message && (
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold animate-fade-in text-center">
                                {message}
                            </div>
                        )}
                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-fade-in text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-sm tracking-widest uppercase
                            shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Đang gửi</span>
                                </div>
                            ) : "Gửi link khôi phục"}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <Link to="/login" className="inline-flex items-center gap-2 group/link">
                            <svg className="w-5 h-5 text-emerald-500 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            <span className="font-black text-emerald-400 hover:text-emerald-300 transition-all uppercase tracking-widest text-[11px]">
                                Quay lại đăng nhập
                            </span>
                        </Link>
                    </div>

                    {/* Decorative Corner */}
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>

                <footer className="mt-12 text-center text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">
                    © 2026 RestoManager. Digital Excellence.
                </footer>
            </div>
        </div>
    );
};

export default ForgotPassword;
