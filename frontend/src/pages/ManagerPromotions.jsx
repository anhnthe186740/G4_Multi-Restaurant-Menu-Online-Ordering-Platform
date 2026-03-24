import { useState, useEffect, useCallback } from 'react';
import { Gift, Loader2, BadgePercent, DollarSign, RefreshCw, Zap, Clock, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import { getManagerPromotions } from '../api/managerApi';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';

/* ── Helpers ─────────────────────────────────────────────────────────── */
const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const STATUS_CONFIG = {
  Active: { label: 'Hoạt động', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  PendingApproval: { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  Inactive: { label: 'Vô hiệu', color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const getPromoStatus = (p) => {
  if (p.status !== 'Active') return p.status;
  const now = dayjs();
  if (p.endDate && dayjs(p.endDate).isBefore(now)) return 'Inactive';
  return 'Active';
};

/* ════════════════════════════════════════════════════════════════════
   ManagerPromotions — Trang xem Auto-Promotions cho Branch Manager
   Thiết kế: Modern Light Mode (Đồng bộ Brand Blue)
   Chế độ: Read-only (Chỉ xem cấu hình từ Owner)
════════════════════════════════════════════════════════════════════ */
export default function ManagerPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <BranchManagerLayout>
      <div className="min-h-screen bg-white text-slate-900 p-4 md:p-8 font-sans selection:bg-blue-500/30 overflow-x-hidden">

        {/* ── Background Glow ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse opacity-50" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-600/5 blur-[100px] rounded-full animate-pulse opacity-30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-8">

          {/* ── Header Section ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-2">
                <Gift size={12} /> Cấu hình từ tổng cục
              </div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">Khuyến Mãi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">Chi Nhánh</span></h1>
              <p className="text-slate-500 text-sm max-w-lg font-medium">Các chiến dịch giảm giá tự động đang được áp dụng tại cơ sở của bạn. Các quy tắc này do Chủ sở hữu thiết lập.</p>
            </div>

            <button
              onClick={fetchAll}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:border-blue-500/50 text-slate-400 hover:text-blue-600 rounded-2xl text-sm font-bold transition-all active:scale-95 duration-300 shadow-sm"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Làm mới
            </button>
          </div>

          {/* ── Quick Stats ── */}
          <div className="flex">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm w-full max-w-sm">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Đang hoạt động</p>
                <h3 className="text-3xl font-black text-emerald-600">{promotions.filter(p => p.status === 'Active').length}</h3>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-inner">
                <Zap size={24} />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200 w-full" />

          {/* ── Promotion Grid ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 size={40} className="animate-spin text-blue-600" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Đang đồng bộ từ Owner...</p>
            </div>
          ) : promotions.filter(p => p.status !== 'PendingApproval').length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-white border border-slate-200 rounded-3xl shadow-sm text-center">
              <Gift size={48} className="text-slate-200 mb-4 opacity-50" />
              <p className="font-black text-lg uppercase tracking-widest">Không có dữ liệu</p>
              <p className="text-xs text-slate-500 mt-2">Cơ sở hiện không có chiến dịch khuyến mãi nào được áp dụng.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {promotions.filter(p => p.status !== 'PendingApproval').map((p, idx) => {
                const st = getPromoStatus(p);
                const cfg = STATUS_CONFIG[st] ?? STATUS_CONFIG.Inactive;
                return (
                  <div key={p.discountID} className="group relative bg-white border border-slate-200 rounded-[32px] p-6 hover:shadow-xl hover:shadow-slate-200 transition-all duration-500 flex flex-col">
                    <div className="absolute top-0 left-10 right-10 h-1 rounded-b-full bg-gradient-to-r from-blue-600 to-blue-500 opacity-20 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-start justify-between mb-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black uppercase">Từ Owner</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{p.name}</h3>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${p.discountType === 'Percentage' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                        {p.discountType === 'Percentage' ? <BadgePercent size={24} /> : <DollarSign size={24} />}
                      </div>
                    </div>

                    <div className="mb-6 p-5 rounded-[24px] bg-slate-50 border border-slate-100">
                      <div className="flex items-baseline gap-1 relative overflow-hidden">
                        <span className={`text-4xl font-black ${p.discountType === 'Percentage' ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {p.discountType === 'Percentage' ? p.value : fmtCurrency(p.value).split(' ')[0]}
                        </span>
                        <span className="text-sm font-bold opacity-50 uppercase tracking-widest">{p.discountType === 'Percentage' ? '%' : 'VNĐ'}</span>
                      </div>
                      {p.maxDiscountAmount > 0 && <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">GIẢM TỐI ĐA: {fmtCurrency(p.maxDiscountAmount)}</p>}
                    </div>

                    <p className="text-sm text-slate-500 mb-8 line-clamp-3 italic leading-relaxed font-medium">"{p.description || 'Nội dung chiến dịch đang được cập nhật...'}"</p>

                    <div className="grid grid-cols-2 gap-3 text-[10px] mb-4 mt-auto">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-slate-400 font-bold uppercase tracking-widest mb-1 opacity-80">Đơn tối thiểu</p>
                        <p className="text-slate-700 font-black">{p.minOrderValue > 0 ? fmtCurrency(p.minOrderValue) : '0 VNĐ'}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-slate-400 font-bold uppercase tracking-widest mb-1 opacity-80">Đã áp dụng</p>
                        <p className="text-emerald-600 font-black">{p.usedCount} lượt</p>
                      </div>

                      <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-600">
                          <Clock size={12} />
                          <p className="font-bold uppercase tracking-widest">Khung giờ</p>
                        </div>
                        <p className="text-slate-700 font-black">{p.happyHourStart ? `${p.happyHourStart} - ${p.happyHourEnd}` : 'Cả ngày'}</p>
                      </div>

                      <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Calendar size={12} />
                          <p className="font-bold uppercase tracking-widest">Hết hạn</p>
                        </div>
                        <p className="text-slate-700 font-black">{p.endDate ? dayjs(p.endDate).format('DD.MM.YYYY') : 'Vô thời hạn'}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </BranchManagerLayout>
  );
}
