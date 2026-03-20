import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ClipboardList, Bell, Settings, LogOut, UtensilsCrossed, LayoutGrid
} from 'lucide-react';

export default function BranchManagerSidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Tổng quan',         path: '/manager/dashboard' },
        { icon: LayoutGrid,      label: 'Sơ đồ bàn',        path: '/manager/tables' },
        { icon: ClipboardList,   label: 'Đơn hàng',          path: '/manager/orders' },
        { icon: UtensilsCrossed, label: 'Theo dõi bếp',     path: '/manager/kds' },
        { icon: Bell,            label: 'Yêu cầu phục vụ',  path: '/manager/service-requests' },
        { icon: Settings,        label: 'Cài đặt',           path: '/manager/settings' },
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <UtensilsCrossed size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-base leading-none">BranchHub</h1>
                        <p className="text-emerald-400 text-[10px] font-semibold tracking-widest mt-0.5">MANAGER</p>
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
                                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
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
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm border border-emerald-500/30 shrink-0">
                        {userData.fullName?.[0]?.toUpperCase() || 'M'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{userData.fullName || 'Quản lý chi nhánh'}</p>
                        <p className="text-slate-500 text-xs">Branch Manager</p>
                    </div>
                    <LogOut size={15} className="text-slate-500 group-hover:text-red-400 transition-colors shrink-0" />
                </div>
            </div>
        </aside>
    );
}
