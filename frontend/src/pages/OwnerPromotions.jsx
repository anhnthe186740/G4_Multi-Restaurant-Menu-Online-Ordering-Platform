import { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Pencil, CheckCircle2, XCircle, Loader2, Clock, AlertCircle, TrendingDown, BadgePercent, DollarSign, RefreshCw, Gift, ChevronDown, BarChart3, Zap, Calendar, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import {
  getOwnerPromotions, createOwnerPromotion, updateOwnerPromotion,
  deleteOwnerPromotion, approveOwnerPromotion, rejectOwnerPromotion,
  getOwnerPromotionReport, toggleOwnerPromotion
} from '../api/ownerApi';
import { getOwnerBranches } from '../api/ownerApi';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';

/* ── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n ?? 0);
const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const STATUS_CONFIG = {
  Active:          { label: 'Hoạt động',  color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  PendingApproval: { label: 'Chờ duyệt',  color: 'bg-amber-50 text-amber-600 border-amber-200' },
  Inactive:        { label: 'Vô hiệu',    color: 'bg-slate-100 text-slate-500 border-slate-200' },
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
   Thiết kế: Modern Light Mode (Đồng bộ Dashboard) - Brand Blue
════════════════════════════════════════════════════════════════════ */
export default function OwnerPromotions() {
  const [promotions, setPromotions]   = useState([]);
  const [report, setReport]           = useState([]);
  const [branches, setBranches]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('all'); // all | report
  const [showModal, setShowModal]     = useState(false);
  const [editPromo, setEditPromo]     = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [showHappyHour, setShowHappyHour] = useState(false);
  const [saving, setSaving]           = useState(false);
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
      const bList = branchRes.data?.branches || branchRes.data || [];
      setBranches(Array.isArray(bList) ? bList : []);
    } catch (e) {
      toast.error('Không thể tải dữ liệu: ' + (e?.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Derived ── */
  const pending   = promotions.filter(p => p.status === 'PendingApproval');
  const activeCount = promotions.filter(p => p.status === 'Active').length;
  
  const counts = {
    all: promotions.length,
    pending: pending.length,
    active: activeCount
  };

  const displayed = promotions;

  /* ── Modal helpers ── */
  const openCreate = () => { 
    setEditPromo(null); 
    setForm(EMPTY_FORM); 
    setShowHappyHour(false);
    setShowModal(true); 
  };
  const openEdit   = (p) => {
    setEditPromo(p);
    setForm({
      name: p.name, description: p.description ?? '', discountType: p.discountType, value: p.value,
      minOrderValue: p.minOrderValue, maxDiscountAmount: p.maxDiscountAmount ?? '',
      startDate: p.startDate ? dayjs(p.startDate).format('YYYY-MM-DD') : '',
      endDate:   p.endDate   ? dayjs(p.endDate).format('YYYY-MM-DD')   : '',
      happyHourStart: p.happyHourStart ?? '', happyHourEnd: p.happyHourEnd ?? '',
      usageLimit: p.usageLimit ?? '', 
      branchIDs: p.applicableBranchIDs ? p.applicableBranchIDs.split(',').map(Number) : [],
      applicableDays: p.applicableDays ? p.applicableDays.split(',').map(Number) : [],
    });
    setShowHappyHour(!!(p.happyHourStart || p.happyHourEnd));
    setShowModal(true);
  };

  const checkLogicConflict = () => {
    if (!form.startDate || !form.endDate || !form.applicableDays || form.applicableDays.length === 0) return false;
    const start = dayjs(form.startDate);
    const end = dayjs(form.endDate);
    const diffDays = end.diff(start, 'day');
    if (diffDays >= 6) return false;
    const daysInRange = [];
    for (let i = 0; i <= diffDays; i++) { daysInRange.push(start.add(i, 'day').day()); }
    return !form.applicableDays.some(d => daysInRange.includes(d));
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
        happyHourStart: showHappyHour ? (form.happyHourStart || null) : null,
        happyHourEnd: showHappyHour ? (form.happyHourEnd || null) : null,
        applicableDays: form.applicableDays.length > 0 ? form.applicableDays.join(',') : null,
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
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await toggleOwnerPromotion(id);
      toast.success(res.data.message);
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Lỗi bật/tắt chiến dịch.');
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên chiến dịch.');
    if (!form.value || parseFloat(form.value) <= 0) return toast.error('Giá trị giảm phải lớn hơn 0.');
    if (form.discountType === 'Percentage' && parseFloat(form.value) > 100) return toast.error('Mức giảm không được > 100%.');
    if (form.startDate && form.endDate && dayjs(form.startDate).isAfter(dayjs(form.endDate))) return toast.error('Ngày bắt đầu không thể sau ngày kết thúc.');
    
    if (checkLogicConflict()) setShowLogicWarning(true);
    else executeSave();
  };

  const handleApprove = async (id) => {
    try {
      await approveOwnerPromotion(id);
      toast.success('Đã duyệt chiến dịch!');
      fetchAll();
    } catch (e) { toast.error('Lỗi duyệt.'); }
  };

  const handleReject = async (id) => {
    try {
      await rejectOwnerPromotion(id);
      toast.success('Đã bác bỏ yêu cầu.');
      fetchAll();
    } catch (e) { toast.error('Lỗi bác bỏ.'); }
  };

  /* ── Total report stats ── */
  const totalGiven = report.reduce((s, r) => s + r.totalDiscountGiven, 0);
  const totalUsed  = report.reduce((s, r) => s + r.usedCount, 0);

  return (
    <RestaurantOwnerLayout>
      <div className="min-h-screen bg-white text-slate-900 p-4 md:p-8 font-sans selection:bg-blue-500/30 overflow-x-hidden">
        
        {/* ── Background Glow ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-600/5 blur-[100px] rounded-full animate-pulse opacity-50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
          
          {/* ── Header Section ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-2">
                <Gift size={12} /> Chiến dịch marketing
              </div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">Khuyến Mãi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">Tự Động</span></h1>
              <p className="text-slate-500 text-sm max-w-lg font-medium">Thiết lập các quy tắc giảm giá thông minh, tự động áp dụng khi thanh toán để tối đa hóa doanh thu của bạn.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={fetchAll} className="group p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-500/50 text-slate-400 hover:text-blue-600 transition-all duration-300 shadow-sm">
                <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-blue-200 active:scale-95"
              >
                <Plus size={18} strokeWidth={3} /> Tạo chiến dịch mới
              </button>
            </div>
          </div>

          {/* ── Stats Dashboard ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Đang triển khai', value: activeCount, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', badge: true },
              { label: 'Ngân sách đã giảm', value: fmtCurrency(totalGiven), icon: TrendingDown, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
              { label: 'Lượt sử dụng', value: fmt(totalUsed), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' }
            ].map(({ label, value, icon: Icon, color, bg, border, badge }) => (
              <div key={label} className="group relative bg-white border border-slate-200 rounded-3xl p-6 transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50">
                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                    <h3 className={`text-3xl font-black ${color} tracking-tight`}>{value}</h3>
                  </div>
                  <div className={`p-4 rounded-2xl ${bg} border ${border} ${color}`}>
                    <Icon size={24} />
                  </div>
                </div>
                {badge && (
                  <div className="mt-4 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-600 text-[10px] font-bold uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { key: 'all', label: 'Tất cả chiến dịch', count: counts.all, icon: Gift },
                { key: 'report', label: 'Bảng báo cáo chi tiết', icon: BarChart3 },
              ].map(({ key, label, count, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-t-2xl border-t-2 ${
                    activeTab === key ? 'text-blue-600 bg-white border-blue-600' : 'text-slate-400 hover:text-slate-600 border-transparent'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                  {count !== undefined && <span className="text-[10px] opacity-60 ml-1">({count})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* ── Main content ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 size={40} className="animate-spin text-blue-600" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Đang tải dữ liệu...</p>
            </div>
          ) : activeTab === 'report' ? (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-500">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead className="bg-slate-50 border-b border-slate-200">
                     <tr>
                       {['Tên chiến dịch','Loại','Giá trị','Phạm vi','Sử dụng','Đã giảm','Trạng thái'].map(h => (
                         <th key={h} className="text-left text-[10px] text-slate-400 font-black uppercase tracking-widest px-6 py-5">{h}</th>
                       ))}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {report.map(r => (
                       <tr key={r.discountID} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-6 py-4 font-bold text-slate-800">{r.name}</td>
                         <td className="px-6 py-4 text-xs text-slate-500">{r.discountType}</td>
                         <td className="px-6 py-4 font-black text-blue-600">{r.discountType === 'Percentage' ? `${r.value}%` : fmtCurrency(r.value)}</td>
                         <td className="px-6 py-4 text-xs text-slate-500 italic">{r.branchName}</td>
                         <td className="px-6 py-4 font-black text-slate-600">{fmt(r.usedCount)}</td>
                         <td className="px-6 py-4 font-black text-rose-600">{fmtCurrency(r.totalDiscountGiven)}</td>
                         <td className="px-6 py-4">
                           <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${STATUS_CONFIG[r.status]?.color}`}>
                             {STATUS_CONFIG[r.status]?.label}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          ) : (
            displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-white border border-slate-200 rounded-3xl">
                <Gift size={48} className="text-slate-200 mb-4" />
                <p className="font-black text-lg uppercase tracking-widest">Không tìm thấy chiến dịch</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {displayed.map((p, idx) => (
                  <div key={p.discountID} className="group relative bg-white border border-slate-200 rounded-[32px] p-6 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 flex flex-col">
                    <div className="absolute top-0 left-10 right-10 h-1 rounded-b-full bg-gradient-to-r from-blue-600 to-blue-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-start justify-between mb-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${STATUS_CONFIG[getPromoStatus(p)]?.color}`}>
                            {STATUS_CONFIG[getPromoStatus(p)]?.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black uppercase">
                            {p.applicableBranchIDs ? `${p.applicableBranchIDs.split(',').length} Chi nhánh` : 'Toàn chuỗi'}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{p.name}</h3>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${p.discountType === 'Percentage' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                        {p.discountType === 'Percentage' ? <BadgePercent size={24} /> : <DollarSign size={24} />}
                      </div>
                    </div>

                    <div className="mb-6 p-5 rounded-[24px] bg-slate-50 border border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black ${p.discountType === 'Percentage' ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {p.discountType === 'Percentage' ? p.value : fmtCurrency(p.value).split(' ')[0]}
                        </span>
                        <span className="text-sm font-bold opacity-50 uppercase tracking-widest">{p.discountType === 'Percentage' ? '%' : 'VNĐ'}</span>
                      </div>
                      {p.maxDiscountAmount > 0 && <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">GIẢM TỐI ĐA: {fmtCurrency(p.maxDiscountAmount)}</p>}
                    </div>

                    <p className="text-sm text-slate-500 mb-8 line-clamp-2 italic leading-relaxed font-medium">"{p.description || 'Không có mô tả cho chiến dịch này.'}"</p>

                    <div className="grid grid-cols-2 gap-3 text-[10px] mb-4 mt-auto">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-slate-400 font-bold uppercase tracking-widest mb-1 opacity-80">Đơn tối thiểu</p>
                        <p className="text-slate-700 font-black">{p.minOrderValue > 0 ? fmtCurrency(p.minOrderValue) : 'Không có'}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-slate-400 font-bold uppercase tracking-widest mb-1 opacity-80">Lượt dùng</p>
                        <p className={`font-black ${p.usageLimit && p.usedCount >= p.usageLimit ? 'text-rose-600' : 'text-slate-700'}`}>
                          {p.usedCount}{p.usageLimit ? `/${p.usageLimit}` : ''}
                        </p>
                      </div>
                      <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-600">
                          <Clock size={12} />
                          <p className="font-bold uppercase tracking-widest">Khung giờ vàng</p>
                        </div>
                        <p className="text-slate-700 font-black">
                          {p.happyHourStart ? `${p.happyHourStart} - ${p.happyHourEnd}` : 'Cả ngày'}
                        </p>
                      </div>
                      <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Calendar size={12} />
                          <p className="font-bold uppercase tracking-widest">Hết hạn</p>
                        </div>
                        <p className="text-slate-700 font-black">{p.endDate ? dayjs(p.endDate).format('DD.MM.YYYY') : 'Vô thời hạn'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-slate-100 pt-6 mt-auto">
                      {p.status === 'PendingApproval' && (
                        <>
                          <button onClick={() => handleApprove(p.discountID)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-emerald-100">
                            <CheckCircle2 size={14} /> Duyệt
                          </button>
                          <button onClick={() => handleReject(p.discountID)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-wider transition-all border border-rose-200 active:scale-95">
                            <XCircle size={14} /> Bác bỏ
                          </button>
                        </>
                      )}
                      {p.status !== 'PendingApproval' && (
                        <button 
                          onClick={() => handleToggle(p.discountID)} 
                          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl transition-all active:scale-95 border ${p.status === 'Active' ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'}`}
                          title={p.status === 'Active' ? 'Tắt tạm thời' : 'Bật lại'}
                        >
                          <Zap size={16} fill={p.status === 'Active' ? 'currentColor' : 'none'} />
                        </button>
                      )}
                      <button onClick={() => openEdit(p)} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all active:scale-95 border border-slate-200">
                        <Pencil size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* ════ MODAL FORM ════ */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm"><Gift size={28} className="text-blue-600" /></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{editPromo ? 'Sửa Chiến Dịch' : 'Tạo Chiến Dịch Mới'}</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Thiết lập tham số khuyến mãi</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"><Plus size={32} className="rotate-45" /></button>
            </div>

            <div className="p-10 space-y-8 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                <Field label="Tên chiến dịch *">
                  <input className="w-full col-span-2 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-bold placeholder:font-normal" placeholder="VD: Khuyến mãi cuối tuần" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </Field>
                <div className="col-span-2"><Field label="Mô tả">
                  <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 focus:outline-none focus:border-blue-500 min-h-[100px] resize-none" placeholder="Nhập nội dung chiến dịch..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </Field></div>
                <Field label="Loại giảm giá">
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer font-bold" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                    <option value="Percentage">Theo Phần Trăm (%)</option>
                    <option value="FixedAmount">Số Tiền Cố Định (VNĐ)</option>
                  </select>
                </Field>
                <Field label={`Giá trị (${TYPE_LABEL[form.discountType]})`}>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-black" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
                </Field>
                <Field label="Đơn tối thiểu (VNĐ)"><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 focus:outline-none focus:border-blue-500" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))} /></Field>
                <Field label="Giảm tối đa (VNĐ)"><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 focus:outline-none focus:border-blue-500" value={form.maxDiscountAmount} onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))} /></Field>
                <Field label="Ngày bắt đầu"><input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 focus:outline-none" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></Field>
                <Field label="Ngày kết thúc"><input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 focus:outline-none" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></Field>

                {/* ── HAPPY HOUR SECTION ── */}
                <div className="col-span-2 px-6 py-5 bg-amber-50/50 border border-amber-100 rounded-[32px] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200">
                        <Clock size={20} className="text-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-amber-900 leading-tight">Khung giờ vàng (Happy Hour)</h4>
                        <p className="text-[9px] text-amber-600 font-bold uppercase tracking-wider">Chỉ áp dụng giảm giá trong khung giờ này</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={showHappyHour} onChange={() => setShowHappyHour(!showHappyHour)} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {showHappyHour && (
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-amber-700 uppercase tracking-widest ml-1">Giờ bắt đầu</label>
                        <input type="time" className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-amber-500 font-bold" value={form.happyHourStart} onChange={e => setForm(f => ({ ...f, happyHourStart: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-amber-700 uppercase tracking-widest ml-1">Giờ kết thúc</label>
                        <input type="time" className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-amber-500 font-bold" value={form.happyHourEnd} onChange={e => setForm(f => ({ ...f, happyHourEnd: e.target.value }))} />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="col-span-2">
                  <Field label="Thứ áp dụng">
                    <div className="flex flex-wrap gap-2 mt-2">
                      {DAYS_OF_WEEK.map(d => (
                        <button key={d.value} type="button" onClick={() => {
                          const newDays = form.applicableDays.includes(d.value) ? form.applicableDays.filter(v => v !== d.value) : [...form.applicableDays, d.value];
                          setForm(f => ({ ...f, applicableDays: newDays }));
                        }} className={`w-12 h-12 rounded-xl text-[10px] font-black transition-all border ${form.applicableDays.includes(d.value) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'}`}>{d.label}</button>
                      ))}
                    </div>
                  </Field>
                </div>
                
                <div className="col-span-2">
                  <Field label="Chi nhánh áp dụng">
                    <div className="flex flex-wrap gap-2 mt-2">
                      {branches.map(b => (
                        <button key={b.branchID} type="button" onClick={() => {
                          const newIds = form.branchIDs.includes(b.branchID) ? form.branchIDs.filter(v => v !== b.branchID) : [...form.branchIDs, b.branchID];
                          setForm(f => ({ ...f, branchIDs: newIds }));
                        }} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${form.branchIDs.includes(b.branchID) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'}`}>{b.name}</button>
                      ))}
                    </div>
                  </Field>
                </div>

                <div className="col-span-2">
                  <Field label="Giới hạn số lượt sử dụng (Bỏ trống = Không giới hạn)">
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-black placeholder:font-normal"
                        placeholder="VD: 100 (chỉ 100 hóa đơn đầu tiên được giảm)"
                        value={form.usageLimit}
                        onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                      />
                      {form.usageLimit && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold">
                          🎯 Áp dụng cho {form.usageLimit} hóa đơn đầu tiên
                        </div>
                      )}
                    </div>
                  </Field>
                </div>
              </div>
            </div>

            <div className="px-10 py-8 border-t border-slate-100 flex gap-4 justify-end bg-slate-50/50">
              <button onClick={() => setShowModal(false)} className="px-8 py-3 rounded-2xl text-slate-400 hover:text-slate-600 font-black uppercase tracking-widest text-xs">Huỷ</button>
              <button onClick={handleSave} disabled={saving} className="px-10 py-3 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 active:scale-95 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editPromo ? 'Cập nhật' : 'Triển khai'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ LOGIC WARNING ════ */}
      {showLogicWarning && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-[40px] p-10 max-w-md w-full shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
             <div className="flex items-center gap-5 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm"><AlertCircle size={28} className="text-amber-600" /></div>
                <div><h3 className="text-xl font-black text-slate-800">Cảnh báo Logic</h3><p className="text-[9px] text-amber-500 font-black uppercase tracking-widest opacity-70">Khung giờ không khớp</p></div>
             </div>
             <p className="text-slate-500 text-sm mb-10 leading-relaxed">Khoảng <span className="text-slate-800 font-bold">Ngày bắt đầu - kết thúc</span> không chứa bất kỳ <span className="text-amber-600 font-bold">Thứ</span> nào bạn đã chọn.</p>
             <div className="flex flex-col gap-3">
                <button onClick={executeSave} disabled={saving} className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest text-xs shadow-xl active:scale-95">Xác nhận lưu</button>
                <button onClick={() => setShowLogicWarning(false)} className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase tracking-widest text-xs transition-all">Quay lại sửa</button>
             </div>
          </div>
        </div>
      )}
    </RestaurantOwnerLayout>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
      {children}
    </div>
  );
}
