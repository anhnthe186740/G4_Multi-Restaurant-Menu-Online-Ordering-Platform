import { useState, useRef, useEffect } from 'react';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';
import {
    Search, Plus, QrCode, Pencil, Trash2, Users,
    MoreVertical, X, Merge, CreditCard, CheckCircle,
} from 'lucide-react';

/* ─── Dữ liệu mẫu ─────────────────────────────────────────────────────────── */
const INITIAL_TABLES = [
    { id: 1,  name: 'Bàn 01',    capacity: 4,  status: 'Trống',      mergedWith: null },
    { id: 2,  name: 'Bàn 02',    capacity: 2,  status: 'Đang ngồi', mergedWith: null },
    { id: 3,  name: 'Bàn 03',    capacity: 6,  status: 'Đang ngồi', mergedWith: null },
    { id: 4,  name: 'Bàn 04',    capacity: 4,  status: 'Trống',      mergedWith: null },
    { id: 5,  name: 'Bàn 05',    capacity: 8,  status: 'Đang ngồi', mergedWith: null },
    { id: 6,  name: 'Bàn 06',    capacity: 2,  status: 'Trống',      mergedWith: null },
    { id: 7,  name: 'Bàn 07',    capacity: 4,  status: 'Trống',      mergedWith: null },
    { id: 8,  name: 'Bàn 08',    capacity: 6,  status: 'Đang ngồi', mergedWith: null },
    { id: 9,  name: 'Bàn VIP 01',capacity: 10, status: 'Trống',      mergedWith: null },
    { id: 10, name: 'Bàn VIP 02',capacity: 12, status: 'Đang ngồi', mergedWith: null },
];

/* ─── Badge trạng thái ─────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
    if (status === 'Trống')
        return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">TRỐNG</span>;
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">ĐANG NGỒI</span>;
}

/* ─── Menu 3 chấm ──────────────────────────────────────────────────────────── */
function ThreeDotMenu({ onMerge, onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
            >
                <MoreVertical size={15} />
            </button>
            {open && (
                <div className="absolute right-0 top-8 z-40 bg-white rounded-xl shadow-xl border border-gray-100 w-40 py-1 text-sm">
                    <button onClick={() => { setOpen(false); onMerge(); }}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-blue-50 text-gray-700 hover:text-blue-700">
                        <Merge size={13} /> Gộp bill
                    </button>
                    <button onClick={() => { setOpen(false); onEdit(); }}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-gray-700">
                        <Pencil size={13} /> Chỉnh sửa
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={() => { setOpen(false); onDelete(); }}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-red-500">
                        <Trash2 size={13} /> Xoá bàn
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─── Card bàn ─────────────────────────────────────────────────────────────── */
function TableCard({ table, occupiedTables, allTables, onMerge, onEdit, onDelete, onSelect, onCheckout }) {
    const occupied = table.status === 'Đang ngồi';
    const mergedTable = table.mergedWith ? allTables.find(t => t.id === table.mergedWith) : null;

    return (
        <div className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
            mergedTable ? 'border-amber-300 hover:border-amber-400' :
            occupied    ? 'border-red-200 hover:border-red-300' :
                          'border-gray-100 hover:border-emerald-200'
        }`}>
            {/* Thanh màu bên trái */}
            {mergedTable && <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-amber-400 to-orange-400 rounded-r-full" />}
            {!mergedTable && occupied && <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-red-400 to-rose-500 rounded-r-full" />}

            <div className="p-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        mergedTable ? 'bg-amber-50' : occupied ? 'bg-red-50' : 'bg-emerald-50'
                    }`}>
                        {occupied ? '🪑' : '🍽️'}
                    </div>
                    <div className="flex items-center gap-1">
                        <StatusBadge status={table.status} />
                        {occupied ? (
                            <ThreeDotMenu onMerge={onMerge} onEdit={onEdit} onDelete={onDelete} />
                        ) : (
                            <button onClick={onEdit} className="p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition">
                                <MoreVertical size={15} />
                            </button>
                        )}
                    </div>
                </div>

                <h3 className="font-bold text-gray-800 text-sm leading-tight">{table.name}</h3>
                <div className="flex items-center gap-1 mt-1 text-gray-400 text-xs">
                    <Users size={11} />
                    <span>Sức chứa: {table.capacity} người</span>
                </div>

                {/* Badge gộp bill */}
                {mergedTable && (
                    <div className="mt-2 flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                        <span className="text-amber-500 text-xs">🔗</span>
                        <span className="text-xs font-semibold text-amber-700">Gộp với {mergedTable.name}</span>
                    </div>
                )}
            </div>

            {/* Nút hành động */}
            <div className="px-4 pb-4">
                {occupied ? (
                    <button onClick={onCheckout}
                        className="w-full py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 transition-all shadow-sm flex items-center justify-center gap-1.5">
                        <CreditCard size={13} /> Thanh toán
                    </button>
                ) : (
                    <button onClick={onSelect}
                        className="w-full py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-1.5">
                        <CheckCircle size={13} /> Chọn bàn
                    </button>
                )}
            </div>
        </div>
    );
}

/* ─── Modal Gộp bill ────────────────────────────────────────────────────────── */
function MergeBillModal({ sourceTable, occupiedTables, onClose, onConfirm }) {
    const [selectedId, setSelectedId] = useState(null);
    // Loại bỏ các bàn đã được gộp với bàn khác rồi
    const others = occupiedTables.filter(t => t.id !== sourceTable.id && !t.mergedWith);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-700 to-emerald-600">
                    <div>
                        <h2 className="font-bold text-white">Gộp hóa đơn {sourceTable.name}</h2>
                        <p className="text-emerald-200 text-xs mt-0.5">Chọn bàn để gộp hóa đơn</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-emerald-800 rounded-lg transition">
                        <X size={18} className="text-white" />
                    </button>
                </div>
                <div className="px-6 py-5">
                    {others.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Merge size={30} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Không có bàn đang ngồi nào khác</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 mb-3">
                                Hóa đơn <strong className="text-gray-800">{sourceTable.name}</strong> sẽ được gộp vào:
                            </p>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {others.map(t => (
                                    <label key={t.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedId === t.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}
                                    >
                                        <input type="radio" name="mergeTarget" value={t.id}
                                            checked={selectedId === t.id}
                                            onChange={() => setSelectedId(t.id)}
                                            className="accent-emerald-600" />
                                        <span className="text-lg">🪑</span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                                            <p className="text-xs text-gray-400">Sức chứa: {t.capacity} người</p>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Đang ngồi</span>
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                    <div className="flex gap-3 mt-5">
                        <button onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            Huỷ
                        </button>
                        <button disabled={!selectedId} onClick={() => selectedId && onConfirm(selectedId)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 ${selectedId ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                            <Merge size={14} /> Xác nhận gộp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Modal Thêm/Sửa bàn ───────────────────────────────────────────────────── */
function TableFormModal({ table, onClose, onSave }) {
    const isEdit = !!table;
    const [name, setName] = useState(table?.name || '');
    const [capacity, setCapacity] = useState(table?.capacity || 4);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ name: name.trim(), capacity: parseInt(capacity) || 4 });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-800">{isEdit ? `Chỉnh sửa ${table.name}` : 'Thêm bàn mới'}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><X size={17} className="text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên bàn</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Bàn 09, Bàn VIP 03..."
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Sức chứa (người)</label>
                        <input type="number" min={1} max={50} value={capacity} onChange={e => setCapacity(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Huỷ</button>
                        <button type="submit"
                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition">
                            {isEdit ? 'Lưu thay đổi' : 'Thêm bàn'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Modal Xác nhận xoá ────────────────────────────────────────────────────── */
function DeleteModal({ table, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trash2 size={22} className="text-red-500" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">Xoá {table.name}?</h3>
                <p className="text-sm text-gray-500 mb-5">Hành động này không thể hoàn tác.</p>
                <div className="flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Huỷ</button>
                    <button onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">Xoá</button>
                </div>
            </div>
        </div>
    );
}

/* ─── Toast thông báo ──────────────────────────────────────────────────────── */
function Toast({ message, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);
    return (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium">
            <CheckCircle size={15} className="text-emerald-400" />
            {message}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TRANG CHÍNH – dùng BranchManagerLayout (có sidebar sẵn)
═══════════════════════════════════════════════════════════════════════════════ */
export default function TableManagement() {
    const [tables, setTables] = useState(INITIAL_TABLES);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [addModal, setAddModal] = useState(false);
    const [editTable, setEditTable] = useState(null);
    const [deleteTable, setDeleteTable] = useState(null);
    const [mergeSource, setMergeSource] = useState(null);
    const [toast, setToast] = useState(null);

    const occupiedTables = tables.filter(t => t.status === 'Đang ngồi');

    const displayed = tables.filter(t => {
        const okFilter = filter === 'all' || (filter === 'available' && t.status === 'Trống') || (filter === 'occupied' && t.status === 'Đang ngồi');
        const okSearch = t.name.toLowerCase().includes(search.toLowerCase());
        return okFilter && okSearch;
    });

    const counts = {
        all: tables.length,
        available: tables.filter(t => t.status === 'Trống').length,
        occupied: tables.filter(t => t.status === 'Đang ngồi').length,
    };

    const showToast = (msg) => setToast(msg);

    const handleAdd = (data) => {
        const newId = Math.max(...tables.map(t => t.id)) + 1;
        setTables(prev => [...prev, { id: newId, ...data, status: 'Trống' }]);
        setAddModal(false);
        showToast(`Đã thêm ${data.name}!`);
    };

    const handleEdit = (data) => {
        setTables(prev => prev.map(t => t.id === editTable.id ? { ...t, ...data } : t));
        showToast(`Đã cập nhật ${data.name}!`);
        setEditTable(null);
    };

    const handleDelete = () => {
        setTables(prev => prev.filter(t => t.id !== deleteTable.id));
        showToast(`Đã xoá ${deleteTable.name}`);
        setDeleteTable(null);
    };

    const handleMerge = (targetId) => {
        const target = tables.find(t => t.id === targetId);
        // Gán mergedWith cho cả 2 bàn
        setTables(prev => prev.map(t => {
            if (t.id === mergeSource.id) return { ...t, mergedWith: targetId };
            if (t.id === targetId)       return { ...t, mergedWith: mergeSource.id };
            return t;
        }));
        showToast(`🔗 Đã gộp hóa đơn ${mergeSource.name} ↔ ${target.name}`);
        setMergeSource(null);
    };

    const handleSelect = (table) => {
        setTables(prev => prev.map(t => t.id === table.id ? { ...t, status: 'Đang ngồi' } : t));
        showToast(`${table.name} đang được phục vụ!`);
    };

    const handleCheckout = (table) => {
        const linkedId = table.mergedWith;
        setTables(prev => prev.map(t => {
            // Bàn đang thanh toán → về Trống, xóa liên kết
            if (t.id === table.id) return { ...t, status: 'Trống', mergedWith: null };
            // Bàn được gộp cùng → cũng về Trống, xóa liên kết
            if (t.id === linkedId) return { ...t, status: 'Trống', mergedWith: null };
            return t;
        }));
        const linkedTable = linkedId ? tables.find(t => t.id === linkedId) : null;
        const msg = linkedTable
            ? `Thanh toán ${table.name} + ${linkedTable.name} thành công!`
            : `Thanh toán ${table.name} thành công!`;
        showToast(msg);
    };

    return (
        <BranchManagerLayout>
            {/* ── Thanh tiêu đề + tìm kiếm + nút thêm ── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sơ đồ Bàn</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {tables.length} bàn · <span className="text-red-500">{counts.occupied} đang có khách</span> · <span className="text-emerald-600">{counts.available} trống</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm kiếm bàn..."
                            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 bg-white" />
                    </div>
                    <button onClick={() => setAddModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-sm transition">
                        <Plus size={15} /> Thêm bàn
                    </button>
                </div>
            </div>

            {/* ── Hàng filter + action ── */}
            <div className="flex items-center justify-between mb-5">
                {/* Filter pills */}
                <div className="flex items-center gap-2">
                    {[
                        { key: 'all', label: `Tất cả (${counts.all})`, dot: null },
                        { key: 'available', label: `Trống (${counts.available})`, dot: 'bg-emerald-500' },
                        { key: 'occupied', label: `Đang ngồi (${counts.occupied})`, dot: 'bg-red-500' },
                    ].map(({ key, label, dot }) => (
                        <button key={key} onClick={() => setFilter(key)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${filter === key ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}>
                            {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
                            {label}
                        </button>
                    ))}
                </div>
                {/* Nút hành động */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition" title="In mã QR">
                        <QrCode size={14} /> <span className="hidden sm:inline">In mã QR</span>
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition">
                        <Pencil size={14} /> <span className="hidden sm:inline">Chỉnh sửa</span>
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-100 rounded-xl hover:bg-red-50 text-red-500 transition">
                        <Trash2 size={14} /> <span className="hidden sm:inline">Xoá</span>
                    </button>
                </div>
            </div>

            {/* ── Grid bàn ── */}
            {displayed.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-sm">Không tìm thấy bàn nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayed.map(table => (
                        <TableCard
                            key={table.id}
                            table={table}
                            allTables={tables}
                            occupiedTables={occupiedTables}
                            onMerge={() => setMergeSource(table)}
                            onEdit={() => setEditTable(table)}
                            onDelete={() => setDeleteTable(table)}
                            onSelect={() => handleSelect(table)}
                            onCheckout={() => handleCheckout(table)}
                        />
                    ))}
                    {/* Card thêm nhanh */}
                    {filter === 'all' && !search && (
                        <button onClick={() => setAddModal(true)}
                            className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all flex flex-col items-center justify-center gap-2 py-8 text-gray-400 hover:text-emerald-600 min-h-[160px]">
                            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-emerald-100 transition">
                                <Plus size={18} />
                            </div>
                            <span className="text-xs font-medium">Thêm bàn mới</span>
                        </button>
                    )}
                </div>
            )}

            {/* ── Modals ── */}
            {addModal && <TableFormModal table={null} onClose={() => setAddModal(false)} onSave={handleAdd} />}
            {editTable && <TableFormModal table={editTable} onClose={() => setEditTable(null)} onSave={handleEdit} />}
            {deleteTable && <DeleteModal table={deleteTable} onClose={() => setDeleteTable(null)} onConfirm={handleDelete} />}
            {mergeSource && <MergeBillModal sourceTable={mergeSource} occupiedTables={occupiedTables} onClose={() => setMergeSource(null)} onConfirm={handleMerge} />}
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </BranchManagerLayout>
    );
}
