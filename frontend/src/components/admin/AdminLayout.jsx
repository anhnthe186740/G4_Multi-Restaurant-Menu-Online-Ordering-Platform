import AdminSidebar from './AdminSidebar';
import { Bell, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function AdminLayout({ children }) {
    const location = useLocation();

    // Simple breadcrumb logic based on path
    const getBreadcrumb = () => {
        const path = location.pathname;
        if (path.includes('/admin/restaurants')) return 'Nền tảng / Quản lý Tài khoản Nhà hàng';
        if (path.includes('/admin/dashboard')) return 'Nền tảng / Tổng quan';
        if (path.includes('/admin/packages')) return 'Nền tảng / Quản lý Gói dịch vụ';
        if (path.includes('/admin/reports')) return 'Nền tảng / Báo cáo & Thống kê';
        if (path.includes('/admin/content')) return 'Nền tảng / Quản lý Nội dung';
        if (path.includes('/admin/support')) return 'Nền tảng / Trung tâm Hỗ trợ';
        return 'Nền tảng / Dashboard';
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans flex text-sm">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Wrapper */}
            <div className="ml-64 flex-1 flex flex-col min-h-screen">

                {/* Top Header Bar */}
                <header className="h-14 bg-[#0f172a] border-b border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-40">
                    {/* Breadcrumb */}
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {getBreadcrumb()}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-[#0f172a]"></span>
                        </button>
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <Settings size={18} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
