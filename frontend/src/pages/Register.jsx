import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../api/authApi";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("Gửi request register:", form);
      const response = await registerApi(form);
      console.log("Register response:", response);
      
      alert("✓ Đăng ký thành công!");
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (err) {
      console.error("Register error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Lỗi đăng ký";
      alert("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background-light dark:bg-background-dark flex flex-col transition-colors duration-300">
      
      {/* ===== Background blobs ===== */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] opacity-30" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* ===== Header ===== */}
        <header className="flex items-center justify-between
          px-6 py-2
          border-b border-gray-200 dark:border-border-dark
          bg-white/80 dark:bg-background-paper/90
          backdrop-blur">
          <div className="flex items-center gap-4 text-gray-900 dark:text-white">
            <div className="w-6 h-6 text-primary">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 8H4c-1.1 0-2 .9-2 2v3c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3c0-1.1-.9-2-2-2zm0 7H4c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2zM3 5c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2s-.9-2-2-2H5c-1.1 0-2 .9-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold tracking-tight">OderEat</h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 font-medium">
              Đã có tài khoản?
            </span>
            <Link
              to="/login"
              className="min-w-[84px] h-10 px-4 rounded-xl bg-[#00c04b] text-white text-sm font-bold border border-transparent hover:bg-[#00a841] transition flex items-center justify-center shadow-sm"
            >
              Đăng nhập
            </Link>
          </div>
        </header>

        {/* ===== Main ===== */}
        <main className="flex-1 flex items-stretch justify-center">
          
          {/* LEFT - IMAGE SECTION */}
          <div className="w-full md:w-1/2 relative overflow-hidden bg-background-dark items-center justify-center p-8 flex">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 opacity-60"
              style={{
                // Bạn có thể thay đổi ảnh này nếu muốn
                backgroundImage: "url('https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop')" 
              }}
            />
            {/* Gradient Overlay để hòa vào nền xanh */}
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background-dark/80 to-transparent" />
            
            <div className="relative z-10 max-w-md text-white text-center px-4">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20">
                <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 8H4c-1.1 0-2 .9-2 2v3c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3c0-1.1-.9-2-2-2zm0 7H4c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2zM3 5c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2s-.9-2-2-2H5c-1.1 0-2 .9-2 2z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold mb-4">Gia nhập cuộc cách mạng ẩm thực</h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                Trải nghiệm hệ thống quản lý thực phẩm trực quan nhất được thiết kế cho sự xuất sắc trong ẩm thực
              </p>
            </div>
          </div>

          {/* RIGHT - FORM SECTION */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-background-light dark:bg-background-dark">
            <div className="w-full max-w-[440px] 
              bg-white dark:bg-background-paper 
              rounded-xl 
              shadow-[0_20px_50px_rgba(0,0,0,0.3)] 
              p-4 border border-gray-100 dark:border-border-dark">
              
              {/* Title */}
              <div className="mb-8 text-center">
                <h1 className="text-[28px] font-bold text-gray-900 dark:text-white">
                  Đăng ký tài khoản
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Tham gia cùng hàng ngàn đầu bếp và những người yêu ẩm thực
                </p>
              </div>

              {/* Form */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên người dùng (username)
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Tên đăng nhập"
                    required
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-background-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 dark:focus:border-primary transition"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                    required
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-background-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 dark:focus:border-primary transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Nhập email"
                    required
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-background-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 dark:focus:border-primary transition"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-background-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 dark:focus:border-primary transition"
                  />
                </div>

                {/* role removed - backend will default to 'Staff' */}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu"
                    required
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-background-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 dark:focus:border-primary transition"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl
                    bg-[#00c04b] text-white
                    text-sm font-bold
                    shadow-lg shadow-[0_10px_30px_rgba(0,192,75,0.25)]
                    hover:bg-[#00a841]
                    active:scale-[0.98]
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-all duration-200"
                >
                  {loading ? "Đang xử lý..." : "Tham gia ngay"}
                </button>

                {/* Login Link */}
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Đã có tài khoản?{" "}
                  <Link
                    to="/login"
                    className="text-primary font-bold hover:underline"
                  >
                    Đăng nhập
                  </Link>
                </div>
              </form>

            </div>
          </div>

        </main>
      </div>
    </div>
  );
}