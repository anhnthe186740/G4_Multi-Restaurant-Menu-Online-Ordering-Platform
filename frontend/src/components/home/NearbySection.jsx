import RestaurantCard from "./RestaurantCard";

const restaurants = [
  {
    name: "Bella Napoli Pizzeria",
    rating: 4.8,
    type: "Ý • Pizza • $$",
    tag: "ĐÁNH GIÁ CAO",
    distance: "2.4 km",
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092",
  },
  {
    name: "Sushi Kyo Zen",
    rating: 4.6,
    type: "Nhật • Sushi • $$$",
    tag: "LỰA CHỌN SỨC KHỎE",
    distance: "1.8 km",
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754",
  },
  {
    name: "Craft Burger Co.",
    rating: 4.9,
    type: "Mỹ • Burger • $$",
    tag: "MUA 1 TẶNG 1",
    distance: "3.1 km",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
  },
];

export default function NearbySection() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Gần bạn nhất</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((r) => (
          <RestaurantCard key={r.name} data={r} />
        ))}
      </div>
    </section>
  );
}
