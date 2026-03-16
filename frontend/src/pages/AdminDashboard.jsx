import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    getDashboardOverview,
    getPackageDistribution,
    getPaymentHistory
} from '../api/adminApi';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const [packageData, setPackageData] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [payPage, setPayPage] = useState(1);
    const [payPagination, setPayPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0, limit: 5 });
    const [payLoading, setPayLoading] = useState(false);

    // ── Effects ──
    useEffect(() => { loadDashboardData(); }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchPayments(payPage); }, [payPage]);

    // ── Fetch payment history ──
    async function fetchPayments(page) {
        setPayLoading(true);
        try {
            const { data } = await getPaymentHistory({ page, limit: 5 });
            if (Array.isArray(data)) {
                setPaymentHistory(data);
                setPayPagination({ currentPage: page, totalPages: 1, totalRecords: data.length, limit: 5 });
            } else {
                setPaymentHistory(data.payments ?? []);
                setPayPagination(data.pagination ?? { currentPage: page, totalPages: 1, totalRecords: 0, limit: 5 });
            }
        } catch (e) {
            console.error('Payment history error:', e);
        } finally {
            setPayLoading(false);
        }
    }

    // ── Load overview + chart ──
    async function loadDashboardData() {
        setLoading(true);
        try {
            const [overviewRes, packageRes] = await Promise.allSettled([
                getDashboardOverview(),
                getPackageDistribution(),
            ]);
            if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);
            if (packageRes.status === 'fulfilled') {
                const pkgData = packageRes.value.data;
                setPackageData(Array.isArray(pkgData) ? pkgData : []);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }


    if (loading) {
        return (
            <AdminLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ff88]"></div>
                </div>
            </AdminLayout>
        );
    }

    // Transform package data for bar chart — dùng revenue (price × count)
    const chartData = packageData.map(pkg => ({
        name: pkg.packageName,
        revenue: pkg.revenue || 0,
        count: pkg.count || 0,
        price: pkg.price || 0,
    }));

    return (
        <AdminLayout>
            {/* Stats Cards Row */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                {/* Total Restaurants Card */}
                <div className="bg-[#142920] rounded-xl p-6 border border-[#1f3d2f]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-sm font-medium">Tổng nhà hàng hoạt động</span>
                        <div className="w-10 h-10 rounded-lg bg-[#00ff88]/10 flex items-center justify-center">
                            <span className="text-2xl">🏪</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-bold text-white">{overview?.activeRestaurants?.toLocaleString() || '0'}</h2>
                        <span className="text-gray-500 text-sm">nhà hàng</span>
                    </div>
                </div>

                {/* Total Revenue Card */}
                <div className="bg-[#142920] rounded-xl p-6 border border-[#1f3d2f]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-sm font-medium">Doanh thu tháng (MRR)</span>
                        <div className="w-10 h-10 rounded-lg bg-[#00ff88]/10 flex items-center justify-center">
                            <span className="text-2xl">💵</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-bold text-white">
                            {overview?.totalRevenue
                                ? `$${overview.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                                : '$0'}
                        </h2>
                        <span className="text-gray-500 text-sm">tổng doanh thu</span>
                    </div>
                </div>

                {/* Pending Requests Card */}
                <div
                    onClick={() => navigate('/admin/requests')}
                    className="bg-[#142920] rounded-xl p-6 border border-[#1f3d2f] cursor-pointer hover:border-orange-500/40 hover:bg-orange-500/5 transition-all group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-sm font-medium group-hover:text-orange-300 transition">Yêu cầu chờ duyệt</span>
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <span className="text-2xl">📝</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-bold text-white">{overview?.pendingRequests || '0'}</h2>
                        <span className="text-orange-400 text-sm font-semibold">Cần xử lý →</span>
                    </div>
                </div>
            </div>

            {/* Charts and Table Row */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Bar Chart - Service Packages */}
                <div className="bg-[#0f1612] rounded-xl border border-[#1a2b22] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Doanh thu theo Gói dịch vụ</h3>
                        <button className="text-gray-400 hover:text-white transition">⋯</button>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a2b22" />
                            <XAxis
                                dataKey="name"
                                stroke="#6b7280"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                            />
                            <YAxis
                                stroke="#6b7280"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                tickFormatter={(value) =>
                                    value >= 1000000
                                        ? `${(value / 1000000).toFixed(1)}M`
                                        : value >= 1000
                                            ? `${(value / 1000).toFixed(0)}K`
                                            : value
                                }
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f1612',
                                    border: '1px solid #1a2b22',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                                formatter={(value, name, props) => [
                                    `${value.toLocaleString('vi-VN')} ₫`,
                                    `Doanh thu (${props.payload.count} sub)`
                                ]}
                                labelStyle={{ color: '#00ff88', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="revenue" fill="#00ff88" radius={[8, 8, 0, 0]} name="Doanh thu" />
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-4 pt-4 border-t border-[#1a2b22]">
                        <p className="text-gray-500 text-xs">Tổng góp của dịch vụ</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-white font-bold text-lg">Doanh nghiệp (Gói 3)</span>
                        </div>
                    </div>
                </div>

                {/* Payment History Table */}
                <div className="bg-[#0f1612] rounded-xl border border-[#1a2b22] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Lịch sử thanh toán gần đây</h3>
                        <button className="text-[#00ff88] text-sm font-semibold hover:underline">
                            Xem tất cả các giao dịch →
                        </button>
                    </div>

                    <div className="space-y-3 min-h-[220px]">
                        {payLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                                    <div className="w-10 h-10 rounded-lg bg-[#1a2b22]" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 bg-[#1a2b22] rounded w-2/3" />
                                        <div className="h-2 bg-[#1a2b22] rounded w-1/3" />
                                    </div>
                                    <div className="h-3 bg-[#1a2b22] rounded w-16" />
                                </div>
                            ))
                        ) : paymentHistory && paymentHistory.length > 0 ? (
                            paymentHistory.map((payment, index) => (
                                <div key={payment.SubscriptionID} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1a2b22]/30 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00ff88]/20 to-[#00c04b]/20 flex items-center justify-center">
                                            <span className="text-lg">{['🍕', '🍔', '🍜', '🍱', '🍰'][index % 5]}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium text-sm">{payment.RestaurantName || 'N/A'}</h4>
                                            <p className="text-gray-500 text-xs">{payment.PackageName || 'Không rõ gói'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold text-sm">
                                            {payment.Amount ? parseFloat(payment.Amount).toLocaleString('en-US') : '0'} $
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            {payment.PaymentDate ? new Date(payment.PaymentDate).toLocaleDateString('vi-VN') : 'N/A'}
                                        </p>
                                    </div>
                                    <button className={`ml-4 px-3 py-1 rounded-lg text-xs font-semibold border transition ${payment.Status === 'Active'
                                        ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20 hover:bg-[#00ff88]/20'
                                        : payment.Status === 'Expired'
                                            ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                        }`}>
                                        • {payment.Status === 'Active' ? 'THÀNH CÔNG' : (payment.Status || 'PENDING').toUpperCase()}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                Chưa có lịch sử thanh toán
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1a2b22]">
                        <span className="text-gray-500 text-xs">Tổng {payPagination.totalRecords} giao dịch</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPayPage(p => Math.max(1, p - 1))}
                                disabled={payPage <= 1 || payLoading}
                                className="w-8 h-8 rounded-lg bg-[#1a2b22] text-gray-400 hover:text-white disabled:opacity-40 transition font-bold"
                            >‹</button>
                            <span className="text-gray-400 text-xs px-1">{payPage}/{payPagination.totalPages || 1}</span>
                            <button
                                onClick={() => setPayPage(p => Math.min(payPagination.totalPages, p + 1))}
                                disabled={payPage >= payPagination.totalPages || payLoading}
                                className="w-8 h-8 rounded-lg bg-[#1a2b22] text-gray-400 hover:text-white disabled:opacity-40 transition font-bold"
                            >›</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Banner */}
            <div className="bg-gradient-to-r from-[#00ff88]/10 to-[#00c04b]/5 border border-[#00ff88]/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
                            <span className="text-[#00ff88] text-xl">✓</span>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold text-sm">Nhà hàng mới đăng ký</h4>
                            <p className="text-gray-400 text-xs">Có 2 đăng ký mới cần xác nhận, vào trang chi tiết để xem</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/admin/requests')}
                        className="px-4 py-2 rounded-lg bg-[#00ff88] text-black font-semibold text-sm hover:bg-[#00d975] transition"
                    >
                        Mở danh sách chờ duyệt
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
