import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';
import { createBranchStaff } from '../api/managerApi';
import {
    User, AtSign, Mail, Phone, Lock, Eye, EyeOff,
    Shield, CheckCircle2, XCircle, ArrowLeft,
    UserPlus, ChevronRight, Info
} from 'lucide-react';

export default function ManagerCreateStaff() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [errors, setErrors] = useState({});
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'Staff', // Default to Staff
        isActive: true,
    });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const validate = () => {
        const errs = {};
        if (!form.fullName.trim())
            errs.fullName = 'Họ và tên không được để trống';
        if (!form.username.trim())
            errs.username = 'Tên đăng nhập không được để trống';
        else if (!/^[a-zA-Z0-9_]{4,20}$/.test(form.username))
            errs.username = 'Tên đăng nhập 4-20 ký tự, chỉ chữ cái, số và dấu _';
        if (!form.email.trim())
            errs.email = 'Email không được để trống';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            errs.email = 'Vui lòng nhập đúng định dạng email';
        if (form.phone && !/^(\+84|0)[2-9]\d{8}$/.test(form.phone.replace(/\s/g, '')))
            errs.phone = 'Số điện thoại không hợp lệ';
        if (!form.password)
            errs.password = 'Mật khẩu không được để trống';
        else if (form.password.length < 6)
            errs.password = 'Mật khẩu phải từ 6 ký tự trở lên';
        if (!form.confirmPassword)
            errs.confirmPassword = 'Vui lòng xác nhận mật khẩu';
        else if (form.password !== form.confirmPassword)
            errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleField = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
    };

    const handleSave = async () => {
        if (!validate()) {
            showToast('Vui lòng kiểm tra lại thông tin', 'error');
            return;
        }
        setSaving(true);
        try {
            await createBranchStaff({
                fullName: form.fullName,
                username: form.username,
                email: form.email,
                phone: form.phone,
                password: form.password,
                role: form.role,
                isActive: form.isActive,
            });
            showToast('Tài khoản nhân viên đã được tạo thành công');
            setTimeout(() => navigate('/manager/staff'), 1200);
        } catch (err) {
            showToast(err.response?.data?.message || 'Không thể tạo tài khoản', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <BranchManagerLayout>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all
                    ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 pt-4">
                <button onClick={() => navigate('/manager/dashboard')} className="hover:text-gray-600 transition-colors uppercase tracking-wider font-bold">Dashboard</button>
                <ChevronRight size={13} />
                <button onClick={() => navigate('/manager/staff')} className="hover:text-gray-600 transition-colors uppercase tracking-wider font-bold">Quản lý nhân viên</button>
                <ChevronRight size={13} />
                <span className="text-emerald-600 font-bold uppercase tracking-wider">Thêm mới nhân viên</span>
            </nav>

            {/* Header */}
            <div className="flex items-center gap-3 mb-1.5">
                <button onClick={() => navigate('/manager/staff')}
                    className="text-gray-400 hover:text-gray-700 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản Nhân viên</h1>
            </div>
            <p className="text-gray-400 text-sm mb-6 pl-9 leading-relaxed">
                Thiết lập tài khoản mới cho nhân viên phục vụ hoặc đầu bếp tại chi nhánh.
            </p>

            {/* Form Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                    {/* Họ và tên */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            Họ và tên <span className="text-red-400 ml-0.5">*</span>
                        </label>
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all
                            ${errors.fullName ? 'border-red-400 bg-red-50/50 focus-within:ring-2 focus-within:ring-red-100' : 'border-gray-100 bg-gray-50/30 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50 focus-within:bg-white'}`}>
                            <User size={16} className="text-gray-400 shrink-0" />
                            <input
                                value={form.fullName}
                                onChange={e => handleField('fullName', e.target.value)}
                                placeholder="Tên nhân viên..."
                                className="flex-1 bg-transparent text-gray-800 focus:outline-none placeholder:text-gray-300 font-medium"
                                autoFocus
                            />
                        </div>
                        {errors.fullName && <p className="text-[11px] text-red-500 font-bold">{errors.fullName}</p>}
                    </div>

                    {/* Tên đăng nhập */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            Tên đăng nhập <span className="text-red-400 ml-0.5">*</span>
                        </label>
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all
                            ${errors.username ? 'border-red-400 bg-red-50/50 focus-within:ring-2 focus-within:ring-red-100' : 'border-gray-100 bg-gray-50/30 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50 focus-within:bg-white'}`}>
                            <AtSign size={16} className="text-gray-400 shrink-0" />
                            <input
                                value={form.username}
                                onChange={e => handleField('username', e.target.value)}
                                placeholder="staff_01..."
                                className="flex-1 bg-transparent text-gray-800 focus:outline-none placeholder:text-gray-300 font-medium"
                            />
                        </div>
                        {errors.username && <p className="text-[11px] text-red-500 font-bold">{errors.username}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            Email <span className="text-red-400 ml-0.5">*</span>
                        </label>
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all
                            ${errors.email ? 'border-red-400 bg-red-50/50 focus-within:ring-2 focus-within:ring-red-100' : 'border-gray-100 bg-gray-50/30 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50 focus-within:bg-white'}`}>
                            <Mail size={16} className="text-gray-400 shrink-0" />
                            <input
                                value={form.email}
                                onChange={e => handleField('email', e.target.value)}
                                placeholder="email@address.com..."
                                className="flex-1 bg-transparent text-gray-800 focus:outline-none placeholder:text-gray-300 font-medium"
                                type="email"
                            />
                        </div>
                        {errors.email && <p className="text-[11px] text-red-500 font-bold">{errors.email}</p>}
                    </div>

                    {/* Số điện thoại */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Số điện thoại</label>
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all
                            ${errors.phone ? 'border-red-400 bg-red-50/50 focus-within:ring-2 focus-within:ring-red-100' : 'border-gray-100 bg-gray-50/30 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50 focus-within:bg-white'}`}>
                            <Phone size={16} className="text-gray-400 shrink-0" />
                            <input
                                value={form.phone}
                                onChange={e => handleField('phone', e.target.value)}
                                placeholder="0xxx xxx xxx..."
                                className="flex-1 bg-transparent text-gray-800 focus:outline-none placeholder:text-gray-300 font-medium"
                                type="tel"
                            />
                        </div>
                        {errors.phone && <p className="text-[11px] text-red-500 font-bold">{errors.phone}</p>}
                    </div>

                    {/* Vai trò */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Vai trò / Chức vụ</label>
                        <div className="flex gap-4">
                            {['Staff', 'Kitchen'].map(role => (
                                <button
                                    key={role}
                                    onClick={() => handleField('role', role)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-sm
                                        ${form.role === role
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                                            : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
                                >
                                    <Shield size={16} />
                                    {role === 'Staff' ? 'Phục vụ' : 'Đầu bếp'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:block" /> {/* Column gap filler */}

                    {/* Mật khẩu */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            Mật khẩu <span className="text-red-400 ml-0.5">*</span>
                        </label>
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all
                            ${errors.password ? 'border-red-400 bg-red-50/50 focus-within:ring-2 focus-within:ring-red-100' : 'border-gray-100 bg-gray-50/30 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50 focus-within:bg-white'}`}>
                            <Lock size={16} className="text-gray-400 shrink-0" />
                            <input
                                value={form.password}
                                onChange={e => handleField('password', e.target.value)}
                                type={showPass ? 'text' : 'password'}
                                placeholder="••••••••••"
                                className="flex-1 bg-transparent text-gray-800 focus:outline-none placeholder:text-gray-300 font-medium"
                            />
                            <button type="button" onClick={() => setShowPass(v => !v)}
                                className="text-gray-400 hover:text-gray-600 transition-colors">
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-[11px] text-red-500 font-bold">{errors.password}</p>}
                    </div>

                    {/* Xác nhận mật khẩu */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            Xác nhận mật khẩu <span className="text-red-400 ml-0.5">*</span>
                        </label>
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all
                            ${errors.confirmPassword ? 'border-red-400 bg-red-50/50 focus-within:ring-2 focus-within:ring-red-100' : 'border-gray-100 bg-gray-50/30 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50 focus-within:bg-white'}`}>
                            <Lock size={16} className="text-gray-400 shrink-0" />
                            <input
                                value={form.confirmPassword}
                                onChange={e => handleField('confirmPassword', e.target.value)}
                                type={showConfirmPass ? 'text' : 'password'}
                                placeholder="••••••••••"
                                className="flex-1 bg-transparent text-gray-800 focus:outline-none placeholder:text-gray-300 font-medium"
                            />
                            <button type="button" onClick={() => setShowConfirmPass(v => !v)}
                                className="text-gray-400 hover:text-gray-600 transition-colors">
                                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="text-[11px] text-red-500 font-bold">{errors.confirmPassword}</p>}
                    </div>

                </div>

                {/* Trạng thái */}
                <div className="mt-8 flex items-center justify-between bg-emerald-50/50 rounded-2xl px-6 py-4 border border-emerald-100/50">
                    <div>
                        <p className="text-sm font-bold text-emerald-900 uppercase tracking-wide">Trạng thái hoạt động</p>
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">Cho phép nhân viên đăng nhập ngay lập tức</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleField('isActive', !form.isActive)}
                            className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none
                                ${form.isActive ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300
                                ${form.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-xs font-bold uppercase ${form.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {form.isActive ? 'Kích hoạt' : 'Tạm dừng'}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
                    <button onClick={() => navigate('/manager/staff')}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all">
                        Hủy bỏ
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl
                            ${!saving ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' : 'bg-emerald-300 text-white cursor-not-allowed'}`}>
                        <UserPlus size={16} />
                        {saving ? 'Đang thực hiện...' : 'Tạo mới nhân viên'}
                    </button>
                </div>
            </div>

            {/* Security Note */}
            <div className="bg-gray-50 rounded-2xl p-5 flex gap-4 border border-gray-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <Info size={18} className="text-emerald-500" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Hướng dẫn tài khoản</p>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                        Khi thiết lập tài khoản, hãy đảm bảo mật khẩu có đủ độ mạnh. Nhân viên có thể sử dụng <b>Tên đăng nhập</b> hoặc <b>Email</b> để truy cập vào hệ thống. Sau khi tạo thành công, hãy cung cấp thông tin này cho nhân viên một cách bảo mật.
                    </p>
                </div>
            </div>
        </BranchManagerLayout>
    );
}
