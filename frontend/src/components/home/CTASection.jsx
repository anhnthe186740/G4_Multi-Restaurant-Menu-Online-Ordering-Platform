import { useNavigate } from "react-router-dom";

export default function CTASection() {
    const navigate = useNavigate();

    return (
        <section className="py-24 md:py-32 bg-[#020617] relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                
                <div className="relative p-12 md:p-20 rounded-[3rem] overflow-hidden group animate-fade-in-up">
                    {/* Background Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-blue-600/20 -z-10 group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -z-10 animate-float-slow" />
                    
                    <div className="relative z-10 text-center max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight tracking-tight">
                            Nâng tầm quản lý <br /> 
                            <span className="text-gradient">ngay hôm nay</span>
                        </h2>
                        
                        <p className="text-gray-300 text-lg md:text-xl mb-12 leading-relaxed opacity-90">
                            Bắt đầu trải nghiệm nền tảng quản lý tốt nhất thị trường Việt Nam. 
                            Hoàn toàn miễn phí dùng thử, không cần thẻ tín dụng.
                        </p>

                        <div className="flex flex-wrap justify-center gap-6">
                            <button 
                                onClick={() => navigate("/register")}
                                className="h-16 px-12 rounded-2xl bg-white text-emerald-600 font-black text-lg transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:scale-95"
                            >
                                Bắt đầu ngay
                            </button>
                            <button 
                                onClick={() => navigate("/contact")}
                                className="h-16 px-12 rounded-2xl border-2 border-white/20 hover:border-white text-white font-black text-lg transition-all duration-300 backdrop-blur-md hover:-translate-y-1 active:scale-95"
                            >
                                Liên hệ chúng tôi
                            </button>
                        </div>
                    </div>

                    {/* Decorative Glass Elements */}
                    <div className="absolute top-10 left-10 w-24 h-24 glass rounded-3xl -rotate-12 opacity-50 blur-[2px] animate-float-slow" />
                    <div className="absolute bottom-10 right-10 w-32 h-32 glass rounded-full rotate-12 opacity-30 blur-[4px] animate-float-slow stagger-2" />
                </div>

            </div>
        </section>
    );
}
