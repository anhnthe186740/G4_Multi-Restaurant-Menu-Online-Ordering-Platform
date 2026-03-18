import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMenuByTable } from '../api/publicApi';
import { ShoppingCart, ChefHat, MapPin, Phone, AlertCircle } from 'lucide-react';

export default function CustomerMenu({ tableIdProp }) {
    const [searchParams] = useSearchParams();
    const tableId = tableIdProp || searchParams.get('tableId');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);

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

    return (
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

            {/* Thông tin Bàn */}
            <div className="px-4 -mt-4 relative z-10">
                <div className="bg-white rounded-2xl shadow-md p-4 flex justify-between items-center border border-gray-100">
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Vị trí của bạn</p>
                        <p className="font-bold text-lg text-emerald-600">{table.name}</p>
                    </div>
                    {branch.phone && (
                        <a href={`tel:${branch.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition">
                            <Phone size={14} /> Liên hệ
                        </a>
                    )}
                </div>
            </div>

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

            {/* Danh sách món ăn */}
            <div className="p-4 space-y-8 max-w-3xl mx-auto">
                {categories.map((cat) => (
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
                                                <button className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition shadow-sm border border-emerald-100">
                                                    <ShoppingCart size={14} className="ml-[-1px]" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Giỏ hàng nổi (Floating Cart - UI tạm) */}
            <div className="sticky bottom-6 left-0 right-0 px-4 mt-6 z-40 flex justify-center max-w-3xl mx-auto">
                <button className="bg-gray-900 text-white shadow-2xl rounded-2xl py-3 px-6 flex items-center gap-3 w-full hover:bg-black transition-colors transform hover:-translate-y-1 duration-200">
                    <div className="relative">
                        <ShoppingCart size={20} />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
                    </div>
                    <span className="font-bold text-sm">Xem giỏ hàng</span>
                    <span className="ml-auto font-black text-emerald-400">0 đ</span>
                </button>
            </div>
            
        </div>
    );
}
