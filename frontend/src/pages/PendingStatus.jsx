import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, XCircle, ArrowRight, RefreshCw } from "lucide-react";

const STATUS_CONFIG = {
    Pending: {
        icon: Clock,
        color: "text-yellow-400",
        bg: "bg-yellow-400/10 border-yellow-400/30",
        badge: "bg-yellow-400/20 text-yellow-300",
        title: "Đơn đang chờ xét duyệt",
        desc: "Chúng tôi đang xem xét đơn đăng ký của bạn. Thường mất 1–2 ngày làm việc.",
    },
    Approved: {
        icon: CheckCircle2,
        color: "text-green-400",
        bg: "bg-green-400/10 border-green-400/30",
        badge: "bg-green-400/20 text-green-300",
        title: "Đơn đã được phê duyệt! 🎉",
        desc: "Nhà hàng của bạn đã được tạo thành công. Hãy vào trang quản lý để bắt đầu.",
    },
    Rejected: {
        icon: XCircle,
        color: "text-red-400",
        bg: "bg-red-400/10 border-red-400/30",
        badge: "bg-red-400/20 text-red-300",
        title: "Đơn đã bị từ chối",
        desc: "Rất tiếc, đơn đăng ký của bạn không được phê duyệt.",
    },
};

export default function PendingStatus() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sessionExpired, setSessionExpired] = useState(false);

    const fetchStatus = async () => {
        setLoading(true);
        setError("");
        setSessionExpired(false);
        try {
            const token = localStorage.getItem("token");
            if (!token) { setSessionExpired(true); setLoading(false); return; }

            const res = await fetch("http://localhost:5000/api/admin/registration-requests/my-status", {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Token hết hạn / không hợp lệ
            if (res.status === 401 || res.status === 403) {
                setSessionExpired(true);
                setLoading(false);
                return;
            }

            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            setData(json);
        } catch (e) {
            setError(e.message || "Không thể tải trạng thái. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStatus(); }, []);

    const handleReLogin = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    // Khi đơn được duyệt: refresh token để cập nhật role mới (Staff → RestaurantOwner)
    // rồi mới chuyển vào dashboard
    const handleGoToDashboard = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/auth/refresh-token", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                if (json.token) localStorage.setItem("token", json.token);
                if (json.user) localStorage.setItem("user", JSON.stringify(json.user));
            }
        } catch { /* nếu lỗi vẫn thử navigate */ }
        // Reload trang để React re-read localStorage rồi vào dashboard
        window.location.href = "/owner/dashboard";
    };

    const formatDate = (d) => d ? new Date(d).toLocaleString("vi-VN") : null;

    return (
        <div className="min-h-screen bg-[#02140c] text-white flex flex-col items-center justify-center px-4 py-16">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-[#00c04b]/5 blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-lg">
                {/* Back button */}
                <button
                    onClick={() => navigate("/")}
                    className="mb-8 text-sm text-gray-400 hover:text-white flex items-center gap-2 transition"
                >
                    ← Về trang chủ
                </button>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-12 h-12 border-4 border-[#00c04b]/30 border-t-[#00c04b] rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Đang kiểm tra trạng thái...</p>
                    </div>
                ) : sessionExpired ? (
                    <div className="bg-[#062519] border border-yellow-500/30 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-yellow-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Phiên đăng nhập đã hết hạn</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Vui lòng đăng nhập lại để xem trạng thái đơn đăng ký.
                        </p>
                        <button
                            onClick={handleReLogin}
                            className="w-full py-3 rounded-xl bg-[#00c04b] text-white font-bold hover:bg-[#00d654] transition"
                        >
                            Đăng nhập lại
                        </button>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-400 mb-6">{error}</p>
                        <button onClick={fetchStatus} className="flex items-center gap-2 mx-auto px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm">
                            <RefreshCw className="w-4 h-4" /> Thử lại
                        </button>
                    </div>
                ) : !data?.hasRequest ? (
                    /* Chưa có đơn */
                    <div className="bg-[#062519] border border-[#133827] rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Chưa có đơn đăng ký</h2>
                        <p className="text-gray-400 text-sm mb-6">Bạn chưa gửi đơn đăng ký nhà hàng nào.</p>
                        <button
                            onClick={() => navigate("/register-restaurant")}
                            className="px-6 py-3 rounded-xl bg-[#00c04b] text-white font-bold hover:bg-[#00d654] transition"
                        >
                            Đăng ký ngay
                        </button>
                    </div>
                ) : (() => {
                    /* Có đơn — hiển thị trạng thái */
                    const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.Pending;
                    const Icon = cfg.icon;
                    return (
                        <div className={`bg-[#062519] border rounded-2xl p-8 ${cfg.bg}`}>
                            {/* Icon + badge */}
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${cfg.bg}`}>
                                    <Icon className={`w-10 h-10 ${cfg.color}`} />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold mb-3 ${cfg.badge}`}>
                                    {data.status === "Pending" ? "Đang chờ duyệt" : data.status === "Approved" ? "Đã phê duyệt" : "Bị từ chối"}
                                </span>
                                <h1 className="text-2xl font-bold mb-2">{cfg.title}</h1>
                                <p className="text-gray-400 text-sm">{cfg.desc}</p>
                            </div>

                            {/* Thông tin đơn */}
                            <div className="bg-black/20 rounded-xl p-4 space-y-3 mb-6 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Tên nhà hàng</span>
                                    <span className="font-semibold">{data.restaurantName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Ngày gửi đơn</span>
                                    <span>{formatDate(data.submissionDate)}</span>
                                </div>
                                {data.approvedDate && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Ngày xử lý</span>
                                        <span>{formatDate(data.approvedDate)}</span>
                                    </div>
                                )}
                                {data.status === "Rejected" && data.adminNote && !data.adminNote.startsWith("__FORM_DATA__") && (
                                    <div className="pt-2 border-t border-white/10">
                                        <p className="text-gray-400 mb-1">Lý do từ chối:</p>
                                        <p className="text-red-300 text-xs">{data.adminNote}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="space-y-3">
                                {data.status === "Approved" && (
                                    <button
                                        onClick={handleGoToDashboard}
                                        className="w-full py-3 rounded-xl bg-[#00c04b] text-white font-bold hover:bg-[#00d654] transition flex items-center justify-center gap-2"
                                    >
                                        Vào trang quản lý <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                                {data.status === "Pending" && (
                                    <button
                                        onClick={fetchStatus}
                                        className="w-full py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" /> Làm mới trạng thái
                                    </button>
                                )}
                                {data.status === "Rejected" && (
                                    <button
                                        onClick={() => navigate("/register-restaurant")}
                                        className="w-full py-3 rounded-xl bg-[#00c04b] text-white font-bold hover:bg-[#00d654] transition"
                                    >
                                        Gửi lại đơn mới
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate("/")}
                                    className="w-full py-3 rounded-xl border border-white/10 text-gray-400 font-semibold hover:text-white hover:border-white/30 transition"
                                >
                                    Về trang chủ
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
