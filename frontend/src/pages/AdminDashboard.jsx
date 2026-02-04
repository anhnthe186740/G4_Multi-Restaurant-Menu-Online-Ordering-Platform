import { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    getDashboardOverview,
    getPackageDistribution,
    getPaymentHistory
} from '../api/adminApi';

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const [packageData, setPackageData] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const [overviewRes, packageRes, paymentsRes] = await Promise.all([
                getDashboardOverview(),
                getPackageDistribution(),
                getPaymentHistory()
            ]);

            setOverview(overviewRes.data);
            setPackageData(packageRes.data);
            setPaymentHistory(paymentsRes.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ff88]"></div>
                </div>
            </AdminLayout>
        );
    }

    // Transform package data for bar chart
    const chartData = packageData.map(pkg => ({
        name: pkg.packageName,
        count: pkg.count
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
                        <h2 className="text-4xl font-bold text-white">{overview?.totalRestaurants?.toLocaleString() || '0'}</h2>
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
                <div className="bg-[#142920] rounded-xl p-6 border border-[#1f3d2f]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-sm font-medium">Yêu cầu chờ duyệt</span>
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <span className="text-2xl">📝</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-bold text-white">{overview?.pendingRequests || '0'}</h2>
                        <span className="text-orange-400 text-sm font-semibold">Cần xử lý</span>
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
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <YAxis
                                stroke="#6b7280"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f1612',
                                    border: '1px solid #1a2b22',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Bar dataKey="count" fill="#00ff88" radius={[8, 8, 0, 0]} />
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

                    <div className="space-y-3">
                        {paymentHistory && paymentHistory.length > 0 ? (
                            paymentHistory.slice(0, 5).map((payment, index) => (
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
                    <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-[#1a2b22]">
                        <button className="w-8 h-8 rounded-lg bg-[#1a2b22] text-gray-400 hover:text-white transition">‹</button>
                        <button className="w-8 h-8 rounded-lg bg-[#1a2b22] text-gray-400 hover:text-white transition">›</button>
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
                    <button className="px-4 py-2 rounded-lg bg-[#00ff88] text-black font-semibold text-sm hover:bg-[#00d975] transition">
                        Mở danh sách chờ duyệt
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
