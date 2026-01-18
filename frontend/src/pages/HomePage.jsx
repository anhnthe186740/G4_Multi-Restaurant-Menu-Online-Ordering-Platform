import CategorySection from "../components/home/CategorySection";
import PromotionSection from "../components/home/PromotionSection";
import NearbySection from "../components/home/NearbySection";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-16">
      <CategorySection />
      <PromotionSection />
      <NearbySection />
    </div>
  );
}
