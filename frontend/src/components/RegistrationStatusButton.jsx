import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, ArrowRight, ChevronRight } from "lucide-react";

/**
 * Floating button hiển thị ở góc dưới-phải của màn hình.
 * Chỉ hiện khi:
 * - User đã đăng nhập (có token)
 * - Role là "Staff" hoặc "RestaurantOwner" (chưa phải Admin)
 * - Có đơn đăng ký nhà hàng (Pending / Approved / Rejected)
 */
export default function RegistrationStatusButton() {
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState(null); // null | "Pending" | "Approved" | "Rejected"
    const [restaurantName, setRestaurantName] = useState("");

    useEffect(() => {
        const user = (() => {
            try { return JSON.parse(localStorage.getItem("user")); }
            catch { return null; }
        })();
        const token = localStorage.getItem("token");

        // Chỉ check nếu user đã login và không phải Admin
        if (!token || !user || user.role === "Admin") return;

        const check = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/admin/registration-requests/my-status", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                // Token không hợp lệ → dừng, không hiện nút
                if (res.status === 401) return;
                if (!res.ok) return;
                const data = await res.json();
                if (data.hasRequest) {
                    setStatus(data.status);
                    setRestaurantName(data.restaurantName || "Nhà hàng của bạn");
                }
            } catch { /* bỏ qua lỗi mạng */ }
        };

        check();
    }, [location.pathname]); // re-check khi chuyển trang

    if (!status) return null;

    // Không hiện trên trang pending-status và owner dashboard
    if (["/pending-status", "/owner/dashboard", "/owner/settings"].includes(location.pathname)) return null;

    const config = {
        Pending: {
            bg: "bg-yellow-500 hover:bg-yellow-400",
            icon: <Clock className="w-4 h-4" />,
            label: "Đang chờ duyệt",
            sub: restaurantName,
        },
        Approved: {
            bg: "bg-green-500 hover:bg-green-400",
            icon: <ArrowRight className="w-4 h-4" />,
            label: "Vào trang quản lý",
            sub: restaurantName,
        },
        Rejected: {
            bg: "bg-red-500 hover:bg-red-400",
            icon: <ChevronRight className="w-4 h-4" />,
            label: "Đơn bị từ chối",
            sub: "Xem chi tiết & gửi lại",
        },
    };

    const cfg = config[status];

    const handleClick = () => {
        if (status === "Approved") {
            navigate("/owner/dashboard");
        } else {
            navigate("/pending-status");
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl text-white shadow-2xl transition-all duration-300 ${cfg.bg}`}
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
        >
            <div className="flex flex-col items-start text-left">
                <span className="text-xs font-bold leading-none">{cfg.label}</span>
                <span className="text-xs opacity-80 mt-0.5 max-w-[140px] truncate">{cfg.sub}</span>
            </div>
            {cfg.icon}
        </button>
    );
}
