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
} from '../api/ownerApi';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Store, Package } from 'lucide-react';

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
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
        green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
        orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    };
    const isPos = growth === null || growth === undefined ? null : growth >= 0;
    return (
        <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-5 flex flex-col gap-2`}>
            <div className="flex items-center justify-between">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">{label}</p>
                <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center ${colorMap[color].split(' ').pop()}`}>
                    <Icon size={18} />
                </div>
            </div>
            <p className="text-white text-2xl font-bold">{value}</p>
            <div className="flex items-center gap-2">
                {isPos !== null ? (
                    <span className={`flex items-center gap-1 text-xs font-semibold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {isPos ? '+' : ''}{growth}%
                    </span>
                ) : null}
                {sub && <span className="text-gray-500 text-xs">{sub}</span>}
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
export default function OwnerReports() {
    const [preset, setPreset] = useState(30);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState('');

    const [branches, setBranches] = useState([]);
    const [trend, setTrend] = useState([]);
    const [branchSummary, setBranchSummary] = useState([]);
    const [productStats, setProductStats] = useState({ products: [], totalRevenue: 0 });
    const [loading, setLoading] = useState(true);

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
            const [trendRes, branchRes, productRes] = await Promise.allSettled([
                getOwnerRevenueTrend(params),
                getOwnerBranchSummary({ startDate: params.startDate, endDate: params.endDate }),
                getOwnerProductStats(params),
            ]);
            if (trendRes.status === 'fulfilled') setTrend(trendRes.value.data);
            if (branchRes.status === 'fulfilled') setBranchSummary(branchRes.value.data);
            if (productRes.status === 'fulfilled') setProductStats(productRes.value.data);
        } finally {
            setLoading(false);
        }
    }, [getParams]);

    useEffect(() => { loadData(); }, [loadData]);

    /* Derived summary stats */
    const totalRevenue = trend.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = trend.reduce((s, d) => s + d.orders, 0);
    const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const activeBranches = branchSummary.filter(b => b.isActive).length;

    const dateRange = getParams();

    return (
        <RestaurantOwnerLayout>
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Báo cáo chi tiết</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Phân tích hiệu suất kinh doanh theo khoảng thời gian</p>
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
                        onChange={e => { setCustomStart(e.target.value); setIsCustom(true); }}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-gray-400 text-sm">→</span>
                    <input
                        type="date"
                        value={customEnd}
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
                            value={`${totalRevenue.toLocaleString('vi-VN')} đ`}
                            sub={`${dateRange.startDate} → ${dateRange.endDate}`}
                            color="blue"
                        />
                        <StatCard
                            icon={ShoppingBag}
                            label="Tổng đơn hàng"
                            value={totalOrders.toLocaleString()}
                            sub="đơn đã thanh toán"
                            color="green"
                        />
                        <StatCard
                            icon={DollarSign}
                            label="Giá trị TB / đơn"
                            value={`${avgOrder.toLocaleString('vi-VN')} đ`}
                            color="purple"
                        />
                        <StatCard
                            icon={Store}
                            label="Chi nhánh hoạt động"
                            value={activeBranches}
                            sub={`/ ${branchSummary.length} chi nhánh`}
                            color="orange"
                        />
                    </div>

                    {/* ── Area Chart: Revenue Trend ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
                        <h3 className="font-bold text-gray-800 mb-1">Xu hướng doanh thu</h3>
                        <p className="text-xs text-gray-400 mb-4">Doanh thu theo từng ngày trong kỳ được chọn</p>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="date" tick={<DateTick />} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                                <YAxis tickFormatter={fmtVND} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
                                <Tooltip
                                    formatter={(v) => [`${v.toLocaleString('vi-VN')} đ`, 'Doanh thu']}
                                    labelFormatter={(l) => `Ngày ${fmtDate(l)}`}
                                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5}
                                    fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: '#3b82f6' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* ── Row: Branch Bar + Product Table ── */}
                    <div className="grid grid-cols-2 gap-5">
                        {/* Branch Revenue Bar */}
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

                            {/* Branch summary table under chart */}
                            {branchSummary.length > 0 && (
                                <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
                                    {branchSummary.map(b => (
                                        <div key={b.branchID} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${b.isActive ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                                                <span className="text-gray-700 font-medium truncate max-w-[160px]">{b.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-right">
                                                <span className="text-gray-500 text-xs">{b.orders} đơn</span>
                                                <span className="font-semibold text-gray-800 w-24">{b.revenue.toLocaleString('vi-VN')} đ</span>
                                                {b.growth !== null && (
                                                    <span className={`text-xs font-bold w-12 ${b.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {b.growth >= 0 ? '+' : ''}{b.growth}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Top Product Table */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <Package size={16} className="text-blue-500" />
                                <h3 className="font-bold text-gray-800">Top sản phẩm bán chạy</h3>
                            </div>
                            <p className="text-xs text-gray-400 mb-4">Doanh thu và số lượng bán ra trong kỳ</p>
                            {productStats.products?.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                                                <th className="text-left py-2 pr-3">#</th>
                                                <th className="text-left py-2 pr-3">Sản phẩm</th>
                                                <th className="text-right py-2 pr-3">SL</th>
                                                <th className="text-right py-2 pr-3">Doanh thu</th>
                                                <th className="text-right py-2">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {productStats.products.map((p, i) => (
                                                <tr key={p.productID} className="hover:bg-gray-50/60 transition-colors">
                                                    <td className="py-2.5 pr-3">
                                                        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold
                                                            ${i === 0 ? 'bg-yellow-400/20 text-yellow-600'
                                                                : i === 1 ? 'bg-gray-300/30 text-gray-600'
                                                                    : i === 2 ? 'bg-orange-400/20 text-orange-600'
                                                                        : 'bg-gray-100 text-gray-400'}`}>
                                                            {i + 1}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 pr-3 font-medium text-gray-800 max-w-[140px] truncate">{p.name}</td>
                                                    <td className="py-2.5 pr-3 text-right text-gray-600">{p.quantity.toLocaleString()}</td>
                                                    <td className="py-2.5 pr-3 text-right font-semibold text-gray-800">{fmtVND(p.revenue)}</td>
                                                    <td className="py-2.5 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-blue-500 rounded-full"
                                                                    style={{ width: `${p.percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-semibold text-blue-600 w-8 text-right">{p.percentage}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu sản phẩm</div>
                            )}

                            {/* Total */}
                            {productStats.totalRevenue > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Tổng doanh thu top 10</span>
                                    <span className="font-bold text-gray-900">{productStats.totalRevenue.toLocaleString('vi-VN')} đ</span>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </RestaurantOwnerLayout>
    );
}
