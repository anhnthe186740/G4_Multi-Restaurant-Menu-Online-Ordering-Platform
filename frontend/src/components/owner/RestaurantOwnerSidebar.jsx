import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, GitBranch, BookOpen, Users, Settings, UtensilsCrossed, LogOut } from 'lucide-react';

export default function RestaurantOwnerSidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Tổng quan', path: '/owner/dashboard' },
        { icon: BarChart3, label: 'Báo cáo chi tiết', path: '/owner/reports' },
        { icon: GitBranch, label: 'Chi nhánh', path: '/owner/branches' },
        { icon: BookOpen, label: 'Thực đơn', path: '/owner/menu' },
        { icon: Users, label: 'Nhân viên', path: '/owner/staff' },
        { icon: Settings, label: 'Cài đặt', path: '/owner/settings' },
    ];

    const isActive = (path) => location.pathname.startsWith(path);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const userData = (() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); }
        catch { return {}; }
    })();

    return (
        <aside className="fixed left-0 top-0 h-screen w-60 bg-[#0f1623] border-r border-slate-700/40 flex flex-col z-50">
            {/* Logo */}
            <div className="p-5 border-b border-slate-700/40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <UtensilsCrossed size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-base leading-none">GastroAdmin</h1>
                        <p className="text-blue-400 text-[10px] font-semibold tracking-widest mt-0.5">RESTAURANT</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {menuItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                        <Link key={item.path} to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                                ${active
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent'
                                }`}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="p-3 border-t border-slate-700/40">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors group" onClick={handleLogout}>
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm border border-blue-500/30 shrink-0">
                        {userData.fullName?.[0]?.toUpperCase() || 'R'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{userData.fullName || 'Chủ nhà hàng'}</p>
                        <p className="text-slate-500 text-xs">Chủ sở hữu</p>
                    </div>
                    <LogOut size={15} className="text-slate-500 group-hover:text-red-400 transition-colors shrink-0" />
                </div>
            </div>
        </aside>
    );
}
