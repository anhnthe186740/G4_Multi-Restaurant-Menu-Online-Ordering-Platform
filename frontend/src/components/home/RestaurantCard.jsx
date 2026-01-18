function RestaurantCard({ name, rating, desc, image }) {
  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      <div
        className="aspect-[16/9] bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="p-4">
        <div className="flex justify-between">
          <h4 className="font-bold">{name}</h4>
          <span className="text-primary font-bold">{rating}</span>
        </div>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

export default RestaurantCard;
