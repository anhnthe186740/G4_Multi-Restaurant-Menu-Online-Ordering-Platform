import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Logo from "./Logo";

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
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">

        {/* LOGO */}
        <Logo size="md" />

        {/* NAV LINKS */}
        <nav className="hidden md:flex items-center gap-10">
          {[
            { name: 'Tính năng', path: '/features' },
            { name: 'Bảng giá', path: '/pricing' },
            { name: 'Giải pháp', path: '/solutions' },
            { name: 'Liên hệ', path: '/contact' }
          ].map((item) => (
            <Link 
              key={item.name} 
              to={item.path} 
              className="text-sm font-semibold text-gray-400 hover:text-emerald-400 transition-colors duration-300 relative group"
            >
              {item.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-5">

          {/* ADMIN DASHBOARD LINK */}
          {user && user.role === 'Admin' && (
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all duration-300 font-bold text-sm border border-emerald-500/20"
            >
              📊 Dashboard
            </Link>
          )}

          {/* AUTH */}
          {!user ? (
            <Link
              to="/login"
              className="h-10 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold
                hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center active:scale-95"
            >
              Đăng nhập
            </Link>
          ) : (
            <div className="relative">
              {/* Avatar */}
              <button 
                onClick={() => setOpen(!open)}
                className="focus:outline-none transition-transform duration-300 active:scale-90"
              >
                <img
                  src={user.avatar || "https://i.pravatar.cc/100"}
                  className="w-10 h-10 rounded-xl border-2 border-emerald-500/30 object-cover p-0.5"
                />
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 mt-4 w-56 glass rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                    <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={handleProfile}
                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors flex items-center gap-3"
                  >
                    <span className="text-lg">{user.role === "RestaurantOwner" ? "🏪" : "👤"}</span>
                    <span>{user.role === "RestaurantOwner" ? "Quản lý nhà hàng" : "Hồ sơ cá nhân"}</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                  >
                    <span className="text-lg">🚪</span>
                    <span>Đăng xuất</span>
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
