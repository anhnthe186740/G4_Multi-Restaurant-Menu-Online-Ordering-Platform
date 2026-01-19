export default function RestaurantCard({ data }) {
  return (
    <div className="bg-white dark:bg-white/5 rounded-xl border border-[#eaf0ed] dark:border-white/10 overflow-hidden hover:shadow-md transition">
      
      <div
        className="aspect-[16/9] bg-cover bg-center"
        style={{ backgroundImage: `url(${data.image})` }}
      />

      <div className="p-4">
        <div className="flex justify-between mb-1">
          <h4 className="font-bold text-lg">{data.name}</h4>
          <span className="text-primary font-bold text-sm">
            ⭐ {data.rating}
          </span>
        </div>

        <p className="text-sm text-[#608573] mb-3">{data.type}</p>

        <div className="flex gap-2 text-xs">
          <span className="bg-primary text-white px-2 py-0.5 rounded-full">
            {data.tag}
          </span>
          <span className="text-[#608573]">{data.distance}</span>
        </div>
      </div>
    </div>
  );
}
