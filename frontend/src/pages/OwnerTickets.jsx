import { useState, useEffect, useRef, useCallback } from 'react';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';
import {
    getOwnerTickets,
    getOwnerTicketById,
    createOwnerTicket,
    replyOwnerTicket,
} from '../api/ownerApi';
import {
    MessageSquare, Plus, Send, X, Clock, CheckCircle,
    AlertCircle, ChevronRight, RefreshCw, FileText,
} from 'lucide-react';

/* ── helpers ── */
const fmtDate = (d) =>
    d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_CFG = {
    Open: { label: 'Mới mở', cls: 'bg-orange-100 text-orange-600 border border-orange-200' },
    InProgress: { label: 'Đang xử lý', cls: 'bg-blue-100 text-blue-600 border border-blue-200' },
    Resolved: { label: 'Đã giải quyết', cls: 'bg-emerald-100 text-emerald-600 border border-emerald-200' },
    Closed: { label: 'Đã đóng', cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
};

const PRIORITY_CFG = {
    Low: { label: 'Thấp', cls: 'bg-green-100 text-green-600' },
    Medium: { label: 'Trung bình', cls: 'bg-yellow-100 text-yellow-700' },
    High: { label: 'Cao', cls: 'bg-red-100 text-red-600' },
};

function StatusBadge({ status }) {
    const c = STATUS_CFG[status] || STATUS_CFG.Open;
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.cls}`}>{c.label}</span>;
}

function PriorityBadge({ priority }) {
    const c = PRIORITY_CFG[priority] || PRIORITY_CFG.Medium;
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${c.cls}`}>{c.label}</span>;
}

/* ── New Ticket Modal ── */
function NewTicketModal({ onClose, onSubmit, loading }) {
    const [form, setForm] = useState({ subject: '', description: '', priority: 'Medium' });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Gửi báo cáo mới</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiêu đề <span className="text-red-500">*</span></label>
                        <input
                            value={form.subject}
                            onChange={e => set('subject', e.target.value)}
                            placeholder="Mô tả ngắn về vấn đề..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nội dung chi tiết</label>
                        <textarea
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                            rows={5}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mức độ ưu tiên</label>
                        <div className="flex gap-2">
                            {['Low', 'Medium', 'High'].map(p => (
                                <button key={p}
                                    onClick={() => set('priority', p)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${form.priority === p
                                        ? p === 'High' ? 'bg-red-500 text-white border-red-500'
                                            : p === 'Medium' ? 'bg-yellow-400 text-white border-yellow-400'
                                                : 'bg-green-500 text-white border-green-500'
                                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                                        }`}>
                                    {PRIORITY_CFG[p].label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition">Hủy</button>
                    <button
                        onClick={() => onSubmit(form)}
                        disabled={!form.subject.trim() || loading}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Chat Panel ── */
function ChatPanel({ ticket, onClose, onReply, replyLoading }) {
    const [replyText, setReplyText] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket?.messages]);

    const handleSend = () => {
        if (!replyText.trim()) return;
        onReply(replyText);
        setReplyText('');
    };

    if (!ticket) return null;

    const isClosed = ticket.status === 'Closed' || ticket.status === 'Resolved';

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-gray-400 font-mono">#{String(ticket.ticketID).padStart(4, '0')}</span>
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                    </div>
                    <p className="text-gray-900 font-bold text-sm leading-snug truncate">{ticket.subject}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{fmtDate(ticket.createdAt)}</p>
                </div>
                <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                    <X size={16} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {ticket.messages?.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Chưa có tin nhắn</div>
                ) : (
                    ticket.messages?.map((msg, i) => {
                        const isOwner = msg.role === 'owner';
                        return (
                            <div key={i} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] ${isOwner ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isOwner
                                        ? 'bg-blue-600 text-white rounded-br-md'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[10px] text-gray-400 px-1">
                                        {isOwner ? 'Bạn' : '🛡️ Admin'} · {fmtDate(msg.time)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            {!isClosed ? (
                <div className="px-4 py-3 border-t border-gray-100 shrink-0">
                    <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition">
                        <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Nhập tin nhắn... (Enter để gửi)"
                            rows={2}
                            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!replyText.trim() || replyLoading}
                            className="shrink-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition disabled:opacity-40"
                        >
                            <Send size={14} className="text-white" />
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 px-1">Shift+Enter để xuống dòng</p>
                </div>
            ) : (
                <div className="px-4 py-3 border-t border-gray-100 shrink-0">
                    <div className={`text-center text-xs font-semibold py-2 rounded-xl ${ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                        {ticket.status === 'Resolved' ? '✓ Vấn đề đã được giải quyết' : 'Ticket đã đóng'}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Main Page ── */
export default function OwnerTickets() {
    const [tickets, setTickets] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState('All');
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [replyLoading, setReplyLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchList = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const params = { page: p, limit: 8 };
            if (filterStatus !== 'All') params.status = filterStatus;
            const res = await getOwnerTickets(params);
            setTickets(res.data.tickets || []);
            setTotal(res.data.total || 0);
            setPage(p);
        } catch {
            showToast('Không thể tải danh sách', 'error');
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => { fetchList(1); }, [filterStatus]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const openTicket = async (ticketID) => {
        setLoadingDetail(true);
        try {
            const res = await getOwnerTicketById(ticketID);
            setSelectedTicket(res.data);
        } catch {
            showToast('Không thể tải chi tiết', 'error');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleCreate = async (form) => {
        setCreateLoading(true);
        try {
            await createOwnerTicket(form);
            showToast('Đã gửi báo cáo thành công!');
            setShowNew(false);
            fetchList(1);
        } catch (e) {
            showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleReply = async (text) => {
        if (!selectedTicket) return;
        setReplyLoading(true);
        try {
            await replyOwnerTicket(selectedTicket.ticketID, { text });
            const res = await getOwnerTicketById(selectedTicket.ticketID);
            setSelectedTicket(res.data);
            fetchList(page);
        } catch (e) {
            showToast(e.response?.data?.message || 'Không thể gửi phản hồi', 'error');
        } finally {
            setReplyLoading(false);
        }
    };

    const LIMIT = 8;
    const totalPages = Math.ceil(total / LIMIT);

    return (
        <RestaurantOwnerLayout>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold
                    ${toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                    {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* New Ticket Modal */}
            {showNew && <NewTicketModal onClose={() => setShowNew(false)} onSubmit={handleCreate} loading={createLoading} />}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Hỗ trợ</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Gửi báo cáo và trao đổi trực tiếp với Admin hệ thống</p>
                </div>
                <button
                    onClick={() => setShowNew(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-500/20"
                >
                    <Plus size={16} />
                    Gửi báo cáo mới
                </button>
            </div>

            <div className="flex gap-5 h-[calc(100vh-200px)] min-h-[500px]">
                {/* ── LEFT: Ticket List ── */}
                <div className={`flex flex-col ${selectedTicket ? 'w-[42%]' : 'w-full'} transition-all duration-300`}>
                    {/* Filters */}
                    <div className="flex items-center gap-2 mb-4">
                        {['All', 'Open', 'InProgress', 'Resolved', 'Closed'].map(s => (
                            <button key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterStatus === s
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}>
                                {s === 'All' ? 'Tất cả' : STATUS_CFG[s]?.label}
                            </button>
                        ))}
                        <button onClick={() => fetchList(page)} className="ml-auto p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-gray-600 transition">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                </div>
                            ))
                        ) : tickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                <FileText size={40} className="mb-3 opacity-30" />
                                <p className="text-sm">Chưa có báo cáo nào</p>
                                <button onClick={() => setShowNew(true)} className="mt-3 text-sm text-blue-600 font-semibold hover:underline">
                                    Gửi báo cáo đầu tiên →
                                </button>
                            </div>
                        ) : (
                            tickets.map(t => (
                                <div key={t.ticketID}
                                    onClick={() => openTicket(t.ticketID)}
                                    className={`bg-white rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md ${selectedTicket?.ticketID === t.ticketID
                                        ? 'border-blue-400 ring-2 ring-blue-500/20'
                                        : 'border-gray-100 hover:border-gray-200'}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-[10px] text-gray-400 font-mono">#{String(t.ticketID).padStart(4, '0')}</span>
                                                <StatusBadge status={t.status} />
                                                <PriorityBadge priority={t.priority} />
                                            </div>
                                            <p className="text-sm font-semibold text-gray-800 truncate">{t.subject}</p>
                                            {t.lastReply && (
                                                <p className="text-xs text-gray-400 mt-1 truncate">
                                                    {t.lastReply.role === 'admin' ? '🛡️ Admin: ' : 'Bạn: '}{t.lastReply.text}
                                                </p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-[10px] text-gray-400">{fmtDate(t.createdAt)}</p>
                                            <div className="flex items-center gap-1 justify-end mt-1.5">
                                                <MessageSquare size={11} className="text-gray-300" />
                                                <span className="text-[10px] text-gray-400">{t.messageCount}</span>
                                                <ChevronRight size={13} className="text-gray-300 ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">Tổng {total} báo cáo</span>
                            <div className="flex gap-2">
                                <button onClick={() => fetchList(page - 1)} disabled={page <= 1}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 disabled:opacity-40 hover:border-gray-300 transition">
                                    Trước
                                </button>
                                <span className="px-3 py-1.5 text-xs text-gray-500">
                                    {page}/{totalPages}
                                </span>
                                <button onClick={() => fetchList(page + 1)} disabled={page >= totalPages}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 disabled:opacity-40 hover:border-gray-300 transition">
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Chat Panel ── */}
                {selectedTicket && (
                    <div className="flex-1 min-w-0">
                        {loadingDetail ? (
                            <div className="flex items-center justify-center h-full bg-white rounded-2xl border border-gray-100">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <ChatPanel
                                ticket={selectedTicket}
                                onClose={() => setSelectedTicket(null)}
                                onReply={handleReply}
                                replyLoading={replyLoading}
                            />
                        )}
                    </div>
                )}
            </div>
        </RestaurantOwnerLayout>
    );
}
