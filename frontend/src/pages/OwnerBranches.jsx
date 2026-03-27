import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';
import { getOwnerBranches, toggleOwnerBranch } from '../api/ownerApi';
import {
    GitBranch, MapPin, Phone, Mail, Table2,
    Settings, CheckCircle2, XCircle,
    ShoppingBag, RefreshCw, Search, Plus, Trash2, AlertTriangle
} from 'lucide-react';

export default function OwnerBranches() {
    const navigate = useNavigate();
    const location = useLocation();
    const newBranchId = location.state?.newBranchId ?? null;
    const [loading, setLoading] = useState(true);
    const [restaurantName, setRestaurantName] = useState('');
    const [branches, setBranches] = useState([]);
    const [togglingId, setTogglingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'inactive'

    // Pagination
    const PAGE_SIZE = 5;
    const [currentPage, setCurrentPage] = useState(1);

    // Tắt chức năng xóa theo yêu cầu (Soft Delete)

    useEffect(() => { loadBranches(); }, []);

    const loadBranches = async () => {
        setLoading(true);
        try {
            const res = await getOwnerBranches();
            setRestaurantName(res.data.restaurantName || '');
            const list = res.data.branches || [];
            if (newBranchId) {
                list.sort((a, b) => (b.branchID === newBranchId ? 1 : 0) - (a.branchID === newBranchId ? 1 : 0));
            }
            setBranches(list);
        } catch (e) {
            showToast('Không thể tải danh sách chi nhánh', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleToggle = async (branch) => {
        setTogglingId(branch.branchID);
        try {
            const res = await toggleOwnerBranch(branch.branchID);
            setBranches(prev =>
                prev.map(b => b.branchID === branch.branchID
                    ? { ...b, isActive: res.data.isActive }
                    : b
                )
            );
            showToast(res.data.message, 'success');
        } catch {
            showToast('Không thể thay đổi trạng thái', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    // Chức năng xóa bị loại bỏ (Chuyển sang Soft Delete ở Backend)

    const activeBranches = branches.filter(b => b.isActive).length;

    // Client-side search + filter
    const filteredBranches = useMemo(() => {
        return branches.filter(b => {
            const matchName = b.name.toLowerCase().includes(search.toLowerCase());
            const matchStatus =
                filterStatus === 'all' ? true :
                    filterStatus === 'active' ? b.isActive :
                        !b.isActive;
            return matchName && matchStatus;
        });
    }, [branches, search, filterStatus]);

    // Reset page when filter/search changes
    useEffect(() => { setCurrentPage(1); }, [search, filterStatus]);

    // Pagination derived values
    const totalPages = Math.max(1, Math.ceil(filteredBranches.length / PAGE_SIZE));
    const pagedBranches = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredBranches.slice(start, start + PAGE_SIZE);
    }, [filteredBranches, currentPage]);

    return (
        <RestaurantOwnerLayout>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all
                    ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success'
                        ? <CheckCircle2 size={16} />
                        : <XCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* MODAL XÓA ĐÃ LOẠI BỎ */}

            {/* ===== HEADER ===== */}
            <div className="flex items-start justify-between mb-7">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <GitBranch size={22} className="text-blue-500" />
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý chi nhánh</h1>
                    </div>
                    <p className="text-gray-500 text-sm">
                        {restaurantName && <span className="font-semibold text-gray-700">{restaurantName}</span>}
                        {restaurantName && ' · '}
                        {branches.length} chi nhánh · <span className="text-emerald-600 font-medium">{activeBranches} đang hoạt động</span>
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={loadBranches}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3.5 py-2 rounded-lg transition-colors"
                    >
                        <RefreshCw size={14} />
                        Làm mới
                    </button>
                    <button
                        onClick={() => navigate('/owner/branches/new')}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-sm shadow-blue-200"
                    >
                        <Plus size={15} />
                        Thêm chi nhánh
                    </button>
                </div>
            </div>

            {/* ===== SEARCH & FILTER BAR ===== */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên chi nhánh..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white"
                    />
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl shrink-0">
                    {[
                        { key: 'all', label: 'Tất cả', count: branches.length },
                        { key: 'active', label: 'Hoạt động', count: branches.filter(b => b.isActive).length },
                        { key: 'inactive', label: 'Tạm dừng', count: branches.filter(b => !b.isActive).length },
                    ].map(({ key, label, count }) => (
                        <button
                            key={key}
                            onClick={() => setFilterStatus(key)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all
                                ${filterStatus === key
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {label}
                            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full
                                ${filterStatus === key ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== LOADING / CONTENT ===== */}
            {loading ? (
                <div className="min-h-[50vh] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-11 h-11 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">Đang tải chi nhánh...</p>
                    </div>
                </div>
            ) : branches.length === 0 ? (
                /* ===== EMPTY STATE (no branches at all) ===== */
                <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <GitBranch size={36} className="text-blue-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-gray-700 font-semibold text-lg">Chưa có chi nhánh nào</p>
                        <p className="text-gray-400 text-sm mt-1">Nhà hàng của bạn chưa có chi nhánh nào được tạo.</p>
                    </div>
                </div>
            ) : filteredBranches.length === 0 ? (
                /* ===== EMPTY STATE (no search/filter results) ===== */
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Search size={28} className="text-gray-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-gray-700 font-semibold">Không tìm thấy chi nhánh</p>
                        <p className="text-gray-400 text-sm mt-1">Thử thay đổi từ khóa hoặc bộ lọc.</p>
                    </div>
                    <button
                        onClick={() => { setSearch(''); setFilterStatus('all'); }}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            ) : (
                /* ===== BRANCH GRID ===== */
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {pagedBranches.map((branch) => (
                            <BranchCard
                                key={branch.branchID}
                                branch={branch}
                                toggling={togglingId === branch.branchID}
                                onToggle={() => handleToggle(branch)}
                                onSettings={() => navigate(`/owner/branches/${branch.branchID}`)}
                                // onDelete bỏ qua
                            />
                        ))}
                    </div>

                    {/* ===== PAGINATION BAR ===== */}
                    {filteredBranches.length > 0 && (
                        <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
                            {/* Info */}
                            <p className="text-sm text-gray-500">
                                Hiển thị{' '}
                                <span className="font-semibold text-gray-700">
                                    {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredBranches.length)}
                                </span>
                                {' '}trong{' '}
                                <span className="font-semibold text-gray-700">{filteredBranches.length}</span>
                                {' '}chi nhánh
                            </p>

                            {/* Page buttons */}
                            <div className="flex items-center gap-1">
                                {/* Prev */}
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    ‹ Trước
                                </button>

                                {/* Page numbers */}
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors
                                            ${currentPage === page
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                {/* Next */}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Sau ›
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </RestaurantOwnerLayout>
    );
}

/* ============================================================
   BRANCH CARD COMPONENT
   ============================================================ */
function BranchCard({ branch, toggling, onToggle, onSettings, onDelete }) {
    return (
        <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden
            ${branch.isActive ? 'border-gray-100' : 'border-gray-200 opacity-80'}`}>

            {/* Card Top Bar */}
            <div className={`h-1.5 w-full ${branch.isActive ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gray-300'}`} />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{branch.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            {branch.isActive ? (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Đang hoạt động
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                    Tạm dừng
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        onClick={onToggle}
                        disabled={toggling}
                        title={branch.isActive ? 'Tạm dừng chi nhánh' : 'Kích hoạt chi nhánh'}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 focus:outline-none
                            ${branch.isActive ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'}
                            ${toggling ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300
                            ${branch.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* Info List */}
                <div className="space-y-2.5 mb-5">
                    {branch.address && (
                        <div className="flex items-start gap-2.5 text-sm text-gray-600">
                            <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                            <span className="leading-snug line-clamp-2">{branch.address}</span>
                        </div>
                    )}
                    {branch.phone && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                            <Phone size={14} className="text-gray-400 shrink-0" />
                            <span>{branch.phone}</span>
                        </div>
                    )}
                    {branch.email && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                            <Mail size={14} className="text-gray-400 shrink-0" />
                            <span className="truncate">{branch.email}</span>
                        </div>
                    )}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-blue-700">{branch.tableCount}</p>
                        <p className="text-[11px] text-blue-500 font-medium mt-0.5 flex items-center justify-center gap-1">
                            <Table2 size={11} /> Bàn
                        </p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-indigo-700">{branch.orderCount}</p>
                        <p className="text-[11px] text-indigo-500 font-medium mt-0.5 flex items-center justify-center gap-1">
                            <ShoppingBag size={11} /> Đơn hàng
                        </p>
                    </div>
                </div>

                {/* Action Buttons — split 50/50: Settings | Delete */}
                <div className="flex gap-2">
                    <button
                        onClick={onSettings}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                        <Settings size={15} />
                        Cài đặt chi nhánh
                    </button>
                </div>
            </div>
        </div>
    );
}
