import { Link, useLocation } from 'react-router-dom';
import RestaurantOwnerSidebar from './RestaurantOwnerSidebar';

export default function RestaurantOwnerLayout({ children }) {
    const location = useLocation();

    const getPageTitle = () => {
        const p = location.pathname;
        if (p.includes('/owner/dashboard')) return 'Tổng quan';
        if (p.includes('/owner/reports')) return 'Báo cáo chi tiết';
        if (p.includes('/owner/branches')) return 'Chi nhánh';
        if (p.includes('/owner/menu')) return 'Thực đơn';
        if (p.includes('/owner/staff')) return 'Nhân viên';
        if (p.includes('/owner/settings')) return 'Cài đặt';
        return 'Trang chủ';
    };

    return (
        <div className="min-h-screen bg-[#f0f4f8]">
            <RestaurantOwnerSidebar />
            <main className="ml-60 min-h-screen">
                {/* Top bar */}
                <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-2 text-sm">
                        <Link to="/owner/dashboard" className="text-gray-400 hover:text-blue-600 transition">Trang chủ</Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-800 font-semibold">{getPageTitle()}</span>
                    </div>
                </div>
                {/* Page Content */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
