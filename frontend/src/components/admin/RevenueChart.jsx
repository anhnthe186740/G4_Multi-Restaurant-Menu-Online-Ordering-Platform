import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueChart({ data, labels }) {
    // Transform data for Recharts
    const chartData = labels?.map((label, index) => ({
        month: label,
        revenue: data?.[index] || 0
    })) || [];

    return (
        <div className="bg-[#0f1612] rounded-xl border border-[#1a2b22] p-6">
            <h3 className="text-lg font-bold text-white mb-4">
                📈 Doanh thu 6 tháng gần đây
            </h3>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                    <XAxis
                        dataKey="month"
                        stroke="#888"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#888"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#062519',
                            border: '1px solid #133827',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                        formatter={(value) => [`${value.toLocaleString('vi-VN')} VND`, 'Doanh thu']}
                    />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#00ff88"
                        strokeWidth={3}
                        dot={{ fill: '#00ff88', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
