const categories = [
  { icon: "local_pizza", label: "Pizza" },
  { icon: "set_meal", label: "Sushi" },
  { icon: "lunch_dining", label: "Bánh mì" },
  { icon: "eco", label: "Healthy" },
  { icon: "icecream", label: "Kem" },
];

function CategorySection() {
  return (
    <section className="mb-10">
      <h3 className="text-lg font-bold mb-4">Danh mục</h3>
      <div className="flex gap-4 overflow-x-auto">
        {categories.map((c) => (
          <div
            key={c.label}
            className="flex flex-col items-center gap-2 cursor-pointer"
          >
            <div className="size-16 rounded-full bg-white shadow flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">
                {c.icon}
              </span>
            </div>
            <p className="text-xs font-semibold">{c.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CategorySection;
