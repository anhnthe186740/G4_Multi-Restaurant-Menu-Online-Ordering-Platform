import { useState, useEffect } from 'react';
import { getRestaurantsForRenewal } from '../../../api/adminApi';

export default function RenewalModal({ isOpen, onClose, onSubmit, packages }) {
    const [restaurants, setRestaurants] = useState([]);
    const [loadingRestaurants, setLoadingRestaurants] = useState(false);
    const [formData, setFormData] = useState({
        restaurantId: '',
        packageId: ''
    });

    const [selectedPackagePrice, setSelectedPackagePrice] = useState(0);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchRestaurants();
        }
    }, [isOpen]);

    const fetchRestaurants = async () => {
        try {
            setLoadingRestaurants(true);
            const response = await getRestaurantsForRenewal();
            setRestaurants(response.data);
        } catch (error) {
            console.error("Error fetching restaurants:", error);
        } finally {
            setLoadingRestaurants(false);
        }
    };

    useEffect(() => {
        if (formData.packageId) {
            const pkg = packages.find(p => p.PackageID == formData.packageId);
            setSelectedPackagePrice(pkg ? pkg.Price : 0);
        } else {
            setSelectedPackagePrice(0);
        }
    }, [formData.packageId, packages]);

    useEffect(() => {
        if (formData.restaurantId) {
            const restaurant = restaurants.find(r => r.RestaurantID == formData.restaurantId);
            setSelectedRestaurant(restaurant || null);
        } else {
            setSelectedRestaurant(null);
        }
    }, [formData.restaurantId, restaurants]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            restaurantId: formData.restaurantId,
            packageId: formData.packageId
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d1612] border border-gray-800 rounded-2xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00ff88]/5 blur-[60px] rounded-full"></div>

                <div className="flex justify-between items-center mb-8 relative z-10">
                    <h3 className="text-2xl font-bold text-white">Gia hạn dịch vụ</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 w-8 h-8 rounded-full flex items-center justify-center transition">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="group">
                        <label className="block text-gray-400 text-sm font-medium mb-2 group-focus-within:text-[#00ff88] transition">Chọn Nhà hàng</label>
                        <select
                            required
                            className="w-full bg-[#1a2b22]/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] focus:outline-none transition appearance-none cursor-pointer hover:border-gray-500"
                            value={formData.restaurantId}
                            onChange={(e) => setFormData({ ...formData, restaurantId: e.target.value })}
                            disabled={loadingRestaurants}
                        >
                            <option value=""> {loadingRestaurants ? 'Đang tải...' : 'Chọn nhà hàng'} </option>
                            {restaurants.map(r => (
                                <option key={r.RestaurantID} value={r.RestaurantID}>
                                    {r.RestaurantName}
                                </option>
                            ))}
                        </select>

                        {selectedRestaurant && (
                            <div className="mt-3 p-3 bg-white/5 rounded-lg border border-gray-700/50 flex flex-col gap-1">
                                <div className="text-sm text-gray-300">
                                    <span className="text-gray-500 mr-2">Chủ sở hữu:</span>
                                    <span className="font-semibold text-[#00ff88]">{selectedRestaurant.OwnerName}</span>
                                </div>
                                <div className="text-xs text-gray-400">
                                    <span className="text-gray-500 mr-2">SĐT:</span>
                                    {selectedRestaurant.OwnerPhone || 'Chưa cập nhật'}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="group">
                        <label className="block text-gray-400 text-sm font-medium mb-2 group-focus-within:text-[#00ff88] transition">Chọn gói gia hạn</label>
                        <select
                            required
                            className="w-full bg-[#1a2b22]/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] focus:outline-none transition appearance-none cursor-pointer hover:border-gray-500"
                            value={formData.packageId}
                            onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                        >
                            <option value="">Lựa chọn gói</option>
                            {packages.map(pkg => (
                                <option key={pkg.PackageID} value={pkg.PackageID}>
                                    {pkg.PackageName} ({pkg.Duration} Tháng)
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData.packageId && (
                        <div className="bg-[#00ff88]/5 p-5 rounded-xl border border-[#00ff88]/20 mt-6 animate-fade-in-up">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Tổng thanh toán</p>
                                    <p className="text-xs text-[#00ff88]">Đã bao gồm thuế</p>
                                </div>
                                <span className="text-3xl font-bold text-[#00ff88] tracking-tight">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedPackagePrice)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-400 hover:text-white font-medium transition"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-[#00ff88] text-[#1a2b22] font-bold rounded-xl hover:bg-[#00df76] transition shadow-[0_0_20px_rgba(0,255,136,0.2)]"
                        >
                            Xác nhận
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
