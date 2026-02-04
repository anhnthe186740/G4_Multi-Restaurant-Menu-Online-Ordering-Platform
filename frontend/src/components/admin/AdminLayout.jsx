import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#0a0f0d]">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <main className="ml-64 min-h-screen p-8">
                {/* Top Bar */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <span className="text-gray-400 text-sm">Trang chủ / </span>
                        <span className="text-white font-medium text-sm">Tổng quan</span>

                        {/* Search Bar */}
                        <div className="flex-1 relative ml-6">
                            <input
                                type="text"
                                placeholder="Tìm kiếm hoá đơn tại đây..."
                                className="w-full bg-[#0f1612] border border-[#1a2b22] rounded-lg px-4 py-2 pl-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/30 transition"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                        </div>
                    </div>

                    {/* Right Side Icons */}
                    <div className="flex items-center gap-3">
                        <button className="relative p-2 text-gray-400 hover:text-white hover:bg-[#1a2b22] rounded-lg transition">
                            🔔
                            <span className="absolute top-1 right-1 w-2 h-2 bg-[#00ff88] rounded-full"></span>
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a2b22] rounded-lg transition">
                            ⚙️
                        </button>
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
