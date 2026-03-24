import { useState, useEffect, useRef, useCallback } from 'react';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';
import { getManagerPaymentHistory } from '../api/managerApi';
import { 
    Search, Calendar, FileText, Download, Eye, 
    Banknote, CreditCard, RefreshCw, Filter, X, 
    ChevronLeft, ChevronRight, LayoutList, History,
    ArrowUpRight, ArrowDownRight, Printer
} from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/* ── Helpers ── */
const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

/* ═══════════════════════════════════════════
   ManagerPaymentHistory — Lịch sử thanh toán
 ═══════════════════════════════════════════ */
export default function ManagerPaymentHistory() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTx, setSelectedTx] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    
    // Ref cho Hóa đơn ảo để xuất PDF
    const receiptRef = useRef(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getManagerPaymentHistory({ startDate, endDate });
            setTransactions(res.data);
        } catch (err) {
            console.error('Fetch history error:', err);
            toast.error('Không thể tải lịch sử thanh toán');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Lọc theo search term (Bàn hoặc Mã Giao dịch)
    const filteredTxs = transactions.filter(tx => 
        tx.tableName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transactionID?.toString().includes(searchTerm)
    );

    // Tính toán thống kê
    const totalRevenue = filteredTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const cashTotal = filteredTxs.filter(tx => tx.paymentMethod === 'Cash').reduce((sum, tx) => sum + tx.amount, 0);
    const bankTotal = filteredTxs.filter(tx => tx.paymentMethod !== 'Cash').reduce((sum, tx) => sum + tx.amount, 0);
    const totalCount = filteredTxs.length;

    /* ── Xử lý Xuất PDF ── */
    const handleDownloadPDF = async (tx) => {
        if (!tx) return;
        setIsExporting(true);
        setSelectedTx(tx); // Hiển thị template ẩn

        // Đợi React render modal ẩn
        setTimeout(async () => {
            try {
                const element = receiptRef.current;
                if (!element) throw new Error("Không tìm thấy template hóa đơn");

                const canvas = await html2canvas(element, {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    logging: false,
                });

                const imgData = canvas.toDataURL("image/png");
                const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: [80, 200], // Khổ giấy in bill K80
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const imgProps = pdf.getImageProperties(imgData);
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
                pdf.save(`HoaDon_${tx.transactionID}_${dayjs(tx.transactionTime).format('YYYYMMDD')}.pdf`);
                
                toast.success('Đã tải hóa đơn PDF thành công!');
            } catch (error) {
                console.error("PDF Export error:", error);
                toast.error("Lỗi khi tạo file PDF");
            } finally {
                setIsExporting(false);
            }
        }, 800);
    };

    return (
        <BranchManagerLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <History className="text-emerald-500" size={24} />
                            Lịch sử thanh toán
                        </h1>
                        <p className="text-sm text-gray-500">Quản lý và tra cứu các giao dịch đã thực hiện</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                            />
                        </div>
                        <span className="text-gray-400">đến</span>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                            />
                        </div>
                        <button 
                            onClick={fetchHistory}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg shadow-emerald-200 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Banknote size={120} />
                        </div>
                        <p className="text-emerald-100 text-sm font-medium">Tổng doanh thu kỳ này</p>
                        <h3 className="text-white text-3xl font-bold mt-1">{formatCurrency(totalRevenue)}</h3>
                        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-100 bg-white/10 w-fit px-2 py-1 rounded-full">
                            <History size={12} />
                            <span>Tổng cộng {totalCount} giao dịch</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <Banknote size={28} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Tiền mặt</p>
                            <h3 className="text-gray-800 text-2xl font-bold">{formatCurrency(cashTotal)}</h3>
                            <p className="text-xs text-amber-600 mt-0.5 font-medium">Chiếm {totalRevenue > 0 ? ((cashTotal/totalRevenue)*100).toFixed(1) : 0}%</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <CreditCard size={28} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Chuyển khoản / Ví điện tử</p>
                            <h3 className="text-gray-800 text-2xl font-bold">{formatCurrency(bankTotal)}</h3>
                            <p className="text-xs text-blue-600 mt-0.5 font-medium">Chiếm {totalRevenue > 0 ? ((bankTotal/totalRevenue)*100).toFixed(1) : 0}%</p>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Tìm theo tên bàn hoặc mã giao dịch..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <Filter size={14} />
                                Lọc nâng cao
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                                <tr>
                                    <th className="px-6 py-4">Mã GD</th>
                                    <th className="px-6 py-4">Thời gian</th>
                                    <th className="px-6 py-4">Bàn</th>
                                    <th className="px-6 py-4">Tổng tiền</th>
                                    <th className="px-6 py-4">Phương thức</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading && (
                                    <tr>
                                        {[1,2,3,4,5,6].map(i => (
                                            <td key={i} className="px-6 py-8">
                                                <div className="h-4 bg-gray-100 animate-pulse rounded w-full"></div>
                                            </td>
                                        ))}
                                    </tr>
                                )}
                                {!loading && filteredTxs.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center opacity-30">
                                                <FileText size={48} />
                                                <p className="mt-2 font-medium">Không tìm thấy giao dịch nào</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {filteredTxs.map((tx) => (
                                    <tr key={tx.transactionID} className="group hover:bg-emerald-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono text-gray-400">#{tx.transactionID}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-700">{dayjs(tx.transactionTime).format('HH:mm')}</p>
                                            <p className="text-[10px] text-gray-400 uppercase">{dayjs(tx.transactionTime).format('DD/MM/YYYY')}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 text-gray-600 text-xs font-bold border border-gray-100">
                                                <LayoutList size={12} />
                                                {tx.tableName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800">
                                            {formatCurrency(tx.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {tx.paymentMethod === 'Cash' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100 uppercase">
                                                    <Banknote size={10} /> Tiền mặt
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase">
                                                    <CreditCard size={10} /> Chuyển khoản
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 outline-none">
                                                <button 
                                                    onClick={() => setSelectedTx(tx)}
                                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDownloadPDF(tx)}
                                                    disabled={isExporting}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-30"
                                                    title="Xuất PDF"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Simple Pagination Placeholder */}
                    <div className="p-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                        <p>Hiển thị {filteredTxs.length} giao dịch</p>
                        <div className="flex gap-1">
                            <button disabled className="p-2 rounded-lg hover:bg-gray-50 opacity-50"><ChevronLeft size={16} /></button>
                            <button className="w-8 h-8 rounded-lg bg-emerald-500 text-white font-bold shadow-sm shadow-emerald-200">1</button>
                            <button disabled className="p-2 rounded-lg hover:bg-gray-50 opacity-50"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Chi tiết đơn hàng */}
            {selectedTx && !isExporting && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Chi tiết hóa đơn</h2>
                                <p className="text-sm text-gray-400">Mã giao dịch #{selectedTx.transactionID}</p>
                            </div>
                            <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-gray-50 rounded-2xl">
                                    <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Thời gian</p>
                                    <p className="font-bold text-gray-700">{dayjs(selectedTx.transactionTime).format('HH:mm - DD/MM/YYYY')}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-2xl">
                                    <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Bàn phục vụ</p>
                                    <p className="font-bold text-gray-700">{selectedTx.tableName}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <LayoutList size={16} className="text-emerald-500" />
                                    Món đã gọi
                                </h3>
                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 thin-scrollbar">
                                    {selectedTx.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 group transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs ring-1 ring-emerald-100">
                                                    {item.quantity}
                                                </div>
                                                <span className="font-medium text-gray-700 group-hover:text-emerald-700 transition-colors uppercase text-xs">{item.productName}</span>
                                            </div>
                                            <span className="text-xs font-bold text-gray-400">{formatCurrency(item.unitPrice * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-dashed border-gray-200">
                                <div className="flex justify-between items-center bg-emerald-50/50 p-4 rounded-2xl">
                                    <span className="text-sm font-bold text-emerald-800">TỔNG CỘNG</span>
                                    <span className="text-2xl font-black text-emerald-600 tracking-tighter">{formatCurrency(selectedTx.amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-gray-50 flex gap-3">
                            <button 
                                onClick={() => handleDownloadPDF(selectedTx)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                            >
                                <Printer size={18} />
                                In hóa đơn / PDF
                            </button>
                            <button 
                                onClick={() => setSelectedTx(null)}
                                className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── HIDDEN RECEIPT TEMPLATE FOR PDF EXPORT ── */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {selectedTx && (
                    <div ref={receiptRef} style={{
                        width: '300px',
                        padding: '16px',
                        fontFamily: "'Courier New', Courier, monospace",
                        color: '#000000',
                        fontSize: '12px',
                        backgroundColor: '#ffffff'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>HÓA ĐƠN THANH TOÁN</h2>
                            <p style={{ margin: '2px 0' }}>#TX-{selectedTx.transactionID}</p>
                            <div style={{ margin: '8px 0', borderTop: '1px dashed #000', width: '100%' }}></div>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Bàn:</span>
                                <span style={{ fontWeight: 'bold' }}>{selectedTx.tableName}</span>
                            </p>
                            <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Thời gian:</span>
                                <span>{dayjs(selectedTx.transactionTime).format('DD/MM/YYYY HH:mm')}</span>
                            </p>
                            <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                                <span>PT Thanh toán:</span>
                                <span>{selectedTx.paymentMethod === 'Cash' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
                            </p>
                        </div>

                        <div style={{ borderTop: '1px solid #000', paddingTop: '8px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', fontSize: '10px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '4px' }}>
                                <span style={{ flex: 1 }}>Tên món</span>
                                <span style={{ width: '30px', textAlign: 'center' }}>SL</span>
                                <span style={{ width: '80px', textAlign: 'right' }}>Thành tiền</span>
                            </div>
                            {selectedTx.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', padding: '4px 0' }}>
                                    <span style={{ flex: 1 }}>{item.productName}</span>
                                    <span style={{ width: '30px', textAlign: 'center' }}>{item.quantity}</span>
                                    <span style={{ width: '80px', textAlign: 'right' }}>{formatCurrency(item.unitPrice * item.quantity)}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px dashed #000', paddingTop: '8px', marginTop: '8px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span>Tạm tính:</span>
                                <span>{formatCurrency(selectedTx.subTotal || selectedTx.amount)}</span>
                            </div>
                            {selectedTx.discountAmount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#059669' }}>
                                    <span>Giảm giá:</span>
                                    <span>-{formatCurrency(selectedTx.discountAmount)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px' }}>
                                <span>TỔNG CỘNG:</span>
                                <span>{formatCurrency(selectedTx.amount)}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <p style={{ margin: '4px 0', fontStyle: 'italic' }}>Cảm ơn quý khách!</p>
                            <p style={{ margin: '2px 0', fontSize: '10px' }}>Hẹn gặp lại quý khách lần sau</p>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .thin-scrollbar::-webkit-scrollbar { width: 4px; }
                .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .thin-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .thin-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </BranchManagerLayout>
    );
}
