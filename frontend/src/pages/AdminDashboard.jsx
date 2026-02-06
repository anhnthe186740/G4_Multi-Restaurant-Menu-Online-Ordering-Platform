import { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import StatCard from '../components/admin/StatCard';
import RevenueChart from '../components/admin/RevenueChart';
import PackageChart from '../components/admin/PackageChart';
import PendingRequestsTable from '../components/admin/PendingRequestsTable';
import TicketsTable from '../components/admin/TicketsTable';
import {
    getDashboardOverview,
    getRevenueChart,
    getPackageDistribution,
    getPendingRequests,
    getRecentTickets
} from '../api/adminApi';

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const [revenueData, setRevenueData] = useState({ labels: [], data: [] });
    const [packageData, setPackageData] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load all data in parallel
            const [
                overviewRes,
                revenueRes,
                packageRes,
                requestsRes,
                ticketsRes
            ] = await Promise.all([
                getDashboardOverview(),
                getRevenueChart(),
                getPackageDistribution(),
                getPendingRequests(),
                getRecentTickets()
            ]);

            setOverview(overviewRes.data);
            setRevenueData(revenueRes.data);
            setPackageData(packageRes.data);
            setPendingRequests(requestsRes.data);
            setTickets(ticketsRes.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            alert('Lỗi khi tải dữ liệu dashboard: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ff88] mx-auto mb-4"></div>
                        <p className="text-gray-400">Đang tải dashboard...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            {/* Refresh Button */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={loadDashboardData}
                    className="px-4 py-2 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 text-[#00ff88] rounded-lg font-semibold transition border border-[#00ff88]/20"
                >
                    🔄 Làm mới
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard
                    title="Tổng nhà hàng"
                    value={overview?.totalRestaurants || 0}
                    icon="🏪"
                    color="primary"
                />
                <StatCard
                    title="Nhà hàng hoạt động"
                    value={overview?.activeRestaurants || 0}
                    icon="✅"
                    color="success"
                />
                <StatCard
                    title="Tổng doanh thu"
                    value={overview?.totalRevenue || 0}
                    icon="💰"
                    color="purple"
                />
                <StatCard
                    title="Đơn chờ duyệt"
                    value={overview?.pendingRequests || 0}
                    icon="📝"
                    color="warning"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard
                    title="Doanh thu tháng này"
                    value={overview?.monthlyRevenue || 0}
                    icon="📊"
                    color="success"
                />
                <StatCard
                    title="Subscriptions đang hoạt động"
                    value={overview?.activeSubscriptions || 0}
                    icon="🎫"
                    color="primary"
                />
                <StatCard
                    title="Sắp hết hạn (7 ngày)"
                    value={overview?.expiringSoon || 0}
                    icon="⏰"
                    color="danger"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <RevenueChart
                    data={revenueData.data}
                    labels={revenueData.labels}
                />
                <PackageChart data={packageData} />
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PendingRequestsTable requests={pendingRequests} />
                <TicketsTable tickets={tickets} />
            </div>
        </AdminLayout>
    );
}
