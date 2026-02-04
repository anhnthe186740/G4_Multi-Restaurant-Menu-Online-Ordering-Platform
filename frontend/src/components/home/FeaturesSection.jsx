export default function FeaturesSection() {
    const features = [
        {
            title: "Đặt món tại bàn QR",
            desc: "Khách hàng chủ động gọi món qua mã QR, giảm tải cho nhân viên và tăng độ chính xác 100%.",
            icon: "qr_code_scanner",
            color: "text-green-400",
            bg: "bg-green-400/10"
        },
        {
            title: "Quản lý đa chi nhánh",
            desc: "Theo dõi và kiểm soát tất cả cơ sở kinh doanh từ xa chỉ với một tài khoản quản lý duy nhất.",
            icon: "store",
            color: "text-blue-400",
            bg: "bg-blue-400/10"
        },
        {
            title: "Báo cáo thời gian thực",
            desc: "Hệ thống biểu đồ trực quan về doanh thu, tỷ suất lợi nhuận giúp bạn ra quyết định nhanh chóng.",
            icon: "monitoring",
            color: "text-purple-400",
            bg: "bg-purple-400/10"
        }
    ];

    return (
        <section className="py-20 bg-[#031a10]">
            <div className="max-w-[1200px] mx-auto px-6">

                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tính năng đột phá</h2>
                    <p className="text-gray-400">
                        Cung cấp mọi công cụ cần thiết để quản lý nhà hàng của bạn một cách chuyên nghiệp và hiệu quả.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="bg-[#042014] p-8 rounded-2xl border border-white/5 hover:border-green-500/30 transition group">
                            <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition`}>
                                <span className={`material-symbols-outlined text-3xl ${feature.color}`}>{feature.icon}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
