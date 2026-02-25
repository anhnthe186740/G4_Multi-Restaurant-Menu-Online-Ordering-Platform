import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
    Upload, FileText, Info, Shield, BookOpen, User,
    CheckCircle, ArrowLeft, Send, Clock, Loader2
} from "lucide-react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const PLAN_LABELS = {
    basic: { name: "Basic", color: "text-green-500", badge: "bg-green-500/10 border-green-500/30" },
    premium: { name: "Premium", color: "text-emerald-400", badge: "bg-emerald-500/10 border-emerald-400/30" },
    enterprise: { name: "Enterprise", color: "text-yellow-400", badge: "bg-yellow-500/10 border-yellow-400/30" },
};

// ─── APPROVAL WAITING SCREEN ────────────────────────────────────────────────
// Tự động poll mỗi 4 giây để phát hiện khi admin duyệt
function ApprovalWaiting({ navigate, apiUrl }) {
    const isLoggedIn = !!localStorage.getItem("token");
    const [dots, setDots] = useState(".");

    // Hiệu ứng chấm "..." đang chờ
    useEffect(() => {
        const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 600);
        return () => clearInterval(t);
    }, []);

    // Polling: kiểm tra role mỗi 4 giây nếu đã đăng nhập
    useEffect(() => {
        if (!isLoggedIn) return;

        const checkApproval = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.post(`${apiUrl}/auth/refresh-token`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.user?.role === "RestaurantOwner") {
                    // Đã được duyệt → cập nhật session và redirect
                    localStorage.setItem("token", res.data.token);
                    localStorage.setItem("user", JSON.stringify(res.data.user));
                    window.location.href = "/owner/dashboard";
                }
            } catch {
                // Bỏ qua lỗi, thử lại lần sau
            }
        };

        checkApproval(); // Kiểm tra ngay lần đầu
        const interval = setInterval(checkApproval, 4000);
        return () => clearInterval(interval);
    }, [isLoggedIn, apiUrl]);

    return (
        <div className="min-h-screen bg-[#040f08] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {isLoggedIn ? (
                    <>
                        <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
                            <Loader2 size={36} className="text-amber-400 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">Đơn đã được gửi!</h1>
                        <p className="text-gray-400 mb-2 leading-relaxed">
                            Hệ thống đang chờ admin phê duyệt{dots}
                        </p>
                        <p className="text-gray-600 text-xs mb-8">
                            Bạn sẽ được tự động chuyển sang trang quản lý khi đơn được duyệt
                        </p>
                        <div className="flex items-center justify-center gap-2 text-amber-400/60 text-xs">
                            <Clock size={13} />
                            <span>Đang kiểm tra trạng thái tự động...</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <CheckCircle size={40} className="text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">Đăng ký thành công!</h1>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Chúng tôi đã nhận được đơn đăng ký. Đội ngũ tư vấn sẽ liên hệ trong
                            <span className="text-green-400 font-semibold"> 1–2 ngày làm việc</span>.
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition"
                        >
                            Về trang chủ
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function RegisterRestaurant() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const plan = searchParams.get("plan") || "basic";
    const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.basic;

    const coverRef = useRef(null);
    const logoRef = useRef(null);
    const licenseRef = useRef(null);

    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [coverPreview, setCoverPreview] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [licenseFile, setLicenseFile] = useState(null);
    const [uploadingImg, setUploadingImg] = useState(""); // "cover" | "logo" | "license" | ""

    const [form, setForm] = useState({
        // Hình ảnh (URL)
        coverImage: "",
        logo: "",
        businessLicense: "",
        // Thông tin nhà hàng
        restaurantName: "",
        description: "",
        website: "",
        taxCode: "",
        // Thông tin chủ sở hữu
        ownerName: "",
        email: "",
        phone: "",
        // Ghi chú
        note: "",
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // Upload file lên server, trả về URL thực
    const uploadToServer = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/upload", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        if (!res.ok) {
            // Tránh crash khi server trả HTML (404, 500...)
            const text = await res.text();
            let message = `Lỗi ${res.status}`;
            try { message = JSON.parse(text).message || message; } catch { /* HTML page */ }
            throw new Error(message);
        }
        const data = await res.json();
        return data.url;
    };

    const handleImageChange = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        const blobUrl = URL.createObjectURL(file);
        if (type === "cover") setCoverPreview(blobUrl);
        else if (type === "logo") setLogoPreview(blobUrl);
        setUploadingImg(type);
        try {
            const serverUrl = await uploadToServer(file);
            if (type === "cover") {
                setCoverPreview(serverUrl);
                setForm(prev => ({ ...prev, coverImage: serverUrl }));
            } else if (type === "logo") {
                setLogoPreview(serverUrl);
                setForm(prev => ({ ...prev, logo: serverUrl }));
            }
        } catch (err) {
            alert("❌ Upload ảnh thất bại: " + err.message);
            if (type === "cover") setCoverPreview(null);
            else if (type === "logo") setLogoPreview(null);
        } finally {
            setUploadingImg("");
        }
    };

    const handleLicenseChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLicenseFile({ name: file.name, date: new Date().toLocaleDateString("vi-VN"), uploading: true });
        setUploadingImg("license");
        try {
            const serverUrl = await uploadToServer(file);
            setLicenseFile({ name: file.name, date: new Date().toLocaleDateString("vi-VN"), uploading: false });
            setForm(prev => ({ ...prev, businessLicense: serverUrl }));
        } catch (err) {
            alert("❌ Upload giấy phép thất bại: " + err.message);
            setLicenseFile(null);
        } finally {
            setUploadingImg("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        if (!form.ownerName.trim() || !form.restaurantName.trim() || !form.email.trim()) {
            setErrorMsg("Vui lòng điền đầy đủ các trường bắt buộc (*)");
            return;
        }
        setSubmitting(true);
        try {
            // Đóng gói toàn bộ thông tin extra vào JSON để admin panel parse
            const extraData = {
                taxCode: form.taxCode || null,
                website: form.website || null,
                description: form.description || null,
                coverImage: form.coverImage || null,
                logo: form.logo || null,
                businessLicense: form.businessLicense || null,
                plan: planInfo.name,
                userNote: form.note || null,
            };
            const notePayload = `__FORM_DATA__:${JSON.stringify(extraData)}`;

            // Gửi token nếu user đã đăng nhập để backend liên kết tài khoản
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.post(`${API_URL}/admin/registration-requests`, {
                ownerName: form.ownerName,
                email: form.email,
                phone: form.phone,
                restaurantName: form.restaurantName,
                note: notePayload,
            }, { headers });
            // Redirect về homepage — user dùng nút "Hồ sơ" để xem trạng thái
            navigate("/");
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <div className="min-h-screen bg-[#040f08]">
            {/* Header */}
            <div className="border-b border-white/5 px-6 py-4 bg-[#060e0a]">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
                        <ArrowLeft size={16} />
                        Quay lại trang chủ
                    </Link>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${planInfo.badge} ${planInfo.color}`}>
                        Gói {planInfo.name}
                    </span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* Page title */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Đăng ký nhà hàng</h1>
                    <p className="text-gray-400 text-sm">
                        Điền thông tin bên dưới để bắt đầu hành trình số hoá nhà hàng của bạn
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ===== BỘ NHẬN DIỆN HÌNH ẢNH ===== */}
                    <div className="bg-[#0a1a10] rounded-2xl border border-white/5 p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Upload size={16} className="text-green-500" />
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Bộ nhận diện hình ảnh</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Cover */}
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-300 mb-2 font-medium">
                                    Ảnh bìa nhà hàng <span className="text-gray-500 font-normal">(1920×1080 khuyến nghị)</span>
                                </p>
                                <div
                                    className="relative w-full h-44 rounded-xl border-2 border-dashed border-white/10 bg-white/5 overflow-hidden cursor-pointer hover:border-green-500/50 transition group"
                                    onClick={() => coverRef.current.click()}
                                >
                                    {coverPreview ? (
                                        <img src={coverPreview} className="w-full h-full object-cover" alt="cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500 group-hover:text-green-400 transition">
                                            <Upload size={28} className="mb-2" />
                                            <p className="text-sm font-medium">Tải ảnh bìa lên</p>
                                            <p className="text-xs mt-1">PNG, JPG tối đa 5MB</p>
                                        </div>
                                    )}
                                    {coverPreview && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <span className="text-white text-sm font-semibold">Thay đổi ảnh bìa</span>
                                        </div>
                                    )}
                                </div>
                                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, "cover")} />
                                <div className="mt-2">
                                    <label className="block text-xs text-gray-500 mb-1">Hoặc nhập URL ảnh bìa</label>
                                    <input
                                        type="url" name="coverImage" value={form.coverImage} onChange={handleChange}
                                        placeholder="https://..."
                                        className="w-full h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-white text-xs placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                                    />
                                </div>
                            </div>
                            {/* Logo */}
                            <div>
                                <p className="text-sm text-gray-300 mb-2 font-medium">
                                    Logo thương hiệu <span className="text-gray-500 font-normal">(tỉ lệ 1:1)</span>
                                </p>
                                <div
                                    className="relative w-full h-44 rounded-xl border-2 border-dashed border-white/10 bg-white/5 overflow-hidden cursor-pointer hover:border-green-500/50 transition group"
                                    onClick={() => logoRef.current.click()}
                                >
                                    {logoPreview ? (
                                        <img src={logoPreview} className="w-full h-full object-contain p-4" alt="logo" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500 group-hover:text-green-400 transition">
                                            <Upload size={24} className="mb-2" />
                                            <p className="text-xs font-medium text-center">Tải logo lên</p>
                                            <p className="text-xs mt-1 text-gray-600">PNG trong suốt</p>
                                        </div>
                                    )}
                                    {logoPreview && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <span className="text-white text-xs font-semibold">Thay đổi logo</span>
                                        </div>
                                    )}
                                </div>
                                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, "logo")} />
                                <div className="mt-2">
                                    <label className="block text-xs text-gray-500 mb-1">Hoặc nhập URL logo</label>
                                    <input
                                        type="url" name="logo" value={form.logo} onChange={handleChange}
                                        placeholder="https://..."
                                        className="w-full h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-white text-xs placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== THÔNG TIN NHÀ HÀNG + PHÁP LÝ ===== */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Thông tin nhà hàng */}
                        <div className="bg-[#0a1a10] rounded-2xl border border-white/5 p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Info size={16} className="text-green-500" />
                                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Thông tin nhà hàng</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Tên nhà hàng <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text" name="restaurantName" value={form.restaurantName} onChange={handleChange}
                                        placeholder="VD: Phở Hà Nội"
                                        className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Website</label>
                                    <input
                                        type="url" name="website" value={form.website} onChange={handleChange}
                                        placeholder="https://nhahang.vn"
                                        className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pháp lý */}
                        <div className="bg-[#0a1a10] rounded-2xl border border-white/5 p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Shield size={16} className="text-green-500" />
                                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Pháp lý & Giấy phép</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Mã số thuế (Tax ID)</label>
                                    <input
                                        type="text" name="taxCode" value={form.taxCode} onChange={handleChange}
                                        placeholder="0123456789"
                                        className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Giấy phép kinh doanh</label>
                                    <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-white/10 bg-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                <FileText size={15} className="text-green-500" />
                                            </div>
                                            <div>
                                                {licenseFile ? (
                                                    <>
                                                        <p className="text-sm font-medium text-white truncate max-w-[130px]">{licenseFile.name}</p>
                                                        <p className="text-xs text-gray-500">Đã tải lên {licenseFile.date}</p>
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-gray-500">Chưa có tệp</p>
                                                )}
                                            </div>
                                        </div>
                                        <label className="text-sm text-green-500 font-semibold cursor-pointer hover:text-green-400 transition">
                                            {licenseFile ? "Thay đổi" : "Tải lên"}
                                            <input ref={licenseRef} type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={handleLicenseChange} />
                                        </label>
                                    </div>
                                    <div className="mt-2">
                                        <label className="block text-xs text-gray-500 mb-1">Hoặc nhập URL giấy phép</label>
                                        <input
                                            type="url" name="businessLicense" value={form.businessLicense} onChange={handleChange}
                                            placeholder="https://... (PDF, ảnh)"
                                            className="w-full h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-white text-xs placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== MÔ TẢ NHÀ HÀNG ===== */}
                    <div className="bg-[#0a1a10] rounded-2xl border border-white/5 p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <BookOpen size={16} className="text-green-500" />
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Mô tả nhà hàng</h2>
                        </div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Giới thiệu ngắn gọn</label>
                        <textarea
                            name="description" value={form.description} onChange={handleChange}
                            rows={3}
                            placeholder="Mô tả về nhà hàng của bạn..."
                            className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm resize-none placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                        />
                        <p className="text-xs text-gray-600 mt-1 text-right">{form.description.length} / 500 ký tự</p>
                    </div>

                    {/* ===== THÔNG TIN CHỦ SỞ HỮU ===== */}
                    <div className="bg-[#0a1a10] rounded-2xl border border-white/5 p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <User size={16} className="text-green-500" />
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Thông tin chủ sở hữu</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Họ và tên <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text" name="ownerName" value={form.ownerName} onChange={handleChange}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Email liên hệ <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="email" name="email" value={form.email} onChange={handleChange}
                                    placeholder="owner@example.com"
                                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Số điện thoại</label>
                                <input
                                    type="tel" name="phone" value={form.phone} onChange={handleChange}
                                    placeholder="0912 345 678"
                                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ===== GHI CHÚ ===== */}
                    <div className="bg-[#0a1a10] rounded-2xl border border-white/5 p-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ghi chú thêm (không bắt buộc)</label>
                        <textarea
                            name="note" value={form.note} onChange={handleChange}
                            rows={2}
                            placeholder="Yêu cầu đặc biệt, câu hỏi, hoặc thông tin bổ sung..."
                            className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm resize-none placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                        />
                    </div>

                    {/* ERROR */}
                    {errorMsg && (
                        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    {/* SUBMIT */}
                    <div className="flex items-center justify-between pt-2 pb-10">
                        <p className="text-xs text-gray-500">
                            <span className="text-red-400">*</span> Trường bắt buộc
                        </p>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Send size={16} />
                            {submitting ? "Đang gửi..." : "Gửi đăng ký"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
