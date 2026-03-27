import { useState, useEffect, useMemo, useCallback } from 'react';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';
import { getManagerBranchMenu, saveManagerBranchMenu } from '../api/managerApi';
import {
    Search, BookOpen, Save, CheckCircle2, XCircle, AlertCircle,
    ChevronDown, Tag, RefreshCw,
} from 'lucide-react';

const formatPrice = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);


/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function ManagerMenu() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    /* ── toast helper ── */
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    /* ── fetch data ── */
    const loadMenu = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const res = await getManagerBranchMenu();
            setItems(res.data);
        } catch (err) {
            console.error('loadMenu error:', err);
            setError('Không thể tải thực đơn. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadMenu(); }, [loadMenu]);

    /* ── derived: unique categories ── */
    const categories = useMemo(() => {
        const map = new Map();
        items.forEach(i => {
            if (!map.has(i.categoryID)) map.set(i.categoryID, i.categoryName);
        });
        return [{ id: 'all', name: 'Tất cả danh mục' }, ...Array.from(map, ([id, name]) => ({ id, name }))];
    }, [items]);

    /* ── filtered display list ── */
    const filtered = useMemo(() => {
        return items.filter(it => {
            const matchCat = activeCategory === 'all' || it.categoryID === activeCategory;
            const matchSearch = it.name.toLowerCase().includes(search.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [items, activeCategory, search]);

    /* ── toggle availability ── */
    const handleToggle = (productID) => {
        setItems(prev => prev.map(it => {
            if (it.productID !== productID) return it;
            const newAvail = !it.isAvailable;
            return { ...it, isAvailable: newAvail, quantity: newAvail ? it.quantity : 0 };
        }));
    };


    /* ── save menu ── */
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = items.map(it => ({
                foodId: it.productID,
                isAvailable: it.isAvailable,
                quantity: it.quantity,
            }));
            await saveManagerBranchMenu(payload);
            showToast('Menu chi nhánh đã được cập nhật hệ thống.');
        } catch (err) {
            console.error('handleSave error:', err);
            showToast(err.response?.data?.message || 'Không thể lưu menu. Vui lòng thử lại.', 'error');
        } finally {
            setSaving(false);
        }
    };

    /* ── counts ── */
    const availCount = items.filter(i => i.isAvailable).length;

    /* ─────────────────── RENDER ─────────────────── */
    return (
        <BranchManagerLayout>
            {/* ── TOAST ── */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
                    ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <BookOpen size={22} className="text-emerald-500" />
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý Thực đơn</h1>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Cập nhật trạng thái kinh doanh của các món ăn tại chi nhánh.
                        {' '}<span className="text-emerald-600 font-semibold">{availCount} đang bán</span>
                        {' / '}<span className="text-gray-400">{items.length} tổng</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={loadMenu}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 border border-gray-200 hover:border-emerald-300 px-3.5 py-2 rounded-lg transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving
                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang lưu...</>
                            : <><Save size={15} />Lưu Menu</>
                        }
                    </button>
                </div>
            </div>

            {/* ── FILTERS ── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm món ăn..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white"
                    />
                </div>
                {/* Category dropdown */}
                <div className="relative shrink-0">
                    <select
                        value={activeCategory}
                        onChange={e => setActiveCategory(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        className="appearance-none pl-3.5 pr-9 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 cursor-pointer"
                    >
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* ── CONTENT ── */}
            {loading ? (
                <div className="min-h-[40vh] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">Đang tải thực đơn...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                        <AlertCircle size={28} className="text-red-500" />
                    </div>
                    <p className="text-gray-700 font-semibold">{error}</p>
                    <button onClick={loadMenu} className="text-sm text-blue-600 hover:underline">Thử lại</button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Search size={28} className="text-gray-400" />
                    </div>
                    <p className="text-gray-700 font-semibold">Không tìm thấy món ăn</p>
                    <button
                        onClick={() => { setSearch(''); setActiveCategory('all'); }}
                        className="text-sm text-blue-600 hover:underline"
                    >Xóa bộ lọc</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map(item => (
                        <FoodCard
                            key={item.productID}
                            item={item}
                            onToggle={() => handleToggle(item.productID)}
                        />
                    ))}
                </div>
            )}
        </BranchManagerLayout>
    );
}

/* ═══════════════════════════════════════════════════════════════
   FOOD CARD
═══════════════════════════════════════════════════════════════ */
function FoodCard({ item, onToggle }) {
    const [imgErr, setImgErr] = useState(false);

    // Derive category label abbreviation for badge
    const catBadge = item.categoryName || '';

    return (
        <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md
            ${item.isAvailable ? 'border-gray-100' : 'border-gray-100 opacity-75'}`}>

            {/* ── Image ── */}
            <div className="relative h-44 bg-gray-100 overflow-hidden">
                {!imgErr && item.imageURL ? (
                    <img
                        src={item.imageURL}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={() => setImgErr(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={36} className="text-gray-300" />
                    </div>
                )}

                {/* Out-of-stock overlay */}
                {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-bold text-sm tracking-wider bg-black/50 px-3 py-1 rounded-lg">
                            HẾT HÀNG
                        </span>
                    </div>
                )}

                {/* Category badge */}
                {catBadge && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full uppercase tracking-wide">
                        <Tag size={8} />
                        {catBadge}
                    </span>
                )}
            </div>

            {/* ── Body ── */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{item.name}</p>
                        <p className="text-blue-600 font-bold text-sm mt-0.5">{formatPrice(item.price)}</p>
                    </div>
                </div>

                {/* ── Toggle row ── */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">TRẠNG THÁI</p>
                        <p className="text-xs font-semibold text-gray-700">
                            {item.isAvailable ? 'Đang bán' : 'Tạm ngưng'}
                        </p>
                    </div>
                    {/* Toggle switch */}
                    <button
                        onClick={onToggle}
                        className={`relative rounded-full transition-colors duration-300 focus:outline-none shrink-0
                            ${item.isAvailable ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'}`}
                        style={{ width: 40, height: 22 }}
                        title={item.isAvailable ? 'Tắt món' : 'Bật món'}
                    >
                        <span
                            className="absolute top-0.5 bg-white rounded-full shadow transition-transform duration-300"
                            style={{ width: 18, height: 18, left: 2, transform: item.isAvailable ? 'translateX(18px)' : 'translateX(0)' }}
                        />
                    </button>
                </div>

            </div>
        </div>
    );
}
