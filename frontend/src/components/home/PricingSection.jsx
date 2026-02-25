import { useNavigate } from "react-router-dom";

export default function PricingSection() {
    const navigate = useNavigate();

    const handleCTA = (plan = "basic") => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/register");
        } else {
            navigate(`/register-restaurant?plan=${plan}`);
        }
    };

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">

                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Lựa chọn gói dịch vụ</h2>
                    <p className="text-gray-400">Phù hợp cho mọi quy mô từ quán nhỏ đến chuỗi nhà hàng lớn.</p>

                    <div className="mt-8 inline-flex items-center bg-[#042014] rounded-full p-1 border border-white/10">
                        <button className="px-6 py-2 rounded-full bg-green-500 text-white text-sm font-bold shadow-lg">Phổ biến nhất</button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">

                    {/* Basic */}
                    <div className="bg-[#03180f] p-8 rounded-2xl border border-white/5">
                        <h3 className="text-xl font-bold text-white mb-2">Basic</h3>
                        <div className="flex items-end gap-1 mb-4">
                            <span className="text-4xl font-bold text-white">0đ</span>
                            <span className="text-gray-500 text-sm mb-1">/tháng</span>
                        </div>
                        <p className="text-gray-500 text-sm mb-8">Dành cho cá nhân mới bắt đầu.</p>
                        <button
                            onClick={() => handleCTA("basic")}
                            className="w-full py-3 rounded-xl bg-[#0a2e1e] text-green-500 font-bold hover:bg-[#0f422b] transition mb-8"
                        >
                            Đăng Kí Ngay
                        </button>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> 1 chi nhánh duy nhất
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Đặt món QR cơ bản
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Báo cáo cuối ngày (qua Email)
                            </li>
                            <li className="flex items-center gap-3 opacity-50">
                                <span className="material-symbols-outlined text-gray-600 text-lg">cancel</span> Không hỗ trợ quản lý kho
                            </li>
                        </ul>
                    </div>

                    {/* Premium */}
                    <div className="bg-[#042014] p-8 rounded-2xl border border-green-500 relative transform md:-translate-y-4 shadow-xl shadow-green-900/10">
                        <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                            PHỔ BIẾN NHẤT
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Premium</h3>
                        <div className="flex items-end gap-1 mb-4">
                            <span className="text-5xl font-bold text-white">1000USD</span>
                            <span className="text-gray-500 text-sm mb-1">/tháng</span>
                        </div>
                        <p className="text-gray-500 text-sm mb-8">Dành cho nhà hàng chuyên nghiệp.</p>
                        <button
                            onClick={() => handleCTA("premium")}
                            className="w-full py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition mb-8 shadow-lg shadow-green-500/20"
                        >
                            Đăng Kí Ngay
                        </button>
                        <ul className="space-y-4 text-sm text-gray-300">
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Lên đến 3 chi nhánh
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Quản lý kho & Định lượng món
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Hỗ trợ ưu tiên 24/7
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Tích hợp thanh toán online
                            </li>
                        </ul>
                    </div>

                    {/* Enterprise */}
                    <div className="bg-[#03180f] p-8 rounded-2xl border border-white/5">
                        <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                        <div className="flex items-end gap-1 mb-4">
                            <span className="text-3xl font-bold text-white">Liên hệ</span>
                        </div>
                        <p className="text-gray-500 text-sm mb-8">Dành cho chuỗi thương hiệu lớn.</p>
                        <button
                            onClick={() => handleCTA("enterprise")}
                            className="w-full py-3 rounded-xl bg-[#0a2e1e] text-green-500 font-bold hover:bg-[#0f422b] transition mb-8"
                        >
                            Đăng Kí Ngay
                        </button>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Không giới hạn chi nhánh
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Giải pháp tùy chỉnh (Custom)
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Đội ngũ hỗ trợ kỹ thuật tận nơi
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Tích hợp với hệ thống ERP hiện có
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </section>
    );
}
