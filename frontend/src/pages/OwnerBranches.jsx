import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';
import { getOwnerBranches, toggleOwnerBranch } from '../api/ownerApi';
import {
    GitBranch, MapPin, Phone, Mail, Table2,
    Settings, Power, CheckCircle2, XCircle,
    ShoppingBag, Plus, RefreshCw
} from 'lucide-react';

export default function OwnerBranches() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [restaurantName, setRestaurantName] = useState('');
    const [branches, setBranches] = useState([]);
    const [togglingId, setTogglingId] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => { loadBranches(); }, []);

    const loadBranches = async () => {
        setLoading(true);
        try {
            const res = await getOwnerBranches();
            setRestaurantName(res.data.restaurantName || '');
            setBranches(res.data.branches || []);
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

    const activeBranches = branches.filter(b => b.isActive).length;

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
                <button
                    onClick={loadBranches}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3.5 py-2 rounded-lg transition-colors"
                >
                    <RefreshCw size={14} />
                    Làm mới
                </button>
            </div>

            {/* ===== LOADING ===== */}
            {loading ? (
                <div className="min-h-[50vh] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-11 h-11 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">Đang tải chi nhánh...</p>
                    </div>
                </div>
            ) : branches.length === 0 ? (
                /* ===== EMPTY STATE ===== */
                <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <GitBranch size={36} className="text-blue-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-gray-700 font-semibold text-lg">Chưa có chi nhánh nào</p>
                        <p className="text-gray-400 text-sm mt-1">Nhà hàng của bạn chưa có chi nhánh nào được tạo.</p>
                    </div>
                </div>
            ) : (
                /* ===== BRANCH GRID ===== */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {branches.map((branch) => (
                        <BranchCard
                            key={branch.branchID}
                            branch={branch}
                            toggling={togglingId === branch.branchID}
                            onToggle={() => handleToggle(branch)}
                            onSettings={() => navigate(`/owner/branches/${branch.branchID}`)}
                        />
                    ))}
                </div>
            )}
        </RestaurantOwnerLayout>
    );
}

/* ============================================================
   BRANCH CARD COMPONENT
   ============================================================ */
function BranchCard({ branch, toggling, onToggle, onSettings }) {
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

                {/* Action Button */}
                <button
                    onClick={onSettings}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                    <Settings size={15} />
                    Cài đặt chi nhánh
                </button>
            </div>
        </div>
    );
}
