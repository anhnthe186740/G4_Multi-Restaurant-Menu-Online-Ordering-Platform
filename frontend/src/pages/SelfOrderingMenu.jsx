import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Search, ShoppingCart, Plus, Minus, ChefHat, MapPin, AlertCircle,
  ClipboardList, UtensilsCrossed, Bell, RefreshCw, CheckCircle, Loader2, X
} from "lucide-react";
import {
  getMenuByTable, createPublicOrder,
  createPublicServiceRequest, getPublicOrderByTable, cancelPublicOrderItem,
} from "../api/publicApi";
import { SOCKET_URL, UPLOADS_URL } from "../api/config";

/* ────────────────────────────────────────────────────────────
   Badge trạng thái món (giống manager drawer)
──────────────────────────────────────────────────────────── */
const ITEM_STATUS_CONFIG = {
  Pending:   { label: "Đơn mới",     bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", dot: "bg-yellow-400" },
  Cooking:   { label: "Đang nấu",   bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300", dot: "bg-orange-400" },
  Ready:     { label: "Sẵn sàng",   bg: "bg-green-100",  text: "text-green-700",  border: "border-green-300",  dot: "bg-green-400"  },
  Served:    { label: "Đã phục vụ", bg: "bg-gray-100",   text: "text-gray-500",   border: "border-gray-200",   dot: "bg-gray-400"   },
  Cancelled: { label: "Đã huỷ",     bg: "bg-red-50",     text: "text-red-400",    border: "border-red-200",    dot: "bg-red-300"    },
};

function ItemStatusBadge({ status }) {
  const cfg = ITEM_STATUS_CONFIG[status] || ITEM_STATUS_CONFIG.Pending;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
   Modal chọn số lượng huỷ (nếu món có Qty > 1)
──────────────────────────────────────────────────────────── */
function CancelQuantityModal({ item, onClose, onConfirm, isCancelling }) {
  const [qty, setQty] = useState(1);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto border border-red-200">
          <X size={24} className="text-red-600" />
        </div>
        <h2 className="text-lg font-black text-center text-gray-900 mb-1">Huỷ số lượng?</h2>
        <p className="text-sm text-center text-gray-500 mb-5">
          Bạn muốn huỷ bao nhiêu <strong className="text-gray-800">{item.productName}</strong>? (Tối đa {item.quantity})
        </p>

        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-12 h-12 rounded-full border-2 border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-90 transition-all"
          >
            <Minus size={20} strokeWidth={3} />
          </button>
          <span className="text-3xl font-black text-gray-800 min-w-[40px] text-center">
            {qty}
          </span>
          <button
            onClick={() => setQty(Math.min(item.quantity, qty + 1))}
            className="w-12 h-12 rounded-full border-2 border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 active:scale-90 transition-all"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="flex gap-3">
          <button disabled={isCancelling} onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition disabled:opacity-50">
            Đóng
          </button>
          <button
            disabled={isCancelling}
            onClick={() => onConfirm(qty)}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition shadow-lg shadow-red-500/30 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isCancelling ? <Loader2 size={18} className="animate-spin" /> : "Xác nhận huỷ"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Modal nhập ghi chú khi gọi nhân viên
──────────────────────────────────────────────────────────── */
function StaffNoteModal({ onClose, onConfirm, isSending }) {
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto border border-amber-200">
          <Bell size={24} className="text-amber-600" />
        </div>
        <h2 className="text-lg font-black text-center text-gray-900 mb-1">Gọi nhân viên hỗ trợ</h2>
        <p className="text-sm text-center text-gray-500 mb-4">
          Bạn cần hỗ trợ gì thêm không? (Ví dụ: mang thêm đá, mượn bật lửa...)
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nhập yêu cầu của bạn (tùy chọn)..."
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all min-h-[100px] mb-6 resize-none"
        />

        <div className="flex gap-3">
          <button disabled={isSending} onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition disabled:opacity-50">
            Bỏ qua
          </button>
          <button
            disabled={isSending}
            onClick={() => onConfirm(note)}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition shadow-lg shadow-amber-500/30 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : "Gửi yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Tab 1: Đơn hàng — giống hệt TableOrderPanel của manager
──────────────────────────────────────────────────────────── */
function OrderTab({ tableId, tableName }) {
  const [order, setOrder]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [callingStaff, setCallingStaff] = useState(false);
  const [staffCalled, setStaffCalled]   = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelModalItem, setCancelModalItem] = useState(null);
  const [showStaffNoteModal, setShowStaffNoteModal] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicOrderByTable(tableId);
      setOrder(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Bàn này chưa có đơn hàng nào đang mở.");
      } else {
        setError(err.response?.data?.message || "Lỗi tải đơn hàng.");
      }
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  // Realtime: lắng nghe bếp cập nhật trạng thái từng món
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("orderItemStatusChanged", ({ orderDetailID, itemStatus }) => {
      setOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(i =>
            i.orderDetailID === orderDetailID ? { ...i, itemStatus } : i
          ),
        };
      });
    });

    // Khi có tableUpdate (thanh toán, thêm món...) thì reload lại toàn bộ
    socket.on("tableUpdate", () => { loadOrder(); });

    return () => socket.disconnect();
  }, [loadOrder]);

  const handleCallStaff = async (note = "") => {
    setCallingStaff(true);
    try {
      await createPublicServiceRequest({ tableId, requestType: "GoiMon", note });
      setStaffCalled(true);
      setShowStaffNoteModal(false);
      setTimeout(() => setStaffCalled(false), 3500);
    } catch (err) {
      console.error("Gọi nhân viên lỗi:", err);
    } finally {
      setCallingStaff(false);
    }
  };

  const handleCancelItem = (item) => {
    if (item.quantity > 1) {
      setCancelModalItem(item);
    } else {
      if (!window.confirm("Huỷ món này?")) return;
      confirmCancelQuantity(item.orderDetailID, 1);
    }
  };

  const confirmCancelQuantity = async (orderDetailID, cancelQuantity) => {
    setCancellingId(orderDetailID);
    try {
      await cancelPublicOrderItem({ tableId, orderDetailID, cancelQuantity });
      setCancelModalItem(null);
      loadOrder(); 
    } catch (err) {
      alert(err.response?.data?.message || "Không thể huỷ món này.");
    } finally {
      setCancellingId(null);
    }
  };

  const activeItems    = order?.items?.filter(i => i.itemStatus !== "Cancelled") ?? [];
  const cancelledItems = order?.items?.filter(i => i.itemStatus === "Cancelled") ?? [];
  const displayTotal   = activeItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <div className="flex flex-col min-h-full">
      {/* Gọi nhân viên */}
      <div className="px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setShowStaffNoteModal(true)}
          disabled={callingStaff || staffCalled}
          className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${
            staffCalled
              ? "bg-green-100 text-green-700 border border-green-200"
              : callingStaff
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
          }`}>
          {staffCalled ? (
            <><CheckCircle size={16} /> Đã gửi yêu cầu — nhân viên sẽ đến ngay!</>
          ) : callingStaff ? (
            <><Loader2 size={16} className="animate-spin" /> Đang gửi...</>
          ) : (
            <><Bell size={16} /> 🔔 Gọi nhân viên</>
          )}
        </button>
      </div>

      {/* Danh sách món */}
      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={26} className="animate-spin text-emerald-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-14 text-center">
            <AlertCircle size={36} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button onClick={loadOrder}
              className="px-4 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition">
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <ChefHat size={14} className="text-emerald-600" /> Các món đã gọi
                <span className="text-xs font-normal text-gray-400">({activeItems.length} món)</span>
              </h3>
              <button onClick={loadOrder} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition">
                <RefreshCw size={13} />
              </button>
            </div>

            {order.items.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">Chưa có món nào được gọi</p>
            ) : (
              <div className="space-y-2">
                {order.items.map(item => {
                  const isCancelled = item.itemStatus === "Cancelled";
                  return (
                    <div key={item.orderDetailID}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                        isCancelled ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-gray-100"
                      }`}>
                      {item.imageURL ? (
                        <img
                          src={`${UPLOADS_URL}${item.imageURL}`}
                          alt={item.productName}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">🍽️</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${isCancelled ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {item.productName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">x{item.quantity}</span>
                          <span className="text-xs font-medium text-gray-600">
                            {(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-xs text-amber-600 mt-0.5 italic">📝 {item.note}</p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2">
                          <ItemStatusBadge status={item.itemStatus} />
                          {/* Nút huỷ — chỉ hiện khi Pending */}
                          {item.itemStatus === "Pending" && (
                            <button
                              onClick={() => handleCancelItem(item)}
                              disabled={cancellingId === item.orderDetailID}
                              className="ml-auto flex items-center gap-1 text-xs text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg px-2.5 py-1 transition-all disabled:opacity-40 flex-shrink-0"
                            >
                              {cancellingId === item.orderDetailID
                                ? <Loader2 size={11} className="animate-spin" />
                                : <X size={11} />}
                              Huỷ
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ghi chú khách hàng */}
            {order.customerNote && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-semibold text-amber-700 mb-0.5">📝 Ghi chú</p>
                <p className="text-xs text-amber-600">{order.customerNote}</p>
              </div>
            )}

            {/* Tổng tiền */}
            {order && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-800">Tổng cộng</span>
                  <span className="text-lg font-black text-emerald-700">
                    {displayTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                {cancelledItems.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1 text-right">Đã huỷ {cancelledItems.length} món</p>
                )}
                <p className="text-xs text-emerald-600 mt-2 text-center">
                  Để thanh toán, vui lòng gọi nhân viên 👆
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal số lượng huỷ */}
      {cancelModalItem && (
        <CancelQuantityModal
          item={cancelModalItem}
          isCancelling={cancellingId === cancelModalItem.orderDetailID}
          onClose={() => setCancelModalItem(null)}
          onConfirm={(qty) => confirmCancelQuantity(cancelModalItem.orderDetailID, qty)}
        />
      )}

      {/* Modal ghi chú gọi nhân viên */}
      {showStaffNoteModal && (
        <StaffNoteModal 
          isSending={callingStaff}
          onClose={() => setShowStaffNoteModal(false)}
          onConfirm={(note) => handleCallStaff(note)}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Tab 2: Thêm món — giống SelfOrderingMenu cũ
──────────────────────────────────────────────────────────── */
function MenuTab({ tableId, data }) {
  const { restaurant, branch, table, categories } = data;
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery]       = useState("");
  const [cart, setCart]                     = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [successMsg, setSuccessMsg]         = useState(null);

  const allFoods = categories.flatMap(c => c.products.map(p => ({ ...p, categoryId: c.categoryID })));
  const filteredFoods = allFoods.filter(food => {
    const matchCat    = activeCategory === "all" || food.categoryId === activeCategory;
    const matchSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const handleUpdateCart = (id, delta) => {
    setCart(prev => {
      const qty = (prev[id] || 0) + delta;
      if (qty <= 0) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: qty };
    });
  };

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartTotal = allFoods.reduce((s, f) => s + (cart[f.productID] || 0) * parseFloat(f.price), 0);

  const confirmOrder = async () => {
    setIsSubmitting(true);
    try {
      const items = Object.entries(cart).map(([id, qty]) => {
        const food = allFoods.find(f => f.productID.toString() === id);
        return { productID: food.productID, quantity: qty, price: food.price };
      });
      await createPublicOrder({ tableId, items });
      setShowConfirmModal(false);
      setCart({});
      setSuccessMsg(`Đã gửi ${items.length} món tới bếp! 🎉`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert("Lỗi đặt món: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex flex-col">
      {/* Search */}
      <div className="sticky top-0 z-20 bg-white px-4 py-3 border-b border-gray-100 shadow-sm">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm món ăn..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 text-sm rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-gray-700" />
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="sticky top-[57px] z-10 bg-white/90 backdrop-blur-md border-b border-gray-100">
          <div className="flex overflow-x-auto hide-scrollbar px-4 py-2.5 gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeCategory === "all" ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"
              }`}>
              Tất cả
            </button>
            {categories.map(cat => (
              <button
                key={cat.categoryID}
                onClick={() => setActiveCategory(cat.categoryID)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat.categoryID ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"
                }`}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Food List */}
      <div className="flex-1 p-4 pb-28 space-y-3">
        {filteredFoods.length === 0 && (
          <div className="text-center py-14 text-gray-400">
            <ChefHat size={36} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Không tìm thấy món nào.</p>
          </div>
        )}
        {filteredFoods.map(food => {
          const qty = cart[food.productID] || 0;
          return (
            <div key={food.productID}
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-3 hover:shadow-md transition-shadow">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                {food.imageURL ? (
                  <img src={`${UPLOADS_URL}${food.imageURL}`} alt={food.name} className="w-full h-full object-cover" />
                ) : (
                  <ChefHat size={24} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{food.name}</h3>
                  {food.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{food.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-extrabold text-emerald-600 text-sm">{formatPrice(food.price)}</span>
                  {qty === 0 ? (
                    <button onClick={() => handleUpdateCart(food.productID, 1)}
                      className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center hover:bg-emerald-100 transition shadow-sm">
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-1 py-1 shadow-inner">
                      <button onClick={() => handleUpdateCart(food.productID, -1)}
                        className="w-7 h-7 rounded-full bg-white text-gray-600 flex items-center justify-center hover:bg-gray-100 shadow-sm border border-gray-200">
                        <Minus size={13} strokeWidth={3} />
                      </button>
                      <span className="font-bold text-sm min-w-[12px] text-center">{qty}</span>
                      <button onClick={() => handleUpdateCart(food.productID, 1)}
                        className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 shadow-sm">
                        <Plus size={13} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart */}
      {cartCount > 0 && (
        <div className="sticky bottom-0 left-0 right-0 p-4 z-30 animate-slide-up">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-1.5 flex items-center justify-between border border-gray-700">
            <div className="flex flex-col pl-4 py-1">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Giỏ hàng • {cartCount} món</span>
              <span className="text-white font-black text-base">{formatPrice(cartTotal)}</span>
            </div>
            <button onClick={() => setShowConfirmModal(true)}
              className="bg-emerald-500 text-white rounded-xl px-5 py-3 font-bold text-sm flex items-center gap-2 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/30">
              <ShoppingCart size={15} /> Đặt món
            </button>
          </div>
        </div>
      )}

      {/* Toast thành công */}
      {successMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-scale-in">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <ChefHat size={24} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-black text-center text-gray-900 mb-1">Xác nhận đặt món?</h2>
            <p className="text-sm text-center text-gray-500 mb-5">
              Bạn đang đặt <strong className="text-gray-800">{cartCount} món</strong> cho{" "}
              <strong className="text-emerald-700">{table.name}</strong>.<br />
              Tổng cộng: <strong className="text-emerald-600">{formatPrice(cartTotal)}</strong>
            </p>
            <div className="flex gap-3">
              <button disabled={isSubmitting} onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition disabled:opacity-50">
                Huỷ
              </button>
              <button disabled={isSubmitting} onClick={confirmOrder}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex justify-center items-center gap-2">
                {isSubmitting
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : "Gửi Bếp Ngay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main: SelfOrderingMenu — 2 tabs (Đơn hàng | Thêm món)
──────────────────────────────────────────────────────────── */
export default function SelfOrderingMenu() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("tableId");

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState(null);
  const [activeTab, setActiveTab] = useState("menu"); // "menu" | "order"

  useEffect(() => {
    if (!tableId) {
      setError("Không tìm thấy bàn. Vui lòng quét lại mã QR trên bàn.");
      setLoading(false);
      return;
    }
    getMenuByTable(tableId)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.message || "Lỗi tải dữ liệu nhà hàng."))
      .finally(() => setLoading(false));
  }, [tableId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Đang tải thực đơn...</p>
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

  const { restaurant, branch, table } = data;

  if (table.isActive === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-amber-100 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <X size={32} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Bàn tạm ngừng phục vụ</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            Rất tiếc, bàn <strong>{table.name}</strong> hiện đang tạm ngừng hoạt động hoặc đang được bảo trì.
          </p>
          <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-700 border border-amber-100 italic">
            Vui lòng liên hệ nhân viên để được hỗ trợ đổi bàn khác.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[480px] bg-gray-50 min-h-screen flex flex-col shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-40 bg-white px-4 pt-4 pb-3 border-b border-gray-100 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3 font-semibold tracking-wide">
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-emerald-500" />
              CN: {branch.name}
            </span>
            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 font-bold uppercase">
              {table.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {restaurant.logo ? (
              <img src={restaurant.logo} alt="Logo"
                className="w-10 h-10 rounded-xl object-cover shadow-sm bg-gray-100 border border-gray-100" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ChefHat size={18} />
              </div>
            )}
            <div>
              <h1 className="text-lg font-black text-gray-800 leading-tight">{restaurant.name}</h1>
              <p className="text-xs text-gray-400">Thực đơn tự phục vụ (QRDine)</p>
            </div>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="sticky top-[76px] z-30 flex border-b border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "menu"
                ? "border-emerald-500 text-emerald-700 bg-emerald-50/50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}>
            <UtensilsCrossed size={15} /> Thêm món
          </button>
          <button
            onClick={() => setActiveTab("order")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "order"
                ? "border-emerald-500 text-emerald-700 bg-emerald-50/50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}>
            <ClipboardList size={15} /> Đơn hàng
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <div className={activeTab === "menu" ? "block" : "hidden"}>
            <MenuTab tableId={tableId} data={data} />
          </div>
          <div className={activeTab === "order" ? "block" : "hidden"}>
            <OrderTab tableId={tableId} tableName={table.name} />
          </div>
        </div>

        {/* Animations */}
        <style dangerouslySetInnerHTML={{ __html: `
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
        ` }} />
      </div>
    </div>
  );
}
