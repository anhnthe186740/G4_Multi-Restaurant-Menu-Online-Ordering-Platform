import { useNavigate } from "react-router-dom";

export default function SolutionsPage() {
  const navigate = useNavigate();

  const solutions = [
    {
      title: "Số hóa quy trình vận hành",
      desc: "Thay thế quy trình ghi chép thủ công bằng hệ thống tự động hoàn toàn. Khách hàng quét mã QR, gọi món, bếp nhận đơn và thanh toán chỉ trong vài giây. Giảm 90% các sai sót do con người gây ra.",
      icon: "rocket_launch",
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    {
      title: "Quản lý tài chính & thất thoát",
      desc: "Theo dõi dòng tiền chi tiết theo thời gian thực. Hệ thống định lượng nguyên liệu tự động trừ kho giúp chủ nhà hàng biết chính xác lượng thực phẩm tiêu thụ, ngăn chặn tình trạng gian lận và thất thoát.",
      icon: "savings",
      color: "text-green-400",
      bg: "bg-green-400/10"
    },
    {
      title: "Gia tăng lòng trung thành",
      desc: "Tích hợp hệ thống CRM thông minh. Tự động gửi voucher chúc mừng sinh nhật khách hàng, tích điểm đổi quà và cá nhân hóa trải nghiệm người dùng để tăng tỷ lệ khách hàng quay lại lên đến 40%.",
      icon: "groups",
      color: "text-orange-400",
      bg: "bg-orange-400/10"
    },
    {
      title: "Quản lý chuỗi nhà hàng tập trung",
      desc: "Dễ dàng quản lý hàng chục chi nhánh chỉ với một tài khoản duy nhất. So sánh hiệu quả kinh doanh giữa các chi nhánh, điều phối nhân sự và nguyên liệu linh hoạt từ xa mà không cần có mặt trực tiếp.",
      icon: "hub",
      color: "text-purple-400",
      bg: "bg-purple-400/10"
    }
  ];

  return (
    <div className="bg-[#02140c] min-h-screen pt-20">
      <div className="max-w-[1200px] mx-auto px-6 text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 uppercase tracking-tight">
          Giải pháp <span className="text-green-500">toàn diện</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
          Chúng tôi mang đến giải pháp công nghệ giúp giải quyết triệt để mọi nỗi lo trong việc quản lý và vận hành chuỗi nhà hàng, 
          từ những quán ăn nhỏ lẻ đến các hệ thống F&B quy mô lớn.
        </p>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 grid md:grid-cols-2 gap-8 mb-20">
        {solutions.map((item, idx) => (
          <div key={idx} className="bg-[#042014] p-8 rounded-3xl border border-white/5 hover:border-green-500/20 transition-all duration-500 group">
            <div className={`w-16 h-16 rounded-2xl ${item.bg} flex items-center justify-center mb-8 group-hover:scale-110 transition duration-500 shadow-inner`}>
              <span className={`material-symbols-outlined text-4xl ${item.color}`}>{item.icon}</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
            <p className="text-gray-400 text-sm leading-7">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="max-w-[1200px] mx-auto px-6 mb-20">
        <div className="bg-gradient-to-br from-green-500/20 to-transparent p-12 rounded-[40px] border border-green-500/10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Bạn chưa biết bắt đầu từ đâu?</h2>
            <p className="text-gray-400 mb-8">Hãy để chuyên gia của chúng tôi tư vấn giải pháp phù hợp nhất cho mô hình kinh doanh của bạn hoàn toàn miễn phí.</p>
            <button onClick={() => navigate("/contact")} className="bg-green-500 text-white font-bold py-4 px-10 rounded-2xl hover:bg-green-600 transition shadow-xl shadow-green-500/20">
                Nhận tư vấn ngay
            </button>
        </div>
      </div>

      <div className="flex justify-center pb-20">
        <button 
          onClick={() => navigate("/")}
          className="h-12 px-8 rounded-full border border-gray-600 hover:border-white text-gray-300 hover:text-white font-bold transition flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Quay lại trang chủ
        </button>
      </div>
    </div>
  );
}
