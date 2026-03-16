import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';
import { getOwnerManagers, toggleOwnerManager, deleteOwnerManager, getOwnerBranches } from '../api/ownerApi';
import {
    Users, Plus, Search, MoreVertical, CheckCircle2, XCircle,
    UserCheck, UserX, Trash2, Edit2, ChevronDown, Store
} from 'lucide-react';

export default function OwnerStaff() {
    const navigate = useNavigate();
    const [managers, setManagers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterBranch, setFilterBranch] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [toast, setToast] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

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
            const [mRes, bRes] = await Promise.all([
                getOwnerManagers(),
                getOwnerBranches(),
            ]);
            setManagers(mRes.data || []);
            setBranches(bRes.data?.branches || bRes.data || []);
        } catch {
            showToast('Không thể tải dữ liệu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            await toggleOwnerManager(id);
            setManagers(prev => prev.map(m =>
                m.id === id ? { ...m, isActive: !m.isActive } : m
            ));
            showToast('Cập nhật trạng thái thành công');
        } catch {
            showToast('Không thể cập nhật trạng thái', 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteOwnerManager(id);
            setManagers(prev => prev.filter(m => m.id !== id));
            showToast('Đã xóa tài khoản');
        } catch {
            showToast('Không thể xóa tài khoản', 'error');
        } finally {
            setConfirmDelete(null);
        }
    };

    const filtered = managers.filter(m => {
        const matchSearch = !search ||
            m.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            m.username?.toLowerCase().includes(search.toLowerCase()) ||
            m.email?.toLowerCase().includes(search.toLowerCase());
        const matchBranch = filterBranch === 'all' || String(m.branchId) === filterBranch;
        const matchStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && m.isActive) ||
            (filterStatus === 'inactive' && !m.isActive);
        return matchSearch && matchBranch && matchStatus;
    });

    const getBranchName = (branchId) =>
        branches.find(b => b.id === branchId || b.branchID === branchId)?.name || '—';

    const totalActive = managers.filter(m => m.isActive).length;

    return (
        <RestaurantOwnerLayout>
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
                            <button onClick={() => handleDelete(confirmDelete.id)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                                Xóa tài khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <Users size={22} className="text-blue-500" />
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhân viên</h1>
                    </div>
                    <p className="text-gray-400 text-sm pl-9">
                        Quản lý tài khoản Quản lý Chi nhánh trong hệ thống
                    </p>
                </div>
                <button
                    onClick={() => navigate('/owner/staff/new')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-200"
                >
                    <Plus size={16} />
                    Thêm quản lý
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Tổng quản lý', value: managers.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
                    { label: 'Đang hoạt động', value: totalActive, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: UserCheck },
                    { label: 'Tạm dừng', value: managers.length - totalActive, color: 'text-gray-500', bg: 'bg-gray-100', icon: UserX },
                ].map(({ label, value, color, bg, icon: Icon }) => (
                    <div key={label} className={`${bg} rounded-2xl p-4 flex items-center gap-3`}>
                        <div className={`w-10 h-10 rounded-xl ${bg} border border-white/60 flex items-center justify-center`}>
                            <Icon size={18} className={color} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">{label}</p>
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
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                        />
                    </div>
                    {/* Filter Branch */}
                    <div className="relative">
                        <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={filterBranch}
                            onChange={e => setFilterBranch(e.target.value)}
                            className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all appearance-none bg-white"
                        >
                            <option value="all">Tất cả chi nhánh</option>
                            {branches.map(b => (
                                <option key={b.branchID || b.id} value={String(b.branchID || b.id)}>{b.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {/* Filter Status */}
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="pl-4 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all appearance-none bg-white"
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
                        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3" />
                        Đang tải dữ liệu...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Users size={40} className="mb-3 text-gray-200" />
                        <p className="font-semibold text-gray-500">Chưa có quản lý nào</p>
                        <p className="text-sm mt-1 mb-4">Bắt đầu bằng cách thêm tài khoản quản lý chi nhánh đầu tiên</p>
                        <button
                            onClick={() => navigate('/owner/staff/new')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                        >
                            <Plus size={15} /> Thêm quản lý
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                {['Tài khoản', 'Chi nhánh', 'Liên hệ', 'Trạng thái', ''].map(h => (
                                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3.5">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(m => (
                                <tr key={m.id} className="hover:bg-gray-50/60 transition-colors group">
                                    {/* Account */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                                                {m.fullName?.[0]?.toUpperCase() || 'M'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{m.fullName || '—'}</p>
                                                <p className="text-xs text-gray-400">@{m.username || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Branch */}
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                                            <Store size={12} />
                                            {getBranchName(m.branchId)}
                                        </span>
                                    </td>
                                    {/* Contact */}
                                    <td className="px-5 py-4">
                                        <p className="text-sm text-gray-700">{m.email || '—'}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{m.phone || ''}</p>
                                    </td>
                                    {/* Status Toggle */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggle(m.id)}
                                                className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none
                                                    ${m.isActive ? 'bg-blue-500' : 'bg-gray-300'}`}
                                            >
                                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300
                                                    ${m.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                            <span className={`text-xs font-semibold ${m.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                {m.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                            </span>
                                        </div>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-5 py-4">
                                        <div className="relative flex justify-end">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {openMenuId === m.id && (
                                                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-xl py-1 w-44"
                                                    onMouseLeave={() => setOpenMenuId(null)}>
                                                    <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                        <Edit2 size={14} className="text-blue-500" />
                                                        Chỉnh sửa
                                                    </button>
                                                    <button
                                                        onClick={() => { setConfirmDelete(m); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
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
        </RestaurantOwnerLayout>
    );
}
