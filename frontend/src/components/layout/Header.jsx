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
    <header className="sticky top-0 z-50 bg-[#02140c]/80 backdrop-blur border-b border-white/10">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold text-lg">
            R
          </div>
          <span className="font-bold text-xl text-white">RestoManager</span>
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
          <Link
            to="/login"
            className="text-sm font-medium text-gray-300 hover:text-white transition"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="h-9 px-5 rounded bg-green-500 text-white text-sm font-bold
                hover:bg-green-600 transition flex items-center justify-center"
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </header>
  );
}
