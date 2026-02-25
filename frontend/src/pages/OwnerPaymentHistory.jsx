import { useState, useEffect, useCallback } from 'react';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';
import { getOwnerPaymentHistory } from '../api/ownerApi';
import {
    Search, Download, Eye, TrendingUp, TrendingDown,
    Banknote, CreditCard, Smartphone, RefreshCw,
    ChevronLeft, ChevronRight, X, Calendar, Filter,
    CheckCircle2, XCircle, RotateCcw, Receipt, Building2
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtVND = (v) => {
    if (!v && v !== 0) return '0 đ';
    return `${Number(v).toLocaleString('vi-VN')} đ`;
};

const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const METHOD_MAP = {
    Cash: { label: 'Tiền mặt', icon: Banknote, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    BankTransfer: { label: 'Chuyển khoản', icon: CreditCard, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    'E-Wallet': { label: 'Ví điện tử', icon: Smartphone, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
};

const STATUS_MAP = {
    Success: { label: 'Thành công', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: CheckCircle2 },
    Failed: { label: 'Thất bại', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: XCircle },
};

// Tính startDate/endDate theo khoảng chọn
const getDateRange = (rangeKey) => {
    const now = new Date();
    let start, end;
    switch (rangeKey) {
        case 'this_month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = now;
            break;
        case 'last_month':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            break;
        case 'this_quarter': {
            const q = Math.floor(now.getMonth() / 3);
            start = new Date(now.getFullYear(), q * 3, 1);
            end = now;
            break;
        }
        case 'this_year':
            start = new Date(now.getFullYear(), 0, 1);
            end = now;
            break;
        case 'all':
        default:
            return { startDate: undefined, endDate: undefined };
    }
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function TransactionModal({ tx, onClose }) {
    if (!tx) return null;
    const method = METHOD_MAP[tx.paymentMethod] || {};
    const statusInfo = STATUS_MAP[tx.status] || {};
    const MethodIcon = method.icon || CreditCard;
    const StatusIcon = statusInfo.icon || CheckCircle2;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: method.bg || 'rgba(59,130,246,0.15)' }}>
                            <MethodIcon size={20} style={{ color: method.color || '#3b82f6' }} />
                        </div>
                        <div>
                            <p className="text-white font-bold text-base">Chi tiết giao dịch</p>
                            <p className="text-xs" style={{ color: '#64748b' }}>#{tx.transactionID}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10">
                        <X size={16} style={{ color: '#94a3b8' }} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Amount */}
                    <div className="text-center py-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <p className="text-3xl font-black text-white">{fmtVND(tx.amount)}</p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ background: statusInfo.bg, color: statusInfo.color }}>
                            <StatusIcon size={12} />
                            {statusInfo.label || tx.status}
                        </div>
                    </div>

                    {/* Details grid */}
                    {[
                        { label: 'Mã đơn hàng', value: tx.orderID ? `#ORD-${tx.orderID}` : '—', icon: Receipt },
                        { label: 'Chi nhánh', value: tx.branchName || '—', icon: Building2 },
                        { label: 'Phương thức', value: method.label || tx.paymentMethod, icon: MethodIcon },
                        { label: 'Thời gian', value: fmtDate(tx.transactionTime), icon: Calendar },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <Icon size={16} style={{ color: '#64748b' }} className="shrink-0" />
                            <div className="flex-1 flex items-center justify-between">
                                <span className="text-xs" style={{ color: '#64748b' }}>{label}</span>
                                <span className="text-sm font-semibold text-white">{value}</span>
                            </div>
                        </div>
                    ))}

                    {tx.paymentGatewayRef && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <Receipt size={16} style={{ color: '#64748b' }} className="shrink-0" />
                            <div className="flex-1 flex items-center justify-between">
                                <span className="text-xs" style={{ color: '#64748b' }}>Mã tham chiếu</span>
                                <span className="text-sm font-semibold text-white font-mono">{tx.paymentGatewayRef}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function OwnerPaymentHistory() {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ totalRevenue: 0, cashRevenue: 0, onlineRevenue: 0, cashPercent: 0, onlinePercent: 0, revenueGrowth: null });
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const LIMIT = 10;

    // Filters
    const [rangeKey, setRangeKey] = useState('this_month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // Modal
    const [selectedTx, setSelectedTx] = useState(null);

    // CSV loading
    const [csvLoading, setCsvLoading] = useState(false);

    const buildParams = useCallback(() => {
        const params = { page, limit: LIMIT };
        if (rangeKey === 'custom') {
            if (customStart) params.startDate = customStart;
            if (customEnd) params.endDate = customEnd;
        } else {
            const range = getDateRange(rangeKey);
            if (range.startDate) params.startDate = range.startDate;
            if (range.endDate) params.endDate = range.endDate;
        }
        if (methodFilter) params.paymentMethod = methodFilter;
        if (statusFilter) params.status = statusFilter;
        if (search) params.search = search;
        return params;
    }, [page, rangeKey, customStart, customEnd, methodFilter, statusFilter, search]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getOwnerPaymentHistory(buildParams());
            setTransactions(res.data.transactions || []);
            setSummary(res.data.summary || {});
            setTotalCount(res.data.totalCount || 0);
        } catch (err) {
            console.error('Payment history error:', err);
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const handleReset = () => {
        setRangeKey('this_month');
        setCustomStart('');
        setCustomEnd('');
        setMethodFilter('');
        setStatusFilter('');
        setSearch('');
        setSearchInput('');
        setPage(1);
    };

    const handleExportCSV = async () => {
        setCsvLoading(true);
        try {
            const params = { ...buildParams(), exportCsv: 'true' };
            const res = await getOwnerPaymentHistory(params);
            // Backend trả về CSV string qua Content-Type text/csv
            const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lich-su-thanh-toan-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            // Fallback: xuất từ data hiện tại
            const headers = ['Ngày,Mã đơn hàng,Chi nhánh,Phương thức,Số tiền,Trạng thái'];
            const rows = transactions.map((t) => [
                fmtDate(t.transactionTime),
                `#ORD-${t.orderID || ''}`,
                t.branchName || '',
                METHOD_MAP[t.paymentMethod]?.label || t.paymentMethod,
                t.amount,
                STATUS_MAP[t.status]?.label || t.status,
            ].join(','));
            const csv = '\uFEFF' + [headers, ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lich-su-thanh-toan-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setCsvLoading(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));
    const startIdx = (page - 1) * LIMIT + 1;
    const endIdx = Math.min(page * LIMIT, totalCount);

    // Pagination range
    const getPaginationPages = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages = [];
        if (page <= 4) {
            pages.push(1, 2, 3, 4, 5, '...', totalPages);
        } else if (page >= totalPages - 3) {
            pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
        }
        return pages;
    };

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <RestaurantOwnerLayout>
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Lịch sử thanh toán</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Theo dõi toàn bộ giao dịch từ các chi nhánh</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm mã đơn hàng..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 w-52 transition-all"
                        />
                    </form>
                    {/* Export CSV */}
                    <button
                        onClick={handleExportCSV}
                        disabled={csvLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
                    >
                        <Download size={14} />
                        {csvLoading ? 'Đang xuất...' : 'Xuất CSV'}
                    </button>
                </div>
            </div>

            {/* ── Stat Cards (dark) ──────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-5 mb-6">
                {/* Total Revenue */}
                <div className="relative rounded-2xl p-6 overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.18)' }}>
                        <Receipt size={18} style={{ color: '#60a5fa' }} />
                    </div>
                    <p className="text-xs font-medium mb-3" style={{ color: '#94a3b8' }}>Tổng doanh thu</p>
                    <p className="text-2xl font-black text-white mb-2">{fmtVND(summary.totalRevenue)}</p>
                    {summary.revenueGrowth !== null && summary.revenueGrowth !== undefined ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: summary.revenueGrowth >= 0 ? '#4ade80' : '#f87171' }}>
                            {summary.revenueGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {summary.revenueGrowth >= 0 ? '+' : ''}{summary.revenueGrowth}% so với kỳ trước
                        </div>
                    ) : (
                        <p className="text-xs" style={{ color: '#475569' }}>Chưa có dữ liệu kỳ trước</p>
                    )}
                    {/* Decorative blur */}
                    <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full opacity-10" style={{ background: 'radial-gradient(circle,#3b82f6,transparent)' }} />
                </div>

                {/* Cash */}
                <div className="relative rounded-2xl p-6 overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
                        <Banknote size={18} style={{ color: '#4ade80' }} />
                    </div>
                    <p className="text-xs font-medium mb-3" style={{ color: '#94a3b8' }}>Tiền mặt</p>
                    <p className="text-2xl font-black text-white mb-2">{fmtVND(summary.cashRevenue)}</p>
                    <p className="text-xs font-medium" style={{ color: '#4ade80' }}>{summary.cashPercent}% tổng giao dịch</p>
                    <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full opacity-10" style={{ background: 'radial-gradient(circle,#22c55e,transparent)' }} />
                </div>

                {/* Online */}
                <div className="relative rounded-2xl p-6 overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}>
                        <CreditCard size={18} style={{ color: '#c084fc' }} />
                    </div>
                    <p className="text-xs font-medium mb-3" style={{ color: '#94a3b8' }}>Chuyển khoản / Online</p>
                    <p className="text-2xl font-black text-white mb-2">{fmtVND(summary.onlineRevenue)}</p>
                    <p className="text-xs font-medium" style={{ color: '#c084fc' }}>{summary.onlinePercent}% tổng giao dịch</p>
                    <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full opacity-10" style={{ background: 'radial-gradient(circle,#a855f7,transparent)' }} />
                </div>
            </div>

            {/* ── Filter Bar ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-5">
                <div className="flex items-end gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 w-full">
                        <Filter size={12} />
                        Bộ lọc
                    </div>
                    {/* Time range */}
                    <div className="flex flex-col gap-1 min-w-[170px]">
                        <label className="text-xs text-gray-400 font-medium">Khoảng thời gian</label>
                        <select
                            value={rangeKey}
                            onChange={(e) => { setRangeKey(e.target.value); setPage(1); }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white text-gray-700"
                        >
                            <option value="all">Tất cả</option>
                            <option value="this_month">Tháng này</option>
                            <option value="last_month">Tháng trước</option>
                            <option value="this_quarter">Quý này</option>
                            <option value="this_year">Năm nay</option>
                            <option value="custom">Tùy chỉnh</option>
                        </select>
                    </div>

                    {/* Custom date range */}
                    {rangeKey === 'custom' && (
                        <>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400 font-medium">Từ ngày</label>
                                <input type="date" value={customStart} onChange={(e) => { setCustomStart(e.target.value); setPage(1); }}
                                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white text-gray-700" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400 font-medium">Đến ngày</label>
                                <input type="date" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); setPage(1); }}
                                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white text-gray-700" />
                            </div>
                        </>
                    )}

                    {/* Method */}
                    <div className="flex flex-col gap-1 min-w-[160px]">
                        <label className="text-xs text-gray-400 font-medium">Phương thức</label>
                        <select
                            value={methodFilter}
                            onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white text-gray-700"
                        >
                            <option value="">Tất cả phương thức</option>
                            <option value="Cash">Tiền mặt</option>
                            <option value="BankTransfer">Chuyển khoản</option>
                            <option value="E-Wallet">Ví điện tử</option>
                        </select>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-1 min-w-[150px]">
                        <label className="text-xs text-gray-400 font-medium">Trạng thái</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white text-gray-700"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="Success">Thành công</option>
                            <option value="Failed">Thất bại</option>
                        </select>
                    </div>

                    {/* Reset */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-transparent font-medium">.</label>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw size={13} />
                            Làm mới
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Transaction Table ──────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"
                                style={{ borderWidth: 3, borderStyle: 'solid', borderColor: '#3b82f6 transparent transparent transparent' }} />
                            <p className="text-sm text-gray-400">Đang tải dữ liệu...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['NGÀY', 'MÃ ĐƠN HÀNG', 'CHI NHÁNH', 'PHƯƠNG THỨC', 'SỐ TIỀN', 'TRẠNG THÁI', ''].map((h) => (
                                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold" style={{ color: '#94a3b8', letterSpacing: '0.05em' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-16 text-gray-400 text-sm">
                                            <div className="flex flex-col items-center gap-2">
                                                <Receipt size={36} className="text-gray-200" />
                                                <p>Không có giao dịch nào</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : transactions.map((tx, idx) => {
                                    const method = METHOD_MAP[tx.paymentMethod] || { label: tx.paymentMethod, icon: CreditCard, color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
                                    const MethodIcon = method.icon;
                                    const statusInfo = STATUS_MAP[tx.status] || { label: tx.status, color: '#64748b', bg: 'rgba(100,116,139,0.1)' };

                                    return (
                                        <tr key={tx.transactionID}
                                            className="border-t transition-colors hover:bg-blue-50/30 group"
                                            style={{ borderColor: '#f1f5f9' }}>
                                            {/* Date */}
                                            <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                {fmtDate(tx.transactionTime)}
                                            </td>
                                            {/* Order ID */}
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-gray-800">
                                                    {tx.orderID ? `#ORD-${tx.orderID}` : '—'}
                                                </span>
                                            </td>
                                            {/* Branch */}
                                            <td className="px-5 py-4 text-sm text-gray-500 max-w-[140px] truncate">
                                                {tx.branchName || '—'}
                                            </td>
                                            {/* Method */}
                                            <td className="px-5 py-4">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                    style={{ background: method.bg, color: method.color }}>
                                                    <MethodIcon size={13} />
                                                    {method.label}
                                                </div>
                                            </td>
                                            {/* Amount */}
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-black text-gray-900">{fmtVND(tx.amount)}</span>
                                            </td>
                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                                                    style={{ background: statusInfo.bg, color: statusInfo.color }}>
                                                    {tx.status === 'Success'
                                                        ? <CheckCircle2 size={12} />
                                                        : <XCircle size={12} />}
                                                    {statusInfo.label}
                                                </div>
                                            </td>
                                            {/* Action */}
                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() => setSelectedTx(tx)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all opacity-50 group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-600 text-gray-400"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* ── Pagination ────────────────────────────────── */}
                        <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: '#f1f5f9' }}>
                            <p className="text-sm text-gray-400">
                                {totalCount === 0
                                    ? 'Không có giao dịch nào'
                                    : `Hiển thị ${startIdx} – ${endIdx} của ${totalCount.toLocaleString()} giao dịch`}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
                                    style={{ borderColor: '#e2e8f0' }}
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                {getPaginationPages().map((p, i) =>
                                    p === '...' ? (
                                        <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-all"
                                            style={p === page
                                                ? { background: '#3b82f6', color: 'white', fontWeight: 700 }
                                                : { color: '#64748b', border: '1px solid #e2e8f0' }}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
                                    style={{ borderColor: '#e2e8f0' }}
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Modal ──────────────────────────────────────────────────── */}
            <TransactionModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
        </RestaurantOwnerLayout>
    );
}
