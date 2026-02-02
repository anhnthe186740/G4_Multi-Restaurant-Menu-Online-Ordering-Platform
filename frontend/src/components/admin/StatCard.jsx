export default function StatCard({ title, value, icon, color = "primary", trend, trendUp }) {
    const colorClasses = {
        primary: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
        success: "from-[#00ff88]/20 to-[#00c04b]/20 border-[#00ff88]/30",
        warning: "from-orange-500/20 to-orange-600/20 border-orange-500/30",
        danger: "from-red-500/20 to-red-600/20 border-red-500/30",
        purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    };

    const iconColorClasses = {
        primary: "text-blue-400",
        success: "text-[#00ff88]",
        warning: "text-orange-400",
        danger: "text-red-400",
        purple: "text-purple-400",
    };

    const valueColorClasses = {
        primary: "text-blue-400",
        success: "text-[#00ff88]",
        warning: "text-orange-400",
        danger: "text-red-400",
        purple: "text-purple-400",
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6 hover:scale-105 transition-transform backdrop-blur-sm`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-gray-400 text-sm font-medium mb-2">
                        {title}
                    </p>
                    <h3 className={`text-3xl font-bold ${valueColorClasses[color]}`}>
                        {typeof value === 'number' && value >= 1000000
                            ? `${(value / 1000000).toFixed(1)}M`
                            : typeof value === 'number'
                                ? value.toLocaleString('vi-VN')
                                : value}
                    </h3>
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            <span className={`text-xs font-semibold ${trendUp ? 'text-[#00ff88]' : 'text-red-400'}`}>
                                {trendUp ? '↑' : '↓'} {trend}
                            </span>
                            <span className="text-xs text-gray-500">vs last month</span>
                        </div>
                    )}
                </div>
                <div className={`text-3xl ${iconColorClasses[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
