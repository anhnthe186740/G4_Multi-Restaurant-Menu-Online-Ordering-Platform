import RestaurantCard from "./RestaurantCard";

function NearbySection() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Gần bạn nhất</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RestaurantCard
          name="Bella Napoli Pizzeria"
          rating="4.8"
          desc="Ý • Pizza • $$"
          image="https://images.unsplash.com/photo-1600891964599-f61ba0e24092"
        />
        <RestaurantCard
          name="Sushi Kyo Zen"
          rating="4.6"
          desc="Nhật • Sushi • $$$"
          image="https://images.unsplash.com/photo-1553621042-f6e147245754"
        />
        <RestaurantCard
          name="Craft Burger Co."
          rating="4.9"
          desc="Mỹ • Burger • $$"
          image="https://images.unsplash.com/photo-1550547660-d9450f859349"
        />
      </div>
    </section>
  );
}

export default NearbySection;
