import { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import {
    getAllReports,
    getReportStats,
    getReportById,
    updateReportStatus,
    addReportResponse
} from '../api/adminApi';
import {
    Search, RefreshCw, ChevronRight, FileText,
    Clock, Loader2, CheckCircle2, XCircle, X, AlertTriangle
} from 'lucide-react';

/* ── helpers ── */
const fmtDate = (d) =>
    d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_CFG = {
    Open: { label: 'Mới gửi', cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/25' },
    InProgress: { label: 'Đang xử lý', cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/25' },
    Resolved: { label: 'Đã hoàn thành', cls: 'bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/25' },
    Closed: { label: 'Đã đóng', cls: 'bg-gray-500/15 text-gray-400 border border-gray-500/25' },
};

const PRIORITY_CFG = {
    Low: { label: 'Thấp', cls: 'bg-green-500/10 text-green-400' },
    Medium: { label: 'Trung bình', cls: 'bg-yellow-500/10 text-yellow-400' },
    High: { label: 'Cao', cls: 'bg-red-500/10 text-red-400' },
};

function StatusBadge({ status }) {
    const c = STATUS_CFG[status] || STATUS_CFG.Open;
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.cls}`}>{c.label}</span>;
}

function PriorityBadge({ priority }) {
    const c = PRIORITY_CFG[priority] || PRIORITY_CFG.Medium;
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${c.cls}`}>{c.label}</span>;
}

/* ── Detail Panel ── */
function DetailPanel({ report, onClose, onAction, actionLoading }) {
    const [resolution, setResolution] = useState('');
    const [confirmStep, setConfirmStep] = useState(false); // show textarea for Resolved

    const status = report?.Status;

    // Extract admin resolution text (latest admin message in JSON format, or raw)
    const getAdminText = () => {
        if (!report?.Resolution) return '';
        const lines = report.Resolution.split('\n').filter(Boolean);
        for (let i = lines.length - 1; i >= 0; i--) {
            try {
                const msg = JSON.parse(lines[i]);
                if (msg.role === 'admin') return msg.text;
            } catch { /* continue */ }
        }
        return report.Resolution; // fallback raw
    };

    return (
        <div className="flex flex-col h-full bg-[#0f1612] border border-slate-700/50 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-800 shrink-0">
                <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-mono">#{String(report.TicketID).padStart(4, '0')}</span>
                        <StatusBadge status={status} />
                        <PriorityBadge priority={report.Priority} />
                    </div>
                    <p className="text-white font-bold text-sm leading-snug">{report.Subject}</p>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-slate-400 text-xs">{report.UserName}</span>
                        {report.RestaurantName && <span className="text-slate-600 text-xs">• {report.RestaurantName}</span>}
                        <span className="text-slate-600 text-xs ml-auto">{fmtDate(report.CreatedAt)}</span>
                    </div>
                </div>
                <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition">
                    <X size={16} />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Description */}
                <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Nội dung báo cáo</p>
                    <div className="bg-slate-800/50 rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
                        {report.Description || <span className="text-slate-600 italic">Không có nội dung</span>}
                    </div>
                </div>

                {/* Previous resolution (Resolved) */}
                {(status === 'Resolved' || status === 'Closed') && (
                    <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Phản hồi đã gửi</p>
                        <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 size={14} className="text-[#00ff88]" />
                                <span className="text-xs font-semibold text-[#00ff88]">Đã hoàn thành</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">{getAdminText() || <span className="text-slate-600 italic">Không có ghi chú</span>}</p>
                        </div>
                    </div>
                )}

                {/* InProgress confirm step */}
                {status === 'InProgress' && !confirmStep && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Loader2 size={14} className="text-blue-400 animate-spin" />
                            <span className="text-xs font-semibold text-blue-400">Đang xử lý</span>
                        </div>
                        <p className="text-xs text-slate-500">Báo cáo đã được tiếp nhận. Nhấn "Xác nhận hoàn thành" khi xử lý xong.</p>
                    </div>
                )}

                {/* Resolve form */}
                {status === 'InProgress' && confirmStep && (
                    <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Ghi chú phản hồi cho chủ nhà hàng</p>
                        <textarea
                            value={resolution}
                            onChange={e => setResolution(e.target.value)}
                            placeholder="Nhập nội dung phản hồi và kết quả xử lý..."
                            rows={5}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff88]/40 resize-none"
                        />
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="px-5 py-4 border-t border-slate-800 shrink-0">
                {/* OPEN → button "Tiếp nhận" */}
                {status === 'Open' && (
                    <button
                        onClick={() => onAction('InProgress')}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm transition disabled:opacity-50"
                    >
                        <Clock size={15} />
                        {actionLoading ? 'Đang xử lý...' : 'Tiếp nhận & Bắt đầu xử lý'}
                    </button>
                )}

                {/* INPROGRESS → two buttons */}
                {status === 'InProgress' && !confirmStep && (
                    <button
                        onClick={() => setConfirmStep(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00ff88] hover:bg-[#00d975] text-black font-semibold text-sm transition"
                    >
                        <CheckCircle2 size={15} />
                        Xác nhận hoàn thành
                    </button>
                )}

                {status === 'InProgress' && confirmStep && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setConfirmStep(false); setResolution(''); }}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-sm font-semibold transition"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={() => onAction('Resolved', resolution)}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00ff88] hover:bg-[#00d975] text-black font-semibold text-sm transition disabled:opacity-50"
                        >
                            <CheckCircle2 size={15} />
                            {actionLoading ? 'Đang lưu...' : 'Xác nhận & Gửi phản hồi'}
                        </button>
                    </div>
                )}

                {/* Already resolved/closed */}
                {(status === 'Resolved' || status === 'Closed') && (
                    <div className={`text-center text-xs font-semibold py-2.5 rounded-xl ${status === 'Resolved'
                        ? 'bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88]'
                        : 'bg-slate-800 border border-slate-700 text-slate-500'}`}>
                        {status === 'Resolved' ? '✓ Báo cáo đã được xử lý và phản hồi' : 'Báo cáo đã đóng'}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Stat Card ── */
function StatCard({ label, count, color }) {
    const colors = {
        orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
        blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        green: 'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]',
        gray: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
    };
    return (
        <div className={`rounded-xl p-5 border ${colors[color]}`}>
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            <p className="text-white text-2xl font-bold">{count}</p>
        </div>
    );
}

/* ── Main ── */
export default function AdminReports() {
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterPriority, setFilterPriority] = useState('All');
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0, limit: 10 });
    const [selected, setSelected] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => { loadReports(); loadStats(); }, [filterStatus, filterPriority, search, pagination.currentPage]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadReports = async () => {
        try {
            setLoading(true);
            const params = { page: pagination.currentPage, limit: pagination.limit };
            if (filterStatus !== 'All') params.status = filterStatus;
            if (filterPriority !== 'All') params.priority = filterPriority;
            if (search.trim()) params.search = search.trim();
            const res = await getAllReports(params);
            setReports(res.data.reports || []);
            setPagination(p => ({ ...p, ...res.data.pagination }));
        } catch { showToast('Không thể tải dữ liệu', 'error'); }
        finally { setLoading(false); }
    };

    const loadStats = async () => {
        try { const r = await getReportStats(); setStats(r.data); } catch { /* silent */ }
    };

    const openReport = async (id) => {
        try {
            const res = await getReportById(id);
            setSelected(res.data);
        } catch { showToast('Không thể tải chi tiết', 'error'); }
    };

    /* Action handler: change status + optionally send resolution */
    const handleAction = async (newStatus, resolutionText = '') => {
        if (!selected) return;
        setActionLoading(true);
        try {
            if (newStatus === 'Resolved' && resolutionText.trim()) {
                // Send response then mark resolved
                await addReportResponse(selected.TicketID, { response: resolutionText });
                await updateReportStatus(selected.TicketID, { status: 'Resolved' });
            } else {
                await updateReportStatus(selected.TicketID, { status: newStatus });
            }
            showToast(newStatus === 'Resolved' ? 'Đã hoàn thành và gửi phản hồi!' : 'Đã tiếp nhận báo cáo');
            await openReport(selected.TicketID);
            loadReports(); loadStats();
        } catch (e) {
            showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminLayout>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold
                    ${toast.type === 'error'
                        ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                        : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'}`}>
                    {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Quản lý Báo cáo</h1>
                <p className="text-slate-500 text-sm mt-1">Tiếp nhận và xử lý báo cáo từ chủ nhà hàng</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <StatCard label="Mới gửi" count={stats.byStatus.Open || 0} color="orange" />
                    <StatCard label="Đang xử lý" count={stats.byStatus.InProgress || 0} color="blue" />
                    <StatCard label="Đã hoàn thành" count={stats.byStatus.Resolved || 0} color="green" />
                    <StatCard label="Tổng tất cả" count={stats.totalThisMonth || 0} color="gray" />
                </div>
            )}

            <div className="flex gap-5" style={{ height: 'calc(100vh - 290px)', minHeight: '480px' }}>
                {/* LEFT: List */}
                <div className={`flex flex-col ${selected ? 'w-[55%]' : 'w-full'} transition-all duration-300`}>
                    {/* Filters */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex-1 max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Tìm theo tiêu đề, tên..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
                                className="w-full pl-9 pr-4 py-2 bg-[#0f1612] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={e => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
                            className="bg-[#0f1612] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                            <option value="All">Tất cả trạng thái</option>
                            <option value="Open">Mới gửi</option>
                            <option value="InProgress">Đang xử lý</option>
                            <option value="Resolved">Đã hoàn thành</option>
                            <option value="Closed">Đã đóng</option>
                        </select>
                        <select
                            value={filterPriority}
                            onChange={e => { setFilterPriority(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
                            className="bg-[#0f1612] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                            <option value="All">Tất cả ưu tiên</option>
                            <option value="High">Cao</option>
                            <option value="Medium">Trung bình</option>
                            <option value="Low">Thấp</option>
                        </select>
                        <button onClick={loadReports} className="p-2 bg-[#0f1612] border border-slate-700 rounded-xl text-slate-400 hover:text-white transition">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto bg-[#0f1612] rounded-xl border border-slate-700/50 overflow-hidden">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-[#0f1612] border-b border-slate-700/50">
                                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                                    <th className="px-4 py-3 font-semibold">REF</th>
                                    <th className="px-4 py-3 font-semibold">Ưu tiên</th>
                                    <th className="px-4 py-3 font-semibold">Nhà hàng</th>
                                    <th className="px-4 py-3 font-semibold">Tiêu đề</th>
                                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-800 rounded w-3/4" /></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : reports.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-16 text-slate-500">
                                        <FileText size={36} className="mx-auto mb-3 opacity-30" />Không có báo cáo nào
                                    </td></tr>
                                ) : reports.map(r => (
                                    <tr key={r.TicketID}
                                        onClick={() => openReport(r.TicketID)}
                                        className={`cursor-pointer hover:bg-slate-800/40 transition group
                                            ${selected?.TicketID === r.TicketID ? 'border-l-4 border-l-emerald-500 bg-emerald-500/5' : 'border-l-4 border-l-transparent'}`}>
                                        <td className="px-4 py-3.5">
                                            <span className="text-emerald-500 font-mono text-xs">#{String(r.TicketID).padStart(4, '0')}</span>
                                        </td>
                                        <td className="px-4 py-3.5"><PriorityBadge priority={r.Priority} /></td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-white text-sm font-medium">{r.UserName}</p>
                                            <p className="text-slate-500 text-xs">{r.RestaurantName || '—'}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-white text-sm font-medium line-clamp-1">{r.Subject}</p>
                                            <p className="text-slate-500 text-xs line-clamp-1">{r.Description}</p>
                                        </td>
                                        <td className="px-4 py-3.5"><StatusBadge status={r.Status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-3 pt-3">
                            <span className="text-slate-500 text-xs">Tổng {pagination.totalRecords} báo cáo</span>
                            <div className="flex gap-2">
                                <button onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))}
                                    disabled={pagination.currentPage <= 1}
                                    className="px-3 py-1.5 bg-[#0f1612] border border-slate-700 rounded-lg text-xs text-slate-400 disabled:opacity-40 hover:text-white transition">Trước</button>
                                <span className="px-3 py-1.5 text-xs text-slate-400">{pagination.currentPage}/{pagination.totalPages}</span>
                                <button onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}
                                    disabled={pagination.currentPage >= pagination.totalPages}
                                    className="px-3 py-1.5 bg-[#0f1612] border border-slate-700 rounded-lg text-xs text-slate-400 disabled:opacity-40 hover:text-white transition">Sau</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Detail Panel */}
                {selected && (
                    <div className="flex-1 min-w-0">
                        <DetailPanel
                            report={selected}
                            onClose={() => setSelected(null)}
                            onAction={handleAction}
                            actionLoading={actionLoading}
                        />
                    </div>
                )}

                {/* Empty right placeholder */}
                {!selected && (
                    <div className="w-72 shrink-0 hidden lg:flex flex-col items-center justify-center bg-[#0f1612] border border-slate-700/50 border-dashed rounded-xl text-slate-600">
                        <FileText size={36} className="mb-3 opacity-40" />
                        <p className="text-sm">Chọn một báo cáo để xử lý</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
