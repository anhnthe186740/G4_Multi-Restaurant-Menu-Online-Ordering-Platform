import { useState, useMemo, useEffect, useCallback } from 'react';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';
import {
    BookOpen, Search, RefreshCw, CheckCircle2, XCircle, Tag, DollarSign,
    EyeOff, ChevronDown, ImageIcon, AlertCircle, Save
} from 'lucide-react';
import { getManagerMenuItems, saveManagerMenu } from '../api/managerApi';

const formatPrice = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function ManagerMenu() {
    // raw data
    const [categories, setCategories] = useState([]);
    const categoryTabs = useMemo(() => [
        { id: 0, label: 'Tất cả' },
        ...categories.map(c => ({ id: c.categoryID, label: c.name }))
    ], [categories]);

    // flattened items for UI state
    const [items, setItems] = useState([]);
    
    // UI state
    const [activeCat, setActiveCat] = useState(0);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all | available | hidden
    const [toast, setToast] = useState(null);

    // loading/saving
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const res = await getManagerMenuItems();
            const fetchedCategories = res.data;
            setCategories(fetchedCategories);

            // Flatten products into a single list
            const flatItems = [];
            fetchedCategories.forEach(cat => {
                cat.products.forEach(p => {
                    flatItems.push({
                        ...p,
                        categoryId: cat.categoryID,
                        // ensure these exist
                        isAvailable: p.isAvailable ?? false,
                        quantity: p.quantity ?? 0
                    });
                });
            });
            setItems(flatItems);
        } catch (err) {
            console.error('Failed to load menu:', err);
            setError('Không thể tải thực đơn chi nhánh.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter logic
    const filtered = useMemo(() => {
        return items.filter(it => {
            const matchCat = activeCat === 0 || it.categoryId === activeCat;
            const matchSearch = it.name.toLowerCase().includes(search.toLowerCase());
            const matchStatus =
                filterStatus === 'all' ? true :
                    filterStatus === 'available' ? it.isAvailable :
                        !it.isAvailable;
            return matchCat && matchSearch && matchStatus;
        });
    }, [items, activeCat, search, filterStatus]);

    // Update handlers
    const handleToggle = (id) => {
        setItems(prev => prev.map(it => {
            if (it.productID === id) {
                const newStatus = !it.isAvailable;
                return { 
                    ...it, 
                    isAvailable: newStatus,
                    quantity: newStatus ? it.quantity : 0 // reset quantity if turned off
                };
            }
            return it;
        }));
    };

    const handleQuantityChange = (id, newQty) => {
        const value = Math.max(0, parseInt(newQty) || 0);
        setItems(prev => prev.map(it => 
            it.productID === id ? { ...it, quantity: value } : it
        ));
    };

    const handleSaveMenu = async () => {
        setSaving(true);
        try {
            const payload = items.map(it => ({
                productID: it.productID,
                isAvailable: it.isAvailable,
                quantity: it.quantity
            }));
            await saveManagerMenu(payload);
            showToast('Lưu thành công: Menu chi nhánh đã được cập nhật hệ thống.');
            // Reload to get fresh data
            loadData();
        } catch (err) {
            console.error('Save error:', err);
            showToast('Không thể lưu thực đơn.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const availCount = items.filter(i => i.isAvailable).length;

    return (
        <BranchManagerLayout>
            {/* ===== TOAST ===== */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
                    ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* ===== HEADER ===== */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Quản lý Thực đơn</h1>
                    <p className="text-gray-500 text-sm">
                        Cập nhật trạng thái kinh doanh và số lượng tồn kho của chi nhánh.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadData}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 border border-gray-200 hover:border-emerald-300 px-3.5 py-2 rounded-lg transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                    <button
                        onClick={handleSaveMenu}
                        disabled={saving || loading}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        Lưu Menu
                    </button>
                </div>
            </div>

            {/* ===== CATEGORY TABS & FILTER ===== */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4">
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                    {categoryTabs.map(cat => {
                        const count = cat.id === 0 ? items.length : items.filter(i => i.categoryId === cat.id).length;
                        const active = activeCat === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCat(cat.id)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0
                                    ${active
                                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
                                    }`}
                            >
                                {cat.label}
                                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full
                                    ${active ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm món ăn..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-gray-50 hover:bg-white transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
                        {[
                            { key: 'all', label: 'Tất cả', count: items.length },
                            { key: 'available', label: 'Đang bán', count: availCount },
                            { key: 'hidden', label: 'Tạm ngưng', count: items.length - availCount },
                        ].map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setFilterStatus(key)}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all
                                    ${filterStatus === key
                                        ? 'bg-white text-gray-800 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {label}
                                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full
                                    ${filterStatus === key ? 'bg-gray-200 text-gray-800' : 'bg-transparent text-gray-500'}`}>
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== LIST ===== */}
            {loading ? (
                <div className="min-h-[40vh] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">Đang tải dữ liệu...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                        <AlertCircle size={28} className="text-red-500" />
                    </div>
                    <p className="text-gray-700 font-semibold">{error}</p>
                    <button onClick={loadData} className="text-sm text-emerald-600 hover:underline">Thử lại</button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Search size={28} className="text-gray-400" />
                    </div>
                    <p className="text-gray-700 font-semibold">Không tìm thấy món ăn</p>
                    <p className="text-gray-400 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map(item => {
                        const catLabel = categoryTabs.find(c => c.id === item.categoryId)?.label || '';
                        return (
                            <div key={item.productID} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col group">
                                <div className="h-44 relative bg-gray-100">
                                    {item.imageURL ? (
                                        <img src={item.imageURL} alt={item.name} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!item.isAvailable ? 'grayscale opacity-70' : ''}`} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon size={32} className="text-gray-300" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 z-10">
                                        <span className="bg-white/90 backdrop-blur text-blue-600 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase uppercase tracking-wider border border-white/50">
                                            {catLabel}
                                        </span>
                                    </div>
                                    {!item.isAvailable && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                                            <span className="text-white font-semibold tracking-widest border border-white/30 px-4 py-1.5 rounded-lg backdrop-blur-sm">TẠM NGƯNG</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col z-30 bg-white">
                                    <h3 className="font-bold text-gray-900 text-base mb-1 truncate" title={item.name}>{item.name}</h3>
                                    <p className="text-blue-600 font-bold text-sm mb-4">{formatPrice(item.price)}</p>
                                    
                                    <div className="mt-auto grid grid-cols-2 gap-3 items-end pt-3 border-t border-gray-50">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Trạng thái</p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggle(item.productID)}
                                                    className={`relative rounded-full transition-colors duration-300 focus:outline-none shrink-0
                                                        ${item.isAvailable ? 'bg-blue-600' : 'bg-gray-300'}`}
                                                    style={{ width: 36, height: 20 }}
                                                >
                                                    <span
                                                        className="absolute top-[2px] bg-white rounded-full shadow transition-transform duration-300"
                                                        style={{ width: 16, height: 16, left: 2, transform: item.isAvailable ? 'translateX(16px)' : 'translateX(0)' }}
                                                    />
                                                </button>
                                                <span className={`text-xs font-semibold ${item.isAvailable ? 'text-gray-700' : 'text-gray-500'}`}>
                                                    {item.isAvailable ? 'Đang bán' : 'Tạm ngưng'}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Số lượng</p>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    disabled={!item.isAvailable}
                                                    value={item.quantity}
                                                    onChange={e => handleQuantityChange(item.productID, e.target.value)}
                                                    className={`w-full py-1.5 px-3 text-sm text-center font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors
                                                        ${item.isAvailable ? 'border-gray-300 text-gray-800 bg-white' : 'border-gray-200 text-gray-400 bg-gray-50'}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </BranchManagerLayout>
    );
}
