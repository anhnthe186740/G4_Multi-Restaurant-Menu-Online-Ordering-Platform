import { useNavigate } from "react-router-dom";

export default function HeroSection() {
    const navigate = useNavigate();
    return (
        <section className="relative pt-20 pb-24 md:pt-32 md:pb-40 overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10 animate-float-slow" />

            <div className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

                {/* Left Content */}
                <div className="relative z-10 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider mb-8 uppercase">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Hệ thống Thế Hệ Mới
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tight">
                        Vận hành <span className="text-gradient">thông minh</span>, <br />
                        đột phá doanh thu
                    </h1>
                    
                    <p className="text-gray-400 text-lg md:text-xl mb-10 leading-relaxed max-w-xl">
                        Hệ thống quản lý nhà hàng toàn diện tích hợp AI giúp tối ưu quy trình từ đặt món đến báo cáo, giúp bạn tiết kiệm <b>30%</b> chi phí nhân sự ngay tháng đầu tiên.
                    </p>

                    <div className="flex flex-wrap gap-5 mb-12">
                        <button className="h-14 px-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-2xl hover:shadow-emerald-500/40 text-white font-bold transition-all duration-300 transform hover:-translate-y-1 active:scale-95">
                            Dùng thử miễn phí
                        </button>
                        <button 
                            onClick={() => navigate("/features")}
                            className="h-14 px-10 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold transition-all duration-300 backdrop-blur-sm transform hover:-translate-y-1 active:scale-95"
                        >
                            Xem bản Demo
                        </button>
                    </div>

                    <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm w-fit">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <img 
                                    key={i} 
                                    src={`https://i.pravatar.cc/100?img=${i+10}`} 
                                    className="w-10 h-10 rounded-full border-2 border-[#020617] object-cover"
                                    alt="User"
                                />
                            ))}
                        </div>
                        <div className="text-sm">
                            <p className="text-white font-bold">+800 nhà hàng</p>
                            <p className="text-gray-500">đã tin dùng GastroAdmin</p>
                        </div>
                    </div>
                </div>

                {/* Right Visual Content */}
                <div className="relative lg:block hidden animate-fade-in-up stagger-2">
                    <div className="relative z-10 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
                        <img 
                            src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop" 
                            className="w-full h-full object-cover grayscale-[0.2] group-hover:scale-110 transition-transform duration-700"
                            alt="Restaurant Dashboard"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#020617]/80 via-[#020617]/20 to-transparent" />
                        
                        {/* Live Update Card Overlay */}
                        <div className="absolute top-10 left-10 glass p-5 rounded-3xl animate-float-slow shadow-2xl">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                                <span className="material-symbols-outlined">trending_up</span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Tăng trưởng tháng này</p>
                              <p className="text-xl font-black text-white">+42.5%</p>
                            </div>
                          </div>
                        </div>

                        {/* Status Card Overlay */}
                        <div className="absolute bottom-10 right-10 glass p-4 rounded-2xl border-emerald-500/30">
                           <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-sm font-bold text-white">Hệ thống đang hoạt động</span>
                           </div>
                        </div>
                    </div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute -top-6 -right-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-float-slow stagger-3" />
                </div>

            </div>
        </section>
    );
}
