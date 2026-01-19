export default function PromotionSection() {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6">Ưu đãi đặc biệt</h2>

      <div className="flex gap-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-4">

        {/* Promo 1 – FIX MÀU */}
        <div className="w-full md:w-[700px] h-64 snap-start rounded-xl 
          bg-emerald-600 text-white p-8 flex flex-col justify-center shadow-lg">
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full w-fit mb-4">
            Ưu đãi có hạn
          </span>
          <h3 className="text-4xl font-bold mb-2">
            Giảm 20% cho đơn đầu tiên
          </h3>
          <p className="mb-6">
            Nhập mã <b>FRESH20</b> khi thanh toán
          </p>
          <button className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-bold w-fit">
            Nhận ưu đãi
          </button>
        </div>

        {/* Promo 2 */}
        <div className="w-full md:w-[700px] h-64 snap-start rounded-xl 
          bg-black text-white p-8 flex flex-col justify-center shadow-lg">
          <span className="text-xs bg-emerald-600 px-3 py-1 rounded-full w-fit mb-4">
            Miễn phí giao hàng
          </span>
          <h3 className="text-4xl font-bold mb-2">
            Tiệc cuối tuần bùng nổ
          </h3>
          <p className="mb-6">
            Freeship cho đơn trên 300k
          </p>
          <button className="bg-emerald-600 px-6 py-3 rounded-lg font-bold w-fit">
            Đặt ngay
          </button>
        </div>

      </div>
    </section>
  );
}
