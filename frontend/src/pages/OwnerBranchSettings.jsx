import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';
import { getOwnerBranchById, updateOwnerBranch, toggleOwnerBranch, deleteOwnerBranch } from '../api/ownerApi';
import {
    Info, Clock, MapPin, CheckCircle2, XCircle,
    ArrowLeft, Power, AlertTriangle, Plus, Save, Trash2, CalendarDays
} from 'lucide-react';

const DEFAULT_HOURS = { mon_fri: '08:00-22:00', sat: '08:00-23:30', sun: '09:00-23:30' };

export default function OwnerBranchSettings() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showSpecialForm, setShowSpecialForm] = useState(false);
    const [newSpecial, setNewSpecial] = useState({ date: '', label: '', open: '08:00', close: '22:00', isClosed: false });

    // form state
    const [branch, setBranch] = useState(null);
    const [form, setForm] = useState({
        name: '', phone: '', email: '', address: '',
        isActive: true,
        hours: { ...DEFAULT_HOURS },
    });
    const [dirty, setDirty] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => { loadBranch(); }, [id]);

    const loadBranch = async () => {
        setLoading(true);
        try {
            const res = await getOwnerBranchById(id);
            const b = res.data;
            setBranch(b);
            setForm({
                name: b.name || '',
                phone: b.phone || '',
                email: b.email || '',
                address: b.address || '',
                isActive: b.isActive,
                hours: {
                    mon_fri: b.openingHours?.mon_fri || DEFAULT_HOURS.mon_fri,
                    sat: b.openingHours?.sat || DEFAULT_HOURS.sat,
                    sun: b.openingHours?.sun || DEFAULT_HOURS.sun,
                    special: b.openingHours?.special || [],
                },
            });
            setDirty(false);
        } catch {
            showToast('Không thể tải thông tin chi nhánh', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleField = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        setDirty(true);
        if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
    };

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

    const handleHours = (day, rawVal) => {
        setForm(f => ({ ...f, hours: { ...f.hours, [day]: rawVal } }));
        setDirty(true);
    };

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
        setDirty(true);
    };

    const removeSpecial = (idx) => {
        setForm(f => ({ ...f, hours: { ...f.hours, special: f.hours.special.filter((_, i) => i !== idx) } }));
        setDirty(true);
    };

    const handleCancel = () => {
        if (branch) {
            setForm({
                name: branch.name || '',
                phone: branch.phone || '',
                email: branch.email || '',
                address: branch.address || '',
                isActive: branch.isActive,
                hours: {
                    mon_fri: branch.openingHours?.mon_fri || DEFAULT_HOURS.mon_fri,
                    sat: branch.openingHours?.sat || DEFAULT_HOURS.sat,
                    sun: branch.openingHours?.sun || DEFAULT_HOURS.sun,
                },
            });
            setDirty(false);
        }
    };

    const handleSave = async () => {
        if (!validate()) {
            showToast('Vui lòng kiểm tra lại thông tin', 'error');
            return;
        }
        setSaving(true);
        try {
            await updateOwnerBranch(id, {
                name: form.name,
                phone: form.phone,
                email: form.email,
                address: form.address,
                openingHours: form.hours,
            });
            setBranch(b => ({ ...b, name: form.name, phone: form.phone, email: form.email, address: form.address, isActive: form.isActive, openingHours: form.hours }));
            setDirty(false);
            showToast('Lưu thay đổi thành công!');
            setTimeout(() => navigate('/owner/branches'), 1000);
        } catch {
            showToast('Không thể lưu thay đổi', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteOwnerBranch(id);
            showToast('Đã xóa chi nhánh thành công!');
            setTimeout(() => navigate('/owner/branches'), 1000);
        } catch (err) {
            showToast(err.response?.data?.message || 'Không thể xóa chi nhánh', 'error');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    /* ─── Render helpers ─── */
    const parseHour = (str, part) => {
        const [open, close] = (str || '').split('-');
        return part === 'open' ? (open || '') : (close || '');
    };
    const buildHourStr = (open, close) => `${open}-${close}`;

    if (loading) return (
        <RestaurantOwnerLayout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-11 h-11 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        </RestaurantOwnerLayout>
    );

    const isActive = form.isActive;

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

            {/* Delete confirm modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Xác nhận xóa chi nhánh</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Hành động này không thể hoàn tác.</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-5">
                            Bạn có chắc muốn xóa chi nhánh <strong>{branch?.name}</strong>?
                            Toàn bộ dữ liệu liên quan (bàn, đơn hàng...) sẽ bị xóa vĩnh viễn.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                                className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
                                Hủy bỏ
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                {deleting
                                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang xóa...</>
                                    : <><Trash2 size={15} /> Xóa chi nhánh</>}
                            </button>
                        </div>
                    </div>
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
                        <h1 className="text-2xl font-bold text-gray-900">Cài đặt chi nhánh</h1>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border
                            ${isActive
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-200 text-gray-600 border-gray-300'}`}>
                            {isActive ? '● ĐANG HOẠT ĐỘNG' : '● TẠM DỪNG'}
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm pl-8">
                        Quản lý thông tin chi tiết và trạng thái hoạt động của <span className="text-gray-600 font-medium">{branch?.name}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <button onClick={handleCancel} disabled={!dirty}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors
                            ${dirty ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}>
                        Hủy thay đổi
                    </button>
                    <button onClick={handleSave} disabled={!dirty || saving}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm
                            ${dirty && !saving
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                                : 'bg-blue-300 text-white cursor-not-allowed'}`}>
                        <Save size={15} />
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>

            {/* ══════════ 2-COLUMN LAYOUT ══════════ */}
            <div className="grid grid-cols-5 gap-5">

                {/* ╔══════════ LEFT COL (3/5) ══════════╗ */}
                <div className="col-span-3 space-y-5">

                    {/* ── Trạng thái cửa hàng ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-gray-900 text-base">Trạng thái cửa hàng</h2>
                                <p className="text-gray-400 text-xs mt-0.5">Điều chỉnh trạng thái đóng/mở cửa ngay lập tức trên ứng dụng</p>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await toggleOwnerBranch(id);
                                        setForm(f => ({ ...f, isActive: res.data.isActive }));
                                        setBranch(b => ({ ...b, isActive: res.data.isActive }));
                                        showToast(res.data.message);
                                    } catch {
                                        showToast('Không thể thay đổi trạng thái', 'error');
                                    }
                                }}
                                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none
                                    ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center
                                    ${isActive ? 'translate-x-7' : 'translate-x-0'}`}>
                                    {isActive && <CheckCircle2 size={14} className="text-blue-500" />}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* ── Thông tin cơ bản ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <Info size={16} className="text-blue-500" />
                            <h2 className="font-bold text-gray-900 text-base">Thông tin cơ bản</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Tên chi nhánh <span className="text-red-400">*</span></label>
                                <input
                                    value={form.name}
                                    onChange={e => handleField('name', e.target.value)}
                                    className={`w-full px-3.5 py-2.5 rounded-xl border text-gray-800 text-sm focus:outline-none focus:ring-2 transition-all
                                        ${errors.name ? 'border-red-400 focus:ring-red-100 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'}`}
                                    placeholder="Tên chi nhánh"
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
                                {errors.address && <p className="mt-1.5 text-xs text-red-500">{errors.address}</p>}
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
                            {form.address ? (
                                <iframe
                                    title="map"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(form.address)}&z=15&output=embed`}
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center gap-2">
                                    <MapPin size={32} className="text-gray-300" />
                                    <p className="text-xs text-gray-400">Nhập địa chỉ để hiển thị bản đồ</p>
                                </div>
                            )}
                        </div>
                        {form.address && (
                            <p className="text-xs text-gray-400 mt-2">📍 {form.address}</p>
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
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox"
                                        checked={newSpecial.isClosed}
                                        onChange={e => setNewSpecial(s => ({ ...s, isClosed: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-300 accent-blue-500"
                                    />
                                    <span className="text-xs font-semibold text-gray-700">Đóng cửa cả ngày</span>
                                </label>
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

                    {/* ── Tóm tắt vận hành ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="font-bold text-gray-900 text-base mb-4">Tóm tắt vận hành</h2>
                        <div className="space-y-3">
                            <SummaryRow
                                label="Trạng thái"
                                value={isActive ? 'Sẵn sàng phục vụ' : 'Tạm dừng'}
                                ok={isActive}
                            />
                            <SummaryRow label="Đơn hàng online" value="Đang bật" ok={true} />
                            <SummaryRow label="Thời gian chuẩn bị TB" value="15 phút" ok={true} />
                        </div>
                    </div>

                    {/* ── Vùng nguy hiểm ── */}
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                        <h2 className="font-bold text-red-600 text-base mb-1.5">Vùng nguy hiểm</h2>
                        <p className="text-xs text-red-400 mb-4">
                            Xóa chi nhánh sẽ xóa vĩnh viễn toàn bộ dữ liệu liên quan và không thể hoàn tác.
                        </p>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center justify-center gap-2 border border-red-400 text-red-600 hover:bg-red-100 rounded-xl py-2.5 text-sm font-semibold transition-colors"
                        >
                            <Trash2 size={15} />
                            Xóa chi nhánh này
                        </button>
                    </div>

                </div>
            </div>

        </RestaurantOwnerLayout>
    );
}

/* ── Summary Row ── */
function SummaryRow({ label, value, ok }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0
                ${ok ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <CheckCircle2 size={12} className="text-white" />
            </div>
            <span className="text-sm text-gray-500 flex-1">{label}:</span>
            <span className="text-sm font-bold text-gray-800">{value}</span>
        </div>
    );
}
