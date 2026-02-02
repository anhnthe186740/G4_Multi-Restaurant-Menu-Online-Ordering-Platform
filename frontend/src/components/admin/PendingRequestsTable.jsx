export default function PendingRequestsTable({ requests }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!requests || requests.length === 0) {
        return (
            <div className="bg-[#0f1612] rounded-xl border border-[#1a2b22] p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                    📝 Đơn đăng ký chờ duyệt
                </h3>
                <div className="text-center py-8 text-gray-500">
                    Không có đơn đăng ký nào đang chờ
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0f1612] rounded-xl border border-[#1a2b22] p-6">
            <h3 className="text-lg font-bold text-white mb-4">
                📝 Đơn đăng ký chờ duyệt ({requests.length})
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-[#1a2b22]">
                        <tr className="text-left text-sm text-gray-500">
                            <th className="pb-3 font-semibold">ID</th>
                            <th className="pb-3 font-semibold">Chủ nhà hàng</th>
                            <th className="pb-3 font-semibold">Tên nhà hàng</th>
                            <th className="pb-3 font-semibold">Liên hệ</th>
                            <th className="pb-3 font-semibold">Ngày gửi</th>
                            <th className="pb-3 font-semibold text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a2b22]">
                        {requests.map((request) => (
                            <tr key={request.RequestID} className="text-sm hover:bg-[#1a2b22]/50 transition">
                                <td className="py-3 text-white font-medium">
                                    #{request.RequestID}
                                </td>
                                <td className="py-3 text-gray-300">
                                    {request.OwnerName}
                                </td>
                                <td className="py-3 text-white font-medium">
                                    {request.RestaurantName}
                                </td>
                                <td className="py-3 text-gray-400 text-xs">
                                    {request.ContactInfo}
                                </td>
                                <td className="py-3 text-gray-500 text-xs">
                                    {formatDate(request.SubmissionDate)}
                                </td>
                                <td className="py-3 text-right">
                                    <div className="flex gap-2 justify-end">
                                        <button className="px-3 py-1 rounded-lg bg-[#00ff88]/10 text-[#00ff88] hover:bg-[#00ff88]/20 text-xs font-semibold transition border border-[#00ff88]/20">
                                            ✓ Duyệt
                                        </button>
                                        <button className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition border border-red-500/20">
                                            ✗ Từ chối
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
