import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getOwnerKitchenOrders, updateOwnerItemStatus, updateOwnerMultipleItemStatus, getOwnerBranches } from '../api/ownerApi';
import { getManagerBranchInfo } from '../api/managerApi';
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
    Truck,
    LayoutGrid,
    ListFilter
} from 'lucide-react';
import dayjs from 'dayjs';

export default function KitchenDisplaySystem() {
    const { branchID: paramBranchID } = useParams();
    const [searchParams] = useSearchParams();
    const categoryID = searchParams.get('categoryID');
    const navigate = useNavigate();

    const userData = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); }
        catch { return {}; }
    }, []);

    const branchID = userData.role === 'BranchManager' ? userData.branchID : paramBranchID;
    const isReadOnly = userData.role === 'RestaurantOwner';

    const [orders, setOrders] = useState([]);
    const [branchName, setBranchName] = useState('Đang tải...');
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'));
    const [viewMode, setViewMode] = useState('board'); // 'board' or 'batch'
    const audioRef = useRef(new Audio('https://assets.mixkit.io/active_storage/sfx/2869/2869-preview.mp3'));
    const lastOrderCount = useRef(0);

    // Cập nhật đồng hồ hệ thống
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(dayjs().format('HH:mm:ss')), 1000);
        return () => clearInterval(timer);
    }, []);

    // Lấy thông tin chi nhánh
    useEffect(() => {
        const fetchBranchInfo = async () => {
            if (!branchID) return;
            try {
                if (userData.role === 'BranchManager') {
                    const response = await getManagerBranchInfo();
                    setBranchName(response.data.branch.name);
                } else if (userData.role === 'RestaurantOwner') {
                    const response = await getOwnerBranches();
                    const currentBranch = response.data.branches?.find(b => b.branchID === branchID);
                    if (currentBranch) {
                        setBranchName(currentBranch.name);
                    } else {
                        setBranchName(`Chi nhánh ${branchID}`);
                    }
                }
            } catch (error) {
                console.error("Error fetching branch info:", error);
                setBranchName(`Chi nhánh ${branchID}`);
            }
        };
        fetchBranchInfo();
    }, [branchID, userData]);

    const fetchOrders = useCallback(async () => {
        if (!branchID) {
            setLoading(false);
            return;
        }
        try {
            const response = await getOwnerKitchenOrders(branchID, categoryID);
            const newOrders = response.data;
            
            // Phát âm thanh nếu có đơn mới
            if (newOrders.length > lastOrderCount.current) {
                audioRef.current.play().catch(e => console.log("Audio play failed:", e));
                toast("🔔 Có đơn hàng mới!", {
                    icon: '🔥',
                    style: {
                        borderRadius: '12px',
                        background: '#1e293b',
                        color: '#fff',
                        border: '1px solid #3b82f6',
                    },
                    duration: 4000
                });
            }
            lastOrderCount.current = newOrders.length;
            
            setOrders(newOrders);
        } catch (error) {
            console.error("Error fetching kitchen orders:", error);
        } finally {
            setLoading(false);
        }
    }, [branchID, categoryID]);

    useEffect(() => {
        fetchOrders();
        const pollTimer = setInterval(fetchOrders, 5000); // Poll every 5 seconds for better response
        return () => clearInterval(pollTimer);
    }, [fetchOrders]);

    const handleStatusUpdate = async (orderDetailID, status) => {
        const toastId = toast.loading("Đang cập nhật trạng thái...");
        try {
            await updateOwnerItemStatus(orderDetailID, status);
            toast.success("Đã cập nhật!", { id: toastId });
            fetchOrders();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            toast.error("Lỗi: " + errorMsg, { id: toastId });
            console.error("Error updating status:", error);
        }
    };

    const handleBatchStatusUpdate = async (itemIDs, status) => {
        if (!itemIDs || itemIDs.length === 0) {
            toast.error("Danh sách món trống!");
            return;
        }

        const toastId = toast.loading(`Đang cập nhật ${itemIDs.length} món...`);
        try {
            console.log("KDS: Batch updating status:", { itemIDs, status });
            await updateOwnerMultipleItemStatus(itemIDs, status);
            toast.success("Cập nhật thành công!", { id: toastId });
            fetchOrders();
        } catch (error) {
            console.error("KDS: Error batch updating status:", error);
            const errorMsg = error.response?.data?.message || error.message;
            toast.error("Lỗi KDS: " + errorMsg, { id: toastId });
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

    // Thống kê cho Manager
    const stats = useMemo(() => {
        const servedItems = orders.flatMap(o => o.items).filter(i => i.itemStatus === 'Served');
        const pendingItems = orders.flatMap(o => o.items).filter(i => i.itemStatus === 'Pending');
        
        // Giả lập thời gian trung bình từ 5-10p (thực tế sẽ tính từ lịch sử hoàn thành)
        const avgWait = orders.length > 0 ? "06:45" : "00:00";

        return {
            pendingCount: pendingItems.length,
            avgWait,
            totalActive: orders.length
        };
    }, [orders]);

    // Gom món cho Batch Mode
    const batchData = useMemo(() => {
        const map = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.itemStatus === 'Pending' || item.itemStatus === 'Cooking') {
                    if (!map[item.productName]) {
                        map[item.productName] = { 
                            name: item.productName, 
                            pending: 0, 
                            cooking: 0, 
                            ids: [],
                            cookingIds: []
                        };
                    }
                    if (item.itemStatus === 'Pending') {
                        map[item.productName].pending += item.quantity;
                        map[item.productName].ids.push(item.orderDetailID);
                    } else {
                        map[item.productName].cooking += item.quantity;
                        map[item.productName].cookingIds.push(item.orderDetailID);
                    }
                }
            });
        });
        return Object.values(map).sort((a, b) => (b.pending + b.cooking) - (a.pending + a.cooking));
    }, [orders]);

    const getLaneOrders = (status) => {
        const statuses = Array.isArray(status) ? status : [status];
        return orders.filter(order =>
            order.items.some(item => statuses.includes(item.itemStatus))
        ).map(order => ({
            ...order,
            items: order.items.filter(item => statuses.includes(item.itemStatus))
        }));
    };

    if (!branchID) {
        return (
            <div className="fixed inset-0 bg-[#0a0f18] flex flex-col items-center justify-center text-white">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                    <User size={32} className="text-red-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Thiếu thông tin chi nhánh</h2>
                <p className="text-slate-400 text-center max-w-md px-6">
                    Tài khoản của bạn chưa được gán cho chi nhánh nào hoặc thông tin chưa được cập nhật. Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.
                </p>
                <div className="flex gap-4 mt-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all font-bold text-sm"
                    >
                        Quay lại
                    </button>
                    <button 
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            navigate('/login');
                        }} 
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all font-bold text-sm shadow-lg shadow-blue-600/20"
                    >
                        Đăng nhập lại
                    </button>
                </div>
            </div>
        );
    }

    if (loading && orders.length === 0) {
        return (
            <div className="fixed inset-0 bg-[#0a0f18] flex flex-col items-center justify-center text-white gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium animate-pulse">Đang tải dữ liệu bếp...</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-50 text-slate-600 flex flex-col font-sans select-none overflow-hidden text-sm">
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(userData.role === 'RestaurantOwner' ? '/owner/kitchen-tracking' : '/manager/dashboard')} 
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 leading-tight">Màn Hình Bếp (KDS)</h1>
                        <p className="text-blue-600 text-[10px] font-bold tracking-widest uppercase">{branchName} • TRỰC TUYẾN</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* View Mode Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setViewMode('board')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'board' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutGrid size={14} /> THEO ĐƠN
                        </button>
                        <button 
                            onClick={() => setViewMode('batch')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'batch' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ListFilter size={14} /> GOM MÓN
                        </button>
                    </div>

                    <div className="flex items-center gap-8 border-l border-slate-200 pl-6">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase">Đang chờ</p>
                            <p className="text-xl font-black text-blue-600 leading-none">{stats.pendingCount}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase">Thời gian TB</p>
                            <p className="text-xl font-black text-amber-500 leading-none">{stats.avgWait}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
                        <button onClick={toggleFullscreen} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-all text-slate-500 border border-slate-200">
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                    </div>

                    <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
                        <div className="text-right">
                            <p className="text-base font-black text-slate-900 leading-none">{currentTime}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{dayjs().format('DD MMMM, YYYY')}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                            <User size={20} className="text-blue-600" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'board' ? (
                    <main className="absolute inset-0 overflow-x-auto p-4 flex gap-4 custom-scrollbar">
                        {/* Lane: Đơn mới */}
                        <KDSLane
                            title="Đơn mới"
                            count={getLaneOrders('Pending').length}
                            dotColor="bg-blue-500"
                            orders={getLaneOrders('Pending')}
                            renderActions={(item) => !isReadOnly && (
                                <button
                                    onClick={() => handleStatusUpdate(item.orderDetailID, 'Cooking')}
                                    className="w-full mt-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] font-black transition-all border border-blue-200 flex items-center justify-center gap-1.5 uppercase tracking-tighter shadow-sm"
                                >
                                    <Play size={10} fill="currentColor" /> Bắt đầu làm
                                </button>
                            )}
                            batchLabel="Làm tất cả"
                            onBatchAction={!isReadOnly ? (order) => handleBatchStatusUpdate(order.items.map(i => i.orderDetailID), 'Cooking') : null}
                        />

                        {/* Lane: Đang chế biến */}
                        <KDSLane
                            title="Đang làm"
                            count={getLaneOrders('Cooking').length}
                            dotColor="bg-amber-500"
                            orders={getLaneOrders('Cooking')}
                            renderActions={(item) => !isReadOnly && (
                                <button
                                    onClick={() => handleStatusUpdate(item.orderDetailID, 'Ready')}
                                    className="w-full mt-2 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-[10px] font-black transition-all border border-amber-200 flex items-center justify-center gap-1.5 uppercase tracking-tighter shadow-sm"
                                >
                                    <CheckCircle2 size={10} /> Xong / Hoàn tất
                                </button>
                            )}
                            batchLabel="Xong tất cả"
                            onBatchAction={!isReadOnly ? (order) => handleBatchStatusUpdate(order.items.map(i => i.orderDetailID), 'Ready') : null}
                        />

                        {/* Lane: Hoàn tất */}
                        <KDSLane
                            title="Hoàn tất"
                            count={getLaneOrders(['Ready', 'Served']).length}
                            dotColor="bg-emerald-500"
                            orders={getLaneOrders(['Ready', 'Served'])}
                            isDimmed
                        />
                    </main>
                ) : (
                    <main className="absolute inset-0 p-6 overflow-y-auto">
                        <div className="max-w-5xl mx-auto">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                        <ListFilter size={24} className="text-blue-600" /> 
                                        CHẾ ĐỘ GOM MÓN (BATCH MODE)
                                    </h2>
                                    <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest">Tổng hợp số lượng chuẩn bị theo từng món ăn</p>
                                </div>
                                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tổng món cần làm</p>
                                    <p className="text-xl font-black text-slate-900">{batchData.reduce((s, i) => s + i.pending + i.cooking, 0)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {batchData.map((item, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm group hover:border-blue-500/50 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-base font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase">{item.name}</h3>
                                            <span className="text-2xl font-black text-blue-600">{item.pending + item.cooking}</span>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {item.pending > 0 && (
                                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-blue-500 uppercase">Chờ làm</p>
                                                        <p className="text-lg font-black text-blue-600">{item.pending}</p>
                                                    </div>
                                                    {!isReadOnly && (
                                                        <button 
                                                            onClick={() => handleBatchStatusUpdate(item.ids, 'Cooking')}
                                                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all shadow-sm"
                                                        >
                                                            Làm ngay
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {item.cooking > 0 && (
                                                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-amber-500 uppercase">Đang nấu</p>
                                                        <p className="text-lg font-black text-amber-600">{item.cooking}</p>
                                                    </div>
                                                    {!isReadOnly && (
                                                        <button 
                                                            onClick={() => handleBatchStatusUpdate(item.cookingIds, 'Ready')}
                                                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all shadow-sm"
                                                        >
                                                            Xong hết
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {batchData.length === 0 && (
                                    <div className="col-span-full py-20 text-center text-slate-600">
                                        <Truck size={48} className="mx-auto mb-4 opacity-10" />
                                        <p className="font-bold uppercase tracking-[0.2em] opacity-30">Không có món nào cần chế biến</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                )}
            </div>

            {/* Footer */}
            <footer className="h-10 bg-white border-t border-slate-200 flex items-center justify-between px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                <div className="flex gap-8">
                    <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Máy in: Sẵn sàng</p>
                    <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Server: Ổn định</p>
                </div>
                <div className="flex gap-8 items-center">
                    <p className="text-blue-600 hover:text-blue-700 cursor-pointer transition-colors">Trợ giúp kỹ thuật</p>
                    <p className="opacity-40">OrderEats KDS v3.0 (Light Edition)</p>
                </div>
            </footer>
        </div>
    );
}

function KDSLane({ title, count, dotColor, orders, renderActions, isDimmed, batchLabel, onBatchAction }) {
    return (
        <div className={`w-[340px] h-full flex flex-col shrink-0 ${isDimmed ? 'opacity-70' : ''}`}>
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${dotColor} shadow-sm`}></div>
                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">{title}</h2>
                    <span className="text-[10px] bg-white text-slate-500 px-2 py-0.5 rounded-lg font-black ml-1 border border-slate-200">{count}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                {orders.map((order) => (
                    <KDSCard
                        key={`${order.orderID}-${title}`}
                        order={order}
                        borderColor={dotColor}
                        renderActions={renderActions}
                        batchLabel={batchLabel}
                        onBatchAction={onBatchAction}
                    />
                ))}
                {orders.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700 mt-20 opacity-20">
                        <Play size={40} className="mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Trống</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function KDSCard({ order, borderColor, renderActions, batchLabel, onBatchAction }) {
    const waitTimeMinutes = dayjs().diff(dayjs(order.orderTime), 'minute');
    const isLate = waitTimeMinutes >= 15;
    const isWarning = waitTimeMinutes >= 10 && waitTimeMinutes < 15;

    const formatWaitTime = (orderTime) => {
        const diff = dayjs().diff(dayjs(orderTime), 'minute');
        const seconds = dayjs().diff(dayjs(orderTime), 'second') % 60;
        return `${String(diff).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const [timer, setTimer] = useState(formatWaitTime(order.orderTime));

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer(formatWaitTime(order.orderTime));
        }, 1000);
        return () => clearInterval(interval);
    }, [order.orderTime]);

    // Highlighting important notes
    const highlightNote = (note) => {
        if (!note) return null;
        const keywords = ['không', 'dị ứng', 'cay', 'ít', 'nhiều', 'gấp', 'vội'];
        let highlighed = note;
        keywords.forEach(kw => {
            const regex = new RegExp(`(${kw})`, 'gi');
            highlighed = highlighed.replace(regex, '<span class="text-red-500 font-black">$1</span>');
        });
        return <span dangerouslySetInnerHTML={{ __html: highlighed }} />;
    };

    return (
        <div className={`bg-white rounded-2xl overflow-hidden border-l-[6px] ${borderColor.replace('bg-', 'border-')} shadow-sm border border-slate-200 transition-all hover:translate-x-1`}>
            {/* Card Header */}
            <div className={`p-4 border-b border-slate-100 flex items-center justify-between ${isLate ? 'bg-red-50' : isWarning ? 'bg-amber-50' : 'bg-slate-50/50'}`}>
                <div>
                    <h3 className="text-xl font-black text-slate-900 leading-none tracking-tighter">#{order.orderID}</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase tracking-wide">Bàn {order.tableName} • Tại chỗ</p>
                </div>
                <div className={`flex flex-col items-end gap-1 ${isLate ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-blue-600'}`}>
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} className={isLate ? 'animate-pulse' : ''} />
                        <span className="text-sm font-black tracking-tighter">{timer}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-400">{dayjs(order.orderTime).format('HH:mm')}</span>
                </div>
            </div>

            {/* Items List */}
            <div className="p-4 space-y-4">
                {order.items.map((item) => (
                    <div key={item.orderDetailID} className="group/item">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <p className="text-sm font-black text-slate-800 leading-tight uppercase group-hover/item:text-blue-600 transition-colors">
                                    {item.productName}
                                </p>
                                {item.note && (
                                    <p className="text-[10px] text-slate-400 font-bold mt-1.5 pl-3 border-l-2 border-slate-200 italic">
                                        {highlightNote(item.note)}
                                    </p>
                                )}
                            </div>
                            <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-black shrink-0 border border-slate-200">
                                x{item.quantity}
                            </span>
                        </div>
                        {renderActions && renderActions(item)}
                    </div>
                ))}
            </div>

            {/* Actions Bar & Customer Note */}
            <div className="bg-slate-50/50 px-4 py-3 border-t border-slate-100">
                {order.customerNote && (
                    <div className="mb-3 p-2 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-amber-500 mt-1 shrink-0"></div>
                        <p className="text-[10px] text-amber-600 leading-snug font-bold uppercase italic tracking-tight">KHÁCH DẶN: {highlightNote(order.customerNote)}</p>
                    </div>
                )}
                
                {onBatchAction && (
                    <button 
                        onClick={() => onBatchAction(order)}
                        className="w-full py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 shadow-sm"
                    >
                        {batchLabel}
                    </button>
                )}
            </div>
        </div>
    );
}
