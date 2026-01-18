export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#eaf0ed] px-6 md:px-10 lg:px-40 py-3">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-3xl">
            restaurant_menu
          </span>
          <h2 className="text-xl font-bold">FreshFlavors</h2>
        </div>

        <button className="relative">
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="absolute -top-1 -right-1 size-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
            3
          </span>
        </button>
      </div>
    </header>
  );
}
