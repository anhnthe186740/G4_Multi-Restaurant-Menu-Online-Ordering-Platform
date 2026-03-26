import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicServicePackages } from "../../api/adminApi";

export default function PricingSection() {
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPublicServicePackages()
            .then((res) => setPackages(res.data))
            .catch((err) => console.error("Failed to load packages:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleCTA = (pkgName = "") => {
        const token = localStorage.getItem("token");
        if (!token) {
            const redirectPath = `/register-restaurant${pkgName ? `?plan=${pkgName.toLowerCase()}` : ""}`;
            navigate(`/register?redirect=${encodeURIComponent(redirectPath)}`);
        } else {
            navigate(`/register-restaurant${pkgName ? `?plan=${pkgName.toLowerCase()}` : ""}`);
        }
    };

    // Xác định gói nổi bật nhất (phổ biến nhất) dựa theo index = 1 (giữa)
    // hoặc dùng flag isPopular nếu backend có hỗ trợ
    const getIsPopular = (index) => {
        // Nếu có 3 gói thì chọn gói giữa (index 1), nếu khác thì chọn index 1 anyway
        return index === 1;
    };

    const formatPrice = (price) => {
        if (!price || price === 0) return "0đ";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <section className="py-24 md:py-32 relative overflow-hidden bg-[#020617]">
            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

            <div className="max-w-[1200px] mx-auto px-6 relative z-10">

                <div className="text-center mb-20 animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                        Lựa chọn gói <span className="text-gradient">linh hoạt</span>
                    </h2>
                    <p className="text-gray-400 text-lg">Phù hợp từ mô hình quán cafe nhỏ đến chuỗi nhà hàng cao cấp.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                ) : packages.length === 0 ? (
                    <p className="text-center text-gray-500 animate-fade-in-up">Chưa có gói dịch vụ nào được cấu hình.</p>
                ) : (
                    <div
                        className={`grid gap-8 items-stretch ${packages.length === 1
                            ? "grid-cols-1 max-w-sm mx-auto"
                            : packages.length === 2
                                ? "md:grid-cols-2 max-w-4xl mx-auto"
                                : "md:grid-cols-3"
                            }`}
                    >
                        {packages.map((pkg, index) => {
                            const isPopular = getIsPopular(index);
                            const features = (pkg.featuresDescription || pkg.Description || "")
                                .split("\n")
                                .map((f) => f.trim())
                                .filter(Boolean);

                            return (
                                <div
                                    key={pkg.packageID || pkg.PackageID}
                                    className={`relative p-10 rounded-[2.5rem] transition-all duration-500 flex flex-col animate-fade-in-up stagger-${index+1} ${isPopular
                                        ? "bg-slate-900/60 border-2 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)] md:-translate-y-6 scale-105 z-20"
                                        : "glass-card z-10"
                                        }`}
                                >
                                    {/* Popular Badge */}
                                    {isPopular && (
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg shadow-emerald-500/30 uppercase tracking-widest whitespace-nowrap">
                                            Phổ biến nhất
                                        </div>
                                    )}

                                    <div className="mb-8">
                                        <h3 className="text-2xl font-black text-white mb-4">
                                            {pkg.PackageName || pkg.packageName}
                                        </h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl md:text-5xl font-black text-white">
                                                {formatPrice(pkg.Price ?? pkg.price)}
                                            </span>
                                            {(pkg.Duration || pkg.duration) && (
                                                <span className="text-gray-500 font-bold">
                                                    /{pkg.Duration || pkg.duration} tháng
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {pkg.description && (
                                        <p className="text-gray-500 leading-relaxed mb-8">{pkg.description}</p>
                                    )}

                                    <ul className="space-y-5 mb-10 flex-grow">
                                        {features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 group">
                                                <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 transition-colors duration-300">
                                                    <span className="material-symbols-outlined text-[14px] text-emerald-400 group-hover:text-white">check</span>
                                                </div>
                                                <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors capitalize">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleCTA(pkg.PackageName || pkg.packageName)}
                                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-300 transform active:scale-95 ${isPopular
                                            ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-500/30"
                                            : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                                            }`}
                                    >
                                        Đăng kí dùng thử
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
