import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#0a0f0d]">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <main className="ml-64 min-h-screen p-8">
                {/* Top Bar */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">
                            Platform Admin Dashboard
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Quản lý và giám sát toàn bộ hệ thống
                        </p>
                    </div>

                    {/* User Avatar & Notifications */}
                    <div className="flex items-center gap-4">
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
