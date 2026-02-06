import { Link, useLocation } from 'react-router-dom';

export default function AdminSidebar() {
    const location = useLocation();

    const menuItems = [
        { icon: '📊', label: 'Tổng quan', path: '/admin/dashboard', active: true },
        { icon: '🏪', label: 'Nhà hàng', path: '/admin/restaurants' },
        { icon: '📝', label: 'Đơn đăng ký', path: '/admin/requests' },
        { icon: '📦', label: 'Gói dịch vụ', path: '/admin/service-packages' },
        { icon: '📈', label: 'Báo cáo', path: '/admin/reports' },
        { icon: '🎫', label: 'Hỗ trợ', path: '/admin/support' },
        { icon: '⚙️', label: 'Cài đặt', path: '/admin/settings' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0a0f0d] border-r border-[#1a2b22] flex flex-col">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-[#1a2b22]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00ff88] to-[#00c04b] flex items-center justify-center text-black font-bold text-xl">
                        A
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg">Admin</h1>
                        <p className="text-[#00ff88] text-xs font-semibold">PLATFORM ADMIN</p>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
                    Menu chính
                </p>
                {menuItems.map((item, index) => (
                    <Link
                        key={index}
                        to={item.path}
                        className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all
              ${isActive(item.path)
                                ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20'
                                : 'text-gray-400 hover:bg-[#1a2b22] hover:text-white'
                            }
            `}
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* User Info Footer */}
            <div className="p-4 border-t border-[#1a2b22]">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00ff88] to-[#00c04b] flex items-center justify-center text-black font-bold text-sm">
                        {JSON.parse(localStorage.getItem('user') || '{}').fullName?.[0] || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                            {JSON.parse(localStorage.getItem('user') || '{}').fullName || 'Admin'}
                        </p>
                        <p className="text-gray-500 text-xs truncate">Platform Admin</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
