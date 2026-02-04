export default function Footer() {
  return (
    <footer className="bg-[#02140c] pt-20 pb-10 text-gray-400 border-t border-white/10">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold">R</div>
            <span className="font-bold text-xl text-white">RestoManager</span>
          </div>
          <p className="text-sm leading-relaxed mb-6">
            Giải pháp SaaS tối ưu cho mọi nhà hàng tại Việt Nam. Chúng tôi cam kết mang lại giá trị thực cho doanh nghiệp của bạn.
          </p>
          <div className="flex gap-4">
            {['globe', 'wifi', 'call'].map(icon => (
              <div key={icon} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-green-500 hover:text-white transition cursor-pointer">
                <span className="material-symbols-outlined text-sm">{icon}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Sản phẩm</h4>
          <ul className="space-y-4 text-sm">
            {['Tính năng chính', 'Các màn QR', 'Báo cáo doanh thu', 'Cập nhật phần mềm'].map(item => (
              <li key={item}><a href="#" className="hover:text-green-500 transition">{item}</a></li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Hỗ trợ</h4>
          <ul className="space-y-4 text-sm">
            {['Trung tâm trợ giúp', 'Tài liệu API', 'Chính sách bảo mật', 'Điều khoản dịch vụ'].map(item => (
              <li key={item}><a href="#" className="hover:text-green-500 transition">{item}</a></li>
            ))}
          </ul>
        </div>

        {/* Office */}
        <div>
          <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Văn phòng</h4>
          <p className="text-sm mb-4">Tòa nhà TechHub, 123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh</p>
          <div className="w-full h-32 bg-gray-800 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-gray-600">map</span>
          </div>
        </div>

      </div>

      <div className="max-w-[1200px] mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <p>© 2024 RestoManager. Tất cả quyền được bảo lưu.</p>
        <div className="flex gap-6">
          <span>Tiếng Việt</span>
          <span>English</span>
        </div>
      </div>
    </footer>
  );
}
