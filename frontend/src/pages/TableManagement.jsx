import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from "socket.io-client";
import { getServerIP } from '../api/publicApi';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';
import {
    Search, Plus, QrCode, Pencil, Trash2, Users,
    MoreVertical, X, Merge, CreditCard, CheckCircle, RefreshCw, Printer, Clock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
    getManagerTables,
    createManagerTable,
    mergeManagerTables,
    updateManagerTable,
    updateManagerTableStatus,
    deleteManagerTable,
} from '../api/managerApi';
import CustomerMenu from './CustomerMenu';
import TablePaymentModal from '../components/manager/TablePaymentModal';

/* ─── Badge trạng thái ─────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
    if (status === 'Trống')
        return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">TRỐNG</span>;
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">ĐANG NGỒI</span>;
}

/* ─── Menu 3 chấm ──────────────────────────────────────────────────────────── */
function ThreeDotMenu({ onMerge, onEdit, onDelete, onPrint }) {
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
                    <button onClick={() => { setOpen(false); onPrint(); }}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700">
                        <QrCode size={13} /> In mã QR
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

/* ─── Card bàn ────────────────────────────────────────────────────── */
function TableCard({ table, allTables, onMerge, onEdit, onDelete, onSelect, onCheckout, onOpenMenuDrawer, onPrintQR }) {
    const occupied = table.status === 'Đang ngồi';
    // mergedWith giờ là mảng các ID
    const mergedIds = Array.isArray(table.mergedWith) ? table.mergedWith : [];
    const isMerged = mergedIds.length > 0;
    const mergedNames = mergedIds
        .map(id => allTables.find(t => t.id === id)?.name || `#${id}`)
        .join(', ');

    const handleCardClick = (e) => {
        // Tránh bị đè khi bấm vào các nút bên trong (3 chấm, thanh toán, v.v)
        if (e.target.closest('button')) return;
        
        if (occupied) {
            onOpenMenuDrawer(table.id);
        }
    };

    return (
        <div 
            onClick={handleCardClick}
            className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
                occupied ? 'cursor-pointer' : ''
            } ${isMerged ? 'border-amber-300 hover:border-amber-400' :
            occupied ? 'border-red-200 hover:border-red-300' :
                'border-gray-100 hover:border-emerald-200'
            }`}>
            {/* Thanh màu bên trái */}
            {isMerged && <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-amber-400 to-orange-400 rounded-r-full" />}
            {!isMerged && occupied && <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-red-400 to-rose-500 rounded-r-full" />}

            <div className="p-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${isMerged ? 'bg-amber-50' : occupied ? 'bg-red-50' : 'bg-emerald-50'
                        }`}>
                        {occupied ? '🪑' : '🍽️'}
                    </div>
                    <div className="flex items-center gap-1">
                        <StatusBadge status={table.status} />
                        <ThreeDotMenu 
                            onMerge={onMerge} 
                            onEdit={onEdit} 
                            onDelete={onDelete} 
                            onPrint={onPrintQR} 
                        />
                    </div>
                </div>

                <h3 className="font-bold text-gray-800 text-sm leading-tight">{table.name}</h3>
                <div className="flex items-center gap-1 mt-1 text-gray-400 text-xs">
                    <Users size={11} />
                    <span>Sức chứa: {table.capacity} người</span>
                </div>

                {/* Badge gộp bill — hiện tất cả bàn đã gộp */}
                {isMerged && (
                    <div className="mt-2 flex items-start gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                        <span className="text-amber-500 text-xs mt-0.5">🔗</span>
                        <span className="text-xs font-semibold text-amber-700">Gộp với {mergedNames}</span>
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
/* ─── Modal Gộp bill — hỗ trợ chọn nhiều bàn ──────────────────────────── */
function MergeBillModal({ sourceTable, occupiedTables, onClose, onConfirm }) {
    const [selectedIds, setSelectedIds] = useState([]);
    // Hiện tất cả bàn đang ngồi trừ chính nó (kể cả bàn đã gộp trước)
    const others = occupiedTables.filter(t => t.id !== sourceTable.id);

    const toggle = (id) => setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-700 to-emerald-600">
                    <div>
                        <h2 className="font-bold text-white">Gộp hóa đơn {sourceTable.name}</h2>
                        <p className="text-emerald-200 text-xs mt-0.5">Chọn một hoặc nhiều bàn để gộp</p>
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
                                Hóa đơn <strong className="text-gray-800">{sourceTable.name}</strong> sẽ được gộp với:
                            </p>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {others.map(t => {
                                    const checked = selectedIds.includes(t.id);
                                    const alreadyMerged = Array.isArray(t.mergedWith) && t.mergedWith.length > 0;
                                    return (
                                        <label key={t.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${checked
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                                                }`}
                                        >
                                            <input type="checkbox" value={t.id}
                                                checked={checked}
                                                onChange={() => toggle(t.id)}
                                                className="accent-emerald-600 w-4 h-4" />
                                            <span className="text-lg">🪑</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                                                <p className="text-xs text-gray-400">Sức chứa: {t.capacity} người</p>
                                                {alreadyMerged && (
                                                    <p className="text-xs text-amber-600 mt-0.5">🔗 Đã gộp trước</p>
                                                )}
                                            </div>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium flex-shrink-0">Đang ngồi</span>
                                        </label>
                                    );
                                })}
                            </div>
                            {selectedIds.length > 0 && (
                                <p className="text-xs text-emerald-600 font-medium mt-2">
                                    ✅ Đã chọn {selectedIds.length} bàn
                                </p>
                            )}
                        </>
                    )}
                    <div className="flex gap-3 mt-5">
                        <button onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            Huỷ
                        </button>
                        <button
                            disabled={selectedIds.length === 0}
                            onClick={() => selectedIds.length > 0 && onConfirm(selectedIds)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 ${selectedIds.length > 0
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}>
                            <Merge size={14} /> Xác nhận gộp ({selectedIds.length})
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

/* ─── Modal In Mã QR – Hỗ trợ chọn bàn ────────────────────────────────────── */
function PrintQRModal({ tables, onClose }) {
    const [selectedIds, setSelectedIds] = useState(tables.map(t => t.id));
    const [serverIP, setServerIP] = useState(window.location.hostname);

    useEffect(() => {
        getServerIP()
            .then(res => setServerIP(res.data.ip))
            .catch(err => console.error("Không lấy được IP server:", err));
    }, []);

    const toggleTable = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selectedIds.length === tables.length) setSelectedIds([]);
        else setSelectedIds(tables.map(t => t.id));
    };

    const tablesToPrint = tables.filter(t => selectedIds.includes(t.id));

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm print:bg-transparent print:static print:block print:inset-auto">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { margin: 10mm; size: A4 portrait; }
                    body { margin: 0; padding: 0; background: white !important; }
                    nav, aside, header, footer, .print-hidden, .no-print { display: none !important; }
                }
            ` }} />
            
            {/* Giao diện chọn bàn (Ẩn khi in) */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col print:hidden no-print">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-emerald-50/50">
                    <div>
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2 uppercase tracking-tight">
                            <QrCode className="text-emerald-600" size={20} />
                            QUẢN LÝ IN MÃ QR ({selectedIds.length}/{tables.length})
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Chọn các bàn bạn muốn in tem QR.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleAll} className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition">
                            {selectedIds.length === tables.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition ml-2">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {tables.map(table => {
                            const isSelected = selectedIds.includes(table.id);
                            return (
                                <div 
                                    key={table.id} 
                                    onClick={() => toggleTable(table.id)}
                                    className={`bg-white p-4 rounded-2xl shadow-sm border-2 transition-all cursor-pointer flex flex-col items-center text-center relative ${
                                        isSelected ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-100 hover:border-emerald-200'
                                    }`}
                                >
                                    <div className="absolute top-2 right-2">
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${
                                            isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-200'
                                        }`}>
                                            {isSelected && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                    </div>
                                    <h3 className={`font-bold text-sm mb-3 ${isSelected ? 'text-emerald-900' : 'text-gray-700'}`}>{table.name}</h3>
                                    <div className={`p-2 bg-white rounded-lg border-2 border-dashed ${isSelected ? 'border-emerald-100' : 'border-gray-50'}`}>
                                        <QRCodeSVG 
                                            value={`http://${serverIP}:5173/self-order?tableId=${table.id}`} 
                                            size={64}
                                            level="L"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-2xl">
                    <button onClick={onClose}
                        className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition">
                        ĐÓNG
                    </button>
                    <button onClick={handlePrint}
                        disabled={selectedIds.length === 0}
                        className={`px-8 py-2.5 rounded-xl text-sm font-black transition flex items-center gap-2 shadow-lg ${
                            selectedIds.length > 0
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        }`}>
                        <Printer size={18} /> IN NGAY ({selectedIds.length})
                    </button>
                </div>
            </div>

            {/* Giao diện THỰC TẾ KHI IN (Dàn trang chuẩn A4) */}
            <div className="hidden print:block print:w-full print:bg-white no-screen">
                <div className="grid grid-cols-2 gap-4">
                    {tablesToPrint.map(table => (
                        <div key={table.id} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-400 rounded-[30px] break-inside-avoid mb-6" style={{ minHeight: '140mm' }}>
                            <h2 className="text-4xl font-black mb-6 text-gray-900 uppercase tracking-widest">{table.name}</h2>
                            <div className="p-4 bg-white border-2 border-gray-100 rounded-3xl shadow-sm">
                                <QRCodeSVG 
                                    value={`http://${serverIP}:5173/self-order?tableId=${table.id}`} 
                                    size={280}
                                    level="H"
                                />
                            </div>
                            <div className="mt-8 flex flex-col items-center gap-2">
                                <p className="text-xl font-black text-gray-800 tracking-wide">QUÉT MÃ ĐỂ ĐẶT MÓN</p>
                                <p className="text-xs text-gray-400 font-medium">RestoOrder - Hân hạnh phục vụ</p>
                            </div>
                        </div>
                    ))}
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
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [addModal, setAddModal] = useState(false);
    const [editTable, setEditTable] = useState(null);
    const [deleteTable, setDeleteTable] = useState(null);
    const [mergeSource, setMergeSource] = useState(null);
    const [printTables, setPrintTables] = useState(null); // null hoặc [table1, table2...]
    const [toast, setToast] = useState(null);
    const [menuDrawerTableId, setMenuDrawerTableId] = useState(null);

    // ==========================================
    // PAYMENT QUEUE STATE
    // ==========================================
    const [paymentQueue, setPaymentQueue] = useState([]); 
    // Mảng chứa: { tableId, tableName, paymentData, billData }
    const [activeQueueItem, setActiveQueueItem] = useState(null); // tableId đang mở modal QR lại
    // ==========================================

    const showToast = (msg) => setToast(msg);

    // Chuẩn hoá chuỗi: bỏ dấu + khoảng trắng + chữ thường
    // VD: "Bàn 01" → "ban01", giúp search "ban01" vẫn tìm được
    const norm = (str) => str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // bỏ dấu
        .replace(/\s+/g, '');             // bỏ khoảng trắng

    /* ── Load bàn từ API ── */
    const loadTables = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getManagerTables();
            // Server đã trả về mergedWith[] và mergedGroupId từ DB
            setTables(res.data);
        } catch (err) {
            showToast('Lỗi tải danh sách bàn: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadTables(); }, [loadTables]);

    // Socket.io for Real-time
    useEffect(() => {
        const socket = io(`http://${window.location.hostname}:5000`);
        
        socket.on("connect", () => {
            console.log("🟢 Connected to Real-time Server");
        });

        socket.on("tableUpdate", (data) => {
            console.log("🔄 Real-time Update Received:", data);
            loadTables(); // Refresh the list
        });

        return () => {
            socket.disconnect();
        };
    }, [loadTables]);

    const occupiedTables = tables.filter(t => t.status === 'Đang ngồi');

    const displayed = tables.filter(t => {
        const okFilter = filter === 'all'
            || (filter === 'available' && t.status === 'Trống')
            || (filter === 'occupied' && t.status === 'Đang ngồi');
        const okSearch = norm(t.name).includes(norm(search));
        return okFilter && okSearch;
    });

    const counts = {
        all: tables.length,
        available: tables.filter(t => t.status === 'Trống').length,
        occupied: tables.filter(t => t.status === 'Đang ngồi').length,
    };

    /* ── Thêm bàn ── */
    const handleAdd = async (data) => {
        try {
            const res = await createManagerTable(data);
            setTables(prev => [...prev, { ...res.data, mergedWith: [] }]);
            setAddModal(false);
            showToast(`Đã thêm ${res.data.name}!`);
        } catch (err) {
            showToast('Lỗi thêm bàn: ' + (err.response?.data?.message || err.message));
        }
    };

    /* ── Sửa bàn ── */
    const handleEdit = async (data) => {
        try {
            const res = await updateManagerTable(editTable.id, data);
            setTables(prev => prev.map(t => t.id === editTable.id ? { ...t, ...res.data } : t));
            showToast(`Đã cập nhật ${res.data.name}!`);
            setEditTable(null);
        } catch (err) {
            showToast('Lỗi cập nhật: ' + (err.response?.data?.message || err.message));
        }
    };

    /* ── Xoá bàn ── */
    const handleDelete = async () => {
        try {
            await deleteManagerTable(deleteTable.id);
            setTables(prev => prev.filter(t => t.id !== deleteTable.id));
            showToast(`Đã xoá ${deleteTable.name}`);
            setDeleteTable(null);
        } catch (err) {
            showToast('Lỗi xoá bàn: ' + (err.response?.data?.message || err.message));
            setDeleteTable(null);
        }
    };

    /* ── Gộp bill — hỗ trợ nhiều bàn ── */
    const handleMerge = async (targetIds) => {
        const source = mergeSource;
        setMergeSource(null); // đóng modal ngay
        try {
            // Gọi API lần lượt cho từng bàn được chọn
            for (const tid of targetIds) {
                await mergeManagerTables(source.id, tid);
            }
            // Reload từ server — backend đã lưu mergedGroupId vào DB
            await loadTables();
            const targetNames = tables
                .filter(t => targetIds.includes(t.id))
                .map(t => t.name).join(', ');
            showToast(`🔗 Đã gộp hóa đơn ${source.name} ↔ ${targetNames}!`);
        } catch (err) {
            showToast('Lỗi gộp bill: ' + (err.response?.data?.message || err.message));
        }
    };

    /* ── Chọn bàn → Đang ngồi ── */
    const handleSelect = async (table) => {
        try {
            await updateManagerTableStatus(table.id, 'Đang ngồi');
            setTables(prev => prev.map(t => t.id === table.id ? { ...t, status: 'Đang ngồi' } : t));
            showToast(`${table.name} đang được phục vụ!`);
        } catch (err) {
            showToast('Lỗi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
        }
    };

    /* ── Thanh toán → Trống (backend tự xóa toàn bộ nhóm gộp) ── */
    const handleCheckout = async (table) => {
        const linkedIds = Array.isArray(table.mergedWith) ? table.mergedWith : [];
        const linkedNames = linkedIds
            .map(id => tables.find(t => t.id === id)?.name || '')
            .filter(Boolean).join(' + ');
        try {
            // Chỉ cần gọi 1 API cho bàn chính —
            // backend sẽ tự đặt toàn bộ các bàn cùng nhóm về Available và xóa mergedGroupId
            await updateManagerTableStatus(table.id, 'Trống');
            setTables(prev => prev.map(t => {
                if (t.id === table.id || linkedIds.includes(t.id)) {
                    return { ...t, status: 'Trống', mergedWith: [], mergedGroupId: null };
                }
                return t;
            }));
            showToast(`💵 Đã thanh toán xong cho: ${table.name} ${linkedNames ? '+ ' + linkedNames : ''}`);
        } catch (err) {
            showToast('Lỗi thanh toán: ' + (err.response?.data?.message || err.message));
        }
    };

    /* ── Xử lý Checkout từ Drawer ── */
    // Nhận object { type, paymentData, billData } từ component con, 
    // nếu type = 'QR' thì đưa vào Queue và tắt drawer
    const handleDrawerCheckoutSuccess = (message, payload) => {
        setMenuDrawerTableId(null); // Đóng drawer
        if (payload?.type === 'QR') {
            // Thêm vào Queue
            setPaymentQueue(prev => {
                // tránh duplicate
                if (prev.find(item => item.tableId === payload.tableId)) return prev;
                return [...prev, payload];
            });
            setActiveQueueItem(payload.tableId); // Tự động mở QR thay vì buộc người dùng bấm
            // Không gán toast message nếu không cần thiết
        } else {
            showToast(message || 'Thanh toán tiền mặt thành công!');
            loadTables(); // Refresh nếu thanh toán tiền mặt thành công
        }
    };

    /* ── Xử lý khi thanh toán QR thành công từ Queue ── */
    const handleQueuePaymentSuccess = (tableId) => {
        setActiveQueueItem(null);
        setPaymentQueue(prev => prev.filter(item => item.tableId !== tableId));
        showToast(`Thanh toán mã QR thành công!`);
        loadTables(); // Reload trạng thái bàn về Trống
    };

    return (
        <BranchManagerLayout>
            <div className="print:hidden">
                {/* ── Thanh tiêu đề + tìm kiếm + nút thêm ── */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sơ đồ Bàn</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {loading ? 'Đang tải...' : `${tables.length} bàn · `}
                            {!loading && <><span className="text-red-500">{counts.occupied} đang có khách</span> · <span className="text-emerald-600">{counts.available} trống</span></>}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={loadTables} title="Làm mới"
                            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition">
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <div className="relative flex items-center">
                            <Search size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Tìm kiếm bàn..."
                                className="pl-8 pr-4 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 bg-white"
                            />
                        </div>
                    </div>
                </div>
    
                {/* ── Loading ── */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
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
                                <button 
                                    onClick={() => setPrintTables(displayed)}
                                    disabled={displayed.length === 0}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-xl transition ${
                                        displayed.length > 0 
                                        ? 'border-gray-200 hover:bg-gray-50 text-gray-600' 
                                        : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                    }`} 
                                    title="In mã QR">
                                    <QrCode size={14} /> <span className="hidden sm:inline">In tất cả mã QR</span>
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
                                        onOpenMenuDrawer={(id) => setMenuDrawerTableId(id)}
                                        onPrintQR={() => setPrintTables([table])}
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
                    </>
                )}
            </div>

            {/* ── Modals ── */}
            {addModal && <TableFormModal table={null} onClose={() => setAddModal(false)} onSave={handleAdd} />}
            {editTable && <TableFormModal table={editTable} onClose={() => setEditTable(null)} onSave={handleEdit} />}
            {deleteTable && <DeleteModal table={deleteTable} onClose={() => setDeleteTable(null)} onConfirm={handleDelete} />}
            {mergeSource && <MergeBillModal sourceTable={mergeSource} occupiedTables={occupiedTables} onClose={() => setMergeSource(null)} onConfirm={handleMerge} />}
            {printTables && <PrintQRModal tables={printTables} onClose={() => setPrintTables(null)} />}
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}

            {/* Menu Drawer */}
            <div 
                className={`fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col ${menuDrawerTableId ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {menuDrawerTableId && (
                    <div className="relative flex-1 flex flex-col overflow-hidden">
                        {/* Nút đóng Drawer định vị tuyệt đối bên trên nội dung */}
                        <button 
                            onClick={() => setMenuDrawerTableId(null)}
                            className="absolute top-4 right-4 z-[70] p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all shadow-md focus:outline-none"
                        >
                            <X size={20} />
                        </button>
                        {/* Box bọc CustomerMenu */}
                        <div className="flex-1 overflow-y-auto">
                            <CustomerMenu 
                                tableIdProp={menuDrawerTableId} 
                                onCheckoutSuccess={handleDrawerCheckoutSuccess}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Backdrop phủ đen đằng sau */}
            {menuDrawerTableId && (
                <div 
                    className="fixed inset-0 bg-black/30 z-[50] backdrop-blur-sm transition-opacity"
                    onClick={() => setMenuDrawerTableId(null)}
                />
            )}

            {/* PAYMENT QUEUE BAR */}
            {paymentQueue.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] py-3 px-6 pb-20 md:pb-3 overflow-x-auto hide-scrollbar">
                    <div className="flex items-center gap-4 min-w-max md:pl-64">
                        <div className="flex items-center gap-2 pr-4 border-r border-gray-200 font-bold text-gray-600">
                            <Clock className="text-amber-500 animate-pulse" size={20} />
                            <span className="text-sm">Hàng chờ QR ({paymentQueue.length})</span>
                        </div>
                        
                        {paymentQueue.map((item) => (
                            <button 
                                key={item.tableId}
                                onClick={() => setActiveQueueItem(item.tableId)}
                                className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl hover:shadow-md transition group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs">
                                    🪑
                                </div>
                                <div className="text-left flex-1 min-w-[100px]">
                                    <p className="text-xs font-bold text-gray-800 leading-tight">{item.tableName}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">Đang quét...</p>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-white border border-emerald-200 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition shrink-0">
                                    <QrCode size={12} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* RE-OPEN PAYMENT MODAL FROM QUEUE */}
            {activeQueueItem && paymentQueue.find(q => q.tableId === activeQueueItem) && (
                <TablePaymentModal
                    isOpen={true}
                    onClose={() => setActiveQueueItem(null)}
                    paymentData={paymentQueue.find(q => q.tableId === activeQueueItem).paymentData}
                    billData={paymentQueue.find(q => q.tableId === activeQueueItem).billData}
                    tableName={paymentQueue.find(q => q.tableId === activeQueueItem).tableName}
                    onPaymentSuccess={() => handleQueuePaymentSuccess(activeQueueItem)}
                />
            )}
        </BranchManagerLayout>
    );
}

