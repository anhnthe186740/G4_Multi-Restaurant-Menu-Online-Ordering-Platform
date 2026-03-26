import React, { useState, useEffect, useCallback } from "react";
import { 
  ClipboardCheck, 
  MapPin, 
  Loader2, 
  Search, 
  RefreshCcw, 
  ChevronRight,
  Clock,
  CheckCircle2,
  Table
} from "lucide-react";
import { getOwnerKitchenOrders, updateOwnerItemStatus, updateOwnerMultipleItemStatus } from "../api/ownerApi";
import { io } from "socket.io-client";
import BranchManagerLayout from "../components/manager/BranchManagerLayout";

export default function StaffReadyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branchID = user.branchID;

  const fetchOrders = useCallback(async () => {
    if (!branchID) return;
    try {
      const res = await getOwnerKitchenOrders(branchID);
      // Chỉ lấy các món có trạng thái "Ready"
      setOrders(res.data);
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  }, [branchID]);

  useEffect(() => {
    fetchOrders();

    const socket = io(`http://${window.location.hostname}:5000`);
    
    // Lắng nghe sự kiện cập nhật trạng thái bếp
    socket.on("orderItemStatusChanged", () => {
      fetchOrders();
    });

    // Lắng nghe sự kiện có đơn hàng mới
    socket.on("newOrder", () => {
      fetchOrders();
    });

    return () => socket.disconnect();
  }, [fetchOrders]);

  const handleMarkAsServed = async (orderDetailID) => {
    setUpdatingId(orderDetailID);
    try {
      await updateOwnerItemStatus(orderDetailID, "Served");
      // Reload orders will happen via socket or manual fetch if needed
      // But we can also update local state for better UX
      setOrders(prev => prev.map(order => ({
        ...order,
        items: order.items.map(item => 
          item.orderDetailID === orderDetailID ? { ...item, itemStatus: "Served" } : item
        )
      })));
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái: " + (error.response?.data?.message || error.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAllServed = async (order) => {
    const readyItems = order.items.filter(item => item.itemStatus === "Ready");
    if (readyItems.length === 0) return;

    const ids = readyItems.map(item => item.orderDetailID);
    try {
      await updateOwnerMultipleItemStatus(ids, "Served");
      fetchOrders();
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái: " + (error.response?.data?.message || error.message));
    }
  };

  // Lọc chỉ các đơn có ít nhất một món "Ready"
  const readyOrders = orders.map(order => ({
    ...order,
    items: order.items.filter(item => {
        const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             order.tableName.toLowerCase().includes(searchQuery.toLowerCase());
        return item.itemStatus === "Ready" && matchesSearch;
    })
  })).filter(order => order.items.length > 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải danh sách món sẵn sàng...</p>
      </div>
    );
  }

  return (
    <BranchManagerLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="text-emerald-500" />
            Món ăn chờ giao
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Danh sách các món ăn nhà bếp đã hoàn thành và sẵn sàng phục vụ khách.
          </p>
        </div>

        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Tìm bàn hoặc món..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-full md:w-64"
                />
            </div>
            <button 
                onClick={fetchOrders}
                className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
                title="Làm mới"
            >
                <RefreshCcw className="w-4 h-4" />
            </button>
        </div>
      </div>

      {readyOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Hiện không có món nào chờ giao</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2">
            Khi nhà bếp hoàn thành món ăn, chúng sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {readyOrders.map((order) => (
            <div key={order.orderID} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                    <Table size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{order.tableName}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                        <Clock size={10} />
                        <span>{new Date(order.orderTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>ID: #{order.orderID}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleMarkAllServed(order)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Giao tất cả
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.orderDetailID} className="px-5 py-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                        {item.quantity}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{item.productName}</p>
                        {item.note && (
                          <p className="text-xs text-amber-600 italic mt-0.5">Ghi chú: {item.note}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleMarkAsServed(item.orderDetailID)}
                      disabled={updatingId === item.orderDetailID}
                      className="group/btn flex items-center gap-2 px-4 py-2 rounded-xl text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                    >
                      {updatingId === item.orderDetailID ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <span className="text-sm font-bold">Hoàn tất</span>
                          <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Card Footer */}
              {order.customerNote && (
                <div className="px-5 py-3 bg-amber-50 border-t border-slate-100">
                   <p className="text-xs text-amber-700">
                     <span className="font-bold">Ghi chú đơn hàng:</span> {order.customerNote}
                   </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </BranchManagerLayout>
  );
}
