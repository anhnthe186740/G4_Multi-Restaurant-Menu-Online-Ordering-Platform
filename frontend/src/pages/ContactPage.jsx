import { useNavigate } from "react-router-dom";

export default function ContactPage() {
  const navigate = useNavigate();

  const faqs = [
    { q: "Tôi có thể dùng thử trước khi mua không?", a: "Tất nhiên! Chúng tôi cung cấp chương trình dùng thử miễn phí 14 ngày đầy đủ tính năng để bạn trải nghiệm trước khi quyết định." },
    { q: "Hệ thống có hỗ trợ cài đặt tận nơi không?", a: "RestoManager hỗ trợ cài đặt từ xa và hướng dẫn tận nơi tại các thành phố lớn như Hà Nội, TP.HCM, Đà Nẵng." },
    { q: "Dữ liệu của nhà hàng có được bảo mật không?", a: "Chúng tôi sử dụng hạ tầng đám mây của AWS với công nghệ mã hóa dữ liệu đa lớp, đảm bảo dữ liệu của bạn an toàn 100%." }
  ];

  return (
    <div className="bg-[#02140c] min-h-screen pt-20 pb-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 uppercase tracking-tighter">
            Kết nối với <span className="text-green-500">chúng tôi</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Mọi ý kiến đóng góp và thắc mắc của bạn là nguồn động lực để RestoManager ngày càng hoàn thiện hơn. 
            Chúng tôi sẽ phản hồi lại bạn trong vòng 24h làm việc.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start mb-20">
          {/* Thông tin liên hệ & Social */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-8 border-l-4 border-green-500 pl-4">Thông tin VP</h2>
            
            <div className="flex items-start gap-4 p-6 bg-[#042014] rounded-2xl border border-white/5">
              <span className="material-symbols-outlined text-orange-500 text-2xl">mail</span>
              <div>
                <h3 className="font-bold text-white mb-1">Email hỗ trợ</h3>
                <p className="text-gray-400 text-sm">support@restomanager.vn</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-[#042014] rounded-2xl border border-white/5">
              <span className="material-symbols-outlined text-green-500 text-2xl">call</span>
              <div>
                <h3 className="font-bold text-white mb-1">Hotline CSKH</h3>
                <p className="text-gray-400 text-sm">1900 123 456 (8h - 22h)</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-[#042014] rounded-2xl border border-white/5">
              <span className="material-symbols-outlined text-blue-500 text-2xl">location_on</span>
              <div>
                <h3 className="font-bold text-white mb-1">Trụ sở chính</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Tòa nhà FPT, Lô E2a-7, Đường D1, Khu Công nghệ cao, P.Long Thạnh Mỹ, TP. Thủ Đức, TP. Hồ Chí Minh</p>
              </div>
            </div>

            <div className="pt-6">
                <h3 className="text-white font-bold mb-4">Theo dõi chúng tôi</h3>
                <div className="flex gap-4">
                    {['Facebook', 'YouTube', 'LinkedIn'].map(s => (
                        <div key={s} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-gray-400 border border-white/10 hover:bg-green-500 hover:text-white transition cursor-pointer">
                            {s.charAt(0)}
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* Form liên hệ */}
          <div className="lg:col-span-2 bg-[#042014] p-10 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/5 rounded-full blur-[60px] translate-x-10 -translate-y-10 group-hover:bg-green-500/10 transition duration-1000"></div>
            
            <h3 className="text-3xl font-bold text-white mb-8">Gửi yêu cầu hỗ trợ</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-[10px] text-gray-500 font-extrabold uppercase mb-2 block tracking-widest">Họ và tên</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Nguyễn Văn A" 
                  className="w-full bg-[#03180f] border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500/50 transition bg-opacity-50"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-extrabold uppercase mb-2 block tracking-widest">Số điện thoại</label>
                <input 
                  type="text" 
                  placeholder="09xx xxx xxx" 
                  className="w-full bg-[#03180f] border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500/50 transition bg-opacity-50"
                />
              </div>
            </div>
            <div className="mb-6">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase mb-2 block tracking-widest">Email liên hệ</label>
                <input 
                  type="email" 
                  placeholder="email@vidu.com" 
                  className="w-full bg-[#03180f] border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500/50 transition bg-opacity-50"
                />
            </div>
            <div className="mb-8">
                <label className="text-[10px] text-gray-500 font-extrabold uppercase mb-2 block tracking-widest">Nội dung chi tiết</label>
                <textarea 
                  rows="5" 
                  placeholder="Mô tả thắc mắc hoặc yêu cầu tư vấn của bạn..." 
                  className="w-full bg-[#03180f] border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500/50 transition bg-opacity-50 resize-none"
                ></textarea>
            </div>
            <button className="w-full py-5 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition-all duration-300 shadow-xl shadow-green-500/20 active:scale-[0.98]">
              Gửi yêu cầu ngay
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-2xl font-bold text-white text-center mb-10">Câu hỏi thường gặp</h2>
            <div className="space-y-4">
                {faqs.map((faq, i) => (
                    <div key={i} className="bg-[#031c11] p-6 rounded-2xl border border-white/5">
                        <h4 className="text-white font-bold mb-2 flex gap-2">
                            <span className="text-green-500">Q:</span> {faq.q}
                        </h4>
                        <p className="text-gray-500 text-sm pl-6">{faq.a}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={() => navigate("/")}
            className="h-12 px-8 rounded-full border border-gray-600 hover:border-white text-gray-300 hover:text-white font-bold transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
