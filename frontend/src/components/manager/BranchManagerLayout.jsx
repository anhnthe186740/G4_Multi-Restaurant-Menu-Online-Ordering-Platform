import { useLocation } from 'react-router-dom';
import BranchManagerSidebar from './BranchManagerSidebar';

export default function BranchManagerLayout({ children }) {
    const location = useLocation();

    const getPageTitle = () => {
        const p = location.pathname;
        if (p.includes('/manager/dashboard')) return 'Tổng quan';
        if (p.includes('/manager/tables'))    return 'Sơ đồ bàn';
        if (p.includes('/manager/orders')) return 'Đơn hàng';
        if (p.includes('/manager/service-requests')) return 'Yêu cầu phục vụ';
        if (p.includes('/manager/settings')) return 'Cài đặt';
        return 'Trang chủ';
    };

    return (
        <div className="min-h-screen bg-[#f0f4f8]">
            <BranchManagerSidebar />
            <main className="ml-60 min-h-screen">
                {/* Top bar */}
                <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Quản lý chi nhánh</span>
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
