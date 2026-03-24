/**
 * promotionHelper.js
 * Chứa business logic cho Auto-Promotions:
 *  - isInHappyHour()  : kiểm tra khung giờ vàng (kể cả qua đêm) với timezone Việt Nam
 *  - calcDiscount()   : tính số tiền giảm cho 1 promotion
 *  - findBestPromotion(): chạy 4 bước lọc và chọn promotion tốt nhất
 */

import { toZonedTime, format } from 'date-fns-tz';

const VN_TZ = 'Asia/Ho_Chi_Minh';

/* ─── 1. Kiểm tra Happy Hour (xử lý vắt qua nửa đêm) ─────────────────────── */
export function isInHappyHour(happyHourStart, happyHourEnd) {
  if (!happyHourStart || !happyHourEnd) return true; // null = cả ngày

  const vnNow  = toZonedTime(new Date(), VN_TZ);
  const cur    = format(vnNow, 'HH:mm', { timeZone: VN_TZ }); // "14:30"

  if (happyHourStart <= happyHourEnd) {
    // Ban ngày bình thường: 11:00 → 14:00
    return cur >= happyHourStart && cur <= happyHourEnd;
  } else {
    // Vắt qua nửa đêm: 22:00 → 02:00
    return cur >= happyHourStart || cur <= happyHourEnd;
  }
}

export function isApplicableToday(applicableDays, vnNow) {
  if (!applicableDays) return true; // null hoặc rỗng = áp dụng mọi ngày
  const dayOfWeek = vnNow.getDay(); // 0 = Chủ Nhật, 1 = Thứ 2, ..., 6 = Thứ 7
  const allowedDays = applicableDays.split(',').map(d => parseInt(d.trim(), 10));
  return allowedDays.includes(dayOfWeek);
}

/* ─── 2. Lấy giờ hiện tại theo timezone VN ──────────────────────────────────── */
export function getVNNow() {
  return toZonedTime(new Date(), VN_TZ);
}

/* ─── 3. Tính số tiền giảm cho 1 promotion ──────────────────────────────────── */
export function calcDiscount(promo, subTotal) {
  const sub = parseFloat(subTotal);
  let raw;

  if (promo.discountType === 'Percentage') {
    raw = sub * (parseFloat(promo.value) / 100);
  } else {
    // FixedAmount
    raw = parseFloat(promo.value);
  }

  // Áp cap nếu có maxDiscountAmount
  if (promo.maxDiscountAmount !== null && promo.maxDiscountAmount !== undefined) {
    raw = Math.min(raw, parseFloat(promo.maxDiscountAmount));
  }

  // Không được giảm quá subTotal
  return Math.min(raw, sub);
}

/* ─── 4. Bước 1-3: Tìm promotion tốt nhất cho 1 chi nhánh + subTotal ─────────
 *
 * @param {Object[]} promotions  - Danh sách promotion lấy từ DB (đã lọc theo branchID + restaurantID)
 * @param {number}   subTotal    - Tổng tiền hiện tại của order (VNĐ)
 * @returns {{ promo, discountAmount } | null}
 */
export function findBestPromotion(promotions, subTotal) {
  const sub     = parseFloat(subTotal);
  const vnNow   = getVNNow();
  const nowDate = vnNow; // Date object ở múi giờ VN

  // ── Bước 1: Filter theo trạng thái + thời hạn + usageLimit + ngày trong tuần ──
  const step1 = promotions.filter(p => {
    if (p.status !== 'Active') return false;
    if (p.startDate && new Date(p.startDate) > nowDate) return false;
    if (p.endDate   && new Date(p.endDate) < nowDate)   return false;
    if (p.usageLimit !== null && p.usedCount >= p.usageLimit) return false;
    if (!isApplicableToday(p.applicableDays, vnNow)) return false;
    return true;
  });

  // ── Bước 2: Filter theo minOrderValue + Happy Hour ──
  const step2 = step1.filter(p => {
    if (sub < parseFloat(p.minOrderValue)) return false;
    if (!isInHappyHour(p.happyHourStart, p.happyHourEnd)) return false;
    return true;
  });

  if (step2.length === 0) return null;

  // ── Bước 3: Conflict Resolution — Best Deal, fallback Priority ──
  let best = null;
  let bestAmount = -1;

  for (const p of step2) {
    const amount = calcDiscount(p, sub);
    if (amount > bestAmount) {
      best = p;
      bestAmount = amount;
    }
  }

  return best ? { promo: best, discountAmount: bestAmount } : null;
}
