import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#00ff88', '#3b82f6', '#a855f7', '#f97316', '#ef4444'];

export default function PackageChart({ data }) {
    // Transform data for Recharts
    const chartData = data?.map(item => ({
        name: item.packageName,
        value: item.count
    })) || [];

    return (
        <div className="bg-[#0f1612] rounded-xl border border-[#1a2b22] p-6">
            <h3 className="text-lg font-bold text-white mb-4">
                📦 Phân bố gói dịch vụ
            </h3>

            {chartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                    Chưa có dữ liệu
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#062519',
                                border: '1px solid #133827',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            wrapperStyle={{ fontSize: '12px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
