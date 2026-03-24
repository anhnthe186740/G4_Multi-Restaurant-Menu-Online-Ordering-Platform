import { useState, useEffect, useCallback, useRef } from 'react';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';
import { Bell, CreditCard, RefreshCw, ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import {
    getManagerServiceRequests,
    updateManagerServiceRequestStatus,
} from '../api/managerApi';

/* ─── Constants ─── */
const TABS = [
    { key: 'all',          label: 'Tất cả' },
];

const ICON_MAP = {
    bell:          { Icon: Bell,       color: 'text-red-500',    bg: 'bg-red-50' },
    'credit-card': { Icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

/* ─── Helpers ─── */
const getRelativeTime = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)   return `${diff}s trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
};

const isDone = (status) => status === 'Đã xử lý';

/* ─── Confirm Dialog ─── */
function ConfirmDialog({ request, onConfirm, onCancel, loading }) {
    const iconCfg = ICON_MAP[request?.displayType?.icon ?? 'bell'];
    const Icon = iconCfg?.Icon ?? Bell;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in slide-in-from-bottom-4">
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X size={16} className="text-gray-400" />
                </button>

                <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center">
                        <CheckCircle2 size={28} className="text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Xác nhận đã xử lý?</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Yêu cầu <span className="font-semibold text-gray-700">{request?.displayType?.label}</span>
                            {' '}tại bàn <span className="font-semibold text-gray-700">{request?.tableName}</span>
                        </p>
                    </div>

                    <div className="w-full flex gap-3 mt-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Huỷ
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Xác nhận
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Stat Card ─── */
const StatCard = ({ label, value, valueColor = 'text-gray-900', sub }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <p className="text-gray-400 text-xs font-medium mb-2">{label}</p>
        <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
        {sub && <p className="text-xs mt-1 font-semibold text-gray-400">{sub}</p>}
    </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function ManagerServiceRequests() {
    const [activeTab, setActiveTab]         = useState('all');
    const [requests, setRequests]           = useState([]);
    const [stats, setStats]                 = useState({ pending: 0, totalToday: 0 });
    const [total, setTotal]                 = useState(0);
    const [page, setPage]                   = useState(1);
    const [totalPages, setTotalPages]       = useState(1);
    const [loading, setLoading]             = useState(true);
    const [confirmTarget, setConfirmTarget] = useState(null); // request being confirmed
    const [confirming, setConfirming]       = useState(false);
    const autoRefreshRef                    = useRef(null);
    const LIMIT = 10;

    const loadRequests = useCallback(async (tab = activeTab, p = page) => {
        setLoading(true);
        try {
            const params = { page: p, limit: LIMIT };
            if (tab !== 'all') params.type = tab;
            const res = await getManagerServiceRequests(params);
            const d = res.data;
            setRequests(d.data ?? []);
            setTotal(d.total ?? 0);
            setPage(d.page ?? 1);
            setTotalPages(d.totalPages ?? 1);
            setStats(d.stats ?? { pending: 0, totalToday: 0 });
        } catch (err) {
            console.error('loadRequests error:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, page]); // eslint-disable-line

    useEffect(() => { loadRequests(activeTab, page); }, [activeTab, page, loadRequests]); // eslint-disable-line

    // Auto-refresh 30s
    useEffect(() => {
        autoRefreshRef.current = setInterval(() => loadRequests(activeTab, page), 30000);
        return () => clearInterval(autoRefreshRef.current);
    }, [activeTab, page, loadRequests]);

    const handleTabChange = (key) => { setActiveTab(key); setPage(1); };

    /* Confirm flow */
    const handleClickDone = (req) => setConfirmTarget(req);

    const handleConfirmDone = async () => {
        if (!confirmTarget) return;
        setConfirming(true);
        try {
            await updateManagerServiceRequestStatus(confirmTarget.requestID, 'Đã xử lý');
            setRequests((prev) =>
                prev.map((r) =>
                    r.requestID === confirmTarget.requestID ? { ...r, status: 'Đã xử lý' } : r
                )
            );
            setStats((s) => ({ ...s, pending: Math.max(0, s.pending - 1) }));
        } catch (err) {
            console.error('handleConfirmDone error:', err);
        } finally {
            setConfirming(false);
            setConfirmTarget(null);
        }
    };

    return (
        <BranchManagerLayout>
            {/* ── Confirm Dialog ── */}
            {confirmTarget && (
                <ConfirmDialog
                    request={confirmTarget}
                    loading={confirming}
                    onConfirm={handleConfirmDone}
                    onCancel={() => setConfirmTarget(null)}
                />
            )}

            {/* ══ HEADER ══ */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Yêu cầu hỗ trợ</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Theo dõi các yêu cầu gọi nhân viên từ khách hàng</p>
                </div>
                <button
                    onClick={() => loadRequests(activeTab, page)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    Làm mới
                </button>
            </div>

            {/* ══ STAT CARDS ══ */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <StatCard
                    label="Đang xử lý"
                    value={stats.pending}
                    sub={stats.pending > 0 ? '🔴 Cần gấp' : '✅ Tốt'}
                    valueColor={stats.pending > 5 ? 'text-red-600' : stats.pending > 0 ? 'text-orange-500' : 'text-gray-900'}
                />
                <StatCard
                    label="Tổng hôm nay"
                    value={stats.totalToday}
                    sub="yêu cầu"
                />
                <StatCard
                    label="Tổng hiển thị"
                    value={total}
                    sub="yêu cầu"
                />
            </div>

            {/* ══ FILTER TABS ══ */}
            <div className="flex items-center gap-2 mb-4">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === tab.key
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ══ TABLE ══ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Bàn</th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">Loại yêu cầu</th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[250px]">Nội dung yêu cầu (Ghi chú)</th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">Thời gian</th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Trạng thái</th>
                                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                        <p className="text-gray-400 text-sm">Đang tải...</p>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <CheckCircle2 size={40} className="text-gray-200 mx-auto mb-3" />
                                        <p className="text-gray-400 text-sm font-medium">Không có yêu cầu nào</p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => {
                                    const iconCfg = ICON_MAP[req.displayType?.icon] ?? ICON_MAP['bell'];
                                    const IconComp = iconCfg.Icon;
                                    const done = isDone(req.status);

                                    return (
                                        <tr
                                            key={req.requestID}
                                            className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${done ? 'opacity-55' : ''}`}
                                        >
                                            {/* Bàn */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                                                        <span className="text-xs font-bold text-slate-600">
                                                            {req.tableName?.replace(/[^0-9]/g, '') || req.tableID}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-800">{req.tableName}</p>
                                                </div>
                                            </td>

                                            {/* Loại yêu cầu */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 rounded-lg ${iconCfg.bg} flex items-center justify-center`}>
                                                        <IconComp size={14} className={iconCfg.color} />
                                                    </div>
                                                    <span className={`text-sm font-semibold ${iconCfg.color} whitespace-nowrap`}>
                                                        {req.displayType?.label ?? req.requestType}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Ghi chú */}
                                            <td className="px-6 py-4">
                                                {req.note ? (
                                                    <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-lg border border-amber-100 italic max-w-[300px] break-words">
                                                        "{req.note}"
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 text-xs italic">Không có ghi chú</span>
                                                )}
                                            </td>

                                            {/* Thời gian */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <Clock size={13} />
                                                    <span className="text-sm">{getRelativeTime(req.createdTime)}</span>
                                                </div>
                                            </td>

                                            {/* Trạng thái */}
                                            <td className="px-6 py-4">
                                                {done ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 size={11} />
                                                        ĐÃ XỬ LÝ
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-600 border border-orange-200">
                                                        <AlertCircle size={11} />
                                                        ĐANG XỬ LÝ
                                                    </span>
                                                )}
                                            </td>

                                            {/* Thao tác */}
                                            <td className="px-6 py-4 text-right">
                                                {done ? (
                                                    <span className="text-xs text-gray-300 font-medium">Hoàn tất</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleClickDone(req)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-sm hover:shadow"
                                                    >
                                                        <CheckCircle2 size={13} />
                                                        Đã xử lý
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && total > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/40">
                        <p className="text-sm text-gray-400">
                            Hiển thị <span className="font-semibold text-gray-600">{requests.length}</span> trong{' '}
                            <span className="font-semibold text-gray-600">{total}</span> yêu cầu
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={15} className="text-gray-500" />
                            </button>
                            <span className="text-sm font-medium text-gray-600 min-w-[70px] text-center">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={15} className="text-gray-500" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </BranchManagerLayout>
    );
}
