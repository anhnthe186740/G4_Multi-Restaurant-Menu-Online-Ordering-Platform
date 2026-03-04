import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';
import { createOwnerBranch } from '../api/ownerApi';
import {
    Info, Clock, MapPin, CheckCircle2, XCircle,
    ArrowLeft, Plus, Save, GitBranch, Trash2, CalendarDays
} from 'lucide-react';

const DEFAULT_HOURS = { mon_fri: '08:00-22:00', sat: '08:00-23:30', sun: '09:00-23:30', special: [] };

export default function OwnerCreateBranch() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [errors, setErrors] = useState({});
    const [mapAddress, setMapAddress] = useState('');
    const mapDebounceRef = useRef(null);
    const [showSpecialForm, setShowSpecialForm] = useState(false);
    const [newSpecial, setNewSpecial] = useState({ date: '', label: '', open: '08:00', close: '22:00', isClosed: false });

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        isActive: true,
        hours: { ...DEFAULT_HOURS },
    });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Validate từng trường
    const validate = () => {
        const errs = {};
        if (!form.name.trim())
            errs.name = 'Tên chi nhánh không được để trống';
        if (form.phone && !/^(\+84|0)[2-9]\d{8}$/.test(form.phone.replace(/\s/g, '')))
            errs.phone = 'Số điện thoại không hợp lệ (VD: 0912345678 hoặc 0241111111)';
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            errs.email = 'Email không đúng định dạng';
        if (form.address && form.address.trim().length < 10)
            errs.address = 'Địa chỉ quá ngắn, vui lòng nhập đầy đủ';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Cập nhật field + xoá lỗi tương ứng
    const handleField = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
        // Debounce map update khi thay đổi địa chỉ
        if (key === 'address') {
            clearTimeout(mapDebounceRef.current);
            mapDebounceRef.current = setTimeout(() => {
                setMapAddress(val);
            }, 800);
        }
    };

    const handleHours = (day, rawVal) =>
        setForm(f => ({ ...f, hours: { ...f.hours, [day]: rawVal } }));

    const addSpecial = () => {
        if (!newSpecial.date) return;
        const entry = {
            date: newSpecial.date,
            label: newSpecial.label || newSpecial.date,
            hours: newSpecial.isClosed ? null : `${newSpecial.open}-${newSpecial.close}`,
            isClosed: newSpecial.isClosed,
        };
        setForm(f => ({ ...f, hours: { ...f.hours, special: [...(f.hours.special || []), entry] } }));
        setNewSpecial({ date: '', label: '', open: '08:00', close: '22:00', isClosed: false });
        setShowSpecialForm(false);
    };

    const removeSpecial = (idx) => {
        setForm(f => ({ ...f, hours: { ...f.hours, special: f.hours.special.filter((_, i) => i !== idx) } }));
    };

    const parseHour = (str, part) => {
        const [open, close] = (str || '').split('-');
        return part === 'open' ? (open || '') : (close || '');
    };
    const buildHourStr = (open, close) => `${open}-${close}`;

    const handleSave = async () => {
        if (!validate()) {
            showToast('Vui lòng kiểm tra lại thông tin', 'error');
            return;
        }
        setSaving(true);
        try {
            const res = await createOwnerBranch({
                name: form.name,
                phone: form.phone,
                email: form.email,
                address: form.address,
                openingHours: form.hours,
                isActive: form.isActive,
            });
            showToast('Tạo chi nhánh thành công!');
            setTimeout(() => navigate(`/owner/branches/${res.data.branchID}`), 1000);
        } catch (err) {
            showToast(err.response?.data?.message || 'Không thể tạo chi nhánh', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <RestaurantOwnerLayout>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all
                    ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* ══════════ HEADER ══════════ */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <button onClick={() => navigate('/owner/branches')}
                            className="text-gray-400 hover:text-gray-700 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <GitBranch size={20} className="text-blue-500" />
                        <h1 className="text-2xl font-bold text-gray-900">Thêm chi nhánh mới</h1>
                    </div>
                    <p className="text-gray-400 text-sm pl-16">
                        Điền thông tin để tạo chi nhánh mới cho nhà hàng của bạn
                    </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <button onClick={() => navigate('/owner/branches')}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                        Hủy bỏ
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm
                            ${!saving
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                                : 'bg-blue-300 text-white cursor-not-allowed'}`}>
                        <Save size={15} />
                        {saving ? 'Đang tạo...' : 'Tạo chi nhánh'}
                    </button>
                </div>
            </div>

            {/* ══════════ 2-COLUMN LAYOUT ══════════ */}
            <div className="grid grid-cols-5 gap-5">

                {/* ╔══════════ LEFT COL (3/5) ══════════╗ */}
                <div className="col-span-3 space-y-5">

                    {/* ── Trạng thái ban đầu ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-gray-900 text-base">Trạng thái ban đầu</h2>
                                <p className="text-gray-400 text-xs mt-0.5">Chi nhánh sẽ được kích hoạt ngay sau khi tạo</p>
                            </div>
                            <button
                                onClick={() => handleField('isActive', !form.isActive)}
                                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none
                                    ${form.isActive ? 'bg-blue-500' : 'bg-gray-300'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center
                                    ${form.isActive ? 'translate-x-7' : 'translate-x-0'}`}>
                                    {form.isActive && <CheckCircle2 size={14} className="text-blue-500" />}
                                </span>
                            </button>
                        </div>
                        <div className={`mt-3 text-xs font-semibold ${form.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                            {form.isActive ? '● Sẽ hoạt động ngay sau khi tạo' : '● Tạm dừng — có thể kích hoạt sau'}
                        </div>
                    </div>

                    {/* ── Thông tin cơ bản ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <Info size={16} className="text-blue-500" />
                            <h2 className="font-bold text-gray-900 text-base">Thông tin cơ bản</h2>
                            <span className="text-red-400 text-xs">* bắt buộc</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                                    Tên chi nhánh <span className="text-red-400">*</span>
                                </label>
                                <input
                                    value={form.name}
                                    onChange={e => handleField('name', e.target.value)}
                                    className={`w-full px-3.5 py-2.5 rounded-xl border text-gray-800 text-sm focus:outline-none focus:ring-2 transition-all
                                        ${errors.name ? 'border-red-400 focus:ring-red-100 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'}`}
                                    placeholder="VD: Chi nhánh Quận 1"
                                    autoFocus
                                />
                                {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Số điện thoại <span className="text-red-400">*</span></label>
                                    <input
                                        value={form.phone}
                                        onChange={e => handleField('phone', e.target.value)}
                                        className={`w-full px-3.5 py-2.5 rounded-xl border text-gray-800 text-sm focus:outline-none focus:ring-2 transition-all
                                            ${errors.phone ? 'border-red-400 focus:ring-red-100 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'}`}
                                        placeholder="0912 345 678"
                                    />
                                    {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email liên hệ <span className="text-red-400">*</span></label>
                                    <input
                                        value={form.email}
                                        onChange={e => handleField('email', e.target.value)}
                                        className={`w-full px-3.5 py-2.5 rounded-xl border text-gray-800 text-sm focus:outline-none focus:ring-2 transition-all
                                            ${errors.email ? 'border-red-400 focus:ring-red-100 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'}`}
                                        placeholder="chinhanh@email.vn"
                                    />
                                    {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Địa chỉ chi tiết <span className="text-red-400">*</span></label>
                                <textarea
                                    value={form.address}
                                    onChange={e => handleField('address', e.target.value)}
                                    rows={3}
                                    className={`w-full px-3.5 py-2.5 rounded-xl border text-gray-800 text-sm focus:outline-none focus:ring-2 transition-all resize-none
                                        ${errors.address ? 'border-red-400 focus:ring-red-100 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'}`}
                                    placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                                />
                                {errors.address
                                    ? <p className="mt-1.5 text-xs text-red-500">{errors.address}</p>
                                    : <p className="mt-1.5 text-xs text-gray-400">Nhập đầy đủ để bản đồ hiển thị chính xác</p>
                                }
                            </div>
                        </div>
                    </div>

                    {/* ── Vị trí trên bản đồ ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-blue-500" />
                                <h2 className="font-bold text-gray-900 text-base">Vị trí trên bản đồ</h2>
                            </div>
                            <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors">
                                <MapPin size={12} />
                                Cập nhật vị trí
                            </button>
                        </div>
                        {/* Map iframe dựa trên địa chỉ */}
                        <div className="relative rounded-xl overflow-hidden border border-gray-100" style={{ height: 220 }}>
                            {mapAddress ? (
                                <iframe
                                    key={mapAddress}
                                    title="map"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&z=15&output=embed`}
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center gap-2">
                                    <MapPin size={32} className="text-gray-300" />
                                    <p className="text-xs text-gray-400">Nhập địa chỉ để hiển thị bản đồ</p>
                                </div>
                            )}
                        </div>
                        {mapAddress && (
                            <p className="text-xs text-gray-400 mt-2">📍 {mapAddress}</p>
                        )}
                    </div>
                </div>

                {/* ╔══════════ RIGHT COL (2/5) ══════════╗ */}
                <div className="col-span-2 space-y-5">

                    {/* ── Giờ hoạt động ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <Clock size={16} className="text-blue-500" />
                            <h2 className="font-bold text-gray-900 text-base">Giờ hoạt động</h2>
                        </div>
                        <div className="space-y-4">
                            {[
                                { key: 'mon_fri', label: 'Thứ 2 -\nThứ 6' },
                                { key: 'sat', label: 'Thứ 7' },
                                { key: 'sun', label: 'Chủ\nnhật' },
                            ].map(({ key, label }) => {
                                const openVal = parseHour(form.hours[key], 'open');
                                const closeVal = parseHour(form.hours[key], 'close');
                                return (
                                    <div key={key} className="flex items-center gap-3">
                                        <span className="text-xs font-semibold text-gray-500 whitespace-pre-line w-14 shrink-0 leading-tight">{label}</span>
                                        <input
                                            type="time"
                                            value={openVal}
                                            onChange={e => handleHours(key, buildHourStr(e.target.value, closeVal))}
                                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                        />
                                        <span className="text-gray-300 font-medium">—</span>
                                        <input
                                            type="time"
                                            value={closeVal}
                                            onChange={e => handleHours(key, buildHourStr(openVal, e.target.value))}
                                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Danh sách giờ đặc biệt đã thêm */}
                        {(form.hours.special || []).length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-xs font-semibold text-gray-500 mb-1">Giờ đặc biệt đã thêm:</p>
                                {form.hours.special.map((s, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                                        <CalendarDays size={13} className="text-orange-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-700 truncate">{s.label}</p>
                                            <p className="text-[11px] text-gray-500">
                                                {new Date(s.date + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                {' · '}
                                                {s.isClosed ? <span className="text-red-500 font-semibold">Đóng cửa</span> : <span className="text-green-600">{s.hours}</span>}
                                            </p>
                                        </div>
                                        <button onClick={() => removeSpecial(idx)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Form thêm giờ đặc biệt */}
                        {showSpecialForm ? (
                            <div className="mt-4 border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
                                <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                                    <CalendarDays size={13} /> Thêm giờ đặc biệt / Ngày lễ
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Ngày <span className="text-red-400">*</span></label>
                                        <input type="date"
                                            value={newSpecial.date}
                                            onChange={e => setNewSpecial(s => ({ ...s, date: e.target.value }))}
                                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-gray-800 text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Nhãn (tên ngày lễ)</label>
                                        <input type="text"
                                            value={newSpecial.label}
                                            onChange={e => setNewSpecial(s => ({ ...s, label: e.target.value }))}
                                            placeholder="VD: Tết Nguyên Đán"
                                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-gray-800 text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>
                                {/* Checkbox đóng cửa */}
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox"
                                        checked={newSpecial.isClosed}
                                        onChange={e => setNewSpecial(s => ({ ...s, isClosed: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-300 accent-blue-500"
                                    />
                                    <span className="text-xs font-semibold text-gray-700">Đóng cửa cả ngày</span>
                                </label>
                                {/* Giờ mở/đóng — ẩn nếu đóng cửa */}
                                {!newSpecial.isClosed && (
                                    <div className="flex items-center gap-2">
                                        <input type="time" value={newSpecial.open}
                                            onChange={e => setNewSpecial(s => ({ ...s, open: e.target.value }))}
                                            className="flex-1 px-2.5 py-2 rounded-lg border border-gray-200 text-gray-800 text-xs focus:outline-none focus:border-blue-400"
                                        />
                                        <span className="text-gray-400 text-xs">—</span>
                                        <input type="time" value={newSpecial.close}
                                            onChange={e => setNewSpecial(s => ({ ...s, close: e.target.value }))}
                                            className="flex-1 px-2.5 py-2 rounded-lg border border-gray-200 text-gray-800 text-xs focus:outline-none focus:border-blue-400"
                                        />
                                    </div>
                                )}
                                <div className="flex gap-2 pt-1">
                                    <button onClick={() => setShowSpecialForm(false)}
                                        className="flex-1 text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg py-2 transition-colors">
                                        Hủy
                                    </button>
                                    <button onClick={addSpecial} disabled={!newSpecial.date}
                                        className="flex-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg py-2 transition-colors">
                                        Thêm
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setShowSpecialForm(true)}
                                className="mt-4 w-full flex items-center justify-center gap-2 border border-dashed border-blue-300 text-blue-500 hover:bg-blue-50 rounded-xl py-2.5 text-xs font-semibold transition-colors">
                                <Plus size={14} />
                                Thêm giờ đặc biệt / Ngày lễ
                            </button>
                        )}
                    </div>


                    {/* ── Summary Preview ── */}
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                        <h2 className="font-bold text-blue-800 text-base mb-3">Xem trước thông tin</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-blue-600">Tên:</span>
                                <span className="font-semibold text-blue-900 truncate max-w-[160px]">{form.name || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-600">SĐT:</span>
                                <span className="font-semibold text-blue-900">{form.phone || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-600">Trạng thái:</span>
                                <span className={`font-semibold ${form.isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                                    {form.isActive ? '● Hoạt động' : '● Tạm dừng'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-600">Giờ T2-T6:</span>
                                <span className="font-semibold text-blue-900">{form.hours.mon_fri}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Hướng dẫn ── */}
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                        <h3 className="font-bold text-amber-700 text-sm mb-2">💡 Lưu ý</h3>
                        <ul className="text-xs text-amber-600 space-y-1.5 list-disc ml-4">
                            <li>Thông tin cơ bản là phần bắt buộc</li>
                            <li>Sau khi tạo, bạn có thể chỉnh sửa thêm tại trang Cài đặt chi nhánh</li>
                            <li>Chi nhánh mới sẽ hiển thị ngay trong danh sách</li>
                        </ul>
                    </div>
                </div>
            </div>
        </RestaurantOwnerLayout>
    );
}
