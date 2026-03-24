import { useState, useEffect, useCallback } from 'react';
import { Gift, Loader2, BadgePercent, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import { getManagerPromotions } from '../api/managerApi';
import BranchManagerLayout from '../components/manager/BranchManagerLayout';

const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const STATUS_CONFIG = {
  Active:          { label: 'Đang hoạt động', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  PendingApproval: { label: 'Chờ duyệt',      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  Inactive:        { label: 'Vô hiệu',         color: 'bg-slate-600/40 text-slate-400 border-slate-600/40' },
};

/* ════════════════════════════════════════════════════════════════════
   ManagerPromotions — Trang quản lý Auto-Promotions cho Branch Manager (Read-Only)
════════════════════════════════════════════════════════════════════ */
export default function ManagerPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading]       = useState(true);

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
      <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
        {/* ── Header ─────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Gift size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Khuyến Mãi Chi Nhánh</h1>
              <p className="text-slate-400 text-xs">Danh sách chiến dịch tự động áp dụng khi tính tiền tại bàn do Owner cấu hình</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* ── Content ─────────── */}
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-emerald-400" /></div>
        ) : promotions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Gift size={48} className="mb-3 opacity-30" />
            <p className="font-semibold">Chưa có chiến dịch nào được áp dụng</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {promotions.map(p => {
              const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.Inactive;
              return (
                <div key={p.discountID} className={`bg-slate-800/50 border rounded-2xl p-4 transition group border-blue-500/20 hover:border-blue-500/40`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold">Từ Chủ Quán</span>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BranchManagerLayout>
  );
}
