import { useState, useEffect, useCallback } from 'react';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    getOwnerRevenueTrend,
    getOwnerBranchSummary,
    getOwnerProductStats,
    getOwnerBranches,
    getOwnerOrdersDetail,
    getOwnerOrdersHeatmap,
    getOwnerDashboardStats, // Will use this for Revenue, Cost, Profit
    exportOwnerReport,
} from '../api/ownerApi';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Store, Package, Download, ListOrdered, Receipt, RefreshCw } from 'lucide-react';

/* ─── Helpers ─── */
const fmtVND = (v) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}T`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v;
};

const fmtDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
};

const PRESET_RANGES = [
    { label: '7 ngày', days: 7 },
    { label: '30 ngày', days: 30 },
    { label: '3 tháng', days: 90 },
];

function getDateRange(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
    };
}

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

/* ─── Custom XAxis Tick for dates ─── */
const DateTick = ({ x, y, payload }) => (
    <text x={x} y={y + 12} textAnchor="middle" fill="#6b7280" fontSize={10}>
        {fmtDate(payload.value)}
    </text>
);

/* ─── Custom Branch Tick ─── */
const BranchTick = ({ x, y, payload }) => {
    const parts = payload.value.split(' - ');
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={8} textAnchor="middle" fill="#9ca3af" fontSize={10} fontWeight={500}>{parts[0]}</text>
            {parts[1] && <text x={0} y={0} dy={20} textAnchor="middle" fill="#6b7280" fontSize={10}>{parts[1]}</text>}
        </g>
    );
};

/* ─── Main Page ─── */
export default function OwnerOverview() {
    const [preset, setPreset] = useState(30);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState('');

    const [branches, setBranches] = useState([]);
    const [trend, setTrend] = useState([]);
    const [branchSummary, setBranchSummary] = useState([]);
    const [productStats, setProductStats] = useState({ products: [], totalRevenue: 0 });
    const [ordersDetail, setOrdersDetail] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [heatmap, setHeatmap] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    /* Compute date range */
    const getParams = useCallback(() => {
        const range = isCustom && customStart && customEnd
            ? { startDate: customStart, endDate: customEnd }
            : getDateRange(preset);
        return { ...range, ...(selectedBranch ? { branchID: selectedBranch } : {}) };
    }, [preset, isCustom, customStart, customEnd, selectedBranch]);

    /* Load branches list once */
    useEffect(() => {
        getOwnerBranches().then(r => setBranches(r.data.branches || [])).catch(() => { });
    }, []);

    /* Load report data */
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = getParams();
            const [trendRes, branchRes, productRes, ordersRes, heatmapRes, statsRes] = await Promise.allSettled([
                getOwnerRevenueTrend(params),
                getOwnerBranchSummary({ startDate: params.startDate, endDate: params.endDate }),
                getOwnerProductStats(params),
                getOwnerOrdersDetail(params),
                getOwnerOrdersHeatmap(params),
                getOwnerDashboardStats(params),
            ]);
            if (trendRes.status === 'fulfilled') setTrend(trendRes.value.data);
            if (branchRes.status === 'fulfilled') setBranchSummary(branchRes.value.data);
            if (productRes.status === 'fulfilled') setProductStats(productRes.value.data);
            if (ordersRes.status === 'fulfilled') setOrdersDetail(ordersRes.value.data.orders);
            if (heatmapRes.status === 'fulfilled') setHeatmap(heatmapRes.value.data);
            if (statsRes.status === 'fulfilled') setDashboardStats(statsRes.value.data);
        } finally {
            setLoading(false);
        }
    }, [getParams]);

    useEffect(() => { loadData(); }, [loadData]);

    /* Derived summary stats */
    // const totalRevenue = trend.reduce((s, d) => s + d.revenue, 0);
    // const totalOrders = trend.reduce((s, d) => s + d.orders, 0);
    // const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    // const activeBranches = branchSummary.filter(b => b.isActive).length;

    const dateRange = getParams();

    /* Excel/PDF Export */
    const handleExportFile = async (type = 'excel') => {
        const params = getParams();
        const startDateStr = params.startDate;
        const endDateStr = params.endDate;
        try {
            setExporting(true);
            const token = localStorage.getItem('token');
            const branchParam = params.branchID ? `&branchID=${params.branchID}` : '';
            const response = await fetch(
                `http://localhost:5000/api/owner/reports/export?startDate=${startDateStr}&endDate=${endDateStr}&type=${type}${branchParam}`,
                { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Lỗi xuất báo cáo.');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const extension = type === 'pdf' ? 'pdf' : 'xlsx';
            link.setAttribute('download', `Bao_Cao_Owner_${startDateStr}_${endDateStr}.${extension}`);
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

    return (
        <RestaurantOwnerLayout>
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Quản lý hiệu suất kinh doanh trên toàn hệ thống</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleExportFile('excel')}
                        disabled={loading || exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {exporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                        Xuất Excel
                    </button>
                    <button
                        onClick={() => handleExportFile('pdf')}
                        disabled={loading || exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {exporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                        Xuất PDF
                    </button>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-3">
                {/* Preset buttons */}
                <div className="flex gap-2">
                    {PRESET_RANGES.map(r => (
                        <button
                            key={r.days}
                            onClick={() => { setPreset(r.days); setIsCustom(false); }}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors
                                ${!isCustom && preset === r.days
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

                {/* Custom range */}
                <div className="flex items-center gap-2 ml-2">
                    <input
                        type="date"
                        value={customStart}
                        max={customEnd || undefined}
                        onChange={e => { setCustomStart(e.target.value); setIsCustom(true); }}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-gray-400 text-sm">→</span>
                    <input
                        type="date"
                        value={customEnd}
                        min={customStart || undefined}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e => { setCustomEnd(e.target.value); setIsCustom(true); }}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Branch selector */}
                <select
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                    className="ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                    <option value="">Tất cả chi nhánh</option>
                    {branches.map(b => (
                        <option key={b.branchID} value={b.branchID}>{b.name}</option>
                    ))}
                </select>
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
                            value={dashboardStats ? `${dashboardStats.totalRevenue.toLocaleString('vi-VN')} đ` : "0 đ"}
                            growth={dashboardStats?.revenueGrowth}
                            color="blue"
                        />
                        <StatCard
                            icon={Receipt}
                            label="Tổng chi phí"
                            value={dashboardStats ? `${dashboardStats.totalCost.toLocaleString('vi-VN')} đ` : "0 đ"}
                            sub="Tạm tính (35%)"
                            color="orange"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Lợi nhuận ròng"
                            value={dashboardStats ? `${dashboardStats.netProfit.toLocaleString('vi-VN')} đ` : "0 đ"}
                            growth={dashboardStats?.profitGrowth}
                            color="green"
                        />
                        <StatCard
                            icon={ShoppingBag}
                            label="Số đơn hàng"
                            value={dashboardStats ? dashboardStats.totalOrders.toLocaleString() : "0"}
                            growth={dashboardStats?.orderGrowth}
                            color="purple"
                        />
                    </div>

                    {/* ── Area Chart: Revenue & Cost Trend ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
                        <h3 className="font-bold text-gray-800 mb-1">So sánh Thu nhập & Chi phí</h3>
                        <p className="text-xs text-gray-400 mb-4">Doanh thu và chi phí dự tính theo ngày</p>
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="date" tick={<DateTick />} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                                <YAxis tickFormatter={fmtVND} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
                                <Tooltip
                                    formatter={(v, name) => [`${v.toLocaleString('vi-VN')} đ`, name === 'revenue' ? 'Doanh thu' : 'Chi phí']}
                                    labelFormatter={(l) => `Ngày ${fmtDate(l)}`}
                                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                                />
                                <Area type="monotone" dataKey="revenue" name="revenue" stroke="#3b82f6" strokeWidth={3}
                                    fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: '#3b82f6' }} />
                                <Area type="monotone" dataKey="cost" name="cost" stroke="#9ca3af" strokeWidth={3}
                                    fill="url(#costGrad)" dot={false} activeDot={{ r: 5, fill: '#9ca3af' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* ── Row: Branch Bar + Product List ── */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-bold text-gray-800 mb-1">Doanh thu theo chi nhánh</h3>
                            <p className="text-xs text-gray-400 mb-4">So sánh hiệu suất từng chi nhánh</p>
                            {branchSummary.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={branchSummary} barSize={32} margin={{ top: 5, right: 5, left: 0, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="name" tick={<BranchTick />} axisLine={false} tickLine={false} interval={0} height={45} />
                                        <YAxis tickFormatter={fmtVND} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
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

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <Package size={16} className="text-blue-500" />
                                <h3 className="font-bold text-gray-800">Món ăn bán chạy nhất</h3>
                            </div>
                            <p className="text-xs text-gray-400 mb-4">Các sản phẩm đóng góp doanh thu cao nhất</p>

                            {productStats.products?.length > 0 ? (
                                <div className="space-y-4">
                                    {productStats.products.slice(0, 5).map((p, i) => (
                                        <div key={p.productID} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0 hover:bg-gray-50/50 p-2 rounded-lg transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                    {p.imageURL ? (
                                                        <img src={p.imageURL} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <Package size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm max-w-[180px] truncate">{p.name}</p>
                                                    <p className="text-xs text-gray-500">{p.quantity.toLocaleString()} lượt bán</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-blue-600 text-sm">{fmtVND(p.revenue)}</p>
                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden ml-auto">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.percentage}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="w-full text-center text-blue-600 text-sm font-semibold mt-2 hover:text-blue-700 transition-colors">
                                        Xem tất cả thực đơn
                                    </button>
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu sản phẩm</div>
                            )}
                        </div>
                    </div>

                    {/* ── Peak Hours Heatmap ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-bold text-gray-800">Biểu đồ nhiệt giờ cao điểm</h3>
                                <p className="text-xs text-gray-400">Mật độ khách hàng trung bình trong 30 ngày qua</p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                <span>Ít khách</span>
                                <div className="w-12 h-3 bg-gradient-to-r from-blue-50 to-blue-600 rounded-sm"></div>
                                <span>Đông khách</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto pb-2">
                            <div className="min-w-[700px]">
                                <div className="flex gap-1">
                                    <div className="flex flex-col gap-1 pr-3 justify-between text-xs text-gray-400 font-medium py-1">
                                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                                            <div key={d} className="h-6 flex items-center">{d}</div>
                                        ))}
                                    </div>

                                    <div className="flex-1 flex flex-col gap-1">
                                        {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                                            <div key={dayIdx} className="flex gap-1 flex-1">
                                                {[...Array(24)].map((_, hourIdx) => {
                                                    const count = heatmap[dayIdx]?.[hourIdx] || 0;
                                                    const maxOrders = 15;
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
                                        ))}
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
                    </div>

                    {/* ── Product Analysis Table ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-800">Phân tích Sản phẩm</h3>
                            </div>
                        </div>

                        {productStats.products?.length > 0 ? (
                            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white border-b border-gray-100 z-10">
                                        <tr className="text-xs text-gray-500 uppercase">
                                            <th className="text-left py-4 px-2 font-semibold">Tên món</th>
                                            <th className="text-left py-4 px-2 font-semibold">Phân loại</th>
                                            <th className="text-left py-4 px-2 font-semibold">Đã bán</th>
                                            <th className="text-left py-4 px-2 font-semibold">Doanh thu</th>
                                            <th className="text-left py-4 px-2 font-semibold">Xu hướng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {productStats.products.map((p) => {
                                            const isPos = p.trend && p.trend.startsWith('+');
                                            return (
                                                <tr key={p.productID} className="hover:bg-blue-50/30 transition-colors group">
                                                    <td className="py-3 px-2 text-gray-800 font-medium">{p.name}</td>
                                                    <td className="py-3 px-2 text-blue-600 font-medium text-xs">{p.category}</td>
                                                    <td className="py-3 px-2 text-gray-600">{p.quantity}</td>
                                                    <td className="py-3 px-2 font-bold text-gray-900">{fmtVND(p.revenue)}</td>
                                                    <td className="py-3 px-2">
                                                        <span className={`flex items-center gap-1 text-xs font-semibold ${isPos ? 'text-blue-500' : 'text-red-400'}`}>
                                                            {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                            {p.trend}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Không có dữ liệu sản phẩm</div>
                        )}
                    </div>
                </>
            )}
        </RestaurantOwnerLayout>
    );
}
