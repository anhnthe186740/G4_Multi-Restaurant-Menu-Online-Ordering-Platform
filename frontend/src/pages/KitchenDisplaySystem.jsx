import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getOwnerKitchenOrders, updateOwnerItemStatus } from '../api/ownerApi';
import {
    Clock,
    ChevronLeft,
    Maximize2,
    Minimize2,
    Volume2,
    Settings,
    User,
    CheckCircle2,
    Play,
    Truck
} from 'lucide-react';
import dayjs from 'dayjs';

export default function KitchenDisplaySystem() {
    const { branchID } = useParams();
    const [searchParams] = useSearchParams();
    const categoryID = searchParams.get('categoryID');
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'));

    // Cập nhật đồng hồ hệ thống
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(dayjs().format('HH:mm:ss')), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            const response = await getOwnerKitchenOrders(branchID, categoryID);
            setOrders(response.data);
        } catch (error) {
            console.error("Error fetching kitchen orders:", error);
        } finally {
            setLoading(false);
        }
    }, [branchID, categoryID]);

    useEffect(() => {
        fetchOrders();
        const pollTimer = setInterval(fetchOrders, 10000); // Poll every 10 seconds
        return () => clearInterval(pollTimer);
    }, [fetchOrders]);

    const handleStatusUpdate = async (orderDetailID, nextStatus) => {
        try {
            await updateOwnerItemStatus(orderDetailID, nextStatus);
            fetchOrders(); // Refresh immediately
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const getLaneOrders = (status) => {
        return orders.filter(order =>
            order.items.some(item => item.itemStatus === status)
        ).map(order => ({
            ...order,
            items: order.items.filter(item => item.itemStatus === status)
        }));
    };

    const getWaitTime = (orderTime) => {
        const diff = dayjs().diff(dayjs(orderTime), 'minute');
        const seconds = dayjs().diff(dayjs(orderTime), 'second') % 60;
        return `${String(diff).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-[#0a0f18] text-slate-300 flex flex-col font-sans select-none overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-[#161e2e] border-b border-slate-700/50 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/owner/kitchen-tracking')} className="text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-tight">KDS Bếp Chính</h1>
                        <p className="text-blue-400 text-[10px] font-bold tracking-widest uppercase">NHÀ HÀNG CHI NHÁNH {branchID} • TRỰC TUYẾN</p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-500 mb-0.5">ĐANG CHỜ</p>
                        <p className="text-xl font-bold text-blue-500">{orders.length}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-500 mb-0.5">THỜI GIAN TB</p>
                        <p className="text-xl font-bold text-yellow-500">05:20</p>
                    </div>
                    <div className="flex items-center gap-3 border-l border-slate-700/50 pl-8">
                        <button className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center hover:bg-slate-700 transition-all">
                            <Volume2 size={18} />
                        </button>
                        <button onClick={toggleFullscreen} className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center hover:bg-slate-700 transition-all">
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center hover:bg-slate-700 transition-all">
                            <Settings size={18} />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 border-l border-slate-700/50 pl-8">
                        <div className="text-right">
                            <p className="text-lg font-bold text-white leading-none">{currentTime}</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-1">{dayjs().format('DD [Tháng] MM, YYYY')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 overflow-hidden border border-blue-500/30">
                            <User size={40} className="text-blue-400" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Board */}
            <main className="flex-1 overflow-x-auto p-4 flex gap-4">
                {/* Lane: Đơn mới */}
                <KDSLane
                    title="Đơn mới"
                    count={getLaneOrders('Pending').length}
                    dotColor="bg-blue-500"
                    orders={getLaneOrders('Pending')}
                    renderActions={(item) => (
                        <button
                            onClick={() => handleStatusUpdate(item.orderDetailID, 'Cooking')}
                            className="w-full mt-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-xs font-bold transition-all border border-blue-500/30 flex items-center justify-center gap-2"
                        >
                            <Play size={12} fill="currentColor" /> BẮT ĐẦU LÀM
                        </button>
                    )}
                />

                {/* Lane: Đang chế biến */}
                <KDSLane
                    title="Đang chế biến"
                    count={getLaneOrders('Cooking').length}
                    dotColor="bg-yellow-500"
                    orders={getLaneOrders('Cooking')}
                    renderActions={(item) => (
                        <button
                            onClick={() => handleStatusUpdate(item.orderDetailID, 'Ready')}
                            className="w-full mt-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded-lg text-xs font-bold transition-all border border-yellow-500/30 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={12} /> HOÀN THÀNH
                        </button>
                    )}
                />

                {/* Lane: Sẵn sàng */}
                <KDSLane
                    title="Sẵn sàng"
                    count={getLaneOrders('Ready').length}
                    dotColor="bg-emerald-500"
                    orders={getLaneOrders('Ready')}
                    renderActions={(item) => (
                        <button
                            onClick={() => handleStatusUpdate(item.orderDetailID, 'Served')}
                            className="w-full mt-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg text-xs font-bold transition-all border border-emerald-500/30 flex items-center justify-center gap-2"
                        >
                            <Truck size={12} /> TRẢ MÓN
                        </button>
                    )}
                />

                {/* Lane: Hoàn tất */}
                <KDSLane
                    title="Hoàn tất"
                    count={getLaneOrders('Served').length}
                    dotColor="bg-slate-500"
                    orders={getLaneOrders('Served')}
                    isDimmed
                />
            </main>

            {/* Footer */}
            <footer className="h-10 bg-[#0f141f] border-t border-slate-700/50 flex items-center justify-between px-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest shrink-0">
                <div className="flex gap-8">
                    <p>Máy in: Sẵn sàng</p>
                    <p>Server: Ổn định</p>
                    <p>Phiên bản v2.4.12</p>
                </div>
                <div className="flex gap-8">
                    <p className="text-blue-500 cursor-pointer">Hỗ trợ nhanh</p>
                    <p>Bấm giữ thẻ để xem chi tiết đơn hàng</p>
                </div>
            </footer>
        </div>
    );
}

function KDSLane({ title, count, dotColor, orders, renderActions, isDimmed }) {
    return (
        <div className={`w-[320px] h-full flex flex-col shrink-0 ${isDimmed ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-bold ml-1">{count}</span>
                </div>
                <button className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-500 group">
                    <Settings size={14} className="group-hover:text-slate-300" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {orders.map((order) => (
                    <KDSCard
                        key={`${order.orderID}-${title}`}
                        order={order}
                        borderColor={dotColor}
                        renderActions={renderActions}
                    />
                ))}
                {orders.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 mt-20">
                        <Utensils size={40} className="opacity-10 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Trống</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function KDSCard({ order, borderColor, renderActions }) {
    const isLate = dayjs().diff(dayjs(order.orderTime), 'minute') > 10;

    return (
        <div className={`bg-[#161e2e] rounded-xl overflow-hidden border-l-4 ${borderColor.replace('bg-', 'border-')} shadow-lg`}>
            {/* Card Header */}
            <div className="p-3 bg-slate-800/20 border-b border-slate-700/30 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-white leading-none">#{order.orderID}</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">Bàn {order.tableName} • Tại chỗ</p>
                </div>
                <div className={`flex items-center gap-1.5 ${isLate ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                    <Clock size={12} />
                    <span className="text-xs font-black tracking-tighter">{dayjs(order.orderTime).format('HH:mm')}</span>
                </div>
            </div>

            {/* Items List */}
            <div className="p-3 space-y-3">
                {order.items.map((item) => (
                    <div key={item.orderDetailID}>
                        <div className="flex justify-between items-start gap-3">
                            <p className="text-sm font-bold text-slate-200 leading-tight">
                                {item.productName}
                                {item.note && <span className="block text-[10px] text-slate-500 italic font-medium mt-1">Ghi chú: {item.note}</span>}
                            </p>
                            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-bold shrink-0">
                                x{item.quantity}
                            </span>
                        </div>
                        {renderActions && renderActions(item)}
                    </div>
                ))}
            </div>

            {/* Card Footer */}
            {order.customerNote && (
                <div className="bg-yellow-500/5 p-2 border-t border-slate-700/20">
                    <p className="text-[9px] text-yellow-500 leading-tight font-medium uppercase tracking-tight">Lưu ý khách: {order.customerNote}</p>
                </div>
            )}
        </div>
    );
}

function Utensils(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
    )
}
