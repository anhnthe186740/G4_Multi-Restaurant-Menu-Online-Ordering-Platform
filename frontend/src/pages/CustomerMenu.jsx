import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMenuByTable } from '../api/publicApi';
import { ShoppingCart, ChefHat, MapPin, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { confirmManagerOrder, getManagerBillByTable, processManagerCheckout, createTablePaymentLink } from '../api/managerApi';
import { Receipt, CreditCard, History } from 'lucide-react';
import TablePaymentModal from '../components/manager/TablePaymentModal';

export default function CustomerMenu({ tableIdProp, onCheckoutSuccess }) {
    const [searchParams] = useSearchParams();
    const tableId = tableIdProp || searchParams.get('tableId');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);
    const [cart, setCart] = useState([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Management - Bill logic
    const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'bill'
    const [billData, setBillData] = useState(null);
    const [loadingBill, setLoadingBill] = useState(false);

    // QR Payment Modal state
    const [qrPaymentData, setQrPaymentData] = useState(null);
    const [qrModalOpen, setQrModalOpen] = useState(false);

    // Cart Logic
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productID === product.productID);
            if (existing) {
                return prev.map(item =>
                    item.productID === product.productID
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (productID, delta) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.productID === productID) {
                    const newQty = Math.max(0, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    const getCartTotal = () => {
        return cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    };

    const getCartCount = () => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    };

    useEffect(() => {
        if (!tableId) {
            setError("Không tìm thấy bàn. Vui lòng quét lại mã QR trên bàn.");
            setLoading(false);
            return;
        }

        const fetchMenu = async () => {
            try {
                const res = await getMenuByTable(tableId);
                setData(res.data);
                if (res.data.categories && res.data.categories.length > 0) {
                    setActiveCategory(res.data.categories[0].categoryID);
                }
            } catch (err) {
                console.error("Fetch menu error", err);
                setError(err.response?.data?.message || "Lỗi tải dữ liệu nhà hàng. Thực đơn không tồn tại.");
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, [tableId]);

    // Fetch bill when switching to Bill tab
    useEffect(() => {
        if (activeTab === 'bill' && tableId) {
            fetchBill();
        }
    }, [activeTab, tableId]);

    const fetchBill = async () => {
        try {
            setLoadingBill(true);
            const res = await getManagerBillByTable(tableId);
            setBillData(res.data);
        } catch (err) {
            console.error("Fetch bill error", err);
            setBillData(null);
        } finally {
            setLoadingBill(false);
        }
    };

    const handleProcessPayment = async (method = "Cash") => {
        if (!window.confirm(`Xác nhận thanh toán ${formatPrice(billData.totalAmount)} bằng Tiền mặt?`)) {
            return;
        }
        try {
            setIsProcessing(true);
            await processManagerCheckout(tableId, { paymentMethod: method });
            if (onCheckoutSuccess) {
                onCheckoutSuccess(`Bàn đã thanh toán thành công!`, { type: 'Cash', tableId });
            }
        } catch (err) {
            console.error("Checkout error", err);
            alert("Lỗi thanh toán: " + (err.response?.data?.message || err.message));
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle QR/Bank Transfer payment — creates PayOS link
    const handleBankTransfer = async () => {
        try {
            setIsProcessing(true);
            const res = await createTablePaymentLink(tableId);
            
            // Báo lên cha (TableManagement) để thêm vào Queue
            if (onCheckoutSuccess) {
                onCheckoutSuccess('', {
                    type: 'QR',
                    tableId,
                    tableName: billData?.tables?.[0]?.name || `Bàn ${tableId}`,
                    paymentData: res.data,
                    billData: billData
                });
            } else {
                setQrPaymentData(res.data);
                setQrModalOpen(true);
            }
            
        } catch (err) {
            console.error("Create payment link error", err);
            alert("Lỗi tạo mã QR: " + (err.response?.data?.message || err.message));
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full min-h-[500px] bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-medium">Đang tải thực đơn...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="h-full min-h-[500px] bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-red-100 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={40} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Không thể tải thực đơn</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <p className="text-sm font-medium text-emerald-600">Vui lòng liên hệ nhân viên để được hỗ trợ.</p>
                </div>
            </div>
        );
    }

    const { restaurant, branch, table, categories } = data;

    // Helper to format currency
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const isManagerView = !!tableIdProp; // Nếu là Drawer trong quản lý

    return (
        <>
        <div className="h-full bg-gray-50 pb-24 relative">
            {/* Header / Cover Image */}
            <div className="relative h-64 bg-gray-900 shrink-0">
                {restaurant.coverImage ? (
                    <img src={restaurant.coverImage} alt="Cover" className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-emerald-800 to-teal-900 opacity-90" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                <div className="absolute bottom-0 left-0 w-full p-6 text-white flex gap-4 items-end">
                    {restaurant.logo ? (
                        <img src={restaurant.logo} alt="Logo" className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg bg-white object-cover" />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <ChefHat size={32} />
                        </div>
                    )}
                    <div className="flex-1 pb-1">
                        <h1 className="text-2xl font-black mb-1 drop-shadow-md">{restaurant.name}</h1>
                        <p className="text-sm text-gray-200 flex items-center gap-1 opacity-90">
                            <MapPin size={12} /> {branch.name} {branch.address && `- ${branch.address}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quản lý: Chuyển đổi Menu / Hóa đơn */}
            {isManagerView && (
                <div className="px-4 mt-4">
                    <div className="bg-white p-1 rounded-2xl flex shadow-sm border border-gray-100">
                        <button 
                            onClick={() => setActiveTab('menu')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                                activeTab === 'menu' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <ChefHat size={18} /> Menu
                        </button>
                        <button 
                            onClick={() => setActiveTab('bill')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                                activeTab === 'bill' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <Receipt size={18} /> Hóa đơn
                        </button>
                    </div>
                </div>
            )}

            {/* Thanh Danh mục (Sticky) */}
            <div className="sticky top-0 z-30 bg-white shadow-sm mt-4 border-b border-gray-100">
                <div className="flex overflow-x-auto hide-scrollbar px-4 py-3 gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.categoryID}
                            onClick={() => {
                                setActiveCategory(cat.categoryID);
                                document.getElementById(`cat-${cat.categoryID}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                activeCategory === cat.categoryID
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Danh sách món ăn OR Hóa đơn */}
            <div className="p-4 space-y-8 max-w-3xl mx-auto">
                {activeTab === 'menu' ? (
                    categories.map((cat) => (
                        <div key={cat.categoryID} id={`cat-${cat.categoryID}`} className="scroll-mt-24">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                {cat.name}
                                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {cat.products.length} món
                                </span>
                            </h2>

                            {cat.products.length === 0 ? (
                                <p className="text-sm text-gray-400 italic bg-white p-4 rounded-xl border border-dashed border-gray-200">
                                    Danh mục này chưa có món ăn nào.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {cat.products.map((p) => (
                                        <div key={p.productID} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex gap-4">
                                            <div className="w-24 h-24 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                                                {p.imageURL ? (
                                                    <img src={p.imageURL} alt={p.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <ChefHat size={32} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-base leading-tight mb-1 truncate">{p.name}</h3>
                                                    {p.description && (
                                                        <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="font-extrabold text-emerald-600">{formatPrice(p.price)}</p>
                                                    <button 
                                                        onClick={() => addToCart(p)}
                                                        className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition shadow-sm border border-emerald-100"
                                                    >
                                                        <ShoppingCart size={14} className="ml-[-1px]" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    // BILL TAB CONTENT
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-800">Chi tiết hóa đơn</h2>
                            <button onClick={fetchBill} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                                <History size={18} className="text-gray-600" />
                            </button>
                        </div>

                        {loadingBill ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-gray-500 font-bold">Đang tải hóa đơn...</p>
                            </div>
                        ) : billData ? (
                            <div className="space-y-4">
                                {/* Thông tin gộp bàn */}
                                {billData.tables.length > 1 && (
                                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                        <p className="text-blue-700 text-sm font-bold flex items-center gap-2">
                                            <MapPin size={14} /> Điểm gộp: {billData.tables.map(t => t.name).join(' + ')}
                                        </p>
                                    </div>
                                )}

                                {/* Danh sách món đã phục vụ */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-6 space-y-4">
                                        {billData.items.map(item => (
                                            <div key={item.productID} className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0">
                                                    {item.imageURL ? <img src={item.imageURL} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ChefHat size={20} /></div>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800 truncate">{item.name}</p>
                                                    <p className="text-xs text-gray-500 font-bold">{formatPrice(item.price)} x {item.quantity}</p>
                                                </div>
                                                <p className="font-black text-gray-700">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-gray-50 p-6 space-y-3">
                                        <div className="flex justify-between items-center text-gray-500">
                                            <span className="font-medium">Tạm tính</span>
                                            <span className="font-bold">{formatPrice(billData.totalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-emerald-600">
                                            <span className="font-medium">Giảm giá</span>
                                            <span className="font-bold">0 đ</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                            <span className="text-xl font-black text-gray-900">TỔNG CỘNG</span>
                                            <span className="text-3xl font-black text-emerald-600 leading-none">{formatPrice(billData.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Nút thanh toán */}
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button 
                                        disabled={isProcessing}
                                        onClick={() => handleProcessPayment('Cash')}
                                        className="bg-gray-900 text-white rounded-2xl py-4 font-black flex flex-col items-center gap-1 shadow-lg hover:bg-black transition disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-2">
                                            {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CreditCard size={20} />}
                                            Tiền mặt
                                        </div>
                                    </button>
                                    <button 
                                        disabled={isProcessing}
                                        onClick={handleBankTransfer}
                                        className="bg-emerald-600 text-white rounded-2xl py-4 font-black flex flex-col items-center gap-1 shadow-lg hover:bg-emerald-700 transition disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-2">
                                            {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CreditCard size={20} />}
                                            QR Chuyển khoản
                                        </div>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <Receipt size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-400 font-medium">Bàn này chưa có hóa đơn.</p>
                                <button 
                                    onClick={() => setActiveTab('menu')}
                                    className="mt-4 text-emerald-600 font-bold hover:underline"
                                >
                                    Quay lại thực đơn
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Giỏ hàng nổi (Floating Cart - UI tạm) */}
            {cart.length > 0 && (
                <div className="sticky bottom-6 left-0 right-0 px-4 mt-6 z-40 flex justify-center max-w-3xl mx-auto">
                    <button 
                        onClick={() => setIsCheckoutOpen(true)}
                        className="bg-gray-900 text-white shadow-2xl rounded-2xl py-3 px-6 flex items-center gap-3 w-full hover:bg-black transition-colors transform hover:-translate-y-1 duration-200"
                    >
                        <div className="relative">
                            <ShoppingCart size={20} />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                {getCartCount()}
                            </span>
                        </div>
                        <span className="font-bold text-sm">Xem giỏ hàng</span>
                        <span className="ml-auto font-black text-emerald-400">
                            {formatPrice(getCartTotal())}
                        </span>
                    </button>
                </div>
            )}

            {/* Checkout Modal / Overlay (Dành cho Quản lý thanh toán hộ) */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">Chi tiết đơn hàng</h2>
                            <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                                <AlertCircle size={20} className="text-gray-400 rotate-45" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {cart.map(item => (
                                <div key={item.productID} className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                        {item.imageURL ? <img src={item.imageURL} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ChefHat size={20} /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-800 truncate">{item.name}</p>
                                        <p className="text-sm text-emerald-600 font-bold">{formatPrice(item.price)}</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                        <button onClick={() => updateQuantity(item.productID, -1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">-</button>
                                        <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.productID, 1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-6 py-6 bg-gray-50 border-t border-gray-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Tạm tính</span>
                                <span className="text-lg font-bold text-gray-800">{formatPrice(getCartTotal())}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-600">
                                <span className="font-medium">Giảm giá</span>
                                <span className="font-bold">0 đ</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                <span className="text-xl font-black text-gray-900">Tổng cộng</span>
                                <span className="text-2xl font-black text-emerald-600">{formatPrice(getCartTotal())}</span>
                            </div>

                            <button
                                disabled={isProcessing}
                                onClick={async () => {
                                    setIsProcessing(true);
                                    try {
                                        await confirmManagerOrder({
                                            tableId: tableId,
                                            items: cart.map(item => ({
                                                productID: item.productID,
                                                quantity: item.quantity,
                                                price: item.price
                                            }))
                                        });
                                        setIsCheckoutOpen(false);
                                        setCart([]);
                                        if (onCheckoutSuccess) onCheckoutSuccess("Đã xác nhận order thành công!");
                                    } catch (err) {
                                        console.error("Order error", err);
                                        alert("Lỗi xác nhận order: " + (err.response?.data?.message || err.message));
                                    } finally {
                                        setIsProcessing(false);
                                    }
                                }}
                                className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition flex items-center justify-center gap-2 ${
                                    isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }`}
                            >
                                {isProcessing ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <ShoppingCart size={20} />
                                )}
                                {isProcessing ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ORDER'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>

        {/* QR Payment Modal */}
        <TablePaymentModal
            isOpen={qrModalOpen}
            onClose={() => setQrModalOpen(false)}
            paymentData={qrPaymentData}
            billData={billData}
            tableName={billData?.tables?.[0]?.name}
            onPaymentSuccess={() => {
                setQrModalOpen(false);
                if (onCheckoutSuccess) {
                    onCheckoutSuccess('Thanh toán chuyển khoản thành công!', { type: 'Cash', tableId }); // Cash để trigger refresh
                }
            }}
        />
        </>
    );
}
