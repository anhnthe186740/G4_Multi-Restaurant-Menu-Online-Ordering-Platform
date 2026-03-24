import { useState, useEffect, useCallback } from 'react';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import {
    getManagerDashboardStats,
    getManagerRevenueTrend,
    getManagerOrderStatus,
    getManagerTopProducts,
    getManagerOrdersHeatmap,
} from '../api/managerApi';
import {
    TrendingUp, TrendingDown, RefreshCw, Download,
    DollarSign, ShoppingBag, BarChart2, Users, Package
} from 'lucide-react';

/* ─── Constants ─── */
const PERIOD_LABELS   = { today: 'Hôm nay', '7days': '7 ngày', month: 'Tháng này' };
const DONUT_COLORS    = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const DONUT_LABELS    = ['Hoàn thành', 'Đang giao', 'Đang xử lý', 'Đã huỷ'];
const MONTH_NAMES     = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];

/* ─── Helpers ─── */
const fmtVND = (v) => {
    if (!v) return '0 đ';
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}T`;
    if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}K`;
    return v;
};
const fmtMonth = (ym) => {
    if (!ym) return '';
    const [, m] = ym.split('-');
    return MONTH_NAMES[parseInt(m) - 1] || ym;
};

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, sub, growth, color }) {
    const colorMap = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
    };
    const isPos = growth === null || growth === undefined ? null : growth >= 0;
    return (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <p className="text-gray-500 text-sm font-medium">{label}</p>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorMap[color]}`}>
                    <Icon size={20} />
                </div>
            </div>
            <p className="text-gray-900 text-2xl font-bold">{value}</p>
            <div className="flex items-center gap-2">
                {isPos !== null ? (
                    <span className={`flex items-center gap-1 text-xs font-semibold ${isPos ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'} px-1.5 py-0.5 rounded-md`}>
                        {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {isPos ? '+' : ''}{growth}%
                    </span>
                ) : null}
                {sub && <span className="text-gray-400 text-xs">{sub}</span>}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function BranchManagerDashboard() {
    const [period, setPeriod]           = useState('today');
    const [loading, setLoading]         = useState(true);
    const [stats, setStats]             = useState(null);
    const [revenueTrend, setRevenueTrend] = useState([]);
    const [orderStatus, setOrderStatus] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [heatmap, setHeatmap]         = useState([]);
    const [exporting, setExporting]     = useState(false);

    const loadAll = useCallback(async (p = period) => {
        setLoading(true);
        const [s, r, o, t, h] = await Promise.allSettled([
            getManagerDashboardStats(p),
            getManagerRevenueTrend(),
            getManagerOrderStatus(p),
            getManagerTopProducts(),
            getManagerOrdersHeatmap(),
        ]);
        if (s.status === 'fulfilled') setStats(s.value.data);
        if (r.status === 'fulfilled') setRevenueTrend(r.value.data);
        if (o.status === 'fulfilled') setOrderStatus(o.value.data);
        if (t.status === 'fulfilled') setTopProducts(t.value.data);
        if (h.status === 'fulfilled') setHeatmap(h.value.data);
        setLoading(false);
    }, []);  // eslint-disable-line

    useEffect(() => { loadAll(period); }, [period]); // eslint-disable-line

    const handlePeriod = (p) => { setPeriod(p); };

    const handleExportRevenue = async (type = 'excel') => {
        const end = new Date();
        const start = new Date();
        if (period === '7days') {
            start.setDate(start.getDate() - 6);
        } else if (period === 'month') {
            start.setDate(1);
        }
        const startDateStr = start.toISOString().split('T')[0];
        const endDateStr = end.toISOString().split('T')[0];

        try {
            setExporting(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/manager/dashboard/export-revenue?startDate=${startDateStr}&endDate=${endDateStr}&type=${type}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Lỗi xuất báo cáo.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const extension = type === 'pdf' ? 'pdf' : 'xlsx';
            link.setAttribute('download', `Doanh_Thu_${startDateStr}_${endDateStr}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Lỗi khi xuất:', error);
            alert(error.message || 'Lỗi khi tải file báo cáo.');
        } finally {
            setExporting(false);
        }
    };

    /* ─ Donut data ─ */
    const donutData = [
        { name: DONUT_LABELS[0], value: orderStatus?.Completed ?? 0 },
        { name: DONUT_LABELS[1], value: orderStatus?.Serving   ?? 0 },
        { name: DONUT_LABELS[2], value: orderStatus?.Open      ?? 0 },
        { name: DONUT_LABELS[3], value: orderStatus?.Cancelled ?? 0 },
    ];

    /* ─ Revenue chart label ─ */
    const revenueData = revenueTrend.map(r => ({
        ...r,
        label: fmtMonth(r.month),
    }));

    const branch = stats?.branch;

    return (
        <BranchManagerLayout>
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Phân tích Chi nhánh
                        {branch?.name && (
                            <span className="ml-3 text-base font-normal text-gray-400">
                                · {branch.name}
                            </span>
                        )}
                    </h1>
                    {branch?.address && (
                        <p className="text-gray-400 text-sm mt-0.5">📍 {branch.address}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleExportRevenue('excel')}
                        disabled={exporting || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {exporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                        Xuất Excel
                    </button>
                    <button
                        onClick={() => handleExportRevenue('pdf')}
                        disabled={exporting || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {exporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                        Xuất PDF
                    </button>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-3">
                <div className="flex gap-2">
                    {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => handlePeriod(key)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors
                                ${period === key
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* ── 4 Stat Cards ── */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <StatCard
                            icon={DollarSign}
                            label="Tổng doanh thu"
                            value={stats ? `${stats.totalRevenue.toLocaleString('vi-VN')} đ` : "0 đ"}
                            growth={stats?.revenueGrowth}
                            color="blue"
                        />
                        <StatCard
                            icon={ShoppingBag}
                            label="Tổng đơn hàng"
                            value={stats ? stats.totalOrders.toLocaleString() : "0"}
                            growth={stats?.ordersGrowth}
                            color="purple"
                        />
                        <StatCard
                            icon={BarChart2}
                            label="Giá trị TB đơn"
                            value={stats ? `${stats.avgOrderValue.toLocaleString('vi-VN')} đ` : "0 đ"}
                            growth={stats?.avgGrowth}
                            color="orange"
                        />
                        <StatCard
                            icon={Users}
                            label="Đơn đang xử lý"
                            value={stats ? stats.openOrders.toLocaleString() : "0"}
                            growth={null}
                            color="green"
                        />
                    </div>

                    {/* ── Area Chart: Revenue Trend ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
                        <h3 className="font-bold text-gray-800 mb-1">Cập nhật Doanh thu</h3>
                        <p className="text-xs text-gray-400 mb-4">Doanh thu theo từng tháng (6 tháng gần đây)</p>
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} />
                                    <YAxis tickFormatter={fmtVND} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
                                    <Tooltip
                                        formatter={(v) => [`${v.toLocaleString('vi-VN')} đ`, 'Doanh thu']}
                                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                                    />
                                    <Area type="monotone" dataKey="revenue" fill="url(#revenueGrad)" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: '#3b82f6' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu</div>
                        )}
                    </div>

                    {/* ── Row: Donut Chart + Product List ── */}
                    <div className="grid grid-cols-2 gap-5 mb-6">
                        {/* ── Trạng thái đơn hàng ── */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-bold text-gray-800 mb-1">Trạng thái Đơn hàng</h3>
                            <p className="text-xs text-gray-400 mb-6">Quản lý hiệu suất xử lý đơn hàng</p>
                            {orderStatus && orderStatus.total > 0 ? (
                                <div className="flex flex-col items-center">
                                    <div className="relative">
                                        <PieChart width={220} height={220}>
                                            <Pie
                                                data={donutData}
                                                cx={110} cy={110}
                                                innerRadius={65} outerRadius={95}
                                                dataKey="value"
                                                startAngle={90} endAngle={-270}
                                                strokeWidth={0}
                                            >
                                                {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                                            </Pie>
                                        </PieChart>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Tổng cộng</span>
                                            <span className="text-3xl font-bold text-gray-800 mt-1">{orderStatus.total.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="w-full mt-4 space-y-3 px-4">
                                        {donutData.map((item, i) => (
                                            <div key={item.name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: DONUT_COLORS[i] }} />
                                                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-gray-900">{item.value}</span>
                                                    <span className="text-xs font-semibold text-gray-400 w-8 text-right bg-gray-50 px-1 py-0.5 rounded">
                                                        {orderStatus.total > 0 ? Math.round((item.value / orderStatus.total) * 100) + '%' : '0%'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
                                    Không có đơn hàng trong kỳ này
                                </div>
                            )}
                        </div>

                        {/* ── Món ăn bán chạy ── */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <Package size={16} className="text-blue-500" />
                                <h3 className="font-bold text-gray-800">Món ăn bán chạy nhất</h3>
                            </div>
                            <p className="text-xs text-gray-400 mb-6">Các sản phẩm có lượt mua cao (30 ngày qua)</p>

                            {topProducts.length > 0 ? (
                                <div className="space-y-5">
                                    {topProducts.slice(0, 5).map((p, i) => (
                                        <div key={p.productID} className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-bold text-gray-800 truncate max-w-[200px]">{p.name}</span>
                                                <span className="font-bold text-blue-600 shrink-0 ml-2">{p.quantity.toLocaleString()} đơn</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-2 bg-blue-500 rounded-full transition-all duration-700"
                                                    style={{ width: `${p.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button className="w-full text-center text-blue-600 text-sm font-semibold mt-4 hover:text-blue-700 transition-colors">
                                        Xem tất cả thực đơn
                                    </button>
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu sản phẩm</div>
                            )}
                        </div>
                    </div>

                    {/* ── Peak Hours Heatmap ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-10">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-bold text-gray-800">Biểu đồ nhiệt giờ cao điểm</h3>
                                <p className="text-xs text-gray-400">Mật độ khách hàng trung bình trong 7 ngày qua</p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                <span>Ít khách</span>
                                <div className="w-12 h-3 bg-gradient-to-r from-blue-50 to-blue-600 rounded-sm"></div>
                                <span>Đông khách</span>
                            </div>
                        </div>

                        {heatmap.length > 0 ? (
                            <div className="overflow-x-auto pb-2">
                                <div className="min-w-[700px]">
                                    <div className="flex gap-1">
                                        <div className="flex flex-col gap-1 pr-3 justify-between text-xs text-gray-400 font-medium py-1">
                                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                                                <div key={d} className="h-6 flex items-center">{d}</div>
                                            ))}
                                        </div>

                                        <div className="flex-1 flex flex-col gap-1">
                                            {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                                                const maxOrders = Math.max(...heatmap.flatMap(d => d.hours), 1);
                                                return (
                                                    <div key={dayIdx} className="flex gap-1 flex-1">
                                                        {[...Array(24)].map((_, hourIdx) => {
                                                            const count = heatmap[dayIdx]?.hours?.[hourIdx] || 0;
                                                            const opacity = count === 0 ? 0.05 : Math.min(0.2 + (count / maxOrders) * 0.8, 1);
                                                            return (
                                                                <div
                                                                    key={`${dayIdx}-${hourIdx}`}
                                                                    className="flex-1 h-6 rounded-sm bg-blue-600 transition-opacity hover:opacity-100 cursor-pointer relative group"
                                                                    style={{ opacity: count === 0 ? 0.05 : opacity }}
                                                                >
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10">
                                                                        {count} đơn ({hourIdx}:00)
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex mt-2 ml-7 text-[10px] text-gray-400 font-medium">
                                        <div className="flex-1">00:00</div>
                                        <div className="flex-1 text-center">06:00</div>
                                        <div className="flex-1 text-center">12:00</div>
                                        <div className="flex-1 text-center">18:00</div>
                                        <div className="flex-1 text-right">23:59</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu heatmap</div>
                        )}
                    </div>
                </>
            )}
        </BranchManagerLayout>
    );
}
