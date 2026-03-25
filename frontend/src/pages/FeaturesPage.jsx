import { useNavigate } from "react-router-dom";
import FeaturesSection from "../components/home/FeaturesSection";

export default function FeaturesPage() {
  const navigate = useNavigate();

  const extraFeatures = [
    {
      title: "Quản lý kho thông minh",
      desc: "Tự động trừ tồn kho ngay khi món ăn được bán ra. Cảnh báo nguyên liệu sắp hết và quản lý nhập xuất kho chi tiết 24/7.",
      icon: "inventory_2",
      color: "text-amber-400",
      bg: "bg-amber-400/10"
    },
    {
      title: "Thanh toán đa phương thức",
      desc: "Hỗ trợ Momo, VNPay, Chuyển khoản ngân hàng và Tiền mặt. Tích hợp máy POS cầm tay giúp nhân viên thanh toán tại bàn nhanh chóng.",
      icon: "payments",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Ứng dụng Nhân viên & Bếp",
      desc: "Nhân viên nhận order qua tablet, thông tin chuyển thẳng xuống bếp qua màn hình KDS. Loại bỏ hoàn toàn việc dùng giấy ghi tay.",
      icon: "devices",
      color: "text-cyan-400",
      bg: "bg-cyan-400/10"
    },
    {
      title: "Phân tích khách hàng AI",
      desc: "Hệ thống tự động ghi nhớ sở thích khách hàng, gợi ý món ăn phù hợp và phân loại khách hàng thân thiết để triển khai marketing.",
      icon: "smart_toy",
      color: "text-rose-400",
      bg: "bg-rose-400/10"
    }
  ];

  return (
    <div className="bg-[#02140c] min-h-screen pt-20">
      <div className="max-w-[1200px] mx-auto px-6 text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
          Tính năng hệ thống
        </h1>
        <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
          Khám phá trọn bộ công cụ quản lý nhà hàng hiện đại nhất hiện nay. Chúng tôi không chỉ cung cấp phần mềm, 
          mà còn mang lại giải pháp tối ưu quy trình giúp doanh nghiệp của bạn phát triển bền vững.
        </p>
      </div>

      {/* Existing Section */}
      <FeaturesSection />

      {/* Extra Features Section */}
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Và nhiều hơn thế nữa...</h2>
          <div className="h-1 w-20 bg-green-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {extraFeatures.map((f, idx) => (
            <div key={idx} className="bg-[#042014] p-6 rounded-2xl border border-white/5 hover:border-green-500/20 transition-all duration-300">
              <div className={`w-12 h-12 rounded-lg ${f.bg} flex items-center justify-center mb-5`}>
                <span className={`material-symbols-outlined text-2xl ${f.color}`}>{f.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center py-20">
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
