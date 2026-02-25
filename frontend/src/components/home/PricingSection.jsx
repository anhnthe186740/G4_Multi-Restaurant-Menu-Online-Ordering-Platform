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
            navigate("/register");
        } else {
            navigate(`/register-restaurant?plan=${pkgName.toLowerCase()}`);
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
        <section className="py-24 relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">

                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Lựa chọn gói dịch vụ</h2>
                    <p className="text-gray-400">Phù hợp cho mọi quy mô từ quán nhỏ đến chuỗi nhà hàng lớn.</p>
                    {packages.length > 0 && (
                        <div className="mt-8 inline-flex items-center bg-[#042014] rounded-full p-1 border border-white/10">
                            <button className="px-6 py-2 rounded-full bg-green-500 text-white text-sm font-bold shadow-lg">
                                Phổ biến nhất
                            </button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                    </div>
                ) : packages.length === 0 ? (
                    <p className="text-center text-gray-500">Chưa có gói dịch vụ nào.</p>
                ) : (
                    <div
                        className={`grid gap-8 items-start ${packages.length === 1
                            ? "grid-cols-1 max-w-sm mx-auto"
                            : packages.length === 2
                                ? "md:grid-cols-2 max-w-2xl mx-auto"
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
                                    className={`relative p-8 rounded-2xl transition-all duration-300 ${isPopular
                                        ? "bg-[#042014] border border-green-500 shadow-xl shadow-green-900/10 md:-translate-y-4"
                                        : "bg-[#03180f] border border-white/5 hover:border-white/20 hover:-translate-y-1"
                                        }`}
                                >
                                    {/* Phổ biến nhất badge */}
                                    {isPopular && (
                                        <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                            PHỔ BIẾN NHẤT
                                        </div>
                                    )}

                                    {/* Tên gói */}
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {pkg.PackageName || pkg.packageName}
                                    </h3>

                                    {/* Giá */}
                                    <div className="flex items-end gap-1 mb-1">
                                        <span className={`font-bold text-white ${isPopular ? "text-5xl" : "text-4xl"}`}>
                                            {formatPrice(pkg.Price ?? pkg.price)}
                                        </span>
                                        {(pkg.Duration || pkg.duration) && (
                                            <span className="text-gray-500 text-sm mb-1">
                                                /{pkg.Duration || pkg.duration} tháng
                                            </span>
                                        )}
                                    </div>

                                    {/* Mô tả ngắn (nếu có) */}
                                    {pkg.description && (
                                        <p className="text-gray-500 text-sm mb-6">{pkg.description}</p>
                                    )}

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => handleCTA(pkg.PackageName || pkg.packageName)}
                                        className={`w-full py-3 rounded-xl font-bold transition mt-4 mb-8 ${isPopular
                                            ? "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20"
                                            : "bg-[#0a2e1e] text-green-500 hover:bg-[#0f422b]"
                                            }`}
                                    >
                                        Đăng Kí Ngay
                                    </button>

                                    {/* Features list */}
                                    {features.length > 0 && (
                                        <ul className="space-y-4 text-sm text-gray-400">
                                            {features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-green-500 text-lg">
                                                        check_circle
                                                    </span>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
