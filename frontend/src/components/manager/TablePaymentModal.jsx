import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { 
    X, CheckCircle2, Clock, AlertTriangle, Loader2, ExternalLink, 
    Receipt, BanknoteIcon, RefreshCw, ChevronRight, Download
} from 'lucide-react';
import { checkTablePaymentStatus } from '../../api/managerApi';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import dayjs from 'dayjs';

/* ── Định dạng tiền tệ ─── */
const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

/* ═══════════════════════════════════════════
   TablePaymentModal — Modal thanh toán QR
═══════════════════════════════════════════ */
export default function TablePaymentModal({ isOpen, onClose, paymentData, billData, tableName, onPaymentSuccess }) {
    // paymentData: { orderCode, amount, qrCode, checkoutUrl }
    // billData: { items, totalAmount, tables }

    const [status, setStatus] = useState('PENDING'); // PENDING | PAID | CANCELLED
    const pollingRef = useRef(null);
    const receiptRef = useRef(null); // Ref cho HTML của Hóa đơn ảo (ẩn)
    const [isExporting, setIsExporting] = useState(false);

    const tableId = billData?.tables?.[0]?.id;

    // ── Polling kiểm tra trạng thái ──
    const startPolling = useCallback(() => {
        if (!paymentData?.orderCode || !tableId) return;
        
        pollingRef.current = setInterval(async () => {
            try {
                const res = await checkTablePaymentStatus(tableId, paymentData.orderCode);
                const newStatus = res.data.status;
                
                if (newStatus === 'PAID') {
                    setStatus('PAID');
                    clearInterval(pollingRef.current);
                    setTimeout(() => {
                        if (onPaymentSuccess) onPaymentSuccess();
                    }, 2500);
                } else if (newStatus === 'CANCELLED' || newStatus === 'EXPIRED') {
                    setStatus(newStatus);
                    clearInterval(pollingRef.current);
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 3000);
    }, [paymentData, tableId, onPaymentSuccess]);

    // ── Khởi động khi mở modal ──
    useEffect(() => {
        if (!isOpen || !paymentData) return;
        
        setStatus('PENDING');

        startPolling();

        return () => {
            clearInterval(pollingRef.current);
        };
    }, [isOpen, paymentData, startPolling]);

    // ── Xử lý Xuất PDF ──
    const handleExportPDF = async () => {
        if (!receiptRef.current) return;
        try {
            setIsExporting(true);
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2, // Tăng chất lượng ảnh
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            
            // Tính toán kích thước tự động dựa dẫm A4 hoặc kích thước receipt
            // Thường bill in ra là cuộn giấy 80mm
            // pdf định dạng point, mm. Khổ A4 là 210 x 297 mm
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, (canvas.height * 80) / canvas.width] // Chiều rộng 80mm, chiều dài tỉ lệ thuận
            });
            
            pdf.addImage(imgData, 'PNG', 0, 0, 80, (canvas.height * 80) / canvas.width);
            pdf.save(`HoaDon_${tableName || tableId}_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);
        } catch (error) {
            console.error('Export PDF Error:', error);
            alert(`Có lỗi xảy ra khi xuất PDF: ${error?.message || error}`);
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen || !paymentData) return null;

    const isPending = status === 'PENDING';
    const isPaid = status === 'PAID';
    const isFailed = status === 'CANCELLED' || status === 'EXPIRED';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* ── Header ── */}
                <div className={`px-6 py-4 flex items-center justify-between
                    ${isPaid ? 'bg-gradient-to-r from-emerald-600 to-teal-600' :
                      isFailed ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                      'bg-gradient-to-r from-gray-800 to-gray-900'}
                    text-white`}>
                    <div className="flex items-center gap-3">
                        <BanknoteIcon size={22} />
                        <div>
                            <h3 className="font-bold text-base leading-tight">Thanh toán chuyển khoản</h3>
                            <p className="text-xs opacity-80">{tableName || `Bàn ${tableId}`}</p>
                        </div>
                    </div>
                    {isPending && (
                        <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition">
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* ── Trạng thái: Đã thanh toán ── */}
                    {isPaid && (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
                                <CheckCircle2 size={48} className="text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 mb-2">Thanh toán thành công!</h3>
                            <p className="text-gray-500 text-sm mb-1">Số tiền: <strong className="text-emerald-600">{formatCurrency(paymentData.amount)}</strong></p>
                            <p className="text-gray-400 text-xs">Bàn sẽ được giải phóng tự động...</p>
                            <div className="mt-6 w-12 h-1 bg-emerald-200 rounded-full animate-pulse" />
                        </div>
                    )}

                    {/* ── Trạng thái: Thất bại / Hết hạn ── */}
                    {isFailed && (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-5">
                                <AlertTriangle size={48} className="text-red-400" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 mb-2">
                                {status === 'EXPIRED' ? 'Mã QR đã hết hạn' : 'Giao dịch bị hủy'}
                            </h3>
                            <p className="text-gray-500 text-sm mb-6">
                                {status === 'EXPIRED' ? 'Mã QR chỉ có hiệu lực trong 5 phút.' : 'Giao dịch đã bị hủy bởi khách hàng.'}
                            </p>
                            <button 
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl font-bold text-gray-700 transition"
                            >
                                Đóng và thử lại
                            </button>
                        </div>
                    )}

                    {/* ── Trạng thái: Đang chờ ── */}
                    {isPending && (
                        <>
                            {/* Chi tiết hóa đơn */}
                            {billData && (
                                <div className="px-5 pt-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Receipt size={15} className="text-gray-400" />
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chi tiết hóa đơn</h4>
                                        </div>
                                        {/* Nút Xuất Hóa Đơn */}
                                        <button 
                                            onClick={handleExportPDF}
                                            disabled={isExporting}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition disabled:opacity-50"
                                        >
                                            {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                                            Xuất PDF
                                        </button>
                                    </div>
                                    {/* Gộp bàn info */}
                                    {billData.tables?.length > 1 && (
                                        <div className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-2 rounded-xl mb-3 flex items-center gap-2">
                                            <span>🔗</span>
                                            Gộp: {billData.tables.map(t => t.name).join(' + ')}
                                        </div>
                                    )}
                                    <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                                        <div className="divide-y divide-gray-100 max-h-44 overflow-y-auto">
                                            {billData.items?.map((item) => (
                                                <div key={item.productID} className="flex items-center justify-between px-4 py-2.5">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                                                        <p className="text-xs text-gray-400">{formatCurrency(item.price)} × {item.quantity}</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-700 ml-3">{formatCurrency(item.price * item.quantity)}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="px-4 py-3 bg-white border-t border-gray-100 flex justify-between items-center">
                                            <span className="font-black text-gray-900">TỔNG CỘNG</span>
                                            <span className="font-black text-xl text-emerald-600">{formatCurrency(paymentData.amount)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* QR Code & Hướng dẫn */}
                            <div className="px-5 py-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quét mã QR để thanh toán</span>
                                </div>

                                {/* QR + Countdown */}
                                <div className="bg-gradient-to-b from-gray-50 to-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center">
                                    {paymentData.qrCode ? (
                                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 mb-3">
                                            <QRCodeSVG 
                                                value={paymentData.qrCode} 
                                                size={180}
                                                level="M"
                                                includeMargin={false}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-100 rounded-2xl mb-3">
                                            <Loader2 className="animate-spin text-gray-400" size={32} />
                                        </div>
                                    )}

                                    {/* Polling indicator */}
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <RefreshCw size={11} className="animate-spin" />
                                        <span>Đang tự động kiểm tra thanh toán...</span>
                                    </div>
                                </div>

                                {/* Link dự phòng */}
                                {paymentData.checkoutUrl && (
                                    <a 
                                        href={paymentData.checkoutUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                                    >
                                        <ExternalLink size={14} />
                                        Mở trang thanh toán PayOS
                                        <ChevronRight size={13} className="text-gray-400" />
                                    </a>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── HIDDEN RECEIPT TEMPLATE FOR PDF EXPORT ── */}
            <div className="fixed top-0 left-[-9999px] z-[-1] p-6 w-[400px]" style={{ backgroundColor: '#ffffff', color: '#000000', fontFamily: 'sans-serif' }} ref={receiptRef}>
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black mb-1">HÓA ĐƠN THANH TOÁN</h2>
                    <p className="text-sm font-bold uppercase" style={{ color: '#4b5563' }}>{tableName || `BÀN ${tableId}`}</p>
                </div>

                <div className="space-y-1 mb-6 text-sm" style={{ color: '#374151' }}>
                    <div className="flex justify-between">
                        <span>Giờ vào bàn (nhập HĐ):</span>
                        <span className="font-medium">{(billData?.createdAt || billData?.orderTime) ? dayjs(billData.createdAt || billData.orderTime).format('DD/MM/YYYY HH:mm') : '--'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Thời gian in/xuất:</span>
                        <span className="font-medium">{dayjs().format('DD/MM/YYYY HH:mm')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Trạng thái:</span>
                        <span className="font-bold">{status === 'PAID' ? 'Đã thanh toán (QR)' : 'Chờ chuyển khoản (QR)'}</span>
                    </div>
                </div>

                <div className="py-3 mb-4 space-y-3" style={{ borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>
                    <div className="flex justify-between text-xs font-bold mb-2" style={{ color: '#6b7280' }}>
                        <span>MÓN</span>
                        <span>THÀNH TIỀN</span>
                    </div>
                    {billData?.items?.map((item) => (
                        <div key={item.productID} className="flex justify-between text-sm">
                            <div className="flex-1 pr-4">
                                <p className="font-semibold" style={{ color: '#1f2937' }}>{item.name}</p>
                                <p className="text-xs" style={{ color: '#6b7280' }}>{formatCurrency(item.price)} x {item.quantity}</p>
                            </div>
                            <div className="font-bold">
                                {formatCurrency(item.price * item.quantity)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center mb-8">
                    <span className="text-lg font-black tracking-wide">TỔNG CỘNG</span>
                    <span className="text-2xl font-black">{formatCurrency(paymentData.amount)}</span>
                </div>

                {paymentData.qrCode && (
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl" style={{ backgroundColor: '#f9fafb' }}>
                        <p className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: '#6b7280' }}>Mã QR Chuyển Khoản</p>
                        <QRCodeCanvas 
                            value={paymentData.qrCode} 
                            size={200}
                            level="M"
                            includeMargin={false}
                        />
                        <p className="text-[10px] sm:text-xs text-center mt-3" style={{ color: '#9ca3af' }}>Quét mã bằng ứng dụng ngân hàng</p>
                    </div>
                )}
                
                <div className="mt-8 text-center pt-4" style={{ borderTop: '1px dashed #d1d5db' }}>
                    <p className="text-sm font-bold">Cảm ơn quý khách!</p>
                    <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Hẹn gặp lại</p>
                </div>
            </div>
        </div>
    );
}
