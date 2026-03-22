import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';
import { createOwnerManager } from '../api/ownerApi';
import { getOwnerBranches } from '../api/ownerApi';
import {
    User, AtSign, Mail, Phone, Lock, Eye, EyeOff,
    Store, Shield, CheckCircle2, XCircle, ArrowLeft,
    UserPlus, ChevronRight, Info
} from 'lucide-react';

export default function OwnerCreateManager() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [errors, setErrors] = useState({});
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [branches, setBranches] = useState([]);

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        branchId: '',
        role: 'BranchManager',
        isActive: true,
    });

    useEffect(() => {
        getOwnerBranches()
            .then(res => setBranches(res.data?.branches || res.data || []))
            .catch(() => {});
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const validate = () => {
        const errs = {};
        if (!form.fullName.trim())
            errs.fullName = 'Họ và tên không được để trống';
        if (!form.email.trim())
            errs.email = 'Email không được để trống';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            errs.email = 'Vui lòng nhập đúng định dạng email hợp lệ (ví dụ: abc@company.com)';
        if (form.phone && !/^(\+84|0)[2-9]\d{8}$/.test(form.phone.replace(/\s/g, '')))
            errs.phone = 'Số điện thoại không hợp lệ (VD: 0912345678)';
        if (!form.password)
            errs.password = 'Mật khẩu không được để trống';
        else if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(form.password))
            errs.password = 'Mật khẩu ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt';
        if (!form.confirmPassword)
            errs.confirmPassword = 'Vui lòng xác nhận mật khẩu';
        else if (form.password !== form.confirmPassword)
            errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
        if (!form.branchId)
            errs.branchId = 'Vui lòng chọn chi nhánh';
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
            await createOwnerManager({
                fullName: form.fullName,
                username: form.email, // Sử dụng email làm tên đăng nhập
                email: form.email,
                phone: form.phone,
                password: form.password,
                branchId: form.branchId,
                role: form.role,
                isActive: form.isActive,
            });
            showToast('Tài khoản quản lý đã được tạo thành công');
            setTimeout(() => navigate('/owner/staff'), 1200);
        } catch (err) {
            showToast(err.response?.data?.message || 'Không thể tạo tài khoản', 'error');
        } finally {
            setSaving(false);
        }
    };

    const selectedBranch = branches.find(b => String(b.branchID || b.id) === String(form.branchId));

    return (
        <RestaurantOwnerLayout>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all
                    ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                <button onClick={() => navigate('/owner/dashboard')} className="hover:text-gray-600 transition-colors">Dashboard</button>
                <ChevronRight size={13} />
                <button onClick={() => navigate('/owner/staff')} className="hover:text-gray-600 transition-colors">User Management</button>
                <ChevronRight size={13} />
                <span className="text-blue-600 font-semibold">Create Branch Manager</span>
            </nav>

            {/* Header */}
            <div className="flex items-center gap-3 mb-1.5">
                <button onClick={() => navigate('/owner/staff')}
                    className="text-gray-400 hover:text-gray-700 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản Quản lý Chi nhánh</h1>
            </div>
            <p className="text-gray-400 text-sm mb-6 pl-9">
                Cung cấp thông tin để thiết lập quyền điều hành chi nhánh mới.
            </p>

            {/* Form Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">

                    {/* Họ và tên */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                            Họ và tên <span className="text-red-400">*</span>
                        </label>
                        <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all
                            ${errors.fullName ? 'border-red-400 bg-red-50 focus-within:ring-2 focus-within:ring-red-100' : 'border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50'}`}>
                            <User size={15} className="text-gray-400 shrink-0" />
                            <input
                                value={form.fullName}
                                onChange={e => handleField('fullName', e.target.value)}
                                placeholder="Nguyễn Văn A"
                                className="flex-1 bg-transparent text-gray-800 focus:outline-none placeholder:text-gray-300"
                                autoFocus
                            />
                        </div>
                        {errors.fullName && <p className="mt-1.5 text-xs text-red-500">{errors.fullName}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                            Email <span className="text-red-400">*</span>
                        </label>
                        <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all
                            ${errors.email ? 'border-red-400 bg-red-50 focus-within:ring-2 focus-within:ring-red-100' : 'border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50'}`}>
                            <Mail size={15} className="text-gray-400 shrink-0" />
                            <input
                                value={form.email}
                                onChange={e => handleField('email', e.target.value)}
                                placeholder="manager@restaurant.com"
                                className="flex-1 bg-transparent text-gray-800 focus:outline-none placeholder:text-gray-300"
                                type="email"
                            />
                        </div>
                        {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                    </div>

                    {/* Số điện thoại */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Số điện thoại</label>
                        <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all
                            ${errors.phone ? 'border-red-400 bg-red-50 focus-within:ring-2 focus-within:ring-red-100' : 'border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50'}`}>
                            <Phone size={15} className="text-gray-400 shrink-0" />
                            <input
                                value={form.phone}
                                onChange={e => handleField('phone', e.target.value)}
                                placeholder="0123 456 789"
                                className="flex-1 bg-transparent text-gray-800 focus:outline-none placeholder:text-gray-300"
                                type="tel"
                            />
                        </div>
                        {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
                    </div>

                    {/* Chi nhánh */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                            Chi nhánh <span className="text-red-400">*</span>
                        </label>
                        <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all
                            ${errors.branchId ? 'border-red-400 bg-red-50' : 'border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50'}`}>
                            <Store size={15} className="text-gray-400 shrink-0" />
                            <select
                                value={form.branchId}
                                onChange={e => handleField('branchId', e.target.value)}
                                className="flex-1 bg-transparent text-gray-800 focus:outline-none appearance-none"
                            >
                                <option value="">Chọn chi nhánh...</option>
                                {branches.map(b => (
                                    <option key={b.branchID || b.id} value={String(b.branchID || b.id)}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.branchId && <p className="mt-1.5 text-xs text-red-500">{errors.branchId}</p>}
                    </div>

                    {/* Mật khẩu */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                            Mật khẩu <span className="text-red-400">*</span>
                        </label>
                        <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all
                            ${errors.password ? 'border-red-400 bg-red-50 focus-within:ring-2 focus-within:ring-red-100' : 'border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50'}`}>
                            <Lock size={15} className="text-gray-400 shrink-0" />
                            <input
                                value={form.password}
                                onChange={e => handleField('password', e.target.value)}
                                type={showPass ? 'text' : 'password'}
                                placeholder="••••••••••"
                                className="flex-1 bg-transparent text-gray-800 focus:outline-none placeholder:text-gray-300"
                            />
                            <button type="button" onClick={() => setShowPass(v => !v)}
                                className="text-gray-400 hover:text-gray-600 transition-colors">
                                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
                    </div>

                    {/* Xác nhận mật khẩu */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                            Xác nhận mật khẩu <span className="text-red-400">*</span>
                        </label>
                        <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all
                            ${errors.confirmPassword ? 'border-red-400 bg-red-50 focus-within:ring-2 focus-within:ring-red-100' : 'border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50'}`}>
                            <Lock size={15} className="text-gray-400 shrink-0" />
                            <input
                                value={form.confirmPassword}
                                onChange={e => handleField('confirmPassword', e.target.value)}
                                type={showConfirmPass ? 'text' : 'password'}
                                placeholder="••••••••••"
                                className="flex-1 bg-transparent text-gray-800 focus:outline-none placeholder:text-gray-300"
                            />
                            <button type="button" onClick={() => setShowConfirmPass(v => !v)}
                                className="text-gray-400 hover:text-gray-600 transition-colors">
                                {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword}</p>}
                    </div>

                    {/* Vai trò */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Vai trò</label>
                        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50">
                            <Shield size={15} className="text-gray-300 shrink-0" />
                            <span className="text-gray-400">Branch Manager</span>
                        </div>
                    </div>
                </div>

                {/* Trạng thái */}
                <div className="mt-5 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3.5">
                    <div>
                        <p className="text-sm font-semibold text-gray-700">Trạng thái tài khoản</p>
                        <p className="text-xs text-gray-400 mt-0.5">Tài khoản sẽ có hiệu lực ngay sau khi tạo</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleField('isActive', !form.isActive)}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none
                                ${form.isActive ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300
                                ${form.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-sm font-semibold ${form.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                            {form.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => navigate('/owner/staff')}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                        Hủy
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm
                            ${!saving ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' : 'bg-blue-300 text-white cursor-not-allowed'}`}>
                        <UserPlus size={15} />
                        {saving ? 'Đang tạo...' : '+ Tạo tài khoản'}
                    </button>
                </div>
            </div>

            {/* Security Note */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-blue-700 mb-1">Lưu ý bảo mật</p>
                    <p className="text-xs text-blue-600 leading-relaxed">
                        Mật khẩu nên chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt để đảm bảo an toàn tối đa cho hệ thống quản trị. Hãy thông báo thông tin đăng nhập cho nhân viên một cách an toàn.
                    </p>
                </div>
            </div>
        </RestaurantOwnerLayout>
    );
}
