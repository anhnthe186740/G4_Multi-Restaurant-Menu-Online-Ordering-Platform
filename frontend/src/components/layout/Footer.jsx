import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-[#020617] text-gray-400 border-t border-white/5 py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
          
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Logo size="md" className="mb-6" />
            <p className="max-w-xs text-sm leading-relaxed mb-8">
              Giải pháp vận hành nhà hàng thông minh nhất hiện nay. Giúp bạn số hóa quy trình và tối đa hóa lợi nhuận.
            </p>
            <div className="flex gap-4">
              {['facebook', 'twitter', 'instagram', 'linkedin'].map(social => (
                <a key={social} href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all duration-300">
                  <i className={`fab fa-${social}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Sản phẩm</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Tính năng chính</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Đặt món QR Table</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Hệ thống KDS</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Cập nhật mới nhất</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Hỗ trợ</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Trung tâm hỗ trợ</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Hợp tác đại lý</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Chính sách bảo mật</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Trụ sở</h4>
            <p className="text-sm leading-relaxed mb-6">
              Toà nhà TechHub, 123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh
            </p>
            <div className="bg-white/5 rounded-2xl h-32 flex items-center justify-center border border-white/5">
                <span className="material-symbols-outlined text-gray-600 text-4xl">map</span>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs">© 2026 GastroAdmin. Powered by Antigravity.</p>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest leading-none">
            <a href="#" className="hover:text-white transition-colors border-b border-transparent hover:border-white">Tiếng Việt</a>
            <a href="#" className="hover:text-white transition-colors border-b border-transparent hover:border-white">English</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
