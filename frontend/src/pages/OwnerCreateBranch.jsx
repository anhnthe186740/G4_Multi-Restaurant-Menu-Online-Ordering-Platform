import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';
import { createOwnerBranch } from '../api/ownerApi';
import {
    Info, Clock, MapPin, CheckCircle2, XCircle,
    ArrowLeft, Plus, Save, GitBranch
} from 'lucide-react';

const DEFAULT_HOURS = { mon_fri: '08:00-22:00', sat: '08:00-23:30', sun: '09:00-23:30' };

export default function OwnerCreateBranch() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

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

    const handleField = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleHours = (day, rawVal) =>
        setForm(f => ({ ...f, hours: { ...f.hours, [day]: rawVal } }));

    const parseHour = (str, part) => {
        const [open, close] = (str || '').split('-');
        return part === 'open' ? (open || '') : (close || '');
    };
    const buildHourStr = (open, close) => `${open}-${close}`;

    const handleSave = async () => {
        if (!form.name.trim()) {
            showToast('Vui lòng nhập tên chi nhánh', 'error');
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
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                    placeholder="VD: Chi nhánh Quận 1"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Số điện thoại</label>
                                    <input
                                        value={form.phone}
                                        onChange={e => handleField('phone', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                        placeholder="028 1234 5678"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email liên hệ</label>
                                    <input
                                        value={form.email}
                                        onChange={e => handleField('email', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                        placeholder="chinhanh@email.vn"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Địa chỉ chi tiết</label>
                                <textarea
                                    value={form.address}
                                    onChange={e => handleField('address', e.target.value)}
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                                    placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Vị trí bản đồ (preview theo địa chỉ) ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={16} className="text-blue-500" />
                            <h2 className="font-bold text-gray-900 text-base">Xem trước vị trí</h2>
                        </div>
                        <div className="relative rounded-xl overflow-hidden border border-gray-100" style={{ height: 200 }}>
                            {form.address ? (
                                <iframe
                                    title="map-preview"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(form.address)}&z=15&output=embed`}
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-2">
                                    <MapPin size={32} className="text-gray-300" />
                                    <p className="text-xs text-gray-400">Nhập địa chỉ để xem bản đồ</p>
                                </div>
                            )}
                        </div>
                        {form.address && <p className="text-xs text-gray-400 mt-2">📍 {form.address}</p>}
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
                        <button className="mt-4 w-full flex items-center justify-center gap-2 border border-dashed border-blue-300 text-blue-500 hover:bg-blue-50 rounded-xl py-2.5 text-xs font-semibold transition-colors">
                            <Plus size={14} />
                            Thêm giờ đặc biệt / Ngày lễ
                        </button>
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
                            <li>Tên chi nhánh là trường bắt buộc</li>
                            <li>Sau khi tạo, bạn có thể chỉnh sửa thêm tại trang Cài đặt chi nhánh</li>
                            <li>Chi nhánh mới sẽ hiển thị ngay trong danh sách</li>
                        </ul>
                    </div>
                </div>
            </div>
        </RestaurantOwnerLayout>
    );
}
