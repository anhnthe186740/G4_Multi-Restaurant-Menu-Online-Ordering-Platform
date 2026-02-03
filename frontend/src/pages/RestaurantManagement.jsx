import { useState, useEffect } from 'react';
import {
    Building2,
    Search,
    Filter,
    Eye,
    Ban,
    CheckCircle,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Package
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
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch restaurants
    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            const data = await getAllRestaurants(filters);
            setRestaurants(data.restaurants);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            alert('Không thể tải danh sách nhà hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurants();
    }, [filters]);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        setFilters({ ...filters, page: 1 });
    };

    // Handle filter change
    const handleFilterChange = (status) => {
        setFilters({ ...filters, status, page: 1 });
    };

    // Handle pagination
    const handlePageChange = (newPage) => {
        setFilters({ ...filters, page: newPage });
    };

    // Handle view details
    const handleViewDetails = (restaurant) => {
        setSelectedRestaurant(restaurant);
        setShowModal(true);
    };

    // Handle deactivate
    const handleDeactivate = async (id, name) => {
        const reason = prompt(`Lý do vô hiệu hóa nhà hàng "${name}":`);
        if (!reason) return;

        if (!confirm(`Xác nhận vô hiệu hóa nhà hàng "${name}"?`)) return;

        try {
            setActionLoading(true);
            await deactivateRestaurant(id, reason);
            alert('Đã vô hiệu hóa nhà hàng thành công!');
            fetchRestaurants();
        } catch (error) {
            console.error('Error deactivating restaurant:', error);
            alert('Không thể vô hiệu hóa nhà hàng');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle reactivate
    const handleReactivate = async (id, name) => {
        if (!confirm(`Xác nhận kích hoạt lại nhà hàng "${name}"?`)) return;

        try {
            setActionLoading(true);
            await reactivateRestaurant(id);
            alert('Đã kích hoạt lại nhà hàng thành công!');
            fetchRestaurants();
        } catch (error) {
            console.error('Error reactivating restaurant:', error);
            alert('Không thể kích hoạt lại nhà hàng');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle force delete
    const handleForceDelete = async (id, name) => {
        const confirmation = prompt(
            `⚠️ CẢNH BÁO: Xóa vĩnh viễn nhà hàng "${name}"?\n\nHành động này KHÔNG THỂ HOÀN TÁC!\nNhập tên nhà hàng để xác nhận:`
        );

        if (confirmation !== name) {
            alert('Tên nhà hàng không khớp. Đã hủy!');
            return;
        }

        try {
            setActionLoading(true);
            await forceDeleteRestaurant(id);
            alert('Đã xóa vĩnh viễn nhà hàng!');
            fetchRestaurants();
        } catch (error) {
            console.error('Error deleting restaurant:', error);
            alert('Không thể xóa nhà hàng');
        } finally {
            setActionLoading(false);
        }
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const styles = {
            Active: 'bg-green-100 text-green-800 border-green-200',
            Inactive: 'bg-red-100 text-red-800 border-red-200'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
                {status === 'Active' ? '🟢 Hoạt động' : '🔴 Vô hiệu hóa'}
            </span>
        );
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Quản lý Nhà Hàng</h1>
                            <p className="text-gray-500">Quản lý toàn bộ nhà hàng trong hệ thống</p>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên nhà hàng, chủ sở hữu, email..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                />
                            </div>
                        </form>

                        {/* Status Filter */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleFilterChange('')}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all ${filters.status === ''
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => handleFilterChange('Active')}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all ${filters.status === 'Active'
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Hoạt động
                            </button>
                            <button
                                onClick={() => handleFilterChange('Inactive')}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all ${filters.status === 'Inactive'
                                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Vô hiệu hóa
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4 text-gray-600">
                    Tìm thấy <span className="font-bold text-gray-800">{pagination.total}</span> nhà hàng
                </div>

                {/* Table */}
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-500">Đang tải...</p>
                    </div>
                ) : restaurants.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Không tìm thấy nhà hàng nào</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Nhà Hàng
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Chủ Sở Hữu
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Liên Hệ
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Gói Dịch Vụ
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Chi Nhánh
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Trạng Thái
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Hành Động
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {restaurants.map((restaurant) => (
                                        <tr key={restaurant.RestaurantID} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {restaurant.Logo ? (
                                                        <img src={restaurant.Logo} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                                                            <Building2 className="w-6 h-6 text-white" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-gray-800">{restaurant.restaurantName}</div>
                                                        <div className="text-xs text-gray-500">ID: {restaurant.RestaurantID}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-800">{restaurant.ownerName || <span className="text-red-400 italic font-normal">Chưa có owner</span>}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600">{restaurant.ownerEmail || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{restaurant.ownerPhone || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {restaurant.currentPackage ? (
                                                    <div className="flex items-center gap-2">
                                                        <Package className="w-4 h-4 text-indigo-500" />
                                                        <span className="font-medium text-gray-800">{restaurant.currentPackage}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Chưa có gói</span>
                                                )}
                                                {restaurant.packageExpiryDate && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Hết hạn: {formatDate(restaurant.packageExpiryDate)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                                    {restaurant.branchCount} chi nhánh
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(restaurant.ownerStatus || 'Inactive')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(restaurant)}
                                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {restaurant.ownerStatus === 'Active' ? (
                                                        <button
                                                            onClick={() => handleDeactivate(restaurant.RestaurantID, restaurant.restaurantName)}
                                                            disabled={actionLoading}
                                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                                                            title="Vô hiệu hóa"
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleReactivate(restaurant.RestaurantID, restaurant.restaurantName)}
                                                            disabled={actionLoading}
                                                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                                                            title="Kích hoạt lại"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleForceDelete(restaurant.RestaurantID, restaurant.restaurantName)}
                                                        disabled={actionLoading}
                                                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                                        title="Xóa vĩnh viễn"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Trang {pagination.page} / {pagination.totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-gray-700 flex items-center gap-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Trước
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-gray-700 flex items-center gap-2"
                                    >
                                        Sau
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
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
