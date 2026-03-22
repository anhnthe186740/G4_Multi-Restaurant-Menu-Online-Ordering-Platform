import { useState, useEffect } from 'react';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';
import { 
    Users, Plus, Search, Trash2, Shield, Phone, Mail, 
    MoreVertical, X, CheckCircle, AlertCircle, Key, UserPlus
} from 'lucide-react';
import { 
    getBranchStaff, 
    createBranchStaff, 
    updateStaffStatus, 
    deleteBranchStaff 
} from '../api/managerApi';

/* ─── Role Badge ────────────────────────────────────────────────────────── */
function RoleBadge({ role }) {
    const isKitchen = role === 'Kitchen';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border-2 ${
            isKitchen 
            ? 'bg-amber-50 text-amber-700 border-amber-200' 
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isKitchen ? 'bg-amber-500' : 'bg-blue-500'}`} />
            {role === 'Kitchen' ? 'BẾP' : 'NHÂN VIÊN'}
        </span>
    );
}

/* ─── Status Badge ──────────────────────────────────────────────────────── */
function StatusBadge({ status, onClick }) {
    const isActive = status === 'Active';
    return (
        <button 
            onClick={onClick}
            className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider transition-all border-2 ${
                isActive 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
            }`}
        >
            {isActive ? 'HOẠT ĐỘNG' : 'BỊ KHOÁ'}
        </button>
    );
}

/* ─── Modal Thêm Nhân Viên ──────────────────────────────────────────────── */
function CreateStaffModal({ onClose, onSave }) {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        role: 'Staff'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username || !formData.password) {
            setError('Vui lòng điền đầy đủ Tên đăng nhập và Mật khẩu');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await onSave(formData);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi tạo tài khoản');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <UserPlus size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white leading-none">THÊM NHÂN VIÊN</h2>
                            <p className="text-emerald-100 text-[10px] font-bold mt-1 tracking-widest uppercase">Tạo tài khoản mới cho chi nhánh</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border-2 border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Vai trò</label>
                            <select 
                                value={formData.role} 
                                onChange={e => setFormData({...formData, role: e.target.value})}
                                className="w-full h-11 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                            >
                                <option value="Staff">Phục vụ (Staff)</option>
                                <option value="Kitchen">Bếp (Kitchen)</option>
                            </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tên đăng nhập *</label>
                            <input 
                                type="text"
                                required
                                value={formData.username}
                                onChange={e => setFormData({...formData, username: e.target.value})}
                                className="w-full h-11 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                                placeholder="VD: nhanvien01"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mật khẩu *</label>
                        <div className="relative">
                            <input 
                                type="password"
                                required
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                className="w-full h-11 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none pl-10"
                                placeholder="••••••••"
                            />
                            <Key size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Họ và tên</label>
                        <input 
                            type="text"
                            value={formData.fullName}
                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                            className="w-full h-11 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                            placeholder="VD: Nguyễn Văn A"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1.5">
                                Email 
                                <span className="text-[9px] text-emerald-500 lowercase font-bold">(để nhận TK)</span>
                            </label>
                            <input 
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full h-11 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Số điện thoại</label>
                            <input 
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="w-full h-11 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                                placeholder="09xx..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 h-12 rounded-2xl border-2 border-slate-100 text-sm font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest"
                        >
                            Huỷ bỏ
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-12 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest disabled:opacity-50"
                        >
                            {loading ? 'Đang tạo...' : 'Xác nhận ngay'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Trang Quản Lý Tài Khoản ───────────────────────────────────────────── */
export default function ManagerAccountManagement() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [toast, setToast] = useState(null);

    const loadStaff = async () => {
        setLoading(true);
        try {
            const res = await getBranchStaff();
            setStaff(res.data);
        } catch (err) {
            console.error(err);
            showToast('Lỗi tải danh sách nhân viên', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadStaff(); }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCreateStaff = async (data) => {
        await createBranchStaff(data);
        showToast('Đã tạo tài khoản nhân viên thành công!');
        setShowCreateModal(false);
        loadStaff();
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        try {
            await updateStaffStatus(id, newStatus);
            setStaff(prev => prev.map(s => s.userID === id ? { ...s, status: newStatus } : s));
            showToast(`Đã ${newStatus === 'Active' ? 'mở khoá' : 'khoá'} tài khoản!`);
        } catch (err) {
            showToast('Lỗi cập nhật trạng thái', 'error');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc muốn xoá tài khoản ${name}?`)) return;
        try {
            await deleteBranchStaff(id);
            setStaff(prev => prev.filter(s => s.userID !== id));
            showToast('Đã xoá tài khoản thành công');
        } catch (err) {
            showToast('Lỗi khi xoá tài khoản', 'error');
        }
    };

    const filteredStaff = staff.filter(s => {
        const matchSearch = (s.fullName || '').toLowerCase().includes(search.toLowerCase()) || 
                          (s.username || '').toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'all' || s.role === roleFilter;
        return matchSearch && matchRole;
    });

    return (
        <BranchManagerLayout>
            <div className="flex flex-col gap-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                                <Users size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">QUẢN LÝ NHÂN VIÊN</h1>
                                <p className="text-slate-400 text-[10px] font-bold mt-1.5 tracking-widest uppercase">Quản lý đội ngũ nhân viên & bếp của chi nhánh</p>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="h-12 px-6 bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest active:scale-95 shrink-0"
                    >
                        <UserPlus size={18} />
                        Thêm nhân viên
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm theo tên hoặc username..."
                            className="w-full h-12 pl-12 pr-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-full md:w-auto">
                        <button 
                            onClick={() => setRoleFilter('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${roleFilter === 'all' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            TẤT CẢ
                        </button>
                        <button 
                            onClick={() => setRoleFilter('Staff')}
                            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${roleFilter === 'Staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            STAFF
                        </button>
                        <button 
                            onClick={() => setRoleFilter('Kitchen')}
                            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${roleFilter === 'Kitchen' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            BẾP
                        </button>
                    </div>
                </div>

                {/* Staff Table */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhân viên</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Liên hệ</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users size={32} className="opacity-20" />
                                                <span className="text-xs font-bold uppercase tracking-widest">Không tìm thấy nhân viên nào</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStaff.map((person) => (
                                    <tr key={person.userID} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm shrink-0 uppercase tracking-tighter">
                                                    {person.fullName?.[0] || person.username?.[0] || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-800 leading-none">{person.fullName || 'Chưa đặt tên'}</p>
                                                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">@{person.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {person.email && (
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                                        <Mail size={12} className="text-slate-300" /> {person.email}
                                                    </div>
                                                )}
                                                {person.phone && (
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                                        <Phone size={12} className="text-slate-300" /> {person.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <RoleBadge role={person.role} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge 
                                                status={person.status} 
                                                onClick={() => handleToggleStatus(person.userID, person.status)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleDelete(person.userID, person.fullName || person.username)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Xoá tài khoản"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals & Toasts */}
            {showCreateModal && (
                <CreateStaffModal 
                    onClose={() => setShowCreateModal(false)} 
                    onSave={handleCreateStaff}
                />
            )}

            {toast && (
                <div className={`fixed bottom-6 right-6 z-[110] px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 ${
                    toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
                }`}>
                    {toast.type === 'error' ? <AlertCircle size={20} className="text-red-200" /> : <CheckCircle size={20} className="text-emerald-400" />}
                    <span className="text-sm font-black tracking-tight">{toast.message}</span>
                </div>
            )}
        </BranchManagerLayout>
    );
}
