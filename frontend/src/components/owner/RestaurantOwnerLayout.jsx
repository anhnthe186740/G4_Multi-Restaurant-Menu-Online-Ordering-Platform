import { Link, useLocation } from 'react-router-dom';
import RestaurantOwnerSidebar from './RestaurantOwnerSidebar';
import { useEffect, useState } from 'react';
import { getMySubscription } from '../../api/subscriptionApi';
import { AlertTriangle } from 'lucide-react';

export default function RestaurantOwnerLayout({ children }) {
    const location = useLocation();
    const [subWarning, setSubWarning] = useState(null);

    useEffect(() => {
        getMySubscription().then(res => {
            const { status, daysRemaining } = res.data;
            if (status === 'Active' && daysRemaining <= 7) {
                setSubWarning(daysRemaining);
            }
        }).catch(err => console.error("Error checking subscription for banner:", err));
    }, []);

    const getPageTitle = () => {
        const p = location.pathname;
        if (p.includes('/owner/dashboard')) return 'Tổng quan';
        if (p.includes('/owner/reports')) return 'Báo cáo chi tiết';
        if (p.includes('/owner/branches')) return 'Chi nhánh';
        if (p.includes('/owner/menu')) return 'Thực đơn';
        if (p.includes('/owner/staff')) return 'Nhân viên';
        if (p.includes('/owner/settings')) return 'Cài đặt';
        if (p.includes('/owner/payment-history')) return 'Lịch sử thanh toán';
        if (p.includes('/owner/tickets')) return 'Báo cáo & Hỗ trợ';
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

                {/* Subscription Expiry Warning Banner */}
                {subWarning !== null && (
                    <div className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex items-center justify-between">
                        <div className="flex items-center text-amber-800 text-sm font-medium">
                            <AlertTriangle size={16} className="text-amber-500 mr-2" />
                            Gói dịch vụ của bạn sẽ hết hạn sau {subWarning} ngày. Hãy gia hạn để tiếp tục sử dụng dịch vụ không bị gián đoạn.
                        </div>
                        <Link 
                            to="/owner/service-packages" 
                            className="text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                        >
                            Gia hạn ngay
                        </Link>
                    </div>
                )}

                {/* Page Content */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
