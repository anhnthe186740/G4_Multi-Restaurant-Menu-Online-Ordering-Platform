export default function FeaturesSection() {
    const features = [
        {
            title: "Đặt món tại bàn QR",
            desc: "Khách hàng chủ động gọi món qua mã QR, giảm tải cho nhân viên và tăng độ chính xác 100%.",
            icon: "qr_code_scanner",
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]"
        },
        {
            title: "Quản lý đa chi nhánh",
            desc: "Theo dõi và kiểm soát tất cả cơ sở kinh doanh từ xa chỉ với một tài khoản quản lý duy nhất.",
            icon: "store",
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
        },
        {
            title: "Báo cáo thời gian thực",
            desc: "Hệ thống biểu đồ trực quan về doanh thu, tỷ suất lợi nhuận giúp bạn ra quyết định nhanh chóng.",
            icon: "monitoring",
            color: "text-purple-400",
            bg: "bg-purple-400/10",
            glow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
        }
    ];

    return (
        <section className="py-24 md:py-32 bg-[#020617] relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />

            <div className="max-w-[1200px] mx-auto px-6 relative z-10">

                <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                        Tính năng <span className="text-gradient">đột phá</span> cho F&B
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Tất cả những gì bạn cần để số hóa quy trình quản lý nhà hàng chỉ trong một nền tảng duy nhất, hiện đại và dễ sử dụng.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <div 
                            key={idx} 
                            className={`glass-card p-10 rounded-[2rem] group transform transition-all duration-500 hover:-translate-y-2 animate-fade-in-up stagger-${idx+1} ${feature.glow}`}
                        >
                            <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner`}>
                                <span className={`material-symbols-outlined text-4xl ${feature.color}`}>{feature.icon}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                {feature.desc}
                            </p>
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm cursor-pointer group/link">
                                <span>Tìm hiểu thêm</span>
                                <span className="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
