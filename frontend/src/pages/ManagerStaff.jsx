import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';
import { getBranchStaff, updateStaffStatus, deleteBranchStaff, updateBranchStaff } from '../api/managerApi';
import {
    Users, Plus, Search, MoreVertical, CheckCircle2, XCircle,
    UserCheck, UserX, Trash2, Edit2, ChevronDown, ShieldCheck, X
} from 'lucide-react';

export default function ManagerStaff() {
    const navigate = useNavigate();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [toast, setToast] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [editStaff, setEditStaff] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getBranchStaff();
            setStaff(res.data || []);
        } catch (error) {
            console.error("fetchData error:", error);
            showToast('Không thể tải dữ liệu nhân viên', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
            await updateStaffStatus(id, newStatus);
            setStaff(prev => prev.map(s =>
                s.userID === id ? { ...s, isActive: newStatus === 'Active', status: newStatus } : s
            ));
            showToast('Cập nhật trạng thái thành công');
        } catch (error) {
            showToast('Không thể cập nhật trạng thái', 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteBranchStaff(id);
            setStaff(prev => prev.filter(s => s.userID !== id));
            showToast('Đã xóa tài khoản nhân viên');
        } catch (error) {
            showToast('Không thể xóa tài khoản', 'error');
        } finally {
            setConfirmDelete(null);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const { userID, fullName, email, phone, role } = editStaff;
            await updateBranchStaff(userID, { fullName, email, phone, role });
            setStaff(prev => prev.map(s => s.userID === userID ? { ...s, fullName, email, phone, role } : s));
            showToast('Cập nhật thành công');
            setEditStaff(null);
        } catch (err) {
            showToast(err.response?.data?.message || 'Không thể cập nhật', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const filtered = staff.filter(s => {
        const matchSearch = !search ||
            s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            s.username?.toLowerCase().includes(search.toLowerCase()) ||
            s.email?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && (s.isActive || s.status === 'Active')) ||
            (filterStatus === 'inactive' && (!s.isActive && s.status !== 'Active'));
        return matchSearch && matchStatus;
    });

    const totalActive = staff.filter(s => s.isActive || s.status === 'Active').length;

    return (
        <BranchManagerLayout>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold
                    ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                            <Trash2 size={22} className="text-red-600" />
                        </div>
                        <h3 className="text-center font-bold text-gray-900 text-base mb-1">Xác nhận xóa tài khoản</h3>
                        <p className="text-center text-gray-500 text-sm mb-5">
                            Tài khoản của <strong>{confirmDelete.fullName}</strong> sẽ bị xóa vĩnh viễn.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
                                Hủy
                            </button>
                            <button onClick={() => handleDelete(confirmDelete.userID)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                                Xóa tài khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-left">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Chỉnh sửa nhân viên</h3>
                            <button onClick={() => setEditStaff(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Họ và tên</label>
                                    <input
                                        required
                                        value={editStaff.fullName || ''}
                                        onChange={e => setEditStaff({ ...editStaff, fullName: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Số điện thoại</label>
                                    <input
                                        value={editStaff.phone || ''}
                                        onChange={e => setEditStaff({ ...editStaff, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                                <input
                                    required type="email"
                                    value={editStaff.email || ''}
                                    onChange={e => setEditStaff({ ...editStaff, email: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Vai trò</label>
                                <div className="relative">
                                    <ShieldCheck size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={editStaff.role || 'Staff'}
                                        onChange={e => setEditStaff({ ...editStaff, role: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm appearance-none bg-white"
                                    >
                                        <option value="Staff">Phục vụ / Staff</option>
                                        <option value="Kitchen">Đầu bếp / Kitchen</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setEditStaff(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
                                    Hủy
                                </button>
                                <button type="submit" disabled={isUpdating}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
                                    {isUpdating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-6 pt-4">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <Users size={22} className="text-emerald-500" />
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhân viên</h1>
                    </div>
                    <p className="text-gray-400 text-sm pl-9">
                        Quản lý các tài khoản nhân viên (Staff/Kitchen) tại chi nhánh của bạn.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/manager/staff/new')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-emerald-200"
                >
                    <Plus size={16} />
                    Thêm nhân viên
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Tổng nhân viên', value: staff.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
                    { label: 'Đang hoạt động', value: totalActive, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: UserCheck },
                    { label: 'Tạm dừng', value: staff.length - totalActive, color: 'text-gray-500', bg: 'bg-gray-100', icon: UserX },
                ].map(({ label, value, color, bg, icon: Icon }) => (
                    <div key={label} className={`${bg} rounded-2xl p-4 flex items-center gap-3 border border-white/60`}>
                        <div className={`w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm`}>
                            <Icon size={18} className={color} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{label}</p>
                            <p className={`text-xl font-bold ${color}`}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                <div className="flex flex-wrap gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm theo tên, username, email..."
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                        />
                    </div>
                    {/* Filter Status */}
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="pl-4 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all appearance-none bg-white"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Tạm dừng</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
                        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mr-3" />
                        Đang tải danh sách nhân viên...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Users size={32} className="text-gray-200" />
                        </div>
                        <p className="font-bold text-gray-500">Chưa có nhân viên nào</p>
                        <p className="text-sm mt-1 mb-6 max-w-[280px]">Bắt đầu bằng cách thêm tài khoản nhân viên phục vụ hoặc đầu bếp đầu tiên.</p>
                        <button
                            onClick={() => navigate('/manager/staff/new')}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            <Plus size={16} /> Thêm nhân viên
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    {['Nhân viên', 'Vai trò', 'Liên hệ', 'Trạng thái', ''].map(h => (
                                        <th key={h} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((s, index) => (
                                    <tr key={s.userID} className="hover:bg-gray-50/60 transition-colors group">
                                        {/* Account */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0">
                                                    {s.fullName?.[0]?.toUpperCase() || 'S'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{s.fullName || '—'}</p>
                                                    <p className="text-xs text-gray-400">@{s.username || '—'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Role */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold
                                                ${s.role === 'Kitchen' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                                <ShieldCheck size={12} />
                                                {s.role === 'Kitchen' ? 'Bếp / Kitchen' : 'Phục vụ / Staff'}
                                            </span>
                                        </td>
                                        {/* Contact */}
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-700 font-medium">{s.email || '—'}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{s.phone || ''}</p>
                                        </td>
                                        {/* Status Toggle */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleToggle(s.userID, s.isActive ? 'Active' : (s.status || 'Inactive'))}
                                                    className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none
                                                        ${(s.isActive || s.status === 'Active') ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300
                                                        ${(s.isActive || s.status === 'Active') ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                                <span className={`text-[11px] font-bold uppercase
                                                    ${(s.isActive || s.status === 'Active') ? 'text-emerald-500' : 'text-gray-400'}`}>
                                                    {(s.isActive || s.status === 'Active') ? 'Hoạt động' : 'Tạm dừng'}
                                                </span>
                                            </div>
                                        </td>
                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="relative flex justify-end">
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === s.userID ? null : s.userID)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                {openMenuId === s.userID && (
                                                    <div className={`absolute right-0 z-20 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 w-44 transition-all duration-200
                                                        ${(index > 0 && index >= filtered.length - 2) ? 'bottom-full mb-1' : 'top-10'}`}
                                                        onMouseLeave={() => setOpenMenuId(null)}>
                                                        <button 
                                                            onClick={() => { setEditStaff({ ...s }); setOpenMenuId(null); }}
                                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                            <Edit2 size={14} className="text-blue-500" />
                                                            Chỉnh sửa
                                                        </button>
                                                        <div className="h-px bg-gray-50 my-1" />
                                                        <button
                                                            onClick={() => { setConfirmDelete(s); setOpenMenuId(null); }}
                                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                                            <Trash2 size={14} />
                                                            Xóa tài khoản
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                    </table>
                )}
            </div>
        </BranchManagerLayout>
    );
}
