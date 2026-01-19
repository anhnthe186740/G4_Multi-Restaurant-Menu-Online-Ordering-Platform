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

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#eaf0ed]">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-3">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                    <div className="flex items-center gap-3 font-bold text-gray-1000 dark:text-white">
                        <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 8H4c-1.1 0-2 .9-2 2v3c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3c0-1.1-.9-2-2-2zm0 7H4c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2zM3 5c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2s-.9-2-2-2H5c-1.1 0-2 .9-2 2z" />
                        </svg>
                        OderEat
                    </div>
        </Link>

        {/* SEARCH */}
        <div className="flex flex-1 max-w-xl mx-8">
          <input
            placeholder="Tìm món ngon ngay..."
            className="w-full h-10 rounded-xl bg-[#eaf0ed] px-4 text-sm outline-none
              focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">

          {/* CART */}
          <button className="relative">
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="absolute -top-1 -right-1 size-4 bg-orange-500 text-white text-[10px]
              rounded-full flex items-center justify-center">
              3
            </span>
          </button>

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
                  <Link
                    to="/profile"
                    className="block px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    👤 Hồ sơ
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    📦 Đơn hàng
                  </Link>
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
