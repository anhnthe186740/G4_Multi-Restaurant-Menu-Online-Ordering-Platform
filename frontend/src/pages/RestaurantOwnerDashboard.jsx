import { useState, useEffect } from 'react';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    LineChart, Line, Area, AreaChart
} from 'recharts';
import {
    getOwnerDashboardStats,
    getOwnerBranchRevenue,
    getOwnerTopProducts,
    getOwnerOrdersByHour,
    getOwnerBranchPerformance
} from '../api/ownerApi';
import { TrendingUp, TrendingDown, ShoppingBag, Store, Star, Download, Filter } from 'lucide-react';

const PIE_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

// Formatter tiền VND
const fmtVND = (v) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}T`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v;
};

const GrowthBadge = ({ value }) => {
    if (value === null || value === undefined) {
        return (
            <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                — Chưa có dữ liệu tháng trước
            </span>
        );
    }
    const isPos = value >= 0;
    return (
        <span className={`flex items-center gap-1 text-xs font-semibold ${isPos ? 'text-green-600' : 'text-red-500'}`}>
            {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPos ? '+' : ''}{value}% so với tháng trước
        </span>
    );
};

export default function RestaurantOwnerDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [branchRevenue, setBranchRevenue] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [ordersByHour, setOrdersByHour] = useState([]);
    const [branchPerformance, setBranchPerformance] = useState([]);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        const results = await Promise.allSettled([
            getOwnerDashboardStats(),
            getOwnerBranchRevenue(),
            getOwnerTopProducts(),
            getOwnerOrdersByHour(),
            getOwnerBranchPerformance(),
        ]);
        if (results[0].status === 'fulfilled') setStats(results[0].value.data);
        if (results[1].status === 'fulfilled') setBranchRevenue(results[1].value.data);
        if (results[2].status === 'fulfilled') setTopProducts(results[2].value.data);
        if (results[3].status === 'fulfilled') setOrdersByHour(results[3].value.data);
        if (results[4].status === 'fulfilled') setBranchPerformance(results[4].value.data);
        setLoading(false);
    };

    if (loading) {
        return (
            <RestaurantOwnerLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </RestaurantOwnerLayout>
        );
    }

    return (
        <RestaurantOwnerLayout>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển chiến lược</h1>
                    <p className="text-gray-500 text-sm mt-1">Quản lý hiệu suất kinh doanh trên toàn hệ thống</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-md">
                    <Download size={16} />
                    Xuất báo cáo
                </button>
            </div>

            {/* ====== 4 STAT CARDS ====== */}
            <div className="grid grid-cols-4 gap-5 mb-6">
                {/* Card 1 — Tổng doanh thu */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-gray-400 text-xs font-medium mb-2">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                        {stats?.totalRevenue
                            ? `${stats.totalRevenue.toLocaleString('vi-VN')} đ`
                            : '0 đ'}
                    </p>
                    <GrowthBadge value={stats?.revenueGrowth ?? 0} />
                </div>

                {/* Card 2 — Tổng đơn hàng */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-gray-400 text-xs font-medium mb-2">Tổng đơn hàng</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                        {(stats?.totalOrders ?? 0).toLocaleString()}
                    </p>
                    <GrowthBadge value={stats?.orderGrowth ?? 0} />
                </div>

                {/* Card 3 — Giá trị trung bình */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-gray-400 text-xs font-medium mb-2">Giá trị trung bình</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                        {stats?.avgOrderValue
                            ? `${stats.avgOrderValue.toLocaleString('vi-VN')} đ`
                            : '0 đ'}
                    </p>
                    <GrowthBadge value={stats?.avgGrowth ?? 0} />
                </div>

                {/* Card 4 — Chi nhánh xuất sắc (highlight màu blue) */}
                <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500">
                    <p className="text-gray-400 text-xs font-medium mb-2">Chi nhánh xuất sắc</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1 truncate">
                        {stats?.topBranch?.name ?? '—'}
                    </p>
                    {stats?.topBranch && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                            <Star size={12} className="fill-blue-500 text-blue-500" />
                            Tăng trưởng {stats.topBranch.growth}%
                        </span>
                    )}
                </div>
            </div>

            {/* ====== ROW 2: Bar chart + Donut chart ====== */}
            <div className="grid grid-cols-2 gap-5 mb-5">
                {/* Bar chart — So sánh doanh thu chi nhánh */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-gray-800">So sánh doanh thu chi nhánh</h3>
                        <button className="text-gray-400 hover:text-gray-600">⋯</button>
                    </div>
                    {branchRevenue.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={branchRevenue} barSize={36}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={fmtVND} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    formatter={(v) => [`${v.toLocaleString('vi-VN')} đ`, 'Doanh thu']}
                                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                                />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-60 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu</div>
                    )}
                </div>

                {/* Donut chart — Top 5 món ăn bán chạy */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-gray-800">Món ăn bán chạy nhất</h3>
                    </div>
                    {topProducts.length > 0 ? (
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <PieChart width={160} height={160}>
                                    <Pie
                                        data={topProducts}
                                        cx={75} cy={75}
                                        innerRadius={45} outerRadius={72}
                                        dataKey="percentage"
                                        startAngle={90} endAngle={-270}
                                        strokeWidth={0}
                                    >
                                        {topProducts.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-xl font-bold text-gray-800">Top 5</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-semibold">tháng này</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2.5">
                                {topProducts.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                                            <span className="text-xs text-gray-600 truncate max-w-[120px]">{p.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-800">{p.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu</div>
                    )}
                </div>
            </div>

            {/* ====== ROW 3: Area chart + Performance table ====== */}
            <div className="grid grid-cols-2 gap-5">
                {/* Area chart — Lượng đơn theo giờ */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="mb-1">
                        <h3 className="font-bold text-gray-800">Lượng đơn theo giờ</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Phân bổ đơn hàng theo khung giờ trong ngày (30 ngày qua)</p>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={ordersByHour.filter((_, i) => i % 2 === 0)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                            <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2.5} fill="url(#blueGrad)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Table — Hiệu suất chi tiết */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Hiệu suất chi tiết</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs font-semibold text-gray-400 uppercase border-b border-gray-100">
                                    <th className="text-left py-2 pr-4">Chi nhánh</th>
                                    <th className="text-right py-2 pr-4">Đơn hàng</th>
                                    <th className="text-right py-2 pr-4">Doanh thu</th>
                                    <th className="text-right py-2">Tăng trưởng</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {branchPerformance.length > 0 ? branchPerformance.map((b) => (
                                    <tr key={b.branchID} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 pr-4 font-semibold text-gray-800 truncate max-w-[140px]">{b.name}</td>
                                        <td className="py-3 pr-4 text-right text-gray-600">{b.orders.toLocaleString()}</td>
                                        <td className="py-3 pr-4 text-right text-gray-800 font-medium">
                                            {b.revenue.toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className={`font-bold text-xs ${b.growth >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                                {b.growth >= 0 ? '+' : ''}{b.growth}%
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-gray-400 text-sm">Chưa có dữ liệu</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </RestaurantOwnerLayout>
    );
}
