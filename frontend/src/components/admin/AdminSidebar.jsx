import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';

export default function AdminSidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { icon: '📊', label: 'Tổng quan', path: '/admin/dashboard' },
        { icon: '🏪', label: 'Nhà hàng', path: '/admin/restaurants' },
        { icon: '📝', label: 'Đơn đăng ký', path: '/admin/requests' },
        { icon: '📦', label: 'Gói dịch vụ', path: '/admin/service-packages' },
        { icon: '📈', label: 'Báo cáo', path: '/admin/reports' },
        { icon: '⚙️', label: 'Cài đặt', path: '/admin/settings' },
    ];

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const userData = (() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            return {};
        }
    })();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0f172a] border-r border-slate-700/50 flex flex-col z-50">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-emerald-500/20">
                        <UtensilsCrossed size={20} />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg leading-none">Admin</h1>
                        <p className="text-emerald-500 text-[10px] font-bold tracking-widest mt-1">HỆ THỐNG SAAS</p>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item, index) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={index}
                            to={item.path}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg transition-all group
                                ${active
                                    ? 'bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-400 border-l-4 border-emerald-500'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
                                }
                            `}
                        >
                            {/* Render emoji as text, not as component */}
                            <span className="text-lg w-5 text-center">{item.icon}</span>
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Info Footer */}
            <div className="p-4 border-t border-slate-700/50 bg-[#0f172a]">
                <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={handleLogout}
                    title="Đăng xuất"
                >
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-sm border border-emerald-500/30">
                        {userData.fullName?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                            {userData.fullName || 'Admin'}
                        </p>
                        <p className="text-slate-500 text-xs truncate uppercase font-semibold">Đăng xuất</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
