import { useState, useEffect, useRef } from "react";
import RestaurantOwnerLayout from "../components/owner/RestaurantOwnerLayout";
import { Save, Upload, FileText, Info, Shield, BookOpen, User, MapPin, Phone, Clock, Loader2 } from "lucide-react";
import { getOwnRestaurantInfo, updateOwnRestaurantInfo } from "../api/ownerApi";

export default function OwnerSettings() {
    const coverRef = useRef(null);
    const logoRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Editable restaurant fields
    const [form, setForm] = useState({
        name: "",
        taxCode: "",
        website: "",
        description: "",
        logo: "",
        coverImage: "",
        businessLicense: "",
    });

    // Read-only owner info
    const [ownerInfo, setOwnerInfo] = useState({
        ownerName: "",
        ownerUsername: "",
        ownerEmail: "",
        ownerPhone: "",
        ownerStatus: "",
        registeredDate: "",
    });

    // Branches (read-only display)
    const [branches, setBranches] = useState([]);

    const [coverPreview, setCoverPreview] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [licenseFile, setLicenseFile] = useState(null);
    const [uploadingImg, setUploadingImg] = useState(""); // "cover" | "logo" | "license" | ""

    // Load restaurant data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getOwnRestaurantInfo();
                const d = res.data;
                setForm({
                    name: d.Name || "",
                    taxCode: d.TaxCode || "",
                    website: d.Website || "",
                    description: d.Description || "",
                    logo: d.Logo || "",
                    coverImage: d.CoverImage || "",
                    businessLicense: d.BusinessLicense || "",
                });
                setOwnerInfo({
                    ownerName: d.ownerName || "",
                    ownerUsername: d.ownerUsername || "",
                    ownerEmail: d.ownerEmail || "",
                    ownerPhone: d.ownerPhone || "",
                    ownerStatus: d.ownerStatus || "",
                    registeredDate: d.registeredDate || "",
                });
                setBranches(d.branches || []);
                if (d.CoverImage) setCoverPreview(d.CoverImage);
                if (d.Logo) setLogoPreview(d.Logo);
            } catch (err) {
                console.error("Load restaurant info error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    // Upload file lên server, trả về URL thực
    const uploadToServer = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
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
        // Hiển thị preview ngay bằng blob tạm
        const blobUrl = URL.createObjectURL(file);
        if (type === "cover") setCoverPreview(blobUrl);
        else setLogoPreview(blobUrl);
        // Upload lên server
        setUploadingImg(type);
        try {
            const serverUrl = await uploadToServer(file);
            if (type === "cover") {
                setCoverPreview(serverUrl);
                setForm(prev => ({ ...prev, coverImage: serverUrl }));
            } else {
                setLogoPreview(serverUrl);
                setForm(prev => ({ ...prev, logo: serverUrl }));
            }
        } catch (err) {
            alert("❌ Upload ảnh thất bại: " + err.message);
            if (type === "cover") setCoverPreview(null);
            else setLogoPreview(null);
        } finally {
            setUploadingImg("");
        }
    };

    const handleLicenseChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const today = new Date().toLocaleDateString("vi-VN");
        setLicenseFile({ name: file.name, date: today, uploading: true });
        try {
            const serverUrl = await uploadToServer(file);
            setLicenseFile({ name: file.name, date: today, uploading: false });
            setForm(prev => ({ ...prev, businessLicense: serverUrl }));
        } catch (err) {
            alert("❌ Upload giấy phép thất bại: " + err.message);
            setLicenseFile(null);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateOwnRestaurantInfo({
                name: form.name,
                taxCode: form.taxCode,
                website: form.website,
                description: form.description,
                logo: form.logo || undefined,
                coverImage: form.coverImage || undefined,
                businessLicense: form.businessLicense || undefined,
            });
            alert("✅ Đã lưu thông tin nhà hàng thành công!");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Lỗi không xác định";
            alert("❌ " + msg);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleString("vi-VN") : "N/A";

    const statusBadge = (status) => {
        const styles = {
            Active: "bg-green-100 text-green-700 border-green-200",
            Inactive: "bg-red-100 text-red-700 border-red-200",
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || "bg-gray-100 text-gray-600"}`}>
                {status || "N/A"}
            </span>
        );
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

    return (
        <RestaurantOwnerLayout>
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Thông tin Thương hiệu</h1>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition disabled:opacity-60"
                    >
                        <Save size={16} />
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>

                {/* ===== BỘ NHẬN DIỆN HÌNH ẢNH ===== */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Upload size={16} className="text-blue-500" />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Bộ nhận diện hình ảnh</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Cover */}
                        <div className="md:col-span-2">
                            <p className="text-sm text-gray-600 mb-2 font-medium">
                                Ảnh bìa nhà hàng <span className="text-gray-400 font-normal">(Khuyến nghị 1920x1080)</span>
                            </p>
                            <div
                                className="relative w-full h-48 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden cursor-pointer hover:border-blue-400 transition group"
                                onClick={() => coverRef.current.click()}
                            >
                                {coverPreview && (
                                    <img src={coverPreview} className="w-full h-full object-cover" alt="cover" />
                                )}
                                {uploadingImg === "cover" ? (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                                        <span className="text-white text-xs font-semibold">Đang tải lên...</span>
                                    </div>
                                ) : !coverPreview ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-blue-500 transition">
                                        <Upload size={28} className="mb-2" />
                                        <p className="text-sm font-medium">Tải ảnh bìa mới lên</p>
                                        <p className="text-xs mt-1">PNG, JPG tối đa 10MB</p>
                                    </div>
                                ) : (
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
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder-gray-300"
                                />
                            </div>
                        </div>
                        {/* Logo */}
                        <div>
                            <p className="text-sm text-gray-600 mb-2 font-medium">
                                Logo thương hiệu <span className="text-gray-400 font-normal">(Tỉ lệ 1:1)</span>
                            </p>
                            <div
                                className="relative w-full h-48 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden cursor-pointer hover:border-blue-400 transition group"
                                onClick={() => logoRef.current.click()}
                            >
                                {logoPreview && (
                                    <img src={logoPreview} className="w-full h-full object-contain p-4" alt="logo" />
                                )}
                                {uploadingImg === "logo" ? (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                                        <span className="text-white text-xs font-semibold">Đang tải lên...</span>
                                    </div>
                                ) : !logoPreview ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-blue-500 transition">
                                        <Upload size={24} className="mb-2" />
                                        <p className="text-xs font-medium text-center">Tải logo lên</p>
                                        <p className="text-xs mt-1 text-gray-300">PNG có nền trong suốt</p>
                                    </div>
                                ) : (
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
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder-gray-300"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== THÔNG TIN NHÀ HÀNG + PHÁP LÝ ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Thông tin nhà hàng */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Info size={16} className="text-blue-500" />
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Thông tin nhà hàng</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên nhà hàng <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text" name="name" value={form.name} onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <input
                                    type="url" name="website" value={form.website} onChange={handleChange}
                                    placeholder="https://nhahang.vn"
                                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder-gray-300"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pháp lý */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Shield size={16} className="text-blue-500" />
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Pháp lý &amp; Giấy phép</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế (Tax ID)</label>
                                <input
                                    type="text" name="taxCode" value={form.taxCode} onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giấy phép kinh doanh</label>
                                <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <FileText size={15} className="text-blue-600" />
                                        </div>
                                        <div>
                                            {licenseFile ? (
                                                <>
                                                    <p className="text-sm font-medium text-gray-700 truncate max-w-[160px]">{licenseFile.name}</p>
                                                    <p className="text-xs text-gray-400">Đã tải lên {licenseFile.date}</p>
                                                </>
                                            ) : (
                                                <p className="text-sm text-gray-400">Chưa có tệp</p>
                                            )}
                                        </div>
                                    </div>
                                    <label className="text-sm text-blue-600 font-semibold cursor-pointer hover:text-blue-700 transition">
                                        {licenseFile ? "Thay đổi" : "Tải lên"}
                                        <input type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={handleLicenseChange} />
                                    </label>
                                </div>
                                <div className="mt-3">
                                    <label className="block text-xs text-gray-500 mb-1">Hoặc nhập URL giấy phép</label>
                                    <input
                                        type="url" name="businessLicense" value={form.businessLicense} onChange={handleChange}
                                        placeholder="https://... (PDF, ảnh)"
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder-gray-300"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== MÔ TẢ / CÂU CHUYỆN THƯƠNG HIỆU ===== */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <BookOpen size={16} className="text-blue-500" />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Mô tả nhà hàng</h2>
                    </div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giới thiệu ngắn gọn</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Mô tả về nhà hàng của bạn..."
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder-gray-300"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length} / 500 ký tự</p>
                </div>

                {/* ===== THÔNG TIN CHỦ SỞ HỮU (read-only) ===== */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <User size={16} className="text-blue-500" />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Chủ sở hữu</h2>
                        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Chỉ đọc</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Họ tên</p>
                            <p className="text-sm font-medium text-blue-600">{ownerInfo.ownerName || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Username</p>
                            <p className="text-sm text-blue-600">{ownerInfo.ownerUsername || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Email</p>
                            <p className="text-sm text-blue-600">{ownerInfo.ownerEmail || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Số điện thoại</p>
                            <p className="text-sm text-gray-700">{ownerInfo.ownerPhone || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Ngày đăng ký</p>
                            <p className="text-sm text-gray-700">{formatDate(ownerInfo.registeredDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Trạng thái</p>
                            {statusBadge(ownerInfo.ownerStatus)}
                        </div>
                    </div>
                </div>

                {/* ===== CHI NHÁNH (read-only) ===== */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <MapPin size={16} className="text-blue-500" />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                            Chi nhánh ({branches.length})
                        </h2>
                        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Chỉ đọc</span>
                    </div>
                    {branches.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">Chưa có chi nhánh nào</p>
                    ) : (
                        <div className="space-y-3">
                            {branches.map((b) => (
                                <div key={b.BranchID} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm">{b.Name}</h4>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <MapPin size={11} /> {b.Address || "Chưa có địa chỉ"}
                                            </p>
                                        </div>
                                        {statusBadge(b.IsActive ? "Active" : "Inactive")}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5"><Phone size={12} /> {b.Phone || "N/A"}</span>
                                        <span className="flex items-center gap-1.5"><Clock size={12} /> {b.OpeningHours || "N/A"}</span>
                                        <span className="flex items-center gap-1.5"><User size={12} /> QL: {b.managerName || "Chưa có"}</span>
                                        <span className="flex items-center gap-1.5">🪑 {b.tableCount} bàn</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </RestaurantOwnerLayout>
    );
}
