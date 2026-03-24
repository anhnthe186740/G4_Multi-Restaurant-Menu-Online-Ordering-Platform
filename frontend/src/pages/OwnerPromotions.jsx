import { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Pencil, Trash2, CheckCircle2, XCircle, Loader2, Clock, AlertCircle, TrendingDown, BadgePercent, DollarSign, RefreshCw, Gift, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import {
  getOwnerPromotions, createOwnerPromotion, updateOwnerPromotion,
  deleteOwnerPromotion, approveOwnerPromotion, rejectOwnerPromotion,
  getOwnerPromotionReport
} from '../api/ownerApi';
import { getOwnerBranches } from '../api/ownerApi';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';

/* ── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n ?? 0);
const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const STATUS_CONFIG = {
  Active:          { label: 'Đang hoạt động', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  PendingApproval: { label: 'Chờ duyệt',      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  Inactive:        { label: 'Vô hiệu',         color: 'bg-slate-600/40 text-slate-400 border-slate-600/40' },
};

const TYPE_LABEL = { Percentage: '%', FixedAmount: 'VNĐ' };

const getPromoStatus = (p) => {
  if (p.status !== 'Active') return p.status;
  const now = dayjs();
  if (p.endDate && dayjs(p.endDate).isBefore(now)) return 'Inactive';
  return 'Active';
};

/* ── Empty Form ─────────────────────────────────────────────────────── */
const DAYS_OF_WEEK = [
  { value: 1, label: 'T2' }, { value: 2, label: 'T3' }, { value: 3, label: 'T4' },
  { value: 4, label: 'T5' }, { value: 5, label: 'T6' }, { value: 6, label: 'T7' }, { value: 0, label: 'CN' }
];

const EMPTY_FORM = {
  name: '', description: '', discountType: 'Percentage', value: '', minOrderValue: '',
  maxDiscountAmount: '', startDate: '', endDate: '',
  happyHourStart: '', happyHourEnd: '', usageLimit: '', branchIDs: [], applicableDays: []
};

/* ════════════════════════════════════════════════════════════════════
   OwnerPromotions — Trang quản lý Auto-Promotions cho Restaurant Owner
════════════════════════════════════════════════════════════════════ */
export default function OwnerPromotions() {
  const [promotions, setPromotions]   = useState([]);
  const [report, setReport]           = useState([]);
  const [branches, setBranches]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('all'); // all | pending | report
  const [showModal, setShowModal]     = useState(false);
  const [editPromo, setEditPromo]     = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showLogicWarning, setShowLogicWarning] = useState(false);

  /* ── Fetch ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [promoRes, reportRes, branchRes] = await Promise.all([
        getOwnerPromotions(), getOwnerPromotionReport(), getOwnerBranches()
      ]);
      setPromotions(promoRes.data);
      setReport(reportRes.data);
      setBranches(branchRes.data?.branches ?? []);
    } catch (e) {
      toast.error('Không thể tải dữ liệu: ' + (e?.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Derived ── */
  const pending   = promotions.filter(p => p.status === 'PendingApproval');
  const displayed = activeTab === 'pending'
    ? pending
    : promotions.filter(p => activeTab === 'all' || p.status === activeTab);

  /* ── Modal helpers ── */
  const openCreate = () => { setEditPromo(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit   = (p) => {
    setEditPromo(p);
    setForm({
      name: p.name, description: p.description ?? '', discountType: p.discountType, value: p.value,
      minOrderValue: p.minOrderValue, maxDiscountAmount: p.maxDiscountAmount ?? '',
      startDate: p.startDate ? dayjs(p.startDate).format('YYYY-MM-DD') : '',
      endDate:   p.endDate   ? dayjs(p.endDate).format('YYYY-MM-DD')   : '',
      happyHourStart: p.happyHourStart ?? '', happyHourEnd: p.happyHourEnd ?? '',
      usageLimit: p.usageLimit ?? '', branchIDs: p.applicableBranchIDs ? p.applicableBranchIDs.split(',').map(Number) : [],
      applicableDays: p.applicableDays ? p.applicableDays.split(',').map(Number) : [],
    });
    setShowModal(true);
  };

  const checkLogicConflict = () => {
    if (!form.startDate || !form.endDate || !form.applicableDays || form.applicableDays.length === 0) return false;
    
    const start = dayjs(form.startDate);
    const end = dayjs(form.endDate);
    const diffDays = end.diff(start, 'day');
    
    // Nếu khoảng cách >= 6 ngày thì chắc chắn bao phủ hết các thứ trong tuần
    if (diffDays >= 6) return false;
    
    // Kiểm tra từng ngày trong khoảng
    const daysInRange = [];
    for (let i = 0; i <= diffDays; i++) {
      daysInRange.push(start.add(i, 'day').day());
    }
    
    // Nếu không có bất kỳ ngày nào trong dải khớp với applicableDays -> Xung đột
    const hasOverlap = form.applicableDays.some(d => daysInRange.includes(d));
    return !hasOverlap;
  };

  const executeSave = async () => {
    setShowLogicWarning(false);
    setSaving(true);
    try {
      const payload = {
        ...form,
        description: form.description ? form.description.trim() : null,
        value: parseFloat(form.value),
        minOrderValue: parseFloat(form.minOrderValue) || 0,
        maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        branchIDs: form.branchIDs,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        happyHourStart: form.happyHourStart || null,
        happyHourEnd: form.happyHourEnd || null,
        applicableDays: form.applicableDays && form.applicableDays.length > 0 ? form.applicableDays.join(',') : null,
      };
      if (editPromo) {
        await updateOwnerPromotion(editPromo.discountID, payload);
        toast.success('Đã cập nhật chiến dịch!');
      } else {
        await createOwnerPromotion(payload);
        toast.success('Đã tạo chiến dịch!');
      }
      setShowModal(false);
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Lỗi lưu dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên chiến dịch.');
    if (!form.value || parseFloat(form.value) <= 0) return toast.error('Giá trị giảm phải lớn hơn 0.');
    if (form.discountType === 'Percentage' && parseFloat(form.value) > 100) return toast.error('Mức giảm phần trăm không được vượt quá 100%.');
    if (form.minOrderValue && parseFloat(form.minOrderValue) < 0) return toast.error('Đơn tối thiểu không hợp lệ.');
    if (form.maxDiscountAmount && parseFloat(form.maxDiscountAmount) <= 0) return toast.error('Mức giảm tối đa phải hợp lệ.');
    if (form.usageLimit && parseInt(form.usageLimit) <= 0) return toast.error('Giới hạn lượt dùng phải từ 1 trở lên.');
    if (form.startDate && form.endDate && dayjs(form.startDate).isAfter(dayjs(form.endDate))) {
      return toast.error('Ngày bắt đầu không được sau ngày kết thúc.');
    }
    if (form.happyHourStart && form.happyHourEnd && form.happyHourStart >= form.happyHourEnd) {
      return toast.error('Giờ bắt đầu Happy Hour phải nhỏ hơn Giờ kết thúc.');
    }

    if (checkLogicConflict()) {
      setShowLogicWarning(true);
    } else {
      executeSave();
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteOwnerPromotion(id);
      toast.success('Đã xoá chiến dịch.');
      setConfirmDelete(null);
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Lỗi xoá.');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveOwnerPromotion(id);
      toast.success('Đã duyệt chiến dịch!');
      fetchAll();
    } catch (e) { toast.error(e?.response?.data?.message || 'Lỗi duyệt.'); }
  };

  const handleReject = async (id) => {
    try {
      await rejectOwnerPromotion(id);
      toast.success('Đã từ chối chiến dịch.');
      fetchAll();
    } catch (e) { toast.error(e?.response?.data?.message || 'Lỗi từ chối.'); }
  };

  /* ── Total report stats ── */
  const totalGiven  = report.reduce((s, r) => s + r.totalDiscountGiven, 0);
  const totalUsed   = report.reduce((s, r) => s + r.usedCount, 0);
  const activeCount = promotions.filter(p => p.status === 'Active').length;

  return (
    <RestaurantOwnerLayout>
      <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
        {/* ── Header ─────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Gift size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Khuyến Mãi Tự Động</h1>
              <p className="text-slate-400 text-xs">Quản lý Auto-Promotions — áp dụng tự động khi tính tiền</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchAll} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition">
              <RefreshCw size={15} />
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold transition shadow-lg shadow-violet-500/20"
            >
              <Plus size={15} /> Tạo chiến dịch
            </button>
          </div>
        </div>

        {/* ── Stat Cards ─────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Đang hoạt động', value: activeCount, icon: CheckCircle2, color: 'emerald' },
            { label: 'Chờ duyệt',      value: pending.length, icon: Clock, color: 'amber',    badge: pending.length > 0 },
            { label: 'Tổng tiền đã giảm', value: fmtCurrency(totalGiven), icon: TrendingDown, color: 'violet' },
          ].map(({ label, value, icon: Icon, color, badge }) => (
            <div key={label} className={`relative bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs mb-1">{label}</p>
                  <p className={`text-xl font-black text-${color}-400`}>{value}</p>
                </div>
                <div className={`w-9 h-9 rounded-xl bg-${color}-500/10 flex items-center justify-center`}>
                  <Icon size={18} className={`text-${color}-400`} />
                </div>
              </div>
              {badge && (
                <span className="absolute top-3 right-12 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
          ))}
        </div>

        {/* ── Tabs ───────────────── */}
        <div className="flex gap-1 mb-4 bg-slate-800/40 p-1 rounded-xl w-fit">
          {[
            { key: 'all',     label: `Tất cả (${promotions.length})` },
            { key: 'pending', label: `Chờ duyệt (${pending.length})`, highlight: pending.length > 0 },
            { key: 'report',  label: 'Báo cáo' },
          ].map(({ key, label, highlight }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === key
                  ? 'bg-violet-600 text-white shadow'
                  : `text-slate-400 hover:text-white ${highlight ? 'text-amber-400' : ''}`
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Loading ─────────────── */}
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-violet-400" /></div>
        ) : activeTab === 'report' ? (
          /* ── Report Tab ── */
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/30">
                <tr>
                  {['Tên chiến dịch','Loại','Giá trị','Phạm vi','Lượt dùng','Tổng đã giảm','Trạng thái'].map(h => (
                    <th key={h} className="text-left text-xs text-slate-400 font-semibold px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {report.map(r => (
                  <tr key={r.discountID} className="hover:bg-slate-700/20">
                    <td className="px-4 py-3 font-semibold text-white">{r.name}</td>
                    <td className="px-4 py-3 text-slate-300">{r.discountType === 'Percentage' ? '%' : 'Cố định'}</td>
                    <td className="px-4 py-3 font-bold text-violet-400">{r.discountType === 'Percentage' ? `${r.value}%` : fmtCurrency(r.value)}</td>
                    <td className="px-4 py-3 text-slate-300">{r.branchName}</td>
                    <td className="px-4 py-3 font-bold">{fmt(r.usedCount)}</td>
                    <td className="px-4 py-3 font-bold text-rose-400">{fmtCurrency(r.totalDiscountGiven)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${STATUS_CONFIG[r.status]?.color}`}>
                        {STATUS_CONFIG[r.status]?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Promotion Cards ── */
          displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <Gift size={48} className="mb-3 opacity-30" />
              <p className="font-semibold">Chưa có chiến dịch nào</p>
              {activeTab === 'pending' && <p className="text-xs mt-1">Không có chiến dịch chờ duyệt</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayed.map(p => {
                const st = getPromoStatus(p);
                const cfg = STATUS_CONFIG[st] ?? STATUS_CONFIG.Inactive;
                const isExpired = st !== p.status;
                return (
                  <div key={p.discountID} className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4 hover:border-violet-500/40 transition group">
                    {/* Card header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          {!p.applicableBranchIDs && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold">Toàn chuỗi</span>
                          )}
                          {p.applicableBranchIDs && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-600/40 border border-slate-600/60 text-slate-300 text-[10px] font-bold">
                              {p.applicableBranchIDs.split(',').length} chi nhánh
                            </span>
                          )}
                        </div>
                        <h3 className="text-white font-bold mt-1.5 truncate">{p.name}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 ml-2">
                        {p.discountType === 'Percentage'
                          ? <BadgePercent size={18} className="text-violet-400" />
                          : <DollarSign   size={18} className="text-emerald-400" />
                        }
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-2xl font-black text-violet-400 mb-3">
                      {p.discountType === 'Percentage'
                        ? `${p.value}%`
                        : fmtCurrency(p.value)
                      }
                      {p.maxDiscountAmount && (
                        <span className="ml-2 text-xs font-semibold text-slate-400">(tối đa {fmtCurrency(p.maxDiscountAmount)})</span>
                      )}
                    </div>

                    {/* Description */}
                    {p.description && (
                      <p className="text-sm text-slate-300 mb-3 line-clamp-2" title={p.description}>{p.description}</p>
                    )}

                    {/* Meta info */}
                    <div className="space-y-1 text-xs text-slate-400 mb-4">
                      {p.minOrderValue > 0 && <p>🛒 Đơn tối thiểu: <span className="text-slate-200">{fmtCurrency(p.minOrderValue)}</span></p>}
                      {p.happyHourStart && (
                        <p>⏰ Happy Hour: <span className="text-amber-400">{p.happyHourStart} – {p.happyHourEnd}</span></p>
                      )}
                      {(p.startDate || p.endDate) && (
                        <p>📅 {p.startDate ? dayjs(p.startDate).format('DD/MM/YY') : '—'} → {p.endDate ? dayjs(p.endDate).format('DD/MM/YY') : 'Không giới hạn'}</p>
                      )}
                      {p.usageLimit && (
                        <p>🔢 Lượt dùng: <span className={p.usedCount >= p.usageLimit ? 'text-rose-400' : 'text-slate-200'}>{p.usedCount}/{p.usageLimit}</span></p>
                      )}
                      {!p.usageLimit && <p>🔢 Đã dùng: <span className="text-slate-200">{p.usedCount} lần</span></p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 border-t border-slate-700/40 pt-3">
                      {p.status === 'PendingApproval' && (
                        <>
                          <button
                            onClick={() => handleApprove(p.discountID)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition border border-emerald-500/20"
                          >
                            <CheckCircle2 size={13} /> Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(p.discountID)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition border border-rose-500/20"
                          >
                            <XCircle size={13} /> Từ chối
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openEdit(p)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
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
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ════ MODAL TẠO / SỬA ════ */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-700/60 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-700/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <Gift size={16} className="text-violet-400" />
              </div>
              <h2 className="font-bold text-white">{editPromo ? 'Sửa Chiến Dịch' : 'Tạo Chiến Dịch Mới'}</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Tên */}
              <Field label="Tên chiến dịch *">
                <input
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60"
                  placeholder="VD: Khuyến mãi Happy Hour buổi trưa"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </Field>

              {/* Mô tả */}
              <Field label="Mô tả">
                <textarea
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60 min-h-[80px]"
                  placeholder="Nhập mô tả chi tiết chương trình khuyến mãi..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </Field>

              {/* Loại + Giá trị */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Loại giảm giá *">
                  <select
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60"
                    value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                  >
                    <option value="Percentage">Phần trăm (%)</option>
                    <option value="FixedAmount">Số tiền cố định</option>
                  </select>
                </Field>
                <Field label={`Giá trị (${TYPE_LABEL[form.discountType]}) *`}>
                  <input type="number" min="0"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60"
                    placeholder={form.discountType === 'Percentage' ? '10' : '50000'}
                    value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  />
                </Field>
              </div>

              {/* Min Order + Max Discount */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Đơn tối thiểu (VNĐ)">
                  <input type="number" min="0"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60"
                    placeholder="100000"
                    value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))}
                  />
                </Field>
                <Field label="Giảm tối đa (VNĐ)">
                  <input type="number" min="0"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60"
                    placeholder="Không giới hạn"
                    value={form.maxDiscountAmount} onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))}
                  />
                </Field>
              </div>

              {/* Ngày áp dụng */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Từ ngày">
                  <input type="date"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60"
                    value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  />
                </Field>
                <Field label="Đến ngày">
                  <input type="date"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60"
                    value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  />
                </Field>
              </div>

              {/* Happy Hour */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Happy Hour (bắt đầu)">
                  <input type="time"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60"
                    value={form.happyHourStart} onChange={e => setForm(f => ({ ...f, happyHourStart: e.target.value }))}
                  />
                </Field>
                <Field label="Happy Hour (kết thúc)">
                  <input type="time"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60"
                    value={form.happyHourEnd} onChange={e => setForm(f => ({ ...f, happyHourEnd: e.target.value }))}
                  />
                </Field>
              </div>

              {/* Ngày áp dụng trong tuần */}
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
                            ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/30' 
                            : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </Field>

              {/* Applicable Branches */}
              <Field label="Chi nhánh áp dụng (Bỏ chọn tất cả = Toàn chuỗi)">
                <div className="flex flex-wrap gap-2 mt-1">
                  {branches.map(b => {
                    const isChecked = form.branchIDs.includes(b.branchID);
                    return (
                      <button
                        key={b.branchID}
                        type="button"
                        onClick={() => {
                          const newIds = isChecked
                            ? form.branchIDs.filter(v => v !== b.branchID)
                            : [...form.branchIDs, b.branchID];
                          setForm(f => ({ ...f, branchIDs: newIds }));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center justify-center ${
                          isChecked
                            ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/30'
                            : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {b.name}
                      </button>
                    )
                  })}
                </div>
              </Field>

              {/* Usage Limit */}
              <div className="grid grid-cols-1 gap-3">
                <Field label="Giới hạn lượt dùng (Bỏ trống = Không giới hạn)">
                  <input type="number" min="1"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60"
                    placeholder="Không giới hạn"
                    value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-700/40 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editPromo ? 'Cập nhật' : 'Tạo chiến dịch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ LOGIC WARNING ════ */}
      {showLogicWarning && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-amber-900/40 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertCircle size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Cảnh báo Logic</h3>
                <p className="text-slate-400 text-xs">Phát hiện xung đột lịch</p>
              </div>
            </div>
            
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Các "Thứ" bạn chọn không nằm trong khoảng "Ngày bắt đầu - kết thúc" của chiến dịch. Khuyến mãi này có khả năng sẽ không bao giờ được kích hoạt. Bạn có chắc chắn muốn lưu cấu hình này?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogicWarning(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition"
              >
                Huỷ để sửa lại
              </button>
              <button
                onClick={executeSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition flex items-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Vẫn tiếp tục lưu
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
              <div>
                <h3 className="font-bold text-white">Xác nhận xoá</h3>
                <p className="text-slate-400 text-xs">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-5">
              Bạn có chắc muốn xoá chiến dịch <strong className="text-white">"{confirmDelete.name}"</strong>?
              {confirmDelete.usedCount > 0 && (
                <span className="block mt-1 text-amber-400 text-xs">⚠️ Chiến dịch đã được dùng {confirmDelete.usedCount} lần. Nó sẽ bị vô hiệu thay vì xoá.</span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Không
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.discountID)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition"
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </RestaurantOwnerLayout>
  );
}

/* ── Field wrapper ─────────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
