import AdminSidebar from './AdminSidebar';
import { Link, useLocation } from 'react-router-dom';

export default function AdminLayout({ children }) {
    const location = useLocation();

    // Get page title based on current route
    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('/admin/dashboard')) return 'Tổng quan';
        if (path.includes('/admin/restaurants')) return 'Quản lý Nhà hàng';
        if (path.includes('/admin/packages')) return 'Quản lý Gói dịch vụ';
        if (path.includes('/admin/reports')) return 'Báo cáo & Thống kê';
        if (path.includes('/admin/content')) return 'Quản lý Nội dung';
        if (path.includes('/admin/support')) return 'Hỗ trợ';
        return 'Trang chủ';
    };

    return (
        <div className="min-h-screen bg-[#0a0f0d]">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <main className="ml-64 min-h-screen p-8">
                {/* Top Bar */}
                <div className="mb-8">
                    {/* Dynamic Breadcrumb */}
                    <div className="flex items-center gap-2">
                        <Link
                            to="/admin/dashboard"
                            className="text-gray-400 text-sm hover:text-[#00ff88] transition"
                        >
                            Trang chủ
                        </Link>
                        <span className="text-gray-600">/</span>
                        <span className="text-white font-medium text-sm">{getPageTitle()}</span>
                    </div>
                </div>

                {/* Page Content */}
                <div className="space-y-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
