export default function CTASection() {
    return (
        <section className="py-20 px-6">
            <div className="max-w-[1200px] mx-auto bg-gradient-to-r from-green-500 to-green-400 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">

                <div className="relative z-10">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-[#02140c] mb-6">
                        Sẵn sàng đưa nhà hàng của <br /> bạn lên tầm cao mới?
                    </h2>
                    <p className="text-[#02140c]/80 text-lg mb-10 max-w-2xl mx-auto font-medium">
                        Bắt đầu dùng thử miễn phí 14 ngày ngay hôm nay. Không cần thẻ tín dụng.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <button className="h-12 px-8 rounded-xl bg-[#02140c] text-green-400 font-bold hover:bg-[#08291a] transition shadow-xl">
                            Bắt đầu ngay
                        </button>
                        <button className="h-12 px-8 rounded-xl bg-white/20 text-[#02140c] font-bold border border-[#02140c]/20 hover:bg-white/30 transition">
                            Liên hệ chúng tôi
                        </button>
                    </div>
                </div>

                {/* Decorative Circles */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#02140c]/10 rounded-full blur-[60px] translate-x-1/2 translate-y-1/2" />
            </div>
        </section>
    );
}
