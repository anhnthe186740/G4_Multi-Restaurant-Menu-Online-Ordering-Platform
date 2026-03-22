import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, X, Loader2, CheckCircle } from "lucide-react";
import axios from "axios";

export default function ChangePasswordModal({ isOpen, onClose }) {
    const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "", otp: "" });
    const [pwShow, setPwShow] = useState({ current: false, new: false, confirm: false });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMessage, setPwMessage] = useState("");
    const [pwError, setPwError] = useState("");
    
    const [isOtpStep, setIsOtpStep] = useState(false);
    const [otpCountdown, setOtpCountdown] = useState(0);

    const API_URL = "http://localhost:5000/api";

    useEffect(() => {
        let timer;
        if (otpCountdown > 0) {
            timer = setInterval(() => {
                setOtpCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [otpCountdown]);

    if (!isOpen) return null;

    const handleRequestOtp = async (e) => {
        if (e) e.preventDefault();
        setPwMessage("");
        setPwError("");
        if (!pwForm.currentPassword) { setPwError("Vui lòng nhập mật khẩu hiện tại"); return; }
        if (pwForm.newPassword.length < 8) { setPwError("Mật khẩu mới tối thiểu 8 ký tự"); return; }
        if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError("Mật khẩu xác nhận không khớp"); return; }

        setPwLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/auth/send-change-password-otp`, {
                currentPassword: pwForm.currentPassword,
            }, { headers: { Authorization: `Bearer ${token}` } });
            setPwMessage(res.data.message);
            setIsOtpStep(true);
            setOtpCountdown(60);
        } catch (err) {
            setPwError(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setPwLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        if (e) e.preventDefault();
        setPwMessage("");
        setPwError("");
        if (!pwForm.otp || pwForm.otp.length !== 6) { setPwError("Mã OTP phải gồm 6 chữ số"); return; }
        
        setPwLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${API_URL}/auth/change-password`, {
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword,
                otp: pwForm.otp,
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            setPwMessage("Đổi mật khẩu thành công!");
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err) {
            setPwError(err.response?.data?.message || "Mã OTP không hợp lệ, vui lòng thử lại.");
        } finally {
            setPwLoading(false);
        }
    };

    const handleClose = () => {
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "", otp: "" });
        setIsOtpStep(false);
        setPwMessage("");
        setPwError("");
        setOtpCountdown(0);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-800">
                        <Lock size={18} className="text-orange-500" />
                        <h2 className="font-bold">Đổi mật khẩu</h2>
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {pwMessage && !isOtpStep && (
                         <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                            <CheckCircle size={16} /> {pwMessage}
                         </div>
                    )}
                    {pwError && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                            ⚠️ {pwError}
                        </div>
                    )}

                    <form onSubmit={isOtpStep ? handleChangePassword : handleRequestOtp} className="space-y-4">
                        {!isOtpStep ? (
                            <>
                                {["currentPassword", "newPassword", "confirmPassword"].map((field) => {
                                    const labels = { currentPassword: "Mật khẩu hiện tại", newPassword: "Mật khẩu mới", confirmPassword: "Xác nhận mật khẩu mới" };
                                    const showKey = field === "currentPassword" ? "current" : field === "newPassword" ? "new" : "confirm";
                                    return (
                                        <div key={field}>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{labels[field]}</label>
                                            <div className="relative">
                                                <input
                                                    type={pwShow[showKey] ? "text" : "password"}
                                                    value={pwForm[field]}
                                                    onChange={(e) => setPwForm(prev => ({ ...prev, [field]: e.target.value }))}
                                                    required
                                                    className="w-full h-11 px-4 pr-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setPwShow(prev => ({ ...prev, [showKey]: !prev[showKey] }))}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {pwShow[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button
                                    type="submit"
                                    disabled={pwLoading}
                                    className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {pwLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                                    Tiếp theo: Nhận mã OTP
                                </button>
                            </>
                        ) : (
                            <div className="space-y-5">
                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                    <p className="text-sm text-orange-800 text-center">
                                        Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.
                                    </p>
                                </div>
                                <div className="text-center">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mã xác thực OTP (6 số)</label>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        value={pwForm.otp}
                                        onChange={(e) => setPwForm(prev => ({ ...prev, otp: e.target.value.replace(/[^0-9]/g, "") }))}
                                        placeholder="000000"
                                        className="w-full h-14 text-center text-3xl font-bold tracking-[0.5em] rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        type="submit"
                                        disabled={pwLoading || pwForm.otp.length < 6}
                                        className="w-full h-11 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {pwLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                        Xác nhận thay đổi
                                    </button>
                                    
                                    <div className="flex items-center justify-between px-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsOtpStep(false)}
                                            className="text-xs text-gray-500 hover:text-gray-800 font-medium"
                                        >
                                            ← Quay lại chỉnh sửa
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRequestOtp}
                                            disabled={otpCountdown > 0 || pwLoading}
                                            className="text-xs text-orange-600 hover:text-orange-700 font-bold disabled:opacity-50"
                                        >
                                            {otpCountdown > 0 ? `Gửi lại sau ${otpCountdown}s` : "Gửi lại mã OTP"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
