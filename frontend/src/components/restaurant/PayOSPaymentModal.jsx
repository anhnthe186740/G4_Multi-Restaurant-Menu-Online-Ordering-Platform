import { useState, useEffect } from "react";
import { X, CheckCircle, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { checkPaymentStatus } from "../../api/subscriptionApi";

export default function PayOSPaymentModal({ isOpen, onClose, checkOutData, selectedPackage, onPaymentSuccess }) {
  const [status, setStatus] = useState("PENDING");
  const [countdown, setCountdown] = useState(5 * 60); // 5 phút

  useEffect(() => {
    let timer;
    if (isOpen && status === "PENDING") {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setStatus("EXPIRED");
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, status]);

  // Polling checkPaymentStatus
  useEffect(() => {
    let polling;
    if (isOpen && status === "PENDING" && checkOutData?.orderCode) {
      polling = setInterval(async () => {
        try {
          const res = await checkPaymentStatus(checkOutData.orderCode);
          if (res.data.status === "PAID") {
            setStatus("PAID");
            clearInterval(polling);
            setTimeout(() => {
              onPaymentSuccess();
              onClose();
            }, 3000); // Đóng sau 3s
          } else if (res.data.status === "CANCELLED" || res.data.status === "EXPIRED") {
             setStatus(res.data.status);
             clearInterval(polling);
          }
        } catch (error) {
          console.error("Polling error", error);
        }
      }, 3000); // Check mỗi 3 giây
    }

    return () => clearInterval(polling);
  }, [isOpen, status, checkOutData, onPaymentSuccess, onClose]);

  if (!isOpen) return null;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg">Thanh toán qua PayOS</h3>
          {status !== "PAID" && (
            <button onClick={onClose} className="text-white/80 hover:text-white transition">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center">
          
          {status === "PAID" ? (
             <div className="text-center py-8 space-y-4">
               <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircle size={40} className="text-green-500" />
               </div>
               <h3 className="text-xl font-bold text-gray-800">Thanh toán thành công!</h3>
               <p className="text-gray-500 text-sm">Cảm ơn bạn. Gói dịch vụ đã được kích hoạt.</p>
             </div>
          ) : status === "EXPIRED" || status === "CANCELLED" ? (
             <div className="text-center py-8 space-y-4">
               <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <X size={40} className="text-red-500" />
               </div>
               <h3 className="text-xl font-bold text-gray-800">Thanh toán thất bại</h3>
               <p className="text-gray-500 text-sm">Giao dịch đã hết hạn hoặc bị hủy.</p>
               <button onClick={onClose} className="mt-4 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 font-medium">Đóng</button>
             </div>
          ) : (
             <div className="w-full">
               {/* Order Summary / Invoice */}
               <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
                 <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">
                    Thông tin đơn hàng
                 </h4>
                 
                 <div className="space-y-3">
                   <div className="flex justify-between items-center">
                     <span className="text-gray-500">Gói dịch vụ:</span>
                     <span className="font-semibold text-gray-800">{selectedPackage?.packageName || "Gói Dịch Vụ"}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-gray-500">Thời hạn:</span>
                     <span className="font-semibold text-gray-800">{selectedPackage?.duration || 1} tháng</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-gray-500">Mã đơn:</span>
                     <span className="font-mono text-sm font-semibold text-gray-500">{checkOutData?.orderCode}</span>
                   </div>
                   <div className="flex justify-between items-center pt-3 border-t border-gray-200 border-dashed mt-2">
                     <span className="text-gray-600 font-medium">Tổng thanh toán:</span>
                     <span className="text-2xl font-black text-blue-600">{checkOutData?.amount?.toLocaleString()} VNĐ</span>
                   </div>
                 </div>
               </div>

               {/* QR Code Section */}
               <div className="text-center">
                 <div className="mb-4 text-gray-600 font-medium">
                   Quét mã QR bằng ứng dụng ngân hàng
                 </div>
                 
                 <div className="mx-auto w-fit p-5 border-2 border-dashed border-blue-200 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 relative">
                   {checkOutData?.qrCode ? (
                      <QRCodeSVG value={checkOutData.qrCode} size={220} level="M" includeMargin={false} />
                   ) : (
                      <div className="w-[220px] h-[220px] flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl">
                        Đang xử lý...
                      </div>
                   )}
                 </div>

                 <div className="flex items-center justify-center gap-2 text-rose-500 font-semibold bg-rose-50 py-2.5 px-4 rounded-full w-fit mx-auto mb-2">
                   <Clock size={18} />
                   <span>Bảo lưu thanh toán: {formatTime(countdown)}</span>
                 </div>
                 
                 <p className="text-xs text-gray-400 mt-4 text-center">
                    Giao dịch đang được hệ thống theo dõi tự động.<br/>Không cần tải lại trang.
                 </p>
               </div>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
