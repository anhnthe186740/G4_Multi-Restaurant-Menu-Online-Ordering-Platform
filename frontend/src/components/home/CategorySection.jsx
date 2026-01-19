const categories = [
  { icon: "local_pizza", label: "Pizza" },
  { icon: "set_meal", label: "Sushi" },
  { icon: "lunch_dining", label: "Bánh mì" },
  { icon: "eco", label: "Healthy" },
  { icon: "bakery_dining", label: "Tráng miệng" },
  { icon: "ramen_dining", label: "Món Á" },
  { icon: "soup_kitchen", label: "Súp" },
  { icon: "icecream", label: "Kem" },
];

export default function CategorySection() {
  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Danh mục</h3>
        <button className="text-primary text-sm font-semibold">
          Xem tất cả →
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto hide-scrollbar">
        {categories.map((c) => (
          <div
            key={c.label}
            className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer"
          >
            <div className="size-16 rounded-full bg-white dark:bg-white/5 shadow-sm flex items-center justify-center text-primary hover:bg-primary hover:text-white transition">
              <span className="material-symbols-outlined text-3xl">
                {c.icon}
              </span>
            </div>
            <span className="text-xs font-semibold">{c.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
