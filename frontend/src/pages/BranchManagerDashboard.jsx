import { useState, useEffect, useCallback } from 'react';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
    DollarSign, ShoppingBag, BarChart2, Users,
} from 'lucide-react';

/* ─── Constants ─── */
const PERIOD_LABELS   = { today: 'Hôm nay', '7days': '7 ngày', month: 'Tháng này' };
const DONUT_COLORS    = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const DONUT_LABELS    = ['Hoàn thành', 'Đang giao', 'Đang xử lý', 'Đã huỷ'];
const TOP_COLORS      = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
const MONTH_NAMES     = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];

/* ─── Helpers ─── */
const fmtVND = (v) => {
    if (!v) return '0đ';
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}T đ`;
    if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M đ`;
    if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}K đ`;
    return `${v}đ`;
};
const fmtVNDFull = (v) => v ? `${Number(v).toLocaleString('vi-VN')}đ` : '0đ';
const fmtMonth = (ym) => {
    if (!ym) return '';
    const [, m] = ym.split('-');
    return MONTH_NAMES[parseInt(m) - 1] || ym;
};

/* ─── Growth Badge ─── */
const GrowthBadge = ({ value }) => {
    if (value === null || value === undefined)
        return <span className="text-xs text-gray-400">—</span>;
    const pos = value >= 0;
    return (
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${pos ? 'text-emerald-600' : 'text-red-500'}`}>
            {pos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {pos ? '+' : ''}{value}%
        </span>
    );
};

/* ─── Stat Card ─── */
const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, growth, valueFull }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                <Icon size={18} className={iconColor} />
            </div>
            <GrowthBadge value={growth} />
        </div>
        <p className="text-gray-400 text-xs font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900" title={valueFull}>{value}</p>
    </div>
);

/* ─── Heatmap Cell ─── */
const HeatCell = ({ value, max }) => {
    const intensity = max > 0 ? value / max : 0;
    const bg = intensity === 0
        ? '#f1f5f9'
        : intensity < 0.25 ? '#bfdbfe'
        : intensity < 0.5  ? '#60a5fa'
        : intensity < 0.75 ? '#3b82f6'
        : '#1d4ed8';
    return (
        <div
            className="rounded-sm"
            style={{ width: 18, height: 18, backgroundColor: bg }}
            title={`${value} đơn`}
        />
    );
};

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

    /* ─ Donut data ─ */
    const donutData = [
        { name: DONUT_LABELS[0], value: orderStatus?.Completed ?? 0 },
        { name: DONUT_LABELS[1], value: orderStatus?.Serving   ?? 0 },
        { name: DONUT_LABELS[2], value: orderStatus?.Open      ?? 0 },
        { name: DONUT_LABELS[3], value: orderStatus?.Cancelled ?? 0 },
    ];

    /* ─ Heatmap max value ─ */
    const heatmapMax = Math.max(...heatmap.flatMap(d => d.hours), 1);

    /* ─ Hours axis (chỉ hiển thị chẵn) ─ */
    const hoursAxis = Array.from({ length: 12 }, (_, i) => `${String(i * 2).padStart(2, '0')}h`);

    /* ─ Revenue chart label ─ */
    const revenueData = revenueTrend.map(r => ({
        ...r,
        label: fmtMonth(r.month),
    }));

    if (loading) {
        return (
            <BranchManagerLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </BranchManagerLayout>
        );
    }

    const branch = stats?.branch;

    return (
        <BranchManagerLayout>

            {/* ══════ HEADER ══════ */}
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
                        <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1">
                            <span>📍</span>{branch.address}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                        <Download size={15} />
                        Xuất báo cáo
                    </button>
                    <button
                        onClick={() => loadAll(period)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                    >
                        <RefreshCw size={15} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* ══════ PERIOD FILTER ══════ */}
            <div className="flex items-center gap-2 mb-6">
                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => handlePeriod(key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            period === key
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ══════ 4 STAT CARDS ══════ */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard
                    icon={DollarSign}
                    iconBg="bg-blue-50" iconColor="text-blue-600"
                    label="Tổng doanh thu"
                    value={fmtVND(stats?.totalRevenue)}
                    valueFull={fmtVNDFull(stats?.totalRevenue)}
                    growth={stats?.revenueGrowth}
                />
                <StatCard
                    icon={ShoppingBag}
                    iconBg="bg-purple-50" iconColor="text-purple-600"
                    label="Tổng đơn hàng"
                    value={(stats?.totalOrders ?? 0).toLocaleString()}
                    growth={stats?.ordersGrowth}
                />
                <StatCard
                    icon={BarChart2}
                    iconBg="bg-orange-50" iconColor="text-orange-600"
                    label="Giá trị TB đơn"
                    value={fmtVND(stats?.avgOrderValue)}
                    valueFull={fmtVNDFull(stats?.avgOrderValue)}
                    growth={stats?.avgGrowth}
                />
                <StatCard
                    icon={Users}
                    iconBg="bg-emerald-50" iconColor="text-emerald-600"
                    label="Đơn đang xử lý"
                    value={(stats?.openOrders ?? 0).toLocaleString()}
                    growth={null}
                />
            </div>

            {/* ══════ ROW 2: Bar chart (3/5) + Donut (2/5) ══════ */}
            <div className="grid grid-cols-5 gap-4 mb-4">

                {/* ── Biểu đồ doanh thu ── */}
                <div className="col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-gray-800">Biểu đồ Doanh thu</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Doanh thu
                            </span>
                        </div>
                    </div>
                    {revenueData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={revenueData} barSize={28} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={v => fmtVND(v)} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    formatter={(v) => [fmtVNDFull(v), 'Doanh thu']}
                                    contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
                                />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-60 flex items-center justify-center text-gray-300 text-sm">
                            Chưa có dữ liệu
                        </div>
                    )}
                </div>

                {/* ── Trạng thái đơn hàng ── */}
                <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Trạng thái Đơn hàng</h3>
                    {orderStatus && orderStatus.total > 0 ? (
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <PieChart width={190} height={190}>
                                    <Pie
                                        data={donutData}
                                        cx={90} cy={90}
                                        innerRadius={56} outerRadius={85}
                                        dataKey="value"
                                        startAngle={90} endAngle={-270}
                                        strokeWidth={0}
                                    >
                                        {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                                    </Pie>
                                </PieChart>
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Tổng cộng</span>
                                    <span className="text-2xl font-bold text-gray-800">{orderStatus.total.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="w-full mt-2 space-y-2.5">
                                {donutData.map((item, i) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i] }} />
                                            <span className="text-xs text-gray-600">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-800">{item.value}</span>
                                            <span className="text-xs text-gray-400 w-8 text-right">
                                                {orderStatus.total > 0 ? Math.round((item.value / orderStatus.total) * 100) + '%' : '0%'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-52 flex items-center justify-center text-gray-300 text-sm">
                            Không có đơn hàng trong kỳ này
                        </div>
                    )}
                </div>
            </div>

            {/* ══════ ROW 3: Top products (1/2) + Heatmap (1/2) ══════ */}
            <div className="grid grid-cols-2 gap-4">

                {/* ── Sản phẩm bán chạy ── */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-gray-800">Sản phẩm bán chạy</h3>
                        <span className="text-xs text-emerald-600 font-semibold cursor-pointer hover:underline">Xem tất cả</span>
                    </div>
                    {topProducts.length > 0 ? (
                        <div className="space-y-4">
                            {topProducts.map((p, i) => (
                                <div key={p.productID}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{p.name}</span>
                                        <span className="text-sm font-bold text-gray-800 shrink-0 ml-2">{p.quantity.toLocaleString()} đơn</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-2 rounded-full transition-all duration-700"
                                            style={{ width: `${p.percentage}%`, background: TOP_COLORS[i] }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-300 text-sm">
                            Chưa có dữ liệu bán hàng
                        </div>
                    )}
                </div>

                {/* ── Heatmap đơn hàng theo giờ ── */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">Mật độ đơn hàng theo giờ</h3>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <span>Thấp</span>
                            {['#f1f5f9','#bfdbfe','#60a5fa','#3b82f6','#1d4ed8'].map(c => (
                                <span key={c} className="w-3 h-3 rounded-sm inline-block" style={{ background: c }} />
                            ))}
                            <span>Cao</span>
                        </div>
                    </div>
                    {heatmap.length > 0 ? (
                        <div className="overflow-x-auto">
                            {/* Hours header */}
                            <div className="flex mb-1 pl-10">
                                {hoursAxis.map(h => (
                                    <div key={h} style={{ width: 37 }} className="text-[9px] text-gray-400 text-center">{h}</div>
                                ))}
                            </div>
                            {/* Grid rows */}
                            {heatmap.map((row) => (
                                <div key={row.day} className="flex items-center gap-0.5 mb-0.5">
                                    <span className="text-[9px] text-gray-400 w-9 shrink-0">{row.day}</span>
                                    {row.hours.map((v, h) => (
                                        <HeatCell key={h} value={v} max={heatmapMax} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-300 text-sm">
                            Chưa có dữ liệu
                        </div>
                    )}
                </div>
            </div>

        </BranchManagerLayout>
    );
}
