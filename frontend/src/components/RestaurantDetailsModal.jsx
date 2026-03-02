import { useState, useEffect } from 'react';
import {
    X,
    Building,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Clock,
    Package,
    TicketCheck,
    ChevronDown,
    ChevronUp,
    CreditCard,
    AlertCircle
} from 'lucide-react';
import { getRestaurantDetails, getRestaurantStats } from '../api/restaurantApi';

const RestaurantDetailsModal = ({ restaurantId, onClose, onUpdate }) => {
    const [data, setData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info');
    const [expandedSections, setExpandedSections] = useState({
        branches: true,
        subscriptions: true,
        tickets: false
    });

    useEffect(() => {
        fetchData();
    }, [restaurantId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [detailsData, statsData] = await Promise.all([
                getRestaurantDetails(restaurantId),
                getRestaurantStats(restaurantId)
            ]);
            setData(detailsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching restaurant details:', error);
            alert('Không thể tải thông tin nhà hàng');
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getStatusBadge = (status) => {
        const styles = {
            Active: 'bg-green-100 text-green-800 border-green-200',
            Inactive: 'bg-red-100 text-red-800 border-red-200',
            Expired: 'bg-gray-100 text-gray-800 border-gray-200',
            Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            Served: 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    const getPriorityBadge = (priority) => {
        const styles = {
            Low: 'bg-blue-100 text-blue-800',
            Medium: 'bg-yellow-100 text-yellow-800',
            High: 'bg-red-100 text-red-800'
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[priority]}`}>
                {priority}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-12">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { restaurant, branches, subscriptions, tickets } = data;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        {restaurant.Logo ? (
                            <img src={restaurant.Logo} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-lg" />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                                <Building className="w-8 h-8" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold">{restaurant.Name}</h2>
                            <p className="text-blue-100">ID: {restaurant.RestaurantID}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50">
                        <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-semibold text-gray-600">Doanh Thu</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</div>
                            <div className="text-xs text-gray-500 mt-1">{stats.subscriptionCount} gói đã mua</div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-semibold text-gray-600">Chi Nhánh</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-800">{stats.branchCount}</div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Building className="w-5 h-5 text-purple-600" />
                                <span className="text-sm font-semibold text-gray-600">Bàn Ăn</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-800">{stats.totalTables}</div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="w-5 h-5 text-indigo-600" />
                                <span className="text-sm font-semibold text-gray-600">Gói Hiện Tại</span>
                            </div>
                            <div className="text-lg font-bold text-gray-800">
                                {stats.activeSubscription ? stats.activeSubscription.PackageName : 'Chưa có'}
                            </div>
                            {stats.activeSubscription && (
                                <div className="text-xs text-gray-500 mt-1">
                                    HSD: {formatDate(stats.activeSubscription.EndDate).split(' ')[0]}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Restaurant Info */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Building className="w-5 h-5 text-blue-600" />
                            Thông Tin Nhà Hàng
                        </h3>

                        {/* ── Hình ảnh & giấy phép ── */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {/* Ảnh bìa */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Ảnh bìa nhà hàng</p>
                                {restaurant.CoverImage ? (
                                    <img
                                        src={restaurant.CoverImage}
                                        alt="Ảnh bìa"
                                        className="w-full h-36 object-cover rounded-lg border border-gray-200 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-full h-36 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                                        <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                                        <span className="text-xs">Chưa có ảnh bìa</span>
                                    </div>
                                )}
                            </div>

                            {/* Logo */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Logo thương hiệu</p>
                                {restaurant.Logo ? (
                                    <div className="w-full h-36 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center shadow-sm p-4">
                                        <img
                                            src={restaurant.Logo}
                                            alt="Logo"
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-36 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                                        <Building className="w-8 h-8 mb-1" />
                                        <span className="text-xs">Chưa có logo</span>
                                    </div>
                                )}
                            </div>

                            {/* Giấy phép kinh doanh */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Giấy phép kinh doanh</p>
                                {restaurant.BusinessLicense ? (
                                    <a
                                        href={restaurant.BusinessLicense}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center w-full h-36 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition text-blue-600 cursor-pointer shadow-sm"
                                    >
                                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                        <span className="text-xs font-semibold">Xem giấy phép</span>
                                        <span className="text-xs text-blue-400 mt-0.5 max-w-[120px] truncate text-center">
                                            {restaurant.BusinessLicense.split('/').pop()}
                                        </span>
                                    </a>
                                ) : (
                                    <div className="w-full h-36 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                                        <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                        <span className="text-xs">Chưa có giấy phép</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Thông tin văn bản ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Tên Nhà Hàng</label>
                                <div className="text-gray-800 mt-1">{restaurant.Name}</div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Mã Số Thuế</label>
                                <div className="text-gray-800 mt-1">{restaurant.TaxCode || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Website</label>
                                <div className="text-blue-600 mt-1">
                                    {restaurant.Website ? (
                                        <a href={restaurant.Website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            {restaurant.Website}
                                        </a>
                                    ) : 'N/A'}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Ngày Đăng Ký</label>
                                <div className="text-gray-800 mt-1">{formatDate(restaurant.registeredDate)}</div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-semibold text-gray-600">Mô Tả</label>
                                <div className="text-gray-800 mt-1">{restaurant.Description || 'Chưa có mô tả'}</div>
                            </div>
                        </div>
                    </div>


                    {/* Owner Info */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Chủ Sở Hữu
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Họ Tên</label>
                                <div className="text-gray-800 mt-1 font-medium">{restaurant.ownerName}</div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Username</label>
                                <div className="text-gray-800 mt-1">{restaurant.ownerUsername}</div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Email</label>
                                <div className="text-gray-800 mt-1 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {restaurant.ownerEmail || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Số Điện Thoại</label>
                                <div className="text-gray-800 mt-1 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    {restaurant.ownerPhone || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Trạng Thái</label>
                                <div className="mt-1">{getStatusBadge(restaurant.ownerStatus)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Branches */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                        <button
                            onClick={() => toggleSection('branches')}
                            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                Chi Nhánh ({branches.length})
                            </h3>
                            {expandedSections.branches ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>

                        {expandedSections.branches && (
                            <div className="px-6 pb-6 space-y-3">
                                {branches.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">Chưa có chi nhánh nào</p>
                                ) : (
                                    branches.map(branch => (
                                        <div key={branch.BranchID} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{branch.Name}</h4>
                                                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {branch.Address || 'Chưa có địa chỉ'}
                                                    </p>
                                                </div>
                                                {getStatusBadge(branch.IsActive ? 'Active' : 'Inactive')}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-600">{branch.Phone || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-600">{branch.OpeningHours || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-600">QL: {branch.managerName || 'Chưa có'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-600">{branch.tableCount} bàn</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Subscriptions */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                        <button
                            onClick={() => toggleSection('subscriptions')}
                            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                Lịch Sử Gói Dịch Vụ ({subscriptions.length})
                            </h3>
                            {expandedSections.subscriptions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>

                        {expandedSections.subscriptions && (
                            <div className="px-6 pb-6">
                                {subscriptions.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">Chưa có gói dịch vụ nào</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Gói</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Bắt Đầu</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Kết Thúc</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Giá</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Auto Renew</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Trạng Thái</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {subscriptions.map(sub => (
                                                    <tr key={sub.SubscriptionID} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-semibold text-gray-800">{sub.PackageName}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sub.StartDate).split(' ')[0]}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sub.EndDate).split(' ')[0]}</td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{formatCurrency(sub.Price)}</td>
                                                        <td className="px-4 py-3">
                                                            {sub.AutoRenew ? (
                                                                <span className="text-green-600 font-semibold">✓ Có</span>
                                                            ) : (
                                                                <span className="text-gray-400">✗ Không</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">{getStatusBadge(sub.Status)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Support Tickets */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                        <button
                            onClick={() => toggleSection('tickets')}
                            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <TicketCheck className="w-5 h-5 text-blue-600" />
                                Tickets Hỗ Trợ ({tickets.length})
                            </h3>
                            {expandedSections.tickets ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>

                        {expandedSections.tickets && (
                            <div className="px-6 pb-6 space-y-3">
                                {tickets.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">Chưa có ticket nào</p>
                                ) : (
                                    tickets.map(ticket => (
                                        <div key={ticket.TicketID} className="border-2 border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-800">{ticket.Subject}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{ticket.Description}</p>
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    {getPriorityBadge(ticket.Priority)}
                                                    {getStatusBadge(ticket.Status)}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-2">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(ticket.CreatedAt)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 p-6 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestaurantDetailsModal;
