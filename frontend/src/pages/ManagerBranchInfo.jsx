import { useState, useEffect, useRef } from 'react';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';
import { getManagerBranchInfo, updateManagerBranchCover } from '../api/managerApi';
import { Store, MapPin, Phone, Clock, FileText, Image as ImageIcon, Camera, Loader2, ShieldCheck, Lock, Key, X, CheckCircle2 } from 'lucide-react';
import { sendChangePasswordOtpApi, changePasswordApi } from '../api/authApi';

export default function ManagerBranchInfo() {
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    // Password change state
    const [pwdModalOpen, setPwdModalOpen] = useState(false);
    const [pwdStep, setPwdStep] = useState(1); // 1 = get OTP, 2 = confirm new pwd
    const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' });
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdError, setPwdError] = useState('');
    const [pwdSuccess, setPwdSuccess] = useState('');

    useEffect(() => {
        fetchInfo();
    }, []);

    const fetchInfo = async () => {
        try {
            setLoading(true);
            const res = await getManagerBranchInfo();
            setInfo(res.data);
        } catch (err) {
            console.error("fetchInfo error:", err);
            setError('Không thể tải thông tin nhà hàng.');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleCoverChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('cover', file);

        try {
            setUploading(true);
            await updateManagerBranchCover(formData);
            // Refresh info to show new cover
            await fetchInfo();
        } catch (err) {
            console.error("Upload error:", err);
            alert('Lỗi khi tải ảnh bìa lên.');
        } finally {
            setUploading(false);
        }
    };

    /* ===== PASSWORD CHANGE LOGIC ===== */
    const handleOpenPwdModal = () => {
        setPwdModalOpen(true);
        setPwdStep(1);
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' });
        setPwdError('');
        setPwdSuccess('');
    };

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
                setPwdModalOpen(false);
            }, 2000);
        } catch (err) {
            setPwdError(err.response?.data?.message || 'Không thể đổi mật khẩu.');
        } finally {
            setPwdLoading(false);
        }
    };

    if (loading && !info) {
        return (
            <BranchManagerLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </BranchManagerLayout>
        );
    }

    if (error && !info) {
        return (
            <BranchManagerLayout>
                <div className="flex items-center justify-center p-10">
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 w-full max-w-md">
                        <span className="font-medium text-sm">{error || 'Không tìm thấy thông tin.'}</span>
                    </div>
                </div>
            </BranchManagerLayout>
        );
    }

    const { restaurant, name: branchName, address, phone, openingHours } = info || {};

    const renderOpeningHours = (hoursStr) => {
        if (!hoursStr) return <p className="text-sm font-medium text-gray-800">Chưa cập nhật</p>;
        try {
            const hours = JSON.parse(hoursStr);
            return (
                <div className="text-sm font-medium text-gray-800 space-y-1.5 w-full">
                    {hours.mon_fri && (
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1">
                            <span className="text-slate-500">Thứ 2 - Thứ 6:</span>
                            <span className="text-emerald-600 font-semibold">{hours.mon_fri}</span>
                        </div>
                    )}
                    {hours.sat && (
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1">
                            <span className="text-slate-500">Thứ 7:</span>
                            <span className="text-emerald-600 font-semibold">{hours.sat}</span>
                        </div>
                    )}
                    {hours.sun && (
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1">
                            <span className="text-slate-500">Chủ Nhật:</span>
                            <span className="text-red-500 font-semibold">{hours.sun}</span>
                        </div>
                    )}
                    {hours.email && (
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                            <span className="text-slate-400 text-xs uppercase tracking-wider">Email liên hệ:</span>
                            <span className="text-sky-600 text-xs truncate ml-2">{hours.email}</span>
                        </div>
                    )}
                </div>
            );
        } catch (e) {
            return <p className="text-sm font-medium text-gray-800">{hoursStr}</p>;
        }
    };

    return (
        <BranchManagerLayout>
            <div className="max-w-5xl mx-auto pb-10">
                {/* ── HEADER ── */}
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Thông tin nhà hàng</h1>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Chi tiết chi nhánh & thương hiệu</p>
                    </div>
                </div>

                {/* ── BANNER & LOGO ── */}
                <div className="mb-10 relative">
                    {/* Cover Wrapper */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
                        {/* Image area with separate overflow-hidden */}
                        <div className="h-56 w-full bg-slate-100 rounded-t-2xl overflow-hidden relative group">
                            {restaurant?.coverImageURL ? (
                                <img 
                                    src={`http://localhost:5000${restaurant.coverImageURL}`} 
                                    alt="Cover" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                    <ImageIcon size={40} className="mb-2 opacity-50" />
                                    <span className="text-sm font-semibold tracking-wide">Chưa có ảnh bìa</span>
                                </div>
                            )}
                            
                            {/* Dark Overlay for text legibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            {/* Upload Button */}
                            <div className="absolute top-4 right-4 z-20">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleCoverChange}
                                />
                                <button 
                                    onClick={handleUploadClick}
                                    disabled={uploading}
                                    className="flex items-center gap-2 bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-xl border border-white/20 shadow-xl transition-all font-bold text-xs backdrop-blur-md active:scale-95 disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Camera size={16} />
                                    )}
                                    {uploading ? 'Đang tải...' : 'Đổi ảnh bìa'}
                                </button>
                            </div>

                            {/* Bottom Text Area (Inside cover) */}
                            <div className="absolute bottom-6 left-48 right-8 z-10 hidden md:block">
                                <h2 className="text-3xl font-black text-white leading-tight drop-shadow-lg tracking-tight">
                                    {restaurant?.name || 'Nhà hàng'}
                                </h2>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                        Active Brand
                                    </span>
                                    {restaurant?.taxCode && (
                                        <span className="text-white/80 text-xs font-medium bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                                            MST: {restaurant.taxCode}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Logo and Mobile text (Negative margin) */}
                        <div className="px-8 pb-6 flex flex-col md:flex-row md:items-end gap-6 relative">
                            {/* Logo */}
                            <div className="w-36 h-36 rounded-3xl bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 -mt-20 relative z-20 shrink-0 transform hover:scale-105 transition-transform duration-300">
                                {restaurant?.logoURL ? (
                                    <img 
                                        src={`http://localhost:5000${restaurant.logoURL}`} 
                                        alt="Logo" 
                                        className="w-full h-full object-cover rounded-2xl"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-50 flex items-center justify-center rounded-2xl">
                                        <Store size={40} className="text-slate-300" />
                                    </div>
                                )}
                            </div>

                            {/* Mobile title fallback */}
                            <div className="md:hidden pb-1">
                                <h2 className="text-2xl font-bold text-gray-900">{restaurant?.name || 'Chưa cập nhật tên'}</h2>
                                <p className="text-emerald-600 font-bold text-xs mt-1 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Store size={14} /> Hệ thống nhà hàng
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── INFO CARDS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Branch Info Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] pointer-events-none transform rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <Store size={240} />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-inner">
                                    <Store size={22} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Chi nhánh hiện tại</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block">Tên hiển thị</label>
                                    <p className="text-lg font-bold text-gray-900 leading-tight">{branchName || 'Chưa cập nhật'}</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3 p-1">
                                        <MapPin size={18} className="text-emerald-500 shrink-0 mt-1" />
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Địa chỉ</label>
                                            <p className="text-sm font-semibold text-slate-700 leading-relaxed">{address || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-1">
                                        <Phone size={18} className="text-sky-500 shrink-0 mt-1" />
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Hotline</label>
                                            <p className="text-sm font-semibold text-slate-700">{phone || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 mt-2 border-t border-slate-50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Clock size={16} className="text-amber-500" />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian hoạt động</span>
                                    </div>
                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                        {renderOpeningHours(openingHours)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Restaurant Bio Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
                        <div className="absolute -bottom-10 -right-10 p-4 opacity-[0.03] pointer-events-none transform -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <FileText size={240} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-inner">
                                    <FileText size={22} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Giới thiệu thương hiệu</h3>
                            </div>
                            
                            <div className="space-y-6 flex-1">
                                <div>
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 block">Mô tả hệ thống</label>
                                    <div className="bg-indigo-50/30 border border-indigo-100/30 rounded-2xl p-5 text-sm text-gray-600 leading-relaxed font-medium min-h-[140px]">
                                        {restaurant?.description ? (
                                            <div dangerouslySetInnerHTML={{ __html: restaurant.description.replace(/\n/g, '<br/>') }} />
                                        ) : (
                                            <span className="italic text-slate-400">Thương hiệu chưa có đoạn giới thiệu ngắn nào.</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Trạng thái thuế</label>
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã xác minh</p>
                                    </div>
                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Mã số thuế</label>
                                        <p className="text-sm font-mono font-bold text-slate-700 truncate">{restaurant?.taxCode || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white" />
                                    ))}
                                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[8px] font-bold text-emerald-600 border-2 border-white">+12</div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-right max-w-[160px]">
                                    Liên hệ Owner để thay đổi dữ liệu gốc
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Account Security Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden group lg:col-span-2 mt-4">
                        <div className="absolute -right-10 top-0 p-4 opacity-[0.02] pointer-events-none transform -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <ShieldCheck size={280} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-inner">
                                        <ShieldCheck size={22} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Bảo mật tài khoản</h3>
                                </div>
                                <p className="text-sm font-medium text-slate-500 max-w-md mt-2">
                                    Quản lý mật khẩu và bảo vệ tài khoản quản lý chi nhánh của bạn. Đảm bảo sử dụng mật khẩu mạnh.
                                </p>
                            </div>
                            <button
                                onClick={handleOpenPwdModal}
                                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20 transition-all active:scale-95 shrink-0"
                            >
                                <Lock size={16} /> Đổi mật khẩu
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* ===== PASSWORD CHANGE MODAL ===== */}
            {pwdModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                    <Lock size={18} />
                                </div>
                                <h2 className="font-bold text-gray-900 text-lg">Đổi mật khẩu</h2>
                            </div>
                            <button onClick={() => setPwdModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
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
                                onClick={() => setPwdModalOpen(false)}
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
            )}
        </BranchManagerLayout>
    );
}
