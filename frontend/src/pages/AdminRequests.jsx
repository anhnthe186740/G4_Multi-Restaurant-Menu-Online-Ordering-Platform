import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import {
    getRegistrationRequests,
    approveRegistrationRequest,
    rejectRegistrationRequest,
} from "../api/adminApi";
import {
    CheckCircle,
    XCircle,
    Clock,
    Search,
    ChevronLeft,
    ChevronRight,
    Building2,
    User,
    Phone,
    Mail,
    FileText,
    TrendingUp,
    AlertCircle,
    RefreshCw,
} from "lucide-react";

// ─── STATUS BADGE ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        Pending: { label: "Chờ duyệt", cls: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
        Approved: { label: "Đã duyệt", cls: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
        Rejected: { label: "Từ chối", cls: "bg-red-500/20 text-red-400 border border-red-500/30" },
    };
    const cfg = map[status] || map.Pending;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

// ─── STAT CARD ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
    const colors = {
        amber: { bg: "bg-amber-500/10", icon: "text-amber-400", border: "border-amber-500/20" },
        emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-400", border: "border-emerald-500/20" },
        blue: { bg: "bg-blue-500/10", icon: "text-blue-400", border: "border-blue-500/20" },
    };
    const c = colors[color] || colors.amber;
    return (
        <div className={`bg-[#0f1612] rounded-xl border ${c.border} p-5 flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center ${c.icon}`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-400 text-sm">{label}</p>
                <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
                {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function AdminRequests() {
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ pendingCount: 0, approvedToday: 0, approvalRate: 0 });
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [selected, setSelected] = useState(null);
    const [rejectNote, setRejectNote] = useState("");
    const [toast, setToast] = useState(null);

    // ── fetch ──────────────────────────────────────────────────────────────────
    const fetchData = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 8 };
            if (filterStatus !== "All") params.status = filterStatus;
            if (search.trim()) params.search = search.trim();

            const res = await getRegistrationRequests(params);
            setRequests(res.data.requests || []);
            setStats(res.data.stats || {});
            setPagination({ page, ...res.data.pagination });
            // If the selected item still exists in next page data, re-sync it
            if (selected) {
                const updated = res.data.requests.find(r => r.requestID === selected.requestID);
                if (updated) setSelected(updated);
            }
        } catch (err) {
            console.error(err);
            showToast("Không thể tải dữ liệu", "error");
        } finally {
            setLoading(false);
        }
    }, [filterStatus, search, selected]);

    useEffect(() => { fetchData(1); }, [filterStatus]);

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => fetchData(1), 400);
        return () => clearTimeout(t);
    }, [search]);

    // ── toast ──────────────────────────────────────────────────────────────────
    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── approve ────────────────────────────────────────────────────────────────
    const handleApprove = async () => {
        if (!selected || actionLoading) return;
        setActionLoading(true);
        try {
            await approveRegistrationRequest(selected.requestID);
            showToast("Đã phê duyệt yêu cầu thành công!");
            setSelected(null);
            fetchData(pagination.page);
        } catch (err) {
            showToast(err.response?.data?.message || "Có lỗi xảy ra", "error");
        } finally {
            setActionLoading(false);
        }
    };

    // ── reject ─────────────────────────────────────────────────────────────────
    const handleReject = async () => {
        if (!selected || actionLoading) return;
        setActionLoading(true);
        try {
            await rejectRegistrationRequest(selected.requestID, rejectNote);
            showToast("Đã từ chối yêu cầu");
            setRejectNote("");
            setSelected(null);
            fetchData(pagination.page);
        } catch (err) {
            showToast(err.response?.data?.message || "Có lỗi xảy ra", "error");
        } finally {
            setActionLoading(false);
        }
    };

    // ── format date ────────────────────────────────────────────────────────────
    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <AdminLayout>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all
          ${toast.type === "error"
                        ? "bg-red-500/20 border border-red-500/40 text-red-300"
                        : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                    }`}>
                    {toast.type === "error"
                        ? <AlertCircle size={18} />
                        : <CheckCircle size={18} />}
                    {toast.msg}
                </div>
            )}

            <div className="flex gap-6 h-full">
                {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-5">

                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-white">Yêu cầu Chờ duyệt</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Phê duyệt Đăng ký Nhà hàng — Admin Panel
                        </p>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard
                            icon={<Clock size={22} />}
                            label="Tổng yêu cầu chờ"
                            value={stats.pendingCount ?? 0}
                            color="amber"
                        />
                        <StatCard
                            icon={<CheckCircle size={22} />}
                            label="Đã duyệt hôm nay"
                            value={stats.approvedToday ?? 0}
                            color="emerald"
                        />
                        <StatCard
                            icon={<TrendingUp size={22} />}
                            label="Tỉ lệ duyệt"
                            value={`${stats.approvalRate ?? 0}%`}
                            color="blue"
                        />
                    </div>

                    {/* Filter bar */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-xs">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm nhà hàng, chủ sở hữu..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-[#0f1612] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>

                        {["All", "Pending", "Approved", "Rejected"].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${filterStatus === s
                                        ? "bg-emerald-500 text-black"
                                        : "bg-[#0f1612] border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                                    }`}
                            >
                                {s === "All" ? "Tất cả" : s === "Pending" ? "Chờ duyệt" : s === "Approved" ? "Đã duyệt" : "Từ chối"}
                            </button>
                        ))}

                        <button
                            onClick={() => fetchData(pagination.page)}
                            className="ml-auto p-2.5 bg-[#0f1612] border border-slate-700 rounded-xl text-slate-400 hover:text-white transition"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-[#0f1612] rounded-xl border border-slate-700/50 overflow-hidden">
                        <table className="w-full">
                            <thead className="border-b border-slate-700/50">
                                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                                    <th className="px-5 py-3.5 font-semibold">Tên nhà hàng</th>
                                    <th className="px-5 py-3.5 font-semibold">Chủ sở hữu</th>
                                    <th className="px-5 py-3.5 font-semibold">Ngày gửi</th>
                                    <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array.from({ length: 4 }).map((_, j) => (
                                                <td key={j} className="px-5 py-4">
                                                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-16 text-slate-500">
                                            <FileText size={40} className="mx-auto mb-3 opacity-30" />
                                            Không có yêu cầu nào
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map(req => (
                                        <tr
                                            key={req.requestID}
                                            onClick={() => { setSelected(req); setRejectNote(""); }}
                                            className={`cursor-pointer hover:bg-slate-800/40 transition-all group
                        ${selected?.requestID === req.requestID
                                                    ? "bg-emerald-500/5 border-l-4 border-l-emerald-500"
                                                    : "border-l-4 border-l-transparent"
                                                }`}
                                        >
                                            <td className="px-5 py-4">
                                                <span className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                                                    {req.restaurantName || "—"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-300 text-sm">{req.ownerName || "—"}</td>
                                            <td className="px-5 py-4 text-slate-400 text-sm">{fmtDate(req.submissionDate)}</td>
                                            <td className="px-5 py-4"><StatusBadge status={req.approvalStatus} /></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800/60">
                                <span className="text-slate-500 text-sm">
                                    Hiển thị {(pagination.page - 1) * 8 + 1}–{Math.min(pagination.page * 8, pagination.total)} trên {pagination.total} yêu cầu
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => fetchData(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                                        const p = i + 1;
                                        return (
                                            <button key={p} onClick={() => fetchData(p)}
                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition
                          ${p === pagination.page
                                                        ? "bg-emerald-500 text-black"
                                                        : "bg-slate-800 text-slate-400 hover:text-white"
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => fetchData(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
                <div className="w-80 shrink-0">
                    {selected ? (
                        <div className="bg-[#0f1612] border border-slate-700/50 rounded-xl overflow-hidden sticky top-6">
                            {/* Header */}
                            <div className="p-5 border-b border-slate-800/60">
                                <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Chi tiết yêu cầu</p>
                                <p className="text-slate-600 text-xs mt-0.5">ID yêu cầu: #{selected.requestID}</p>
                            </div>

                            <div className="p-5 space-y-5 max-h-[calc(100vh-220px)] overflow-y-auto">
                                {/* Thông tin nhà hàng */}
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-3">Thông tin nhà hàng</p>
                                    <div className="bg-slate-800/40 rounded-xl p-4 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                <Building2 size={16} />
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold text-sm">{selected.restaurantName || "Chưa có tên"}</p>
                                                {selected.contactInfo && (
                                                    <p className="text-slate-500 text-xs mt-0.5">{selected.contactInfo}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Thông tin chủ sở hữu */}
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-3">Thông tin chủ sở hữu</p>
                                    <div className="bg-slate-800/40 rounded-xl p-4 space-y-2.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-bold text-sm">
                                                {selected.ownerName?.[0]?.toUpperCase() || "?"}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">{selected.ownerName || "—"}</p>
                                                <p className="text-slate-500 text-xs">Chủ sở hữu</p>
                                            </div>
                                        </div>
                                        {selected.contactInfo && (
                                            <>
                                                {selected.contactInfo.match(/[\w.-]+@[\w.-]+\.\w+/) && (
                                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                                        <Mail size={13} className="text-slate-500" />
                                                        {selected.contactInfo.match(/[\w.-]+@[\w.-]+\.\w+/)[0]}
                                                    </div>
                                                )}
                                                {selected.contactInfo.match(/0\d{9}/) && (
                                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                                        <Phone size={13} className="text-slate-500" />
                                                        {selected.contactInfo.match(/0\d{9}/)[0]}
                                                    </div>
                                                )}
                                                {!selected.contactInfo.match(/[\w.-]+@[\w.-]+\.\w+/) &&
                                                    !selected.contactInfo.match(/0\d{9}/) && (
                                                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                                                            <User size={13} className="text-slate-500" />
                                                            {selected.contactInfo}
                                                        </div>
                                                    )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Ngày gửi & admin note nếu đã xử lý */}
                                <div className="text-xs text-slate-500 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Ngày gửi:</span>
                                        <span className="text-slate-300">{fmtDate(selected.submissionDate)}</span>
                                    </div>
                                    {selected.approvedDate && (
                                        <div className="flex justify-between">
                                            <span>Ngày xử lý:</span>
                                            <span className="text-slate-300">{fmtDate(selected.approvedDate)}</span>
                                        </div>
                                    )}
                                    {selected.approverName && (
                                        <div className="flex justify-between">
                                            <span>Người xử lý:</span>
                                            <span className="text-slate-300">{selected.approverName}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Admin note (nếu đã từ chối) */}
                                {selected.adminNote && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                        <p className="text-red-400 text-xs font-semibold mb-1">Lý do từ chối:</p>
                                        <p className="text-slate-300 text-xs">{selected.adminNote}</p>
                                    </div>
                                )}

                                {/* Action area — chỉ hiện khi bản ghi đang Pending */}
                                {selected.approvalStatus === "Pending" && (
                                    <div className="space-y-3">
                                        {/* Ghi chú từ chối */}
                                        <div>
                                            <label className="text-slate-500 text-xs uppercase tracking-wider font-semibold block mb-2">
                                                Ghi chú từ chối (nếu có)
                                            </label>
                                            <textarea
                                                value={rejectNote}
                                                onChange={e => setRejectNote(e.target.value)}
                                                placeholder="Nhập lý do từ chối yêu cầu..."
                                                rows={4}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 resize-none"
                                            />
                                        </div>

                                        {/* Buttons */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleReject}
                                                disabled={actionLoading}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-semibold text-sm transition disabled:opacity-50"
                                            >
                                                <XCircle size={16} />
                                                Từ chối
                                            </button>
                                            <button
                                                onClick={handleApprove}
                                                disabled={actionLoading}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition disabled:opacity-50"
                                            >
                                                <CheckCircle size={16} />
                                                Phê duyệt
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Nếu đã xử lý */}
                                {selected.approvalStatus !== "Pending" && (
                                    <div className={`rounded-xl p-3 text-center text-sm font-semibold
                    ${selected.approvalStatus === "Approved"
                                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                            : "bg-red-500/10 border border-red-500/20 text-red-400"
                                        }`}>
                                        {selected.approvalStatus === "Approved" ? "✓ Yêu cầu đã được phê duyệt" : "✗ Yêu cầu đã bị từ chối"}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Empty state */
                        <div className="bg-[#0f1612] border border-slate-700/50 border-dashed rounded-xl h-64 flex flex-col items-center justify-center text-slate-600">
                            <FileText size={36} className="mb-3 opacity-40" />
                            <p className="text-sm">Chọn một yêu cầu để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
