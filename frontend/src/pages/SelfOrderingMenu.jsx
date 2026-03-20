import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ShoppingCart, Plus, Minus, ChefHat, MapPin, AlertCircle } from "lucide-react";
import { getMenuByTable, createPublicOrder } from "../api/publicApi";

export default function SelfOrderingMenu() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("tableId");

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState({}); // { productID: quantity }
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    if (!tableId) {
      setError("Không tìm thấy bàn. Vui lòng quét lại mã QR trên bàn.");
      setLoading(false);
      return;
    }

    getMenuByTable(tableId)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Fetch menu error", err);
        setError(err.response?.data?.message || "Lỗi tải dữ liệu nhà hàng.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tableId]);

  // --- Handlers ---
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const handleUpdateCart = (id, delta) => {
    setCart((prev) => {
      const currentQty = prev[id] || 0;
      const newQty = currentQty + delta;
      
      if (newQty <= 0) {
        const newCart = { ...prev };
        delete newCart[id];
        return newCart;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const handlePlaceOrder = () => {
    setShowConfirmModal(true);
  };

  const confirmOrder = async () => {
    setIsSubmitting(true);
    try {
      const allFoods = data.categories.flatMap((c) => c.products);
      const items = Object.entries(cart).map(([id, qty]) => {
        const food = allFoods.find((f) => f.productID.toString() === id);
        return {
          productID: food.productID,
          quantity: qty,
          price: food.price,
        };
      });

      await createPublicOrder({ tableId: tableId, items });

      setShowConfirmModal(false);
      alert(`Đã gửi đơn hàng cho ${data.table.name} thành công!\nNhà bếp đang chuẩn bị món cho bạn.`);
      setCart({});
    } catch (err) {
      alert("Lỗi đặt món: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Loading & Error UI ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium tracking-wide">Đang tải thực đơn...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-red-100 max-w-sm w-full text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Không thể tải thực đơn</h2>
          <p className="text-gray-500 mb-6 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // --- Derived Data ---
  const { restaurant, branch, table, categories } = data;
  
  const allFoods = categories.flatMap((c) => 
    c.products.map(p => ({ ...p, categoryId: c.categoryID }))
  );

  const filteredFoods = allFoods.filter((food) => {
    const matchCategory = activeCategory === "all" || food.categoryId === activeCategory;
    const matchSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotalPrice = allFoods.reduce((sum, food) => {
    return sum + (cart[food.productID] || 0) * parseFloat(food.price);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* Mobile Frame Simulation */}
      <div className="w-full max-w-[480px] bg-gray-50 min-h-screen relative shadow-2xl flex flex-col">
        
        {/* === TOP STICKY HEADER === */}
        <div className="sticky top-0 z-40 bg-white px-4 pb-3 pt-4 border-b border-gray-100 shadow-sm">
          {/* Context Line */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3 font-semibold tracking-wide">
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-emerald-500" /> 
              CN: {branch.name}
            </span>
            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 shadow-inner font-bold uppercase">
              {table.name}
            </span>
          </div>

          {/* Restaurant Info */}
          <div className="flex items-center gap-3 mb-4">
            {restaurant.logo ? (
              <img 
                src={restaurant.logo} 
                alt="Logo" 
                className="w-12 h-12 rounded-xl object-cover shadow-sm bg-gray-100 border border-gray-100"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl shadow-sm bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ChefHat size={20} />
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-gray-800 leading-tight">
                {restaurant.name}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Thực đơn tự phục vụ (QRDine)</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 text-sm rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-gray-700"
            />
          </div>
        </div>

        {/* === CATEGORY SCROLL (Sticky under header) === */}
        {categories.length > 0 && (
          <div className="sticky top-[152px] z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="flex overflow-x-auto hide-scrollbar px-4 py-3 gap-2">
              <button
                onClick={() => setActiveCategory("all")}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === "all"
                    ? "bg-gray-900 text-white shadow-md shadow-gray-900/20"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.categoryID}
                  onClick={() => setActiveCategory(cat.categoryID)}
                  className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    activeCategory === cat.categoryID
                      ? "bg-gray-900 text-white shadow-md shadow-gray-900/20"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* === MAIN CONTENT (Food List) === */}
        <div className="flex-1 p-4 pb-28 space-y-4">
          {filteredFoods.length === 0 && (
            <div className="text-center py-20 text-gray-400 flex flex-col items-center">
              <ChefHat size={40} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">Không tìm thấy món nào.</p>
            </div>
          )}

          {filteredFoods.map((food) => {
            const qty = cart[food.productID] || 0;
            return (
              <div 
                key={food.productID} 
                className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-3 hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                  {food.imageURL ? (
                    <img src={food.imageURL} alt={food.name} className="w-full h-full object-cover" />
                  ) : (
                    <ChefHat size={28} className="text-gray-300" />
                  )}
                </div>

                {/* Details & Actions */}
                <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight truncate">
                      {food.name}
                    </h3>
                    {food.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 pr-1">
                        {food.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-extrabold text-emerald-600 text-sm">
                      {formatPrice(food.price)}
                    </span>

                    {/* Add / Qty Control */}
                    {qty === 0 ? (
                      <button
                        onClick={() => handleUpdateCart(food.productID, 1)}
                        className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center hover:bg-emerald-100 transition shadow-sm"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-full px-1 py-1 shadow-inner">
                        <button
                          onClick={() => handleUpdateCart(food.productID, -1)}
                          className="w-7 h-7 rounded-full bg-white text-gray-600 flex items-center justify-center hover:bg-gray-100 shadow-sm border border-gray-200"
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="font-bold text-sm min-w-[12px] text-center text-gray-800">
                          {qty}
                        </span>
                        <button
                          onClick={() => handleUpdateCart(food.productID, 1)}
                          className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 shadow-sm"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* === FLOATING CART (Bottom Bar) === */}
        {cartItemsCount > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 z-50 animate-slide-up">
            <div className="bg-gray-900 rounded-2xl shadow-2xl p-1.5 flex items-center justify-between backdrop-blur-xl bg-opacity-95 border border-gray-700">
              
              <div className="flex flex-col pl-4 py-1">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                  Giỏ hàng • {cartItemsCount} món
                </span>
                <span className="text-white font-black text-lg">
                  {formatPrice(cartTotalPrice)}
                </span>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="bg-emerald-500 text-white rounded-xl px-6 py-3.5 font-bold text-sm flex items-center gap-2 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/30"
              >
                <ShoppingCart size={16} /> Đặt món
              </button>
            </div>
          </div>
        )}

        {/* === CONFIRM ORDER MODAL === */}
        {showConfirmModal && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <ChefHat size={24} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-center text-gray-900 mb-2">
                Xác nhận Đặt món?
              </h2>
              <p className="text-sm text-center text-gray-500 mb-6">
                Bạn đang đặt <strong className="text-gray-800">{cartItemsCount} món</strong> 
                cho <strong className="text-emerald-700">{table.name}</strong>.<br/>
                Tổng cộng: <strong className="text-emerald-600">{formatPrice(cartTotalPrice)}</strong>
              </p>
              
              <div className="flex gap-3">
                <button
                  disabled={isSubmitting}
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={confirmOrder}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Gửi Bếp Ngay"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inline Animations */}
        <style dangerouslySetInnerHTML={{__html:`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}} />
      </div>
    </div>
  );
}
