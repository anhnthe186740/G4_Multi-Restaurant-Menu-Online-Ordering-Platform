import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ChangePasswordModal from '../modals/ChangePasswordModal';
import {
    LayoutDashboard, ClipboardList, Bell, Info, UtensilsCrossed, LayoutGrid, LogOut, History,
    Users, BookOpen
} from 'lucide-react';

export default function BranchManagerSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const userData = (() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); }
        catch { return {}; }
    })();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Tổng quan',         path: '/manager/dashboard', roles: ['BranchManager'] },
        { icon: LayoutGrid,      label: 'Sơ đồ bàn',        path: '/manager/tables',   roles: ['BranchManager', 'Staff'] },
        { icon: BookOpen,        label: 'Menu',             path: '/manager/menu',     roles: ['BranchManager', 'Staff'] },
        { icon: UtensilsCrossed, label: 'Theo dõi bếp',     path: '/manager/kds',      roles: ['BranchManager'] },
        { icon: Bell,            label: 'Yêu cầu phục vụ',  path: '/manager/service-requests', roles: ['BranchManager', 'Staff'] },
        { icon: Users,           label: 'Quản lý nhân viên',path: '/manager/staff',    roles: ['BranchManager'] },
        { icon: Info,            label: 'Thông tin nhà hàng',path: '/manager/info',     roles: ['BranchManager'] },
        { icon: History,         label: 'Lịch sử thanh toán',path: '/manager/payment-history', roles: ['BranchManager'] },
    ];

    // Lọc menu theo role
    const filteredMenuItems = menuItems.filter(item => 
        !item.roles || item.roles.includes(userData.role)
    );

    const getRoleLabel = (role) => {
        if (role === 'BranchManager') return 'MANAGER';
        if (role === 'Staff') return 'PHỤC VỤ';
        if (role === 'Kitchen') return 'ĐẦU BẾP';
        return role?.toUpperCase() || 'USER';
    };

    const getRoleDisplay = (role) => {
        if (role === 'BranchManager') return 'Quản lý chi nhánh';
        if (role === 'Staff') return 'Nhân viên phục vụ';
        if (role === 'Kitchen') return 'Nhân viên bếp';
        return role || 'Người dùng';
    };

    const isActive = (path) => location.pathname.startsWith(path);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-60 bg-[#0f1623] border-r border-slate-700/40 flex flex-col z-50 print:hidden">
            {/* Logo */}
            <div className="p-5 border-b border-slate-700/40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <UtensilsCrossed size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-base leading-none">BranchHub</h1>
                        <p className="text-emerald-400 text-[10px] font-semibold tracking-widest mt-0.5">
                            {getRoleLabel(userData.role)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {filteredMenuItems.map((item) => {
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
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/60 transition-colors group">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm border border-emerald-500/30 shrink-0">
                        {userData.fullName?.[0]?.toUpperCase() || 'M'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{userData.fullName || 'Người dùng'}</p>
                        <p className="text-slate-500 text-xs">{getRoleDisplay(userData.role)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowPasswordModal(true)}
                            className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
                            title="Đổi mật khẩu"
                        >
                            <History size={15} />
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                            title="Đăng xuất"
                        >
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>

                <ChangePasswordModal 
                    isOpen={showPasswordModal} 
                    onClose={() => setShowPasswordModal(false)} 
                />
            </div>
        </aside>
    );
}
