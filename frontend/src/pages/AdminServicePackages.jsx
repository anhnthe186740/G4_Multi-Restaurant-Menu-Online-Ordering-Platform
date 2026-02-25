import { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import {
    getServicePackages,
    deleteServicePackage,
    getSubscriptionHistory,
    createServicePackage,
    updateServicePackage,
    renewSubscription,
    getRestaurantStatuses
} from '../api/adminApi';
import PackageFormModal from '../components/admin/packages/PackageFormModal';
import RenewalModal from '../components/admin/packages/RenewalModal';

export default function ServicePackagesPage() {
    const [packages, setPackages] = useState([]);
    const [history, setHistory] = useState([]);
    const [restaurantStatuses, setRestaurantStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentStatusPage, setCurrentStatusPage] = useState(1);
    const [activeTab, setActiveTab] = useState('packages'); // packages | status
    const itemsPerPage = 5;

    // Modals state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isRenewalOpen, setIsRenewalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [pkgRes, histRes, statusRes] = await Promise.all([
                getServicePackages(),
                getSubscriptionHistory(),
                getRestaurantStatuses()
            ]);
            setPackages(pkgRes.data);
            setHistory(histRes.data);
            setRestaurantStatuses(statusRes.data);
        } catch (error) {
            console.error("Error loading packages:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa gói này?')) {
            try {
                await deleteServicePackage(id);
                loadData(); // Refresh list
            } catch (error) {
                alert('Lỗi khi xóa gói: ' + error.message);
            }
        }
    };

    const handleEdit = (pkg) => {
        setEditingPackage(pkg);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingPackage(null);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (data) => {
        try {
            if (editingPackage) {
                await updateServicePackage(editingPackage.packageID, data);
            } else {
                await createServicePackage(data);
            }
            setIsFormOpen(false);
            loadData();
        } catch (error) {
            alert('Lỗi lưu gói dịch vụ: ' + error.message);
            throw error;
        }
    };

    const handleRenewalSubmit = async (data) => {
        try {
            await renewSubscription(data);
            setIsRenewalOpen(false);
            alert('Gia hạn thành công!');
            loadData();
        } catch (error) {
            alert('Lỗi gia hạn: ' + error.message);
            throw error;
        }
    };

    return (

        <AdminLayout>
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Quản lý Gói dịch vụ</h1>
                    <p className="text-gray-400">Cấu hình các gói thuê bao cho nhà hàng</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsRenewalOpen(true)}
                        className="px-5 py-2.5 bg-[#1a2b22] text-[#00ff88] rounded-xl hover:bg-[#00ff88]/10 transition border border-[#00ff88]/30 font-semibold flex items-center gap-2"
                    >
                        <span>🔄</span> Gia hạn nhanh
                    </button>
                    {activeTab === 'packages' && (
                        <button
                            onClick={handleCreate}
                            className="px-5 py-2.5 bg-[#00ff88] text-[#1a2b22] rounded-xl hover:bg-[#00df76] transition font-bold shadow-[0_0_20px_rgba(0,255,136,0.3)] flex items-center gap-2"
                        >
                            <span>+</span> Tạo gói mới
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-6 border-b border-gray-800 mb-8">
                <button
                    onClick={() => setActiveTab('packages')}
                    className={`pb-4 px-2 font-bold text-sm transition relative ${activeTab === 'packages' ? 'text-[#00ff88]' : 'text-gray-400 hover:text-white'}`}
                >
                    Gói dịch vụ
                    {activeTab === 'packages' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00ff88] shadow-[0_0_10px_#00ff88]"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('status')}
                    className={`pb-4 px-2 font-bold text-sm transition relative ${activeTab === 'status' ? 'text-[#00ff88]' : 'text-gray-400 hover:text-white'}`}
                >
                    Trạng thái đăng ký
                    {activeTab === 'status' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00ff88] shadow-[0_0_10px_#00ff88]"></div>}
                </button>
            </div>

            {activeTab === 'packages' ? (
                <>
                    {/* Package Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                        {packages.map((pkg, index) => {
                            const isPopular = pkg.duration === 12 || index === 1; // gói giữa = phổ biến nhất
                            return (
                                <div
                                    key={pkg.packageID}
                                    className={`relative bg-[#0d1612] border rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${isPopular
                                        ? 'border-[#00ff88] shadow-[0_0_30px_rgba(0,255,136,0.1)]'
                                        : 'border-gray-800 hover:border-gray-600'
                                        }`}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#00ff88] text-[#1a2b22] text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                            Phổ biến nhất
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${isPopular ? 'text-[#00ff88]' : 'text-gray-400'}`}>
                                            {pkg.packageName}
                                        </h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-white">
                                                {new Intl.NumberFormat('vi-VN').format(pkg.price)}
                                            </span>
                                            <span className="text-gray-500 font-medium text-xs">VND / {pkg.duration} Tháng</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 mb-6">
                                        <ul className="space-y-2.5">
                                            {(pkg.featuresDescription || "Hỗ trợ kỹ thuật 24/7\nKhông giới hạn tính năng").split('\n').map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2.5">
                                                    <div className="mt-1 w-4 h-4 rounded-full bg-[#00ff88]/10 flex items-center justify-center shrink-0">
                                                        <svg className="w-2.5 h-2.5 text-[#00ff88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="flex gap-2 mt-auto">
                                        <button
                                            onClick={() => handleEdit(pkg)}
                                            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${isPopular
                                                ? 'bg-[#00ff88] text-[#1a2b22] hover:bg-[#00df76]'
                                                : 'bg-white/5 text-white hover:bg-white/10'
                                                }`}
                                        >
                                            <span>✎</span> Chỉnh sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(pkg.packageID)}
                                            className="px-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition border border-red-500/20"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Transaction History */}
                    <div className="bg-[#0d1612] rounded-2xl border border-gray-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Lịch sử thanh toán gói</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5 text-gray-500 text-xs uppercase tracking-wider">
                                        <th className="py-4 px-6 font-semibold">Nhà hàng</th>
                                        <th className="py-4 px-6 font-semibold">Gói</th>
                                        <th className="py-4 px-6 font-semibold">Số tiền</th>
                                        <th className="py-4 px-6 font-semibold">Ngày</th>
                                        <th className="py-4 px-6 font-semibold">Trạng thái</th>
                                        <th className="py-4 px-6 font-semibold text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(item => (
                                        <tr key={item.SubscriptionID} className="group hover:bg-white/[0.02] transition">
                                            <td className="py-4 px-6 text-white font-medium">
                                                {item.RestaurantName}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="px-2.5 py-1 rounded-md bg-white/5 text-white text-xs border border-white/10 font-medium">
                                                    {item.PackageName.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-[#00ff88] font-mono font-medium">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.Price)}
                                            </td>
                                            <td className="py-4 px-6 text-gray-400 text-sm">
                                                {new Date(item.StartDate).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`flex items-center gap-1.5 text-xs font-bold ${item.Status === 'Active' ? 'text-[#00ff88]' : 'text-red-500'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${item.Status === 'Active' ? 'bg-[#00ff88]' : 'bg-red-500'}`}></span>
                                                    {item.Status === 'Active' ? 'THÀNH CÔNG' : 'HẾT HẠN'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button className="px-3 py-1.5 rounded-lg bg-[#00ff88]/10 text-[#00ff88] hover:bg-[#00ff88]/20 text-xs font-bold transition border border-[#00ff88]/20">
                                                    Chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-gray-500">
                                                Chưa có giao dịch nào
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {history.length > 0 && (
                            <div className="p-4 border-t border-gray-800 flex justify-end items-center gap-2">
                                <span className="text-gray-500 text-sm mr-2">
                                    Trang {currentPage} / {Math.ceil(history.length / itemsPerPage)}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                    &lt;
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(history.length / itemsPerPage), p + 1))}
                                    disabled={currentPage === Math.ceil(history.length / itemsPerPage)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                    &gt;
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="bg-[#0d1612] rounded-2xl border border-gray-800 overflow-hidden animate-fade-in-up">
                    <div className="p-6 border-b border-gray-800">
                        <h3 className="text-lg font-bold text-white">Danh sách Trạng thái Đăng ký</h3>
                        <p className="text-gray-400 text-sm">Quản lý thời hạn sử dụng dịch vụ của tất cả nhà hàng</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="py-4 px-6 font-semibold">Nhà hàng / Chủ sở hữu</th>
                                    <th className="py-4 px-6 font-semibold">Gói hiện tại</th>
                                    <th className="py-4 px-6 font-semibold">Ngày hết hạn</th>
                                    <th className="py-4 px-6 font-semibold">Thời hạn còn lại</th>
                                    <th className="py-4 px-6 font-semibold text-right">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {restaurantStatuses.slice((currentStatusPage - 1) * itemsPerPage, currentStatusPage * itemsPerPage).map(status => (
                                    <tr key={status.RestaurantID} className="group hover:bg-white/[0.02] transition">
                                        <td className="py-4 px-6">
                                            <div className="text-white font-medium">{status.RestaurantName}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{status.OwnerName} - {status.OwnerPhone}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-1 rounded-md text-xs border font-medium ${status.Status === 'Active' ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' : 'bg-white/5 text-gray-400 border-white/10'
                                                }`}>
                                                {status.CurrentPackage}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-300 font-mono text-sm">
                                            {status.ExpiryDate ? new Date(status.ExpiryDate).toLocaleDateString('vi-VN') : '---'}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium">
                                            {status.DaysRemaining !== null ? (
                                                status.DaysRemaining > 0
                                                    ? <span className="text-[#00ff88]">{status.DaysRemaining} ngày</span>
                                                    : <span className="text-red-500">Đã hết hạn {-status.DaysRemaining} ngày</span>
                                            ) : (
                                                <span className="text-gray-500">---</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.Status === 'Active' ? 'bg-[#00ff88]/10 text-[#00ff88]' :
                                                status.Status === 'Expired' ? 'bg-red-500/10 text-red-500' : 'bg-gray-700/50 text-gray-400'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${status.Status === 'Active' ? 'bg-[#00ff88]' :
                                                    status.Status === 'Expired' ? 'bg-red-500' : 'bg-gray-400'
                                                    }`}></span>
                                                {status.Status === 'Active' ? 'ĐANG HOẠT ĐỘNG' :
                                                    status.Status === 'Expired' ? 'HẾT HẠN' : 'CHƯA ĐĂNG KÝ'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {restaurantStatuses.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-gray-500">
                                            Chưa có dữ liệu nhà hàng
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls for Status Table */}
                    {restaurantStatuses.length > 0 && (
                        <div className="p-4 border-t border-gray-800 flex justify-end items-center gap-2">
                            <span className="text-gray-500 text-sm mr-2">
                                Trang {currentStatusPage} / {Math.ceil(restaurantStatuses.length / itemsPerPage)}
                            </span>
                            <button
                                onClick={() => setCurrentStatusPage(p => Math.max(1, p - 1))}
                                disabled={currentStatusPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                &lt;
                            </button>
                            <button
                                onClick={() => setCurrentStatusPage(p => Math.min(Math.ceil(restaurantStatuses.length / itemsPerPage), p + 1))}
                                disabled={currentStatusPage === Math.ceil(restaurantStatuses.length / itemsPerPage)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                &gt;
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modals placed here as before */}
            {isFormOpen && (
                <PackageFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleFormSubmit}
                    initialData={editingPackage}
                />
            )}

            {isRenewalOpen && (
                <RenewalModal
                    isOpen={isRenewalOpen}
                    onClose={() => setIsRenewalOpen(false)}
                    onSubmit={handleRenewalSubmit}
                    packages={packages}
                />
            )}
        </AdminLayout>
    );
}
