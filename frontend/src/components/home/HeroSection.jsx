export default function HeroSection() {
    return (
        <section className="relative pt-12 pb-20 md:pt-24 md:pb-32 overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1200px] pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">

                {/* TEXT CONTENT */}
                <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold tracking-wider mb-6">
                        SAAS THẾ HỆ MỚI
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
                        Giải pháp quản lý <br />
                        nhà hàng toàn diện
                    </h1>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-lg">
                        Tối ưu vận hành, tăng doanh thu với hệ thống SaaS quản lý và đặt món hiện đại nhất hiện nay.
                        Giảm 30% chi phí nhân sự ngay tháng đầu tiên.
                    </p>

                    <div className="flex flex-wrap gap-4 mb-10">
                        <button className="h-12 px-8 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold transition shadow-lg shadow-green-500/25">
                            Dùng thử miễn phí
                        </button>
                        <button className="h-12 px-8 rounded-full border border-gray-600 hover:border-white text-gray-300 hover:text-white font-bold transition">
                            Xem bản Demo
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full bg-gray-700 border-2 border-[#02140c]" />
                            ))}
                        </div>
                        <div className="text-sm text-gray-500">
                            <strong className="text-white">+800</strong> nhà hàng đã tin dùng
                        </div>
                    </div>
                </div>

                {/* HERO IMAGE */}
                <div className="relative">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-800 border border-white/10 shadow-2xl relative">
                        {/* Fallback pattern since image gen failed */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <span className="material-symbols-outlined text-9xl text-gray-700 opacity-50">restaurant</span>
                        </div>
                        {/* Simulated UI Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                                    <span className="material-symbols-outlined text-green-500">trending_up</span>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Doanh thu hôm nay</div>
                                    <div className="text-xl font-bold text-white">12,500,000 đ</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
