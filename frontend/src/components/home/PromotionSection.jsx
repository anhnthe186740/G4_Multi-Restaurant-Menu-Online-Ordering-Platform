function PromotionSection() {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6">Ưu đãi đặc biệt</h2>

      <div className="bg-primary rounded-xl p-8 text-white">
        <span className="text-xs font-bold uppercase">Ưu đãi có hạn</span>
        <h2 className="text-4xl font-bold mt-2">
          Giảm 20% cho đơn đầu tiên
        </h2>
        <p className="mt-2">
          Nhập mã <b>FRESH20</b> khi thanh toán
        </p>
        <button className="mt-6 bg-white text-primary px-6 py-3 rounded-lg font-bold">
          Nhận ưu đãi
        </button>
      </div>
    </section>
  );
}

export default PromotionSection;
