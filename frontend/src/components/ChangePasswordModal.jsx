import { useState } from 'react';
import { Lock, Key, X, CheckCircle2, Loader2 } from 'lucide-react';
import { sendChangePasswordOtpApi, changePasswordApi } from '../api/authApi';

export default function ChangePasswordModal({ isOpen, onClose }) {
    const [pwdStep, setPwdStep] = useState(1);
    const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' });
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdError, setPwdError] = useState('');
    const [pwdSuccess, setPwdSuccess] = useState('');

    if (!isOpen) return null;

    const handleSendOtp = async () => {
        if (!pwdForm.currentPassword) {
            setPwdError('Vui lòng nhập mật khẩu hiện tại.');
            return;
        }
        setPwdLoading(true);
        setPwdError('');
        try {
            await sendChangePasswordOtpApi({ currentPassword: pwdForm.currentPassword });
            setPwdStep(2);
            setPwdSuccess('Mã OTP đã được gửi về email của bạn!');
            setTimeout(() => setPwdSuccess(''), 3000);
        } catch (err) {
            setPwdError(err.response?.data?.message || 'Không thể gửi mã OTP.');
        } finally {
            setPwdLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!pwdForm.otp || !pwdForm.newPassword || !pwdForm.confirmPassword) {
            setPwdError('Vui lòng điền đầy đủ thông tin.');
            return;
        }
        if (pwdForm.newPassword.length < 8) {
            setPwdError('Mật khẩu mới phải có ít nhất 8 ký tự.');
            return;
        }
        if (pwdForm.newPassword !== pwdForm.confirmPassword) {
            setPwdError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setPwdLoading(true);
        setPwdError('');
        try {
            await changePasswordApi({
                currentPassword: pwdForm.currentPassword,
                newPassword: pwdForm.newPassword,
                otp: pwdForm.otp
            });
            setPwdSuccess('Đổi mật khẩu thành công!');
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            setPwdError(err.response?.data?.message || 'Không thể đổi mật khẩu.');
        } finally {
            setPwdLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <Lock size={18} />
                        </div>
                        <h2 className="font-bold text-gray-900 text-lg">Đổi mật khẩu</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Progress indicators */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className={`h-2 flex-1 rounded-full ${pwdStep >= 1 ? 'bg-orange-500' : 'bg-slate-100'}`} />
                        <div className={`h-2 flex-1 rounded-full ${pwdStep >= 2 ? 'bg-orange-500' : 'bg-slate-100'}`} />
                    </div>

                    {pwdError && (
                        <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2 border border-red-100">
                            <X size={16} className="shrink-0 mt-0.5" />
                            <span>{pwdError}</span>
                        </div>
                    )}

                    {pwdSuccess && (
                        <div className="bg-emerald-50 text-emerald-600 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2 border border-emerald-100">
                            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                            <span>{pwdSuccess}</span>
                        </div>
                    )}

                    {pwdStep === 1 && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mật khẩu hiện tại</label>
                            <div className="relative">
                                <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={pwdForm.currentPassword}
                                    onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                                    placeholder="Nhập mật khẩu hiện tại"
                                    className="w-full pl-11 pr-4 py-3.5 text-sm font-medium text-gray-900 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-slate-50/50"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-3 font-medium leading-relaxed">
                                Chúng tôi sẽ gửi một mã OTP gồm 6 chữ số đến email liên kết với tài khoản của bạn để xác thực yêu cầu này.
                            </p>
                        </div>
                    )}

                    {pwdStep === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mã OTP từ Email</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={pwdForm.otp}
                                    onChange={e => setPwdForm({ ...pwdForm, otp: e.target.value })}
                                    placeholder="Nhập 6 số OTP"
                                    className="w-full px-4 py-3.5 text-center tracking-[0.5em] font-bold text-gray-900 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mật khẩu mới</label>
                                <input
                                    type="password"
                                    value={pwdForm.newPassword}
                                    onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                                    placeholder="Tối thiểu 8 ký tự"
                                    className="w-full px-4 py-3.5 text-sm font-medium text-gray-900 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Xác nhận mật khẩu</label>
                                <input
                                    type="password"
                                    value={pwdForm.confirmPassword}
                                    onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                                    placeholder="Nhập lại mật khẩu mới"
                                    className="w-full px-4 py-3.5 text-sm font-medium text-gray-900 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/50"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end items-center">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        Hủy
                    </button>
                    {pwdStep === 1 ? (
                        <button
                            onClick={handleSendOtp}
                            disabled={pwdLoading}
                            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {pwdLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                            Lấy mã OTP
                        </button>
                    ) : (
                        <button
                            onClick={handleChangePassword}
                            disabled={pwdLoading || pwdSuccess}
                            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {pwdLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            Lưu mật khẩu mới
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
