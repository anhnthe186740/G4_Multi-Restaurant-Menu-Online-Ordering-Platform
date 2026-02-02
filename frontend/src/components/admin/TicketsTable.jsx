export default function TicketsTable({ tickets }) {
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

    const priorityColors = {
        Low: 'bg-green-500/10 text-green-500',
        Medium: 'bg-yellow-500/10 text-yellow-500',
        High: 'bg-red-500/10 text-red-500'
    };

    const priorityIcons = {
        Low: '🟢',
        Medium: '🟡',
        High: '🔴'
    };

    if (!tickets || tickets.length === 0) {
        return (
            <div className="bg-[#0f1612] rounded-xl border border-[#1a2b22] p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                    🎫 Support Tickets gần đây
                </h3>
                <div className="text-center py-8 text-gray-500">
                    Không có ticket nào
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0f1612] rounded-xl border border-[#1a2b22] p-6">
            <h3 className="text-lg font-bold text-white mb-4">
                🎫 Support Tickets gần đây ({tickets.length})
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-[#1a2b22]">
                        <tr className="text-left text-sm text-gray-500">
                            <th className="pb-3 font-semibold">ID</th>
                            <th className="pb-3 font-semibold">Tiêu đề</th>
                            <th className="pb-3 font-semibold">Người gửi</th>
                            <th className="pb-3 font-semibold">Độ ưu tiên</th>
                            <th className="pb-3 font-semibold">Trạng thái</th>
                            <th className="pb-3 font-semibold">Ngày tạo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a2b22]">
                        {tickets.map((ticket) => (
                            <tr key={ticket.TicketID} className="text-sm hover:bg-[#1a2b22]/50 transition cursor-pointer">
                                <td className="py-3 text-white font-medium">
                                    #{ticket.TicketID}
                                </td>
                                <td className="py-3 text-white">
                                    {ticket.Subject}
                                </td>
                                <td className="py-3 text-gray-400">
                                    {ticket.userName}
                                </td>
                                <td className="py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityColors[ticket.Priority]}`}>
                                        {priorityIcons[ticket.Priority]} {ticket.Priority}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <span className="text-gray-400 text-xs">
                                        {ticket.Status}
                                    </span>
                                </td>
                                <td className="py-3 text-gray-500 dark:text-gray-400 text-xs">
                                    {formatDate(ticket.CreatedAt)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
