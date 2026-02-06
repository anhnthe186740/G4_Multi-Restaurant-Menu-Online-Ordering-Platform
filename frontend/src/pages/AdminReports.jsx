import { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import {
    getAllReports,
    getReportStats,
    getReportById,
    updateReportStatus,
    addReportResponse
} from '../api/adminApi';

export default function AdminReports() {
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'All',
        priority: 'All',
        search: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 10
    });

    // Modal states
    const [selectedReport, setSelectedReport] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [responseText, setResponseText] = useState('');

    useEffect(() => {
        loadReports();
        loadStats();
    }, [filters, pagination.currentPage]);

    const loadReports = async () => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                page: pagination.currentPage,
                limit: pagination.limit
            };

            // Remove 'All' filters
            if (params.status === 'All') delete params.status;
            if (params.priority === 'All') delete params.priority;
            if (!params.search) delete params.search;

            const response = await getAllReports(params);
            setReports(response.data.reports);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await getReportStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleSearch = (e) => {
        setFilters({ ...filters, search: e.target.value });
        setPagination({ ...pagination, currentPage: 1 });
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
        setPagination({ ...pagination, currentPage: 1 });
    };

    const handleViewDetails = async (ticketId) => {
        try {
            const response = await getReportById(ticketId);
            setSelectedReport(response.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error fetching report details:', error);
        }
    };

    const handleStatusUpdate = async (ticketId, newStatus) => {
        try {
            await updateReportStatus(ticketId, { status: newStatus });
            loadReports(); // Refresh list
            if (showDetailModal && selectedReport?.TicketID === ticketId) {
                handleViewDetails(ticketId); // Refresh modal
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleAddResponse = async () => {
        if (!responseText.trim()) return;

        try {
            await addReportResponse(selectedReport.TicketID, { response: responseText });
            setResponseText('');
            setShowResponseModal(false);
            loadReports();
            if (showDetailModal) {
                handleViewDetails(selectedReport.TicketID);
            }
        } catch (error) {
            console.error('Error adding response:', error);
        }
    };

    const getStatusBadge = (status) => {
        const configs = {
            Open: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            InProgress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            Resolved: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20',
            Closed: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        };
        return configs[status] || configs.Open;
    };

    const getPriorityBadge = (priority) => {
        const configs = {
            Low: 'bg-green-500/10 text-green-400',
            Medium: 'bg-yellow-500/10 text-yellow-400',
            High: 'bg-red-500/10 text-red-400'
        };
        return configs[priority] || configs.Medium;
    };

    const getStatusLabel = (status) => {
        const labels = {
            Open: 'Mới mở',
            InProgress: 'Xử lý',
            Resolved: 'Hoàn thành',
            Closed: 'Đóng'
        };
        return labels[status] || status;
    };

    if (loading && reports.length === 0) {
        return (
            <AdminLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ff88]"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Quản lý Report Hệ thống</h1>
                <p className="text-gray-400 text-sm">Theo dõi và xử lý các yêu cầu hỗ trợ từ chủ nhà hàng</p>
            </div>

            {/* Filters & Search */}
            <div className="bg-[#142920] rounded-xl p-4 mb-6 border border-[#1f3d2f]">
                <div className="grid grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="col-span-2">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tiêu đề, nội dung..."
                            value={filters.search}
                            onChange={handleSearch}
                            className="w-full bg-[#0f1612] border border-[#1a2b22] rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/30"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="bg-[#0f1612] border border-[#1a2b22] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/30"
                    >
                        <option value="All">Tất cả trạng thái</option>
                        <option value="Open">Mới mở</option>
                        <option value="InProgress">Đang xử lý</option>
                        <option value="Resolved">Hoàn thành</option>
                        <option value="Closed">Đã đóng</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        className="bg-[#0f1612] border border-[#1a2b22] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/30"
                    >
                        <option value="All">Tất cả mức độ</option>
                        <option value="Low">Thấp</option>
                        <option value="Medium">Trung bình</option>
                        <option value="High">Cao</option>
                    </select>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-5 gap-4 mb-6">
                    <StatCard
                        title="Tổng tất cả report"
                        count={stats.totalThisMonth}
                        color="blue"
                    />
                    <StatCard
                        title="Mới mở"
                        count={stats.byStatus.Open}
                        color="orange"
                    />
                    <StatCard
                        title="Đang xử lý"
                        count={stats.byStatus.InProgress}
                        color="blue"
                    />
                    <StatCard
                        title="Hoàn thành"
                        count={stats.byStatus.Resolved}
                        color="green"
                    />
                    <StatCard
                        title="Đã đóng"
                        count={stats.byStatus.Closed || 0}
                        color="gray"
                    />
                </div>
            )}

            {/* Reports Table */}
            <div className="bg-[#0f1612] rounded-xl border border-[#1a2b22] overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#142920] border-b border-[#1a2b22]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">REF</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Ưu tiên</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Người gửi</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Nội dung</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a2b22]">
                        {reports.map((report) => (
                            <tr key={report.TicketID} className="hover:bg-[#1a2b22]/30 transition">
                                <td className="px-6 py-4">
                                    <span className="text-[#00ff88] font-mono text-sm">
                                        #{String(report.TicketID).padStart(4, '0')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityBadge(report.Priority)}`}>
                                        {report.Priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="text-white text-sm font-medium">{report.UserName}</p>
                                        <p className="text-gray-500 text-xs">{report.RestaurantName || 'N/A'}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-white text-sm font-medium line-clamp-1">{report.Subject}</p>
                                    <p className="text-gray-500 text-xs line-clamp-1">{report.Description}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap ${getStatusBadge(report.Status)}`}>
                                        {getStatusLabel(report.Status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleViewDetails(report.TicketID)}
                                            className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] rounded-lg text-xs font-semibold hover:bg-[#00ff88]/20 transition"
                                        >
                                            Xem
                                        </button>
                                        {report.Status !== 'Resolved' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedReport(report);
                                                    setShowResponseModal(true);
                                                }}
                                                className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-500/20 transition"
                                            >
                                                Phản hồi
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#1a2b22]">
                    <p className="text-gray-500 text-sm">
                        Hiển thị {((pagination.currentPage - 1) * pagination.limit) + 1} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} trong tổng số {pagination.totalRecords}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                            disabled={pagination.currentPage === 1}
                            className="px-4 py-2 bg-[#142920] text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a2b22] transition"
                        >
                            Trước
                        </button>
                        <span className="px-4 py-2 text-white text-sm">
                            Trang {pagination.currentPage} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                            disabled={pagination.currentPage >= pagination.totalPages}
                            className="px-4 py-2 bg-[#142920] text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a2b22] transition"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedReport && (
                <Modal onClose={() => setShowDetailModal(false)} title={`Report #${String(selectedReport.TicketID).padStart(4, '0')}`}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 text-sm">Tiêu đề</label>
                            <p className="text-white font-medium">{selectedReport.Subject}</p>
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm">Mô tả</label>
                            <p className="text-white">{selectedReport.Description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-400 text-sm">Người gửi</label>
                                <p className="text-white">{selectedReport.UserName}</p>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm">Nhà hàng</label>
                                <p className="text-white">{selectedReport.RestaurantName || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-400 text-sm">Ưu tiên</label>
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getPriorityBadge(selectedReport.Priority)}`}>
                                    {selectedReport.Priority}
                                </span>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm block mb-1">Trạng thái</label>
                                <select
                                    value={selectedReport.Status}
                                    onChange={(e) => handleStatusUpdate(selectedReport.TicketID, e.target.value)}
                                    className="bg-[#0f1612] border border-[#1a2b22] rounded-lg px-3 py-1 text-sm text-white"
                                >
                                    <option value="Open">Mới mở</option>
                                    <option value="InProgress">Đang xử lý</option>
                                    <option value="Resolved">Hoàn thành</option>
                                    <option value="Closed">Đã đóng</option>
                                </select>
                            </div>
                        </div>
                        {selectedReport.Resolution && (
                            <div>
                                <label className="text-gray-400 text-sm">Phản hồi Admin</label>
                                <div className="bg-[#0f1612] rounded-lg p-4 mt-2">
                                    <pre className="text-white text-sm whitespace-pre-wrap font-sans">{selectedReport.Resolution}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Response Modal */}
            {showResponseModal && selectedReport && (
                <Modal onClose={() => setShowResponseModal(false)} title="Thêm phản hồi">
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 text-sm block mb-2">Report #{String(selectedReport.TicketID).padStart(4, '0')}</label>
                            <p className="text-white font-medium mb-4">{selectedReport.Subject}</p>
                        </div>
                        <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Nhập phản hồi của bạn..."
                            rows={6}
                            className="w-full bg-[#0f1612] border border-[#1a2b22] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/30 resize-none"
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowResponseModal(false)}
                                className="px-4 py-2 bg-gray-500/10 text-gray-400 rounded-lg text-sm hover:bg-gray-500/20 transition"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddResponse}
                                disabled={!responseText.trim()}
                                className="px-4 py-2 bg-[#00ff88] text-black font-semibold rounded-lg text-sm hover:bg-[#00d975] transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Gửi phản hồi
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Workflow Guidelines */}
            <div className="mt-6 bg-[#0f1612] rounded-xl border border-[#1a2b22] p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <span>ℹ️</span>
                    <span>Quy trình xử lý Report</span>
                </h3>
                <ol className="space-y-2 text-gray-400 text-sm">
                    <li>1. Kiểm tra nội dung và mức độ ưu tiên của report</li>
                    <li>2. Cập nhật trạng thái sang "Đang xử lý" khi bắt đầu xem xét</li>
                    <li>3. Thêm phản hồi cho chủ nhà hàng về tiến trình xử lý</li>
                    <li>4. Sau khi giải quyết xong, cập nhật trạng thái "Đã giải quyết"</li>
                </ol>
            </div>
        </AdminLayout>
    );
}

// Helper Components
function StatCard({ title, count, color }) {
    const colorConfigs = {
        blue: 'bg-blue-500/10 border-blue-500/20',
        orange: 'bg-orange-500/10 border-orange-500/20',
        green: 'bg-[#00ff88]/10 border-[#00ff88]/20',
        gray: 'bg-gray-500/10 border-gray-500/20'
    };

    return (
        <div className={`rounded-xl p-6 border ${colorConfigs[color]}`}>
            <p className="text-gray-400 text-sm mb-2">{title}</p>
            <p className="text-white text-3xl font-bold">{count}</p>
        </div>
    );
}

function Modal({ children, onClose, title }) {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-[#0f1612] rounded-xl border border-[#1a2b22] max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-[#142920] px-6 py-4 border-b border-[#1a2b22] flex items-center justify-between">
                    <h2 className="text-white font-bold text-lg">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition text-2xl"
                    >
                        ×
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
