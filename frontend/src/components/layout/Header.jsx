import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Điều hướng khi ấn "Hồ sơ" tùy theo role
  const handleProfile = () => {
    setOpen(false);
    if (!user) return;
    if (user.role === "RestaurantOwner") {
      navigate("/owner/dashboard");
    } else if (user.role === "Admin") {
      navigate("/admin/dashboard");
    } else {
      // Staff / Customer: xem trạng thái đơn đăng ký
      navigate("/pending-status");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#02140c]/80 backdrop-blur border-b border-white/10">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex items-center gap-3 font-bold text-gray-1000 dark:text-white">
            <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8H4c-1.1 0-2 .9-2 2v3c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3c0-1.1-.9-2-2-2zm0 7H4c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2zM3 5c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2s-.9-2-2-2H5c-1.1 0-2 .9-2 2z" />
            </svg>
            RestoManager
          </div>
        </Link>

        {/* NAV LINKS */}
        <nav className="hidden md:flex items-center gap-8">
          {['Tính năng', 'Bảng giá', 'Giải pháp', 'Liên hệ'].map((item) => (
            <a key={item} href="#" className="text-sm font-medium text-gray-300 hover:text-white transition">
              {item}
            </a>
          ))}
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">

          {/* ADMIN DASHBOARD LINK */}
          {user && user.role === 'Admin' && (
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition font-semibold text-sm"
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
          )}

          {/* CART */}


          {/* AUTH */}
          {!user ? (
            <Link
              to="/login"
              className="h-9 px-4 rounded-xl bg-orange-500 text-white text-sm font-bold
                hover:bg-orange-600 transition flex items-center justify-center"
            >
              Đăng nhập
            </Link>
          ) : (
            <div className="relative">
              {/* Avatar */}
              <button onClick={() => setOpen(!open)}>
                <img
                  src={user.avatar || "https://i.pravatar.cc/100"}
                  className="w-9 h-9 rounded-full border-2 border-orange-400"
                />
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-lg
                  border border-gray-100 overflow-hidden">
                  <button
                    onClick={handleProfile}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    {user.role === "RestaurantOwner" ? "🏪 Quản lý nhà hàng" : "👤 Hồ sơ"}
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50"
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
