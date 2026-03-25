import { useNavigate } from "react-router-dom";
import PricingSection from "../components/home/PricingSection";

export default function PricingPage() {
  const navigate = useNavigate();

  const comparison = [
    { feature: "Số lượng chi nhánh", basic: "1", pro: "3", premium: "Không giới hạn" },
    { feature: "Quản lý Menu & Giá", basic: "✓", pro: "✓", premium: "✓" },
    { feature: "Gọi món QR tại bàn", basic: "✓", pro: "✓", premium: "✓" },
    { feature: "Quản lý kho (Inventory)", basic: "✕", pro: "✓", premium: "✓" },
    { feature: "Báo cáo doanh thu tháng", basic: "✓", pro: "✓", premium: "✓" },
    { feature: "Phân tích xu hướng món ăn", basic: "✕", pro: "✕", premium: "✓" },
    { feature: "Hỗ trợ 24/7", basic: "Email", pro: "Hotline", premium: "Chuyên gia riêng" },
  ];

  return (
    <div className="bg-[#02140c] min-h-screen pt-20">
      <div className="max-w-[1200px] mx-auto px-6 text-center mb-4">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white uppercase tracking-tighter">
          Bảng giá <span className="text-green-500">linh hoạt</span>
        </h1>
        <p className="text-gray-400 mt-6 max-w-2xl mx-auto">
            Đầu tư cho công nghệ là bước đi thông minh nhất để tối ưu lợi nhuận nhà hàng. 
            Chọn gói dịch vụ phù hợp và bắt đầu hành trình số hóa ngay hôm nay.
        </p>
      </div>

      <PricingSection />

      {/* Comparison Table */}
      <div className="max-w-[900px] mx-auto px-6 mb-24 overflow-x-auto">
        <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-2">So sánh chi tiết các gói</h2>
            <p className="text-gray-500 text-sm">Giúp bạn đưa ra quyết định chính xác nhất</p>
        </div>
        <table className="w-full text-left border-collapse bg-[#042014] rounded-3xl overflow-hidden border border-white/5">
            <thead>
                <tr className="bg-white/5">
                    <th className="p-6 text-gray-400 font-bold uppercase text-[10px] tracking-widest">Tính năng</th>
                    <th className="p-6 text-white font-bold text-center">Basic</th>
                    <th className="p-6 text-green-500 font-bold text-center">Pro</th>
                    <th className="p-6 text-white font-bold text-center">Premium</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {comparison.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition">
                        <td className="p-5 text-gray-300 text-sm">{row.feature}</td>
                        <td className="p-5 text-gray-500 text-sm text-center">{row.basic}</td>
                        <td className="p-5 text-white text-sm font-bold text-center">{row.pro}</td>
                        <td className="p-5 text-gray-500 text-sm text-center">{row.premium}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Registration Process */}
      <div className="max-w-[1200px] mx-auto px-6 mb-20">
        <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
                <div className="w-12 h-12 bg-green-500/10 text-green-500 font-bold rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">1</div>
                <h4 className="text-white font-bold mb-3">Đăng ký tài khoản</h4>
                <p className="text-gray-500 text-xs leading-relaxed">Chỉ mất 2 phút để tạo tài khoản và xác thực thông tin nhà hàng của bạn.</p>
            </div>
            <div className="text-center p-8">
                <div className="w-12 h-12 bg-green-500/10 text-green-500 font-bold rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">2</div>
                <h4 className="text-white font-bold mb-3">Chọn gói & Thanh toán</h4>
                <p className="text-gray-500 text-xs leading-relaxed">Lựa chọn gói dịch vụ và thanh toán qua các phương thức điện tử tiện lợi.</p>
            </div>
            <div className="text-center p-8">
                <div className="w-12 h-12 bg-green-500/10 text-green-500 font-bold rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">3</div>
                <h4 className="text-white font-bold mb-3">Sử dụng ngay</h4>
                <p className="text-gray-500 text-xs leading-relaxed">Hệ thống kích hoạt ngay lập tức. Bạn có thể bắt đầu lên menu và đón khách.</p>
            </div>
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
