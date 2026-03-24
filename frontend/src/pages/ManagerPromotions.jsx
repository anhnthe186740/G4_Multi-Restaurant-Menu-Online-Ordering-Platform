import { useState, useEffect, useCallback } from 'react';
import { Gift, Plus, Pencil, Trash2, CheckCircle2, XCircle, Loader2, Clock, AlertCircle, BadgePercent, DollarSign, RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import {
  getManagerPromotions, createManagerPromotion,
  updateManagerPromotion, deleteManagerPromotion
} from '../api/managerApi';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';

/* ── Helpers ─────────────────────────────────────────────────────────── */
const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const STATUS_CONFIG = {
  Active:          { label: 'Đang hoạt động', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  PendingApproval: { label: 'Chờ duyệt',      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  Inactive:        { label: 'Vô hiệu',         color: 'bg-slate-600/40 text-slate-400 border-slate-600/40' },
};

const MANAGER_THRESHOLD_PERCENT = 10;
const MANAGER_THRESHOLD_FIXED   = 50000;

const DAYS_OF_WEEK = [
  { value: 1, label: 'T2' }, { value: 2, label: 'T3' }, { value: 3, label: 'T4' },
  { value: 4, label: 'T5' }, { value: 5, label: 'T6' }, { value: 6, label: 'T7' }, { value: 0, label: 'CN' }
];

const EMPTY_FORM = {
  name: '', description: '', discountType: 'Percentage', value: '', minOrderValue: '',
  maxDiscountAmount: '', startDate: '', endDate: '',
  happyHourStart: '', happyHourEnd: '', priority: 0, usageLimit: '', applicableDays: []
};

/* ════════════════════════════════════════════════════════════════════
   ManagerPromotions — Trang quản lý Auto-Promotions cho Branch Manager
════════════════════════════════════════════════════════════════════ */
export default function ManagerPromotions() {
  const [promotions, setPromotions]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editPromo, setEditPromo]       = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeTab, setActiveTab]       = useState('all');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getManagerPromotions();
      setPromotions(res.data);
    } catch (e) {
      toast.error('Không thể tải dữ liệu: ' + (e?.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Derived ── */
  const myPromos    = promotions.filter(p => !p.isOwnerPromotion);
  const ownerPromos = promotions.filter(p => p.isOwnerPromotion);
  const displayed   = activeTab === 'mine' ? myPromos : activeTab === 'owner' ? ownerPromos : promotions;

  /* ── Threshold preview ── */
  const willBeActive = (type, val) => {
    const n = parseFloat(val);
    if (!n) return null;
    if (type === 'Percentage') return n <= MANAGER_THRESHOLD_PERCENT ? 'Active' : 'PendingApproval';
    return n <= MANAGER_THRESHOLD_FIXED ? 'Active' : 'PendingApproval';
  };
  const previewStatus = willBeActive(form.discountType, form.value);

  const openCreate = () => { setEditPromo(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit   = (p) => {
    setEditPromo(p);
    setForm({
      name: p.name, description: p.description ?? '', discountType: p.discountType, value: p.value,
      minOrderValue: p.minOrderValue, maxDiscountAmount: p.maxDiscountAmount ?? '',
      startDate: p.startDate ? dayjs(p.startDate).format('YYYY-MM-DD') : '',
      endDate:   p.endDate   ? dayjs(p.endDate).format('YYYY-MM-DD')   : '',
      happyHourStart: p.happyHourStart ?? '', happyHourEnd: p.happyHourEnd ?? '',
      priority: p.priority, usageLimit: p.usageLimit ?? '',
      applicableDays: p.applicableDays ? p.applicableDays.split(',').map(Number) : [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.value) return toast.error('Vui lòng nhập tên và giá trị giảm.');
    setSaving(true);
    try {
      const payload = {
        ...form,
        description: form.description ? form.description.trim() : null,
        value: parseFloat(form.value),
        minOrderValue: parseFloat(form.minOrderValue) || 0,
        maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        happyHourStart: form.happyHourStart || null,
        happyHourEnd: form.happyHourEnd || null,
        applicableDays: form.applicableDays && form.applicableDays.length > 0 ? form.applicableDays.join(',') : null,
      };
      if (editPromo) {
        await updateManagerPromotion(editPromo.discountID, payload);
        toast.success('Đã cập nhật chiến dịch!');
      } else {
        const res = await createManagerPromotion(payload);
        const status = res.data?.status;
        toast.success(
          status === 'PendingApproval'
            ? '⏳ Gửi duyệt thành công! Chờ chủ nhà hàng xét duyệt.'
            : '✅ Chiến dịch đã được kích hoạt!',
          { duration: 4000 }
        );
      }
      setShowModal(false);
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Lỗi lưu dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteManagerPromotion(id);
      toast.success('Đã xoá chiến dịch.');
      setConfirmDelete(null);
      fetchAll();
    } catch (e) { toast.error(e?.response?.data?.message || 'Lỗi xoá.'); }
  };

  return (
    <BranchManagerLayout>
      <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
        {/* ── Header ─────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Gift size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Khuyến Mãi Chi Nhánh</h1>
              <p className="text-slate-400 text-xs">Chiến dịch tự động áp dụng khi tính tiền tại bàn</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition">
              <RefreshCw size={15} />
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-500/20"
            >
              <Plus size={15} /> Tạo chiến dịch
            </button>
          </div>
        </div>

        {/* ── Threshold Notice ─── */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
          <ShieldAlert size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-300">
            <strong>Ngưỡng tự động:</strong> Giảm <strong>≤ {MANAGER_THRESHOLD_PERCENT}%</strong> hoặc <strong>≤ {fmtCurrency(MANAGER_THRESHOLD_FIXED)}</strong> sẽ được kích hoạt ngay.
            Vượt ngưỡng → sẽ <strong>Chờ chủ nhà hàng duyệt</strong>.
          </div>
        </div>

        {/* ── Tabs ─────────────── */}
        <div className="flex gap-1 mb-4 bg-slate-800/40 p-1 rounded-xl w-fit">
          {[
            { key: 'all',   label: `Tất cả (${promotions.length})` },
            { key: 'mine',  label: `Của tôi (${myPromos.length})` },
            { key: 'owner', label: `Từ Owner (${ownerPromos.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === key ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Content ─────────── */}
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-emerald-400" /></div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Gift size={48} className="mb-3 opacity-30" />
            <p className="font-semibold">Chưa có chiến dịch nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayed.map(p => {
              const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.Inactive;
              const isOwner = p.isOwnerPromotion;
              return (
                <div key={p.discountID} className={`bg-slate-800/50 border rounded-2xl p-4 transition group ${
                  isOwner ? 'border-blue-500/20 hover:border-blue-500/40' : 'border-slate-700/40 hover:border-emerald-500/40'
                }`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {isOwner
                          ? <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold">Từ Owner</span>
                          : <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">Chi nhánh</span>
                        }
                      </div>
                      <h3 className="text-white font-bold mt-1.5 truncate">{p.name}</h3>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-2 ${
                      p.discountType === 'Percentage' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                    }`}>
                      {p.discountType === 'Percentage'
                        ? <BadgePercent size={18} className="text-emerald-400" />
                        : <DollarSign   size={18} className="text-amber-400" />
                      }
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-2xl font-black text-emerald-400 mb-3">
                    {p.discountType === 'Percentage' ? `${p.value}%` : fmtCurrency(p.value)}
                    {p.maxDiscountAmount && (
                      <span className="ml-2 text-xs font-semibold text-slate-400">tối đa {fmtCurrency(p.maxDiscountAmount)}</span>
                    )}
                  </div>

                  {/* Description */}
                  {p.description && (
                    <p className="text-sm text-slate-300 mb-3 line-clamp-2" title={p.description}>{p.description}</p>
                  )}

                  {/* Meta */}
                  <div className="space-y-1 text-xs text-slate-400 mb-4">
                    {p.minOrderValue > 0 && <p>🛒 Đơn tối thiểu: <span className="text-slate-200">{fmtCurrency(p.minOrderValue)}</span></p>}
                    {p.happyHourStart && (
                      <p>⏰ Happy Hour: <span className="text-amber-400">{p.happyHourStart} – {p.happyHourEnd}</span></p>
                    )}
                    {p.endDate && <p>📅 Đến: <span className="text-slate-200">{dayjs(p.endDate).format('DD/MM/YYYY')}</span></p>}
                    <p>🔢 Đã dùng: <span className="text-slate-200">{p.usedCount}{p.usageLimit ? `/${p.usageLimit}` : ''} lần</span></p>
                  </div>

                  {/* Actions — chỉ cho promotion do chính mình tạo */}
                  {!isOwner && (
                    <div className="flex items-center gap-2 border-t border-slate-700/40 pt-3">
                      <button
                        onClick={() => openEdit(p)}
                        disabled={p.status === 'PendingApproval'}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-bold transition disabled:opacity-40"
                      >
                        <Pencil size={13} /> Sửa
                      </button>
                      <button
                        onClick={() => setConfirmDelete(p)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                  {isOwner && (
                    <p className="text-xs text-slate-500 border-t border-slate-700/40 pt-3 text-center">Chiến dịch của chủ nhà hàng — chỉ đọc</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════ MODAL ════ */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-700/60 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-700/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                  <Gift size={16} className="text-emerald-400" />
                </div>
                <h2 className="font-bold text-white">{editPromo ? 'Sửa Chiến Dịch' : 'Tạo Chiến Dịch Mới'}</h2>
              </div>
              {/* Preview badge */}
              {!editPromo && previewStatus && (
                <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${STATUS_CONFIG[previewStatus]?.color}`}>
                  → Sẽ {previewStatus === 'Active' ? 'Active ngay' : 'Chờ duyệt'}
                </span>
              )}
            </div>

            <div className="p-6 space-y-4">
              <Field label="Tên chiến dịch *">
                <input
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                  placeholder="VD: Giảm 10% cuối tuần"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </Field>

              <Field label="Mô tả">
                <textarea
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 min-h-[80px]"
                  placeholder="Nhập mô tả chi tiết chương trình khuyến mãi..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Loại giảm *">
                  <select
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60"
                    value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                  >
                    <option value="Percentage">Phần trăm (%)</option>
                    <option value="FixedAmount">Số tiền cố định</option>
                  </select>
                </Field>
                <Field label={`Giá trị (${form.discountType === 'Percentage' ? '%' : 'VNĐ'}) *`}>
                  <input type="number" min="0"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                    value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Đơn tối thiểu (VNĐ)">
                  <input type="number" min="0"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                    placeholder="0"
                    value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))}
                  />
                </Field>
                <Field label="Giảm tối đa (VNĐ)">
                  <input type="number" min="0"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                    placeholder="Không giới hạn"
                    value={form.maxDiscountAmount} onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Từ ngày"><input type="date" className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></Field>
                <Field label="Đến ngày"><input type="date" className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Happy Hour bắt đầu"><input type="time" className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60" value={form.happyHourStart} onChange={e => setForm(f => ({ ...f, happyHourStart: e.target.value }))} /></Field>
                <Field label="Happy Hour kết thúc"><input type="time" className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60" value={form.happyHourEnd} onChange={e => setForm(f => ({ ...f, happyHourEnd: e.target.value }))} /></Field>
              </div>

              <Field label="Áp dụng theo thứ trong tuần (Bỏ chọn tất cả = Áp dụng mỗi ngày)">
                <div className="flex flex-wrap gap-2 mt-1">
                  {DAYS_OF_WEEK.map(d => {
                    const isChecked = form.applicableDays.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => {
                          const newDays = isChecked 
                            ? form.applicableDays.filter(v => v !== d.value)
                            : [...form.applicableDays, d.value];
                          setForm(f => ({ ...f, applicableDays: newDays }));
                        }}
                        className={`w-10 h-10 rounded-xl text-xs font-bold transition border flex items-center justify-center ${
                          isChecked 
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                            : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Giới hạn lượt dùng">
                  <input type="number" min="1"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                    placeholder="Không giới hạn"
                    value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                  />
                </Field>
                <Field label="Mức ưu tiên">
                  <input type="number" min="0"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60"
                    value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-700/40 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition">Huỷ</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editPromo ? 'Cập nhật' : 'Tạo chiến dịch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ CONFIRM DELETE ════ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-rose-900/40 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <AlertCircle size={20} className="text-rose-400" />
              </div>
              <h3 className="font-bold text-white">Xác nhận xoá</h3>
            </div>
            <p className="text-slate-300 text-sm mb-5">Bạn có chắc muốn xoá chiến dịch <strong className="text-white">"{confirmDelete.name}"</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition">Không</button>
              <button onClick={() => handleDelete(confirmDelete.discountID)} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition">Xoá</button>
            </div>
          </div>
        </div>
      )}
    </BranchManagerLayout>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
