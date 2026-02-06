import { useState, useEffect } from 'react';

export default function PackageFormModal({ isOpen, onClose, onSubmit, initialData }) {
    const [formData, setFormData] = useState({
        PackageName: '',
        Duration: 1,
        Price: 0,
        Description: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                PackageName: initialData.PackageName,
                Duration: initialData.Duration,
                Price: initialData.Price,
                Description: initialData.Description || ''
            });
        } else {
            setFormData({
                PackageName: '',
                Duration: 1,
                Price: 0,
                Description: ''
            });
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (

        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d1612] border border-gray-800 rounded-2xl w-full max-w-lg p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff88]/10 blur-[50px] rounded-full"></div>

                <div className="flex justify-between items-center mb-8 relative z-10">
                    <h3 className="text-2xl font-bold text-white">
                        {initialData ? 'Chỉnh sửa Gói dịch vụ' : 'Thêm Gói mới'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 w-8 h-8 rounded-full flex items-center justify-center transition">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="group">
                        <label className="block text-gray-400 text-sm font-medium mb-2 group-focus-within:text-[#00ff88] transition">Tên gói dịch vụ</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-[#1a2b22]/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] focus:outline-none transition placeholder-gray-600"
                            placeholder="VD: Gói Doanh Nghiệp"
                            value={formData.PackageName}
                            onChange={(e) => setFormData({ ...formData, PackageName: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="group">
                            <label className="block text-gray-400 text-sm font-medium mb-2 group-focus-within:text-[#00ff88] transition">Thời hạn (Tháng)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    className="w-full bg-[#1a2b22]/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] focus:outline-none transition"
                                    value={formData.Duration}
                                    onChange={(e) => setFormData({ ...formData, Duration: parseInt(e.target.value) || 0 })}
                                />
                                <span className="absolute right-4 top-3 text-gray-500 text-sm pointer-events-none">Tháng</span>
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-gray-400 text-sm font-medium mb-2 group-focus-within:text-[#00ff88] transition">Giá tiền (VND)</label>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                required
                                className="w-full bg-[#1a2b22]/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] focus:outline-none transition font-mono"
                                value={formData.Price}
                                onChange={(e) => setFormData({ ...formData, Price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-gray-400 text-sm font-medium mb-2 group-focus-within:text-[#00ff88] transition">Mô tả đặc quyền (Mỗi dòng một ý)</label>
                        <textarea
                            className="w-full bg-[#1a2b22]/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] focus:outline-none transition h-32 resize-none leading-relaxed placeholder-gray-600"
                            placeholder="- Hỗ trợ 24/7&#10;- Không giới hạn nhân viên&#10;- Báo cáo nâng cao"
                            value={formData.Description}
                            onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-400 hover:text-white font-medium transition"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-[#00ff88] text-[#1a2b22] font-bold rounded-xl hover:bg-[#00df76] transition shadow-[0_0_20px_rgba(0,255,136,0.2)]"
                        >
                            {initialData ? 'Lưu thay đổi' : 'Tạo gói mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
