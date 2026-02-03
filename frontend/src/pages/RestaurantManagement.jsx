import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Eye,
    Lock,
    Unlock,
    Trash2,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    CheckCircle,
    AlertTriangle,
    Ban,
    UserPlus
} from 'lucide-react';
import { getAllRestaurants, deactivateRestaurant, reactivateRestaurant, forceDeleteRestaurant } from '../api/restaurantApi';
import RestaurantDetailsModal from '../components/RestaurantDetailsModal';

const RestaurantManagement = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        page: 1,
        limit: 10
    });
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });
    const [stats, setStats] = useState({
        active: 0,
        inactive: 0,
        total: 0
    });

    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch stats separately to ensure correctness regardless of current page/filter
    // In a real app, this should be a dedicated API endpoint
    const fetchStats = async () => {
        try {
            // Parallel fetch to get counts
            const [totalRes, activeRes, inactiveRes] = await Promise.all([
                getAllRestaurants({ limit: 1 }), // Just to get total count
                getAllRestaurants({ status: 'Active', limit: 1 }),
                getAllRestaurants({ status: 'Inactive', limit: 1 })
            ]);

            setStats({
                total: totalRes.pagination.total,
                active: activeRes.pagination.total,
                inactive: inactiveRes.pagination.total
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            const data = await getAllRestaurants(filters);
            setRestaurants(data.restaurants);
            setPagination(data.pagination);

            // Only fetch stats once or if drastic changes happen
            if (pagination.total === 0) {
                fetchStats();
            }
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurants();
    }, [filters]);

    // Refresh stats when filters change or actions performed
    useEffect(() => {
        fetchStats();
    }, [actionLoading]);

    const handleSearch = (e) => {
        e.preventDefault();
        setFilters({ ...filters, page: 1 });
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value, page: 1 });
    };

    const handlePageChange = (newPage) => {
        setFilters({ ...filters, page: newPage });
    };

    const handleViewDetails = (restaurant) => {
        setSelectedRestaurant(restaurant);
        setShowModal(true);
    };

    const handleDeactivate = async (id, name) => {
        const reason = prompt(`Lý do khóa tài khoản nhà hàng "${name}":`);
        if (!reason) return;
        if (!confirm(`Xác nhận khóa nhà hàng "${name}"?`)) return;

        try {
            setActionLoading(true);
            await deactivateRestaurant(id, reason);
            fetchRestaurants();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Lỗi khi khóa nhà hàng');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReactivate = async (id, name) => {
        if (!confirm(`Xác nhận mở khóa nhà hàng "${name}"?`)) return;

        try {
            setActionLoading(true);
            await reactivateRestaurant(id);
            fetchRestaurants();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Lỗi khi mở khóa nhà hàng');
        } finally {
            setActionLoading(false);
        }
    };

    const handleForceDelete = async (id, name) => {
        const confirmation = prompt(`⚠️ CẢNH BÁO: Xóa vĩnh viễn "${name}"? Nhập tên nhà hàng để xác nhận:`);
        if (confirmation !== name) return alert('Tên không khớp!');

        try {
            setActionLoading(true);
            await forceDeleteRestaurant(id);
            fetchRestaurants();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Lỗi khi xóa nhà hàng');
        } finally {
            setActionLoading(false);
        }
    };

    const activeRate = stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0;

    return (
        <div className="text-slate-200 font-sans">
            {/* Header Section */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Danh sách Tài khoản Nhà hàng</h1>
                    <p className="text-slate-400">Quản lý các nhà hàng đối tác trên toàn hệ thống.</p>
                </div>
                <button
                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20"
                    onClick={() => alert("Tính năng Phê duyệt đang được phát triển")}
                >
                    <UserPlus size={20} />
                    phê duyệt đăng kí
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-[#1e293b] rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center border border-slate-700/50 shadow-xl">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên nhà hàng, email..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-[#0f172a] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    />
                </form>

                {/* Dropdowns */}
                <div className="flex gap-3">
                    <select
                        className="bg-[#0f172a] border border-slate-700 text-slate-300 py-3 px-4 rounded-lg outline-none focus:border-emerald-500 cursor-pointer"
                        onChange={() => { }} // Placeholder for now
                    >
                        <option>Gói dịch vụ (Tất cả)</option>
                        <option>Basic</option>
                        <option>Pro</option>
                        <option>Enterprise</option>
                    </select>

                    <select
                        className="bg-[#0f172a] border border-slate-700 text-slate-300 py-3 px-4 rounded-lg outline-none focus:border-emerald-500 cursor-pointer"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="">Trạng thái (Tất cả)</option>
                        <option value="Active">Hoạt động</option>
                        <option value="Inactive">Bị khóa</option>
                    </select>

                    <button className="bg-[#0f172a] border border-slate-700 text-slate-300 py-3 px-4 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                        <Filter size={18} />
                        Bộ lọc khác
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 shadow-xl overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#0f172a]/50 text-xs uppercase text-slate-400 font-semibold">
                            <tr>
                                <th className="px-6 py-4 text-left tracking-wider">Tên Nhà Hàng</th>
                                <th className="px-6 py-4 text-left tracking-wider">Email Liên Hệ</th>
                                <th className="px-6 py-4 text-left tracking-wider">Gói Dịch Vụ</th>
                                <th className="px-6 py-4 text-left tracking-wider">Trạng Thái</th>
                                <th className="px-6 py-4 text-center tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex justify-center mb-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                                        </div>
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : restaurants.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        Không tìm thấy nhà hàng nào.
                                    </td>
                                </tr>
                            ) : (
                                restaurants.map((restaurant) => (
                                    <tr key={restaurant.RestaurantID} className="hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0 overflow-hidden">
                                                    {restaurant.Logo ? (
                                                        <img src={restaurant.Logo} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        restaurant.restaurantName.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                                                        {restaurant.restaurantName}
                                                    </div>
                                                    <div className="text-xs text-slate-500">ID: RS-{restaurant.RestaurantID.toString().padStart(4, '0')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {restaurant.ownerEmail || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-700/50 border border-slate-600/50 text-slate-300 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide">
                                                {restaurant.currentPackage || 'CƠ BẢN'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {restaurant.ownerStatus === 'Active' ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    <span className="text-emerald-500 font-bold text-xs uppercase">Hoạt động</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    <span className="text-red-500 font-bold text-xs uppercase">Bị khóa</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                                                {restaurant.ownerStatus === 'Active' ? (
                                                    <button
                                                        onClick={() => handleDeactivate(restaurant.RestaurantID, restaurant.restaurantName)}
                                                        className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 p-2 rounded-lg transition-all"
                                                        title="Khóa tài khoản"
                                                    >
                                                        <Unlock size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReactivate(restaurant.RestaurantID, restaurant.restaurantName)}
                                                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                                                        title="Mở khóa tài khoản"
                                                    >
                                                        <Lock size={18} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleViewDetails(restaurant)}
                                                    className="text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-all"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                <button
                                                    onClick={() => handleForceDelete(restaurant.RestaurantID, restaurant.restaurantName)}
                                                    className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                                                    title="Xóa vĩnh viễn"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-[#0f172a]/30 border-t border-slate-700/50 flex items-center justify-between text-sm text-slate-400">
                    <div>
                        Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} nhà hàng
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="px-3 py-1 rounded bg-[#0f172a] hover:bg-slate-700 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Trước
                        </button>
                        {[...Array(pagination.totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => handlePageChange(i + 1)}
                                className={`w-8 h-8 rounded flex items-center justify-center font-bold transition-all ${pagination.page === i + 1
                                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                    : 'bg-[#0f172a] hover:bg-slate-700 border border-slate-700'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className="px-3 py-1 rounded bg-[#0f172a] hover:bg-slate-700 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Footer (Mockup style) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700/50 shadow-lg flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/20">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div className="text-slate-400 text-sm font-medium mb-1">Tỷ lệ hoạt động</div>
                        <div className="text-2xl font-bold text-white">{activeRate}%</div>
                    </div>
                </div>

                <div className="bg-[#1e293b] rounded-xl p-5 border border-yellow-700/30 shadow-lg flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/10 transition-colors"></div>
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0 border border-yellow-500/20">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <div className="text-slate-400 text-sm font-medium mb-1">Tài khoản bị report (24h)</div>
                        <div className="text-2xl font-bold text-white">0 nhà hàng</div>
                    </div>
                </div>

                <div className="bg-[#1e293b] rounded-xl p-5 border border-red-700/30 shadow-lg flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-red-500/10 transition-colors"></div>
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0 border border-red-500/20">
                        <Ban size={24} />
                    </div>
                    <div>
                        <div className="text-slate-400 text-sm font-medium mb-1">Đang bị khóa</div>
                        <div className="text-2xl font-bold text-white">{stats.inactive} nhà hàng</div>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {showModal && selectedRestaurant && (
                <RestaurantDetailsModal
                    restaurantId={selectedRestaurant.RestaurantID}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedRestaurant(null);
                    }}
                    onUpdate={fetchRestaurants}
                />
            )}
        </div>
    );
};

export default RestaurantManagement;
