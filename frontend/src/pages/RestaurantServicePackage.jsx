import { useState, useEffect } from "react";
import RestaurantOwnerLayout from "../components/owner/RestaurantOwnerLayout";
import { getPublicPackages, getMySubscription, createPaymentLink } from "../api/subscriptionApi";
import { Settings, Check, Zap, ArrowRight, Clock, Star, AlertTriangle, LogOut } from "lucide-react";
import PayOSPaymentModal from "../components/restaurant/PayOSPaymentModal";
import { useLocation, useNavigate } from "react-router-dom";

export default function RestaurantServicePackage() {
   const [packages, setPackages] = useState([]);
   const [mySub, setMySub] = useState(null);
   const [subStatus, setSubStatus] = useState("None");
   const [daysRemaining, setDaysRemaining] = useState(0);

   const [loading, setLoading] = useState(true);
   const location = useLocation();
   const navigate = useNavigate();
   
   // Check if the user was forced here by the SubscriptionGuard
   const isForced = location.state?.forced === true;

   // Payment link data
   const [modalOpen, setModalOpen] = useState(false);
   const [checkOutData, setCheckOutData] = useState(null);
   const [selectedPackage, setSelectedPackage] = useState(null);
   const [paymentLoading, setPaymentLoading] = useState(false);

   const fetchData = async () => {
      try {
         setLoading(true);
         const [pkgRes, subRes] = await Promise.all([
            getPublicPackages(),
            getMySubscription()
         ]);
         setPackages(pkgRes.data);
         setMySub(subRes.data.subscription);
         setSubStatus(subRes.data.status);
         setDaysRemaining(subRes.data.daysRemaining);
      } catch (error) {
         console.error("Error fetching subscription data", error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   // Auto-redirect to dashboard when package is active and user was forced to be here
   useEffect(() => {
      const searchParams = new URLSearchParams(location.search);
      const isPayOSReturnAuth = searchParams.get("status") === "PAID" || searchParams.get("cancel") === "false";
      
      if (isPayOSReturnAuth || (subStatus === "Active" && isForced)) {
         navigate("/owner/dashboard", { replace: true, state: {} });
      }
   }, [subStatus, isForced, navigate, location.search]);

   const handleBuyPackage = async (pkg) => {
      try {
         setPaymentLoading(true);
         setSelectedPackage(pkg);
         const res = await createPaymentLink(pkg.packageID);
         setCheckOutData(res.data);
         setModalOpen(true);
      } catch (error) {
         console.error("Lỗi khi tạo payment link", error);
         alert(error.response?.data?.message || "Lỗi tạo QR thanh toán");
      } finally {
         setPaymentLoading(false);
      }
   };

   const handlePaymentSuccess = () => {
      // Tự động chuyển thẳng về dashboard
      navigate('/owner/dashboard', { replace: true, state: {} });
   };
   
   const handleLogout = () => {
       localStorage.removeItem('user');
       localStorage.removeItem('token');
       navigate('/login');
   };

   if (loading) {
      return (
         <RestaurantOwnerLayout>
            <div className="flex items-center justify-center h-64">
               <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
         </RestaurantOwnerLayout>
      );
   }

   // Determine current badge style
   const isExpiringSoon = subStatus === "Active" && daysRemaining <= 7;

   const content = (
      <>
         <div className="max-w-6xl mx-auto space-y-8">
            {/* Forced Mode Banner */}
            {isForced && (
               <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start justify-between">
                  <div className="flex items-start">
                     <AlertTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" size={24} />
                     <div>
                        <h3 className="text-red-800 font-bold text-lg">Yêu cầu gói dịch vụ</h3>
                        <p className="text-red-700 mt-1">
                           Bạn cần mua hoặc gia hạn gói dịch vụ để có thể truy cập vào hệ thống quản lý Restaurant Owner Dashboard.
                        </p>
                     </div>
                  </div>
                  <button 
                     onClick={handleLogout}
                     className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-sm font-medium transition-colors"
                  >
                     <LogOut size={16} />
                     Đăng xuất
                  </button>
               </div>
            )}

            {/* Header Title */}
            <div className="flex items-center justify-between">
               <div>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                     <Settings className={isForced ? "text-red-600" : "text-blue-600"} />
                     Quản lý Gói Dịch Vụ
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">Nâng cấp hoặc gia hạn để mở khóa toàn bộ tính năng quản lý nhà hàng.</p>
               </div>
            </div>

            {/* Current Subscription Banner */}
            <div className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 
           ${subStatus === "Active"
                  ? (isExpiringSoon ? "bg-amber-50 border-amber-200" : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100")
                  : "bg-gray-50 border-gray-200"}`}
            >
               <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${subStatus === 'Active' ? 'bg-blue-600' : 'bg-gray-400'}`}>
                     <Zap size={28} className="text-white" />
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-gray-800">
                        Trạng thái hiện tại: <span className={
                           subStatus === "Active" ? "text-blue-700" : "text-gray-500"
                        }>{mySub?.package?.packageName || "Chưa đăng ký gói"}</span>
                     </h2>
                     {subStatus === "Active" && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                           <Clock size={16} className={isExpiringSoon ? "text-amber-500" : "text-blue-500"} />
                           <span>Còn lại: <strong>{daysRemaining} ngày</strong> (Hết hạn lúc {new Date(mySub.endDate).toLocaleDateString('vi-VN')})</span>
                        </div>
                     )}
                     {subStatus === "Expired" && (
                        <p className="text-red-500 text-sm mt-1">Gói dịch vụ đã hết hạn. Vui lòng gia hạn để sử dụng dịch vụ.</p>
                     )}
                  </div>
               </div>

               <div className="flex-shrink-0">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider 
                ${subStatus === 'Active' && !isExpiringSoon ? 'bg-green-100 text-green-700' : ''}
                ${isExpiringSoon ? 'bg-amber-100 text-amber-700' : ''}
                ${subStatus !== 'Active' ? 'bg-gray-200 text-gray-600' : ''}
             `}>
                     {subStatus === 'Active' ? (isExpiringSoon ? "Sắp Hết Hạn" : "Đang Hoạt Động") : "Đã Khóa / Chưa Có"}
                  </span>
               </div>
            </div>

            {/* Packages Grid */}
            <div>
               <h3 className="text-xl font-bold text-gray-800 mb-6">Lựa chọn gói phù hợp</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {packages.map((pkg) => {
                     const isPopular = pkg.duration === 12; // Example: 1 year package is marked as popular
                     return (
                        <div key={pkg.packageID} className={`relative flex flex-col bg-white rounded-2xl border p-6 shadow-sm hover:shadow-lg transition-transform hover:-translate-y-1 ${isPopular ? "border-blue-500 shadow-blue-100/50" : "border-gray-200"}`}>
                           {isPopular && (
                              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1 shadow-md">
                                 <Star size={12} fill="currentColor" /> Phổ Biến Nhất
                              </div>
                           )}

                           <div className="mb-6">
                              <h4 className="text-xl font-bold text-gray-800 mb-2">{pkg.packageName}</h4>
                              <div className="flex items-baseline gap-1 mt-2">
                                 <span className="text-4xl font-extrabold text-blue-600">{Number(pkg.price).toLocaleString()}</span>
                                 <span className="text-sm font-semibold text-gray-500">VNĐ</span>
                              </div>
                              <p className="text-sm font-medium text-gray-500 mt-2 bg-gray-50 inline-block px-3 py-1 rounded-full border border-gray-100">
                                 Sử dụng trong {pkg.duration} tháng
                              </p>
                           </div>

                           <div className="flex-grow">
                              {/* Map features properly since we might have arbitrary raw text or bullet points if we had them. Just rendering as block */}
                              <div className="text-sm text-gray-600 space-y-3 mb-6">
                                 {pkg.featuresDescription?.split('\n').filter(Boolean).map((line, idx) => (
                                    <p key={idx} className="flex items-start gap-2">
                                       <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                                       <span>{line.replace(/^-/, '').trim()}</span>
                                    </p>
                                 )) || (
                                       <p className="flex items-start gap-2">
                                          <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                                          <span>Đầy đủ tính năng quản lý cơ bản</span>
                                       </p>
                                    )}
                              </div>
                           </div>

                           <button
                              onClick={() => handleBuyPackage(pkg)}
                              disabled={paymentLoading}
                              className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all
                             ${isPopular
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg shadow-blue-500/30"
                                    : "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-md border border-blue-100"}
                          `}
                           >
                              {subStatus === "Active" ? "Gia hạn thêm" : "Đăng ký ngay"}
                              <ArrowRight size={18} />
                           </button>
                        </div>
                     );
                  })}
               </div>
            </div>

         </div>

         <PayOSPaymentModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            checkOutData={checkOutData}
            selectedPackage={selectedPackage}
            onPaymentSuccess={handlePaymentSuccess}
         />
      </>
   );

   return isForced ? (
      <div className="min-h-screen bg-[#f0f4f8] p-8">
         {content}
      </div>
   ) : (
      <RestaurantOwnerLayout>
         {content}
      </RestaurantOwnerLayout>
   );
}
