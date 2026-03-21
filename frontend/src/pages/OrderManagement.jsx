import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import BranchManagerLayout from "../components/manager/BranchManagerLayout";
import {
  getManagerOrders,
  updateManagerOrderStatus,
  processManagerCheckout,
} from "../api/managerApi";

const API_BASE = `http://${window.location.hostname}:5000`;

// ============================================================
// CONFIG & HELPERS
// ============================================================
const COLUMNS = [
  {
    key: "Open",
    label: "Mới Đặt",
    icon: "🟡",
    bg: "bg-amber-50",
    headerBg: "bg-amber-100",
    headerText: "text-amber-800",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    key: "Serving",
    label: "Đang Phục Vụ",
    icon: "🔵",
    bg: "bg-blue-50",
    headerBg: "bg-blue-100",
    headerText: "text-blue-800",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    key: "Completed",
    label: "Đã Hoàn Thành",
    icon: "🟢",
    bg: "bg-green-50",
    headerBg: "bg-green-100",
    headerText: "text-green-800",
    border: "border-green-200",
    badge: "bg-green-100 text-green-700",
  },
];

const ITEM_STATUS_CONFIG = {
  Pending: { label: "Chờ xử lý",   cls: "bg-gray-100 text-gray-600" },
  Cooking: { label: "Đang nấu",    cls: "bg-orange-100 text-orange-700" },
  Ready:   { label: "Sẵn sàng",   cls: "bg-purple-100 text-purple-700" },
  Served:  { label: "Đã phục vụ", cls: "bg-green-100 text-green-700" },
  Cancelled: { label: "Đã huỷ",   cls: "bg-red-100 text-red-500" },
};

const formatCurrency = (n) =>
  Number(n).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const timeAgo = (isoStr) => {
  const mins = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (mins < 1) return "Vừa đặt";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}g ${rem}p trước` : `${hrs} giờ trước`;
};

const nextStatus = (cur) => {
  if (cur === "Open") return "Serving";
  return null;
};

const nextStatusLabel = (cur) => {
  if (cur === "Open") return "▶ Bắt đầu phục vụ";
  return null;
};

// ============================================================
// TOAST
// ============================================================
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all duration-300 ${
            t.type === "success" ? "bg-emerald-600" : "bg-red-500"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// ORDER CARD
// ============================================================
function OrderCard({ order, colConfig, onClick }) {
  const totalItems = order.orderDetails.reduce((s, d) => s + d.quantity, 0);

  return (
    <div
      onClick={() => onClick(order)}
      className={`
        cursor-pointer rounded-xl border ${colConfig.border} bg-white shadow-sm
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4
      `}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-gray-800 tracking-wide">
          {order.orderTable || "—"}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            order.paymentStatus === "Paid"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {order.paymentStatus === "Paid" ? "✔ Đã TT" : "✘ Chưa TT"}
        </span>
      </div>

      {/* Time */}
      <p className="text-xs text-gray-400 mb-3">🕐 {timeAgo(order.orderTime)}</p>

      {/* Items preview */}
      <div className="space-y-1 mb-3">
        {order.orderDetails.slice(0, 3).map((d) => (
          <div key={d.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 truncate max-w-[70%]">{d.productName}</span>
            <span className="text-gray-400 text-xs">x{d.quantity}</span>
          </div>
        ))}
        {order.orderDetails.length > 3 && (
          <p className="text-xs text-gray-400">
            +{order.orderDetails.length - 3} món khác...
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-2">
        <span className="text-xs text-gray-500">🍽 {totalItems} món</span>
        <span className="text-sm font-bold text-indigo-600">
          {formatCurrency(order.totalAmount)}
        </span>
      </div>

      {/* Customer note */}
      {order.customerNote && (
        <p className="mt-2 text-xs text-gray-400 italic truncate">
          📝 {order.customerNote}
        </p>
      )}
    </div>
  );
}

// ============================================================
// ORDER DETAIL DRAWER
// ============================================================
function OrderDrawer({ order, onClose, onChangeStatus, onPayment, actionLoading }) {
  if (!order) return null;

  const col = COLUMNS.find((c) => c.key === order.orderStatus);
  const next = nextStatus(order.orderStatus);
  const nextLabel = nextStatusLabel(order.orderStatus);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className={`${col.headerBg} px-6 py-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Chi tiết đơn hàng #{order.id}</p>
            <h2 className={`text-2xl font-bold ${col.headerText}`}>
              {order.orderTable || "—"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">🕐 {timeAgo(order.orderTime)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
            >
              ✕
            </button>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.badge}`}>
              {col.icon} {col.label}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Note */}
          {order.customerNote && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">📝 Ghi chú</p>
              <p className="text-sm text-gray-700">{order.customerNote}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Danh sách món
            </p>
            <div className="space-y-2">
              {order.orderDetails.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Chưa có món nào</p>
              )}
              {order.orderDetails.map((d) => {
                const cfg = ITEM_STATUS_CONFIG[d.itemStatus] || ITEM_STATUS_CONFIG.Pending;
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {d.productName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(d.unitPrice)} × {d.quantity}
                      </p>
                      {d.note && (
                        <p className="text-xs text-amber-600 italic mt-0.5">📝 {d.note}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-semibold text-gray-700">
                        {formatCurrency(d.unitPrice * d.quantity)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Tổng cộng</span>
              <span className="text-xl font-bold text-indigo-600">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-gray-500">Thanh toán</span>
              <span
                className={`text-sm font-semibold ${
                  order.paymentStatus === "Paid" ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {order.paymentStatus === "Paid" ? "✔ Đã thanh toán" : "✘ Chưa thanh toán"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 space-y-2">
          {next && (
            <button
              disabled={actionLoading}
              onClick={() => onChangeStatus(order.id, next)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors shadow-sm"
            >
              {actionLoading ? "Đang xử lý..." : nextLabel}
            </button>
          )}

          {order.paymentStatus === "Unpaid" && (
            <button
              disabled={actionLoading}
              onClick={() => onPayment(order.id, order.tableIds)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white transition-colors shadow-sm"
            >
              {actionLoading ? "Đang xử lý..." : "💳 Thanh toán / Tạo Invoice"}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================================
// CHECKOUT MODAL
// ============================================================
function CheckoutModal({ order, onClose, onConfirm, actionLoading }) {
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  if (!order) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-1">💳 Thanh toán đơn hàng</h3>
          <p className="text-sm text-gray-500 mb-4">
            {order.orderTable || "—"} — {formatCurrency(order.totalAmount)}
          </p>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phương thức thanh toán
          </label>
          <div className="flex gap-2 mb-6">
            {[
              { value: "Cash", label: "💵 Tiền mặt" },
              { value: "BankTransfer", label: "🏦 Chuyển khoản" },
            ].map((m) => (
              <button
                key={m.value}
                onClick={() => setPaymentMethod(m.value)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  paymentMethod === m.value
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              Huỷ
            </button>
            <button
              disabled={actionLoading}
              onClick={() => onConfirm(paymentMethod)}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold"
            >
              {actionLoading ? "Đang xử lý..." : "Xác nhận"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function OrderManagement() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts, setToasts]               = useState([]);
  const [, setTick]                       = useState(0);
  const socketRef                         = useRef(null);

  // --- Toast helpers ---
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // --- Fetch orders ---
  const fetchOrders = useCallback(async () => {
    try {
      const res = await getManagerOrders();
      setOrders(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh timer (every 60s)
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Tick every 30s to update "time ago" display
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // Socket.io — listen for tableUpdate events to refresh orders
  useEffect(() => {
    const socket = io(API_BASE, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("tableUpdate", () => fetchOrders());
    return () => socket.disconnect();
  }, [fetchOrders]);

  // Keep selectedOrder in sync with latest orders state
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]);

  // --- Change order status ---
  const handleChangeStatus = async (id, newStatus) => {
    setActionLoading(true);
    try {
      await updateManagerOrderStatus(id, newStatus);
      addToast(
        newStatus === "Serving"
          ? "✅ Đơn đang được phục vụ"
          : "✅ Đơn đã hoàn thành"
      );
      await fetchOrders();
      if (newStatus === "Completed") setSelectedOrder(null);
    } catch (err) {
      addToast(err.response?.data?.message || "Cập nhật thất bại", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- Open checkout modal ---
  const handleOpenPayment = (id, tableIds) => {
    const order = orders.find((o) => o.id === id);
    setCheckoutOrder(order);
  };

  // --- Confirm payment ---
  const handleConfirmPayment = async (paymentMethod) => {
    if (!checkoutOrder) return;
    const tableId = checkoutOrder.tableIds?.[0];
    if (!tableId) {
      addToast("Không xác định được bàn để thanh toán", "error");
      return;
    }
    setActionLoading(true);
    try {
      await processManagerCheckout(tableId, { paymentMethod });
      addToast("💳 Thanh toán thành công!");
      setCheckoutOrder(null);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err) {
      addToast(err.response?.data?.message || "Thanh toán thất bại", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // loading
  if (loading) {
    return (
      <BranchManagerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Đang tải đơn hàng...</p>
          </div>
        </div>
      </BranchManagerLayout>
    );
  }

  if (error) {
    return (
      <BranchManagerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-md text-center max-w-sm">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-gray-700 font-semibold mb-2">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </BranchManagerLayout>
    );
  }


  const activeCount = orders.filter(
    (o) => o.orderStatus !== "Completed"
  ).length;

  return (
    <BranchManagerLayout>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🍽 Quản Lý Đơn Hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeCount} đơn đang hoạt động
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {COLUMNS.map((col) => {
            const count = orders.filter((o) => o.orderStatus === col.key).length;
            return (
              <span
                key={col.key}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold ${col.badge}`}
              >
                {col.icon} {col.label}: {count}
              </span>
            );
          })}
          <button
            onClick={fetchOrders}
            className="text-xs px-3 py-1.5 rounded-full font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Kanban board — 3 equal columns */}
      <div className="grid grid-cols-3 gap-5 items-start">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.orderStatus === col.key);
          return (
            <div
              key={col.key}
              className={`rounded-2xl border ${col.border} ${col.bg} overflow-hidden`}
            >
              {/* Column header */}
              <div className={`${col.headerBg} px-4 py-3 flex items-center justify-between`}>
                <span className={`font-bold text-sm ${col.headerText}`}>
                  {col.icon} {col.label}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Cards list */}
              <div className="p-3 space-y-3 min-h-[200px]">
                {colOrders.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-10">
                    Không có đơn hàng
                  </div>
                )}
                {colOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    colConfig={col}
                    onClick={setSelectedOrder}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Drawer */}
      <OrderDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onChangeStatus={handleChangeStatus}
        onPayment={handleOpenPayment}
        actionLoading={actionLoading}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        order={checkoutOrder}
        onClose={() => setCheckoutOrder(null)}
        onConfirm={handleConfirmPayment}
        actionLoading={actionLoading}
      />

      {/* Toasts */}
      <Toast toasts={toasts} />

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </BranchManagerLayout>
  );
}
