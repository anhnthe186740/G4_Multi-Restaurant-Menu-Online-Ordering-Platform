import { useState, useMemo, useEffect, useCallback } from 'react';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';
import {
    BookOpen, Plus, Search, RefreshCw, Pencil, Trash2,
    X, CheckCircle2, XCircle, Tag,
    EyeOff, ChevronDown, ImageIcon, AlertCircle,
} from 'lucide-react';
import {
    getOwnerMenuCategories,
    getOwnerMenuItems,
    createOwnerMenuItem,
    updateOwnerMenuItem,
    deleteOwnerMenuItem,
    toggleOwnerMenuItem,
    createOwnerMenuCategory,
    uploadOwnerFile,
} from '../api/ownerApi';

const EMPTY_FORM = { name: '', description: '', price: '', categoryId: '', isAvailable: true, imageURL: '', imageFile: null };

const formatPrice = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

/* ============================================================
   TRANG CHÍNH
   ============================================================ */
export default function OwnerMenu() {
    // dữ liệu
    const [items, setItems] = useState([]);                           // hàm xử lý món ăn
    const [categories, setCategories] = useState([]);                 // hàm xử lý danh mục
    const categoryTabs = useMemo(() => [
        { id: 0, label: 'Tất cả' },
        ...categories.map(c => ({ id: c.categoryID, label: c.name }))
    ], [categories]);

    // bộ lọc / trạng thái giao diện
    const [activeCat, setActiveCat] = useState(0);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);

    // cờ đang tải / lỗi
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // trạng thái Modal
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null); // null = thêm mới, object = chỉnh sửa
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState(null);

    /* ---------- hàm hỗ trợ ---------- */
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    /* ---------- lấy dữ liệu ---------- */
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const [catRes, itemRes] = await Promise.all([
                getOwnerMenuCategories(),
                getOwnerMenuItems()
            ]);
            setCategories(catRes.data);
            // 
            setItems(itemRes.data.map(p => ({
                ...p,
                id: p.productID,
                categoryId: p.categoryID,          // chuẩn hóa tên cho giao diện
                // bao gồm imageURL và thêm tham số timestamp để tránh cache khi tải lại
                image: p.imageURL ? `${p.imageURL}?t=${Date.now()}` : '',
                imageURL: p.imageURL || '',
            })));
        } catch (err) {
            console.error('failed to load menu:', err);
            setError('Không thể tải thực đơn.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /* ---------- trình tạo danh mục mẫu ---------- */
    const seedCategories = async () => {
        const samples = [
            { name: 'Món chính' },
            { name: 'Đồ uống' },
            { name: 'Tráng miệng' },
        ];
        try {
            setLoading(true);
            for (const cat of samples) {
                await createOwnerMenuCategory(cat);
            }
            showToast('Đã tạo danh mục mẫu');
            loadData();
        } catch (err) {
            console.error('seed error', err);
            showToast('Không thể tạo danh mục', 'error');
        } finally {
            setLoading(false);
        }
    };

    /* ---------- danh sách đã lọc ---------- */
    const filtered = useMemo(() => {
        return items.filter(it => {
            const matchCat = activeCat === 0 || it.categoryId === activeCat;
            const matchSearch = it.name.toLowerCase().includes(search.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [items, activeCat, search]);

    /* ---------- mở modal thêm mới ---------- */
    const openAdd = () => {
        setEditItem(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setShowForm(true);
    };

    /* ---------- mở modal chỉnh sửa ---------- */
    const openEdit = (item) => {
        setEditItem(item);
        setForm({
            name: item.name,
            description: item.description,
            price: String(item.price),
            categoryId: item.categoryId,
            isAvailable: item.isAvailable,
            imageURL: item.imageURL || item.image || '',
            imageFile: null,
        });
        setFormError('');
        setShowForm(true);
    };

    /* ---------- lưu form ---------- */
    const handleSave = async () => {
        if (!form.name.trim()) { setFormError('Vui lòng nhập tên món.'); return; }
        if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
            setFormError('Vui lòng nhập giá hợp lệ.'); return;
        }
        if (!form.categoryId) {
            setFormError('Vui lòng chọn danh mục.'); return;
        }
        setSaving(true);
        try {
            // xử lý tải ảnh lên nếu có chọn tệp
            let imageURL = form.imageURL;
            if (form.imageFile) {
                const data = new FormData();
                data.append('file', form.imageFile);
                const res = await uploadOwnerFile(data, "menu");
                imageURL = res.data.url;
            }

            const payload = {
                name: form.name.trim(),
                description: form.description,
                price: Number(form.price),
                categoryID: Number(form.categoryId),
                isAvailable: form.isAvailable,
                imageURL,
            };
            if (editItem) {
                await updateOwnerMenuItem(editItem.id, payload);
                showToast('Đã cập nhật món ăn thành công!');
            } else {
                await createOwnerMenuItem(payload);
                showToast('Đã thêm món ăn mới!');
            }
            setShowForm(false);
            loadData(); // làm mới danh sách sau khi lưu
        } catch (err) {
            console.error('save error', err);
            const msg = err.response?.data?.message || 'Không thể lưu món ăn.';
            setFormError(msg);
            showToast(msg, 'error');
            // không ném lại lỗi để tránh promise không được bắt
        } finally {
            setSaving(false);
        }
    };

    /* ---------- xóa ---------- */
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteOwnerMenuItem(deleteTarget.id);
            showToast('Đã xóa món ăn.', 'error');
            setDeleteTarget(null);
            loadData();
        } catch (err) {
            console.error('delete error', err);
            showToast('Không thể xóa món ăn.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    /* ---------- đã thêm danh mục ---------- */
    const handleCategoryAdded = async (newId) => {
        await loadData();
        setForm(prev => ({ ...prev, categoryId: newId }));
    };

    /* ---------- số lượng ---------- */
    // Đã xóa theo dõi availCount vì quản lý trạng thái đã bị gỡ bỏ

    return (
        <RestaurantOwnerLayout>
            {/* ===== THÔNG BÁO (TOAST) ===== */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
                    ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* ===== TIÊU ĐỀ ===== */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <BookOpen size={22} className="text-blue-500" />
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý thực đơn</h1>
                    </div>
                    <p className="text-gray-500 text-sm">
                        {items.length} món
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadData}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3.5 py-2 rounded-lg transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                    <button
                        onClick={openAdd}
                        disabled={categories.length === 0}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={16} />
                        Thêm món
                    </button>
                </div>
            </div>

            {/* ===== CÁC TAB DANH MỤC ===== */}
            <div className="flex gap-1 mb-5 overflow-x-auto pb-1 scrollbar-hide">
                {categoryTabs.map(cat => {
                    const count = cat.id === 0 ? items.length : items.filter(i => i.categoryId === cat.id).length;
                    const active = activeCat === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCat(cat.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0
                                ${active
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                }`}
                        >
                            {cat.label}
                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full
                                ${active ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ===== TÌM KIẾM ===== */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên món..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white"
                    />
                </div>
            </div>

            {/* ===== ĐANG TẢI / LỖI / DANH MỤC TRỐNG / DANH SÁCH ===== */}
            {loading ? (
                <div className="min-h-[40vh] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">Đang tải thực đơn...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                        <AlertCircle size={28} className="text-red-500" />
                    </div>
                    <p className="text-gray-700 font-semibold">{error}</p>
                    <button onClick={loadData} className="text-sm text-blue-600 hover:underline">Thử lại</button>
                </div>
            ) : categories.length === 0 ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <BookOpen size={28} className="text-blue-400" />
                    </div>
                    <p className="text-gray-700 font-semibold">Nhà hàng chưa có danh mục nào</p>
                    <p className="text-gray-400 text-sm mb-3">Vui lòng tạo danh mục trước khi thêm món ăn.</p>
                    <button
                        onClick={seedCategories}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                    >
                        {loading ? 'Đang tạo...' : 'Tạo danh mục mẫu'}
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Search size={28} className="text-gray-400" />
                    </div>
                    <p className="text-gray-700 font-semibold">Không tìm thấy món ăn</p>
                    <p className="text-gray-400 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                    <button
                        onClick={() => { setSearch(''); setActiveCat(0); }}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Tiêu đề bảng */}
                    <div className="grid items-center px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                        style={{ gridTemplateColumns: '72px 1fr 120px 130px 96px' }}>
                        <div></div>
                        <div className="pl-3">Tên món</div>
                        <div className="text-center">Danh mục</div>
                        <div className="text-right">Giá</div>
                        <div className="text-center">Thao tác</div>
                    </div>
                    {/* Các dòng */}
                    <div className="divide-y divide-gray-50">
                        {filtered.map(item => (
                            <MenuItemRow
                                key={item.id}
                                item={item}
                                categories={categoryTabs}
                                onEdit={() => openEdit(item)}
                                onDelete={() => setDeleteTarget(item)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ===== MODAL THÊM / SỬA ===== */}
            {showForm && (
                <FormModal
                    isEdit={!!editItem}
                    form={form}
                    setForm={setForm}
                    formError={formError}
                    saving={saving}
                    categories={categories}
                    onCategoryAdded={handleCategoryAdded}
                    onClose={() => setShowForm(false)}
                    onSave={handleSave}
                />
            )}

            {/* ===== MODAL XÁC NHẬN XÓA ===== */}
            {deleteTarget && (
                <DeleteModal
                    item={deleteTarget}
                    deleting={deleting}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}
        </RestaurantOwnerLayout>
    );
}

/* ============================================================
   DÒNG MÓN ĂN TRONG THỰC ĐƠN (danh sách ngang)
   ============================================================ */
function MenuItemRow({ item, categories, onEdit, onDelete }) {
    const catLabel = categories.find(c => c.id === item.categoryId)?.label || '';
    const [imgErr, setImgErr] = useState(false);

    return (
        <div
            className={`grid items-center px-5 py-3.5 hover:bg-blue-50/40 transition-colors`}
            style={{ gridTemplateColumns: '72px 1fr 120px 130px 96px' }}
        >
            {/* Ảnh thu nhỏ — cố định 72×72, object-cover, không bị giãn */}
            <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                {!imgErr && (item.image || item.imageURL) ? (
                    <img
                        src={item.image || item.imageURL}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={() => setImgErr(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={22} className="text-gray-300" />
                    </div>
                )}
            </div>

            {/* Tên + mô tả */}
            <div className="pl-3 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                <p className="text-gray-400 text-xs mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
            </div>

            {/* Danh mục */}
            <div className="flex justify-center">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                    <Tag size={9} />
                    {catLabel}
                </span>
            </div>

            {/* Giá */}
            <div className="text-right">
                <span className="font-bold text-gray-900 text-sm">{formatPrice(item.price)}</span>
            </div>

            {/* Thao tác */}
            <div className="flex items-center justify-center gap-1.5">
                <button
                    onClick={onEdit}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                    title="Sửa món"
                >
                    <Pencil size={15} />
                </button>
                <button
                    onClick={onDelete}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="Xóa món"
                >
                    <Trash2 size={15} />
                </button>
            </div>
        </div>
    );
}

/* ============================================================
   MODAL FORM (Thêm / Sửa)
   ============================================================ */
function FormModal({ isEdit, form, setForm, formError, saving, categories, onCategoryAdded, onClose, onSave }) {
    const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const [showAddCat, setShowAddCat] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [addingCat, setAddingCat] = useState(false);

    const handleSaveCat = async () => {
        if (!newCatName.trim()) return;
        setAddingCat(true);
        try {
            const res = await createOwnerMenuCategory({ name: newCatName.trim() });
            if (onCategoryAdded) {
                await onCategoryAdded(res.data.category.categoryID);
            }
            setShowAddCat(false);
            setNewCatName('');
        } catch (err) {
            console.error('Failed to create category:', err);
        } finally {
            setAddingCat(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Tiêu đề modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <BookOpen size={16} className="text-blue-600" />
                        </div>
                        <h2 className="font-bold text-gray-900 text-lg">
                            {isEdit ? 'Sửa thông tin món' : 'Thêm món mới'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Phần thân */}
                <div className="px-6 py-5 space-y-4">
                    {formError && (
                        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                            <XCircle size={15} />
                            {formError}
                        </div>
                    )}

                    {/* Tên */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên món <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={set('name')}
                            placeholder="VD: Gà nướng muối ớt"
                            className="w-full px-3.5 py-2.5 text-sm text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                        />
                    </div>

                    {/* Mô tả */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả</label>
                        <textarea
                            value={form.description}
                            onChange={set('description')}
                            rows={3}
                            placeholder="Mô tả ngắn về món ăn..."
                            className="w-full px-3.5 py-2.5 text-sm text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 resize-none"
                        />
                    </div>

                    {/* Dòng Giá + Danh mục */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá (VNĐ) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">đ</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.price}
                                    onChange={set('price')}
                                    placeholder="0"
                                    className="w-full pl-9 pr-3.5 py-2.5 text-sm text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Danh mục</label>
                            <div className="relative">
                                <select
                                    value={form.categoryId ?? ''}
                                    onChange={set('categoryId')}
                                    className="w-full appearance-none px-3.5 py-2.5 text-sm text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white pr-8"
                                >
                                    <option value="" disabled>-- Chọn --</option>
                                    {categories.map(c => (
                                        <option key={c.categoryID} value={c.categoryID}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            <div className="mt-1.5 flex justify-end">
                                {!showAddCat ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCat(true)}
                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        <Plus size={12} />
                                        Thêm danh mục mới
                                    </button>
                                ) : (
                                    <div className="flex flex-col w-full gap-2.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100 mt-2 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Danh mục mới</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={newCatName}
                                            onChange={e => setNewCatName(e.target.value)}
                                            placeholder="Tên danh mục mới..."
                                            className="w-full px-3 py-2 text-sm text-black border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white placeholder:text-gray-400"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddCat(false)}
                                                className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveCat}
                                                disabled={addingCat || !newCatName.trim()}
                                                className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-sm shadow-blue-100 transition-all active:scale-95"
                                            >
                                                {addingCat ? 'Đang lưu...' : 'Lưu'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tải ảnh lên */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ảnh món</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => setForm(prev => ({ ...prev, imageFile: e.target.files[0] || null }))}
                            className="w-full text-sm text-gray-900"
                        />
                        {/* xem trước từ tệp đã chọn hoặc URL hiện có */}
                        {(form.imageFile || form.imageURL) && (
                            <img
                                src={form.imageFile ? URL.createObjectURL(form.imageFile) : form.imageURL}
                                alt="preview"
                                className="mt-2 h-28 w-full object-cover rounded-xl border border-gray-200"
                                onError={e => { e.target.style.display = 'none'; }}
                            />
                        )}
                    </div>

                </div>

                {/* Chân trang */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2.5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-60"
                    >
                        {saving
                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
                            : <><CheckCircle2 size={15} /> {isEdit ? 'Lưu thay đổi' : 'Thêm món'}</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   MODAL XÁC NHẬN XÓA
   ============================================================ */
function DeleteModal({ item, deleting, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={22} className="text-red-600" />
                </div>
                <h2 className="text-center font-bold text-gray-900 text-lg mb-1.5">Xóa món ăn</h2>
                <p className="text-center text-gray-500 text-sm mb-5">
                    Bạn có chắc muốn xóa <span className="font-semibold text-gray-800">"{item.name}"</span>? Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-2.5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-60"
                    >
                        {deleting ? 'Đang xóa...' : 'Xóa món'}
                    </button>
                </div>
            </div>
        </div>
    );
}
