# F-006: Bill Splitting & Calculation

## 1. Meta

| Field         | Value                                                          |
| ------------- | -------------------------------------------------------------- |
| **Epic**      | [EPIC-01: LunchOrder](docs/product/epics/epic-01-lunchorder.md) |
| **Priority**  | P0                                                             |
| **Status**    | 🔴 Not Started                                                 |
| **Estimate**  | 8 points (L)                                                   |
| **BA Owner**  | Team                                                           |
| **Dev Owner** | Dev                                                            |

---

## 2. Business Context

### Problem Statement

Sau khi phiên LOCKED, host cần xem tổng kết bill — ai phải trả bao nhiêu — theo 2 phương thức: chia đều (EQUAL) hoặc chia theo món (BY_ITEM). Host cũng có thể nhập grandTotal tùy chỉnh (sau khi áp mã giảm giá thực tế).

### Business Value

- Tính bill tự động, tránh nhầm lẫn thủ công
- Công thức BY_ITEM đảm bảo người ăn nhiều trả nhiều
- Làm tròn đúng chuẩn, tổng luôn bằng grandTotal

---

## 3. User Story

> **Là** host của phiên,  
> **Tôi muốn** hệ thống tự động tính tiền từng người,  
> **Để** tôi chỉ cần nhìn vào bảng và thông báo cho mọi người số tiền cần chuyển.

---

## 4. Acceptance Criteria

- [ ] **AC-01**: Sau khi LOCKED, host xem được bảng tổng kết bill
- [ ] **AC-02**: EQUAL: `amountToPay = grandTotal / số member` (tính đều cho tất cả)
- [ ] **AC-03**: BY_ITEM: `amountToPay_X = memberSubtotal_X × grandTotal / subtotal`
- [ ] **AC-04**: Làm tròn đến đơn vị đồng; phần lẻ cộng vào member có memberSubtotal lớn nhất (BR03 T03)
- [ ] **AC-05**: `Σ amountToPay của tất cả members = grandTotal` (không dư, không thiếu)
- [ ] **AC-06**: Host có thể nhập `grandTotal` thủ công; default = `subtotal + shipFee + serviceFee`
- [ ] **AC-07**: Member nào chưa chọn món vẫn xuất hiện với tổng = 0đ (BR06)
- [ ] **AC-08**: Bảng hiển thị: member name, tiền món, tổng phải trả, trạng thái thanh toán
- [ ] **AC-09**: Host có thể sửa `shipFee`, `serviceFee`, `grandTotal` sau khi LOCKED trong trang bill

---

## 5. Out of Scope

- Export bill PDF/Excel (roadmap)
- Chia tiền theo nhóm con (chỉ toàn phiên)
- Gợi ý nhà hàng giảm giá

---

## 6. UI/UX

### UI Notes

- Page `/sessions/[sessionId]/bill` — hiển thị bill table
- Bảng có header: Member | Tiền món | Tổng phải trả | Trạng thái
- Dưới tên mỗi member: công thức tính `120,000 × 330,000 ÷ 350,000 = 113,143đ`
- Row tổng ở cuối bảng
- Host có form nhỏ để sửa grandTotal, ship fee nếu cần
- Design reference: `orderDetail.html`

---

## 7. Technical Specs

### 7.0 NFR Targets

| NFR           | Target      | Priority | Note               |
| ------------- | ----------- | -------- | ------------------ |
| Accuracy      | 100%        | P0       | Bill calculation   |
| Response time | < 500ms p95 | P1       | Bill page load     |

### 7.1 Pure Functions (lib/bill.ts)

```typescript
// Pure functions — no side effects, easily unit tested
export function calculateEqualSplit(
  participants: { userId: string; name: string; memberSubtotal: number }[],
  grandTotal: number
): MemberBill[]

export function calculateByItemSplit(
  participants: { userId: string; name: string; memberSubtotal: number }[],
  subtotal: number,
  grandTotal: number
): MemberBill[]

// Rounding adjustment: remainder added to member with largest memberSubtotal
function adjustRoundingDiff(rawBills: RawBill[], expectedTotal: number): MemberBill[]
```

### 7.2 Server Actions

- `src/features/bill/actions.ts`:
  - `updateBillSettings(sessionId, { shipFee, serviceFee, grandTotal })` — host only
  - `getBillSummary(sessionId)` — returns computed bill per member (RSC data fetch)

### 7.3 Database Schema

No new tables. Uses existing `sessions.ship_fee`, `sessions.service_fee`, `sessions.grand_total`, and `order_items.unit_final_price × quantity`.

### 7.4 Components

- `app/(app)/sessions/[sessionId]/bill/page.tsx` — Bill summary page (RSC)
- `src/features/bill/components/bill-summary-table.tsx`
- `src/features/bill/components/bill-settings-form.tsx` — Inline form for host
- `src/lib/bill.ts` — Pure calculation functions

---

## 8. Test Cases

### Unit Tests (Most Critical Feature)

| TC-ID | Test Name                           | Input                           | Expected                     |
| ----- | ----------------------------------- | ------------------------------- | ---------------------------- |
| UT-01 | EQUAL split basic                   | 4 members, grandTotal=380,000   | Each pays 95,000             |
| UT-02 | BY_ITEM rounding adjustment         | BRD example (A:120k,B:90k,C:140k,grand:330k) | A:113143, B:84857, C:132000 |
| UT-03 | BY_ITEM sum equals grandTotal       | Various inputs                  | Σ = grandTotal exactly       |
| UT-04 | Member with 0 orders                | 1 member no orders              | amountToPay = 0 (EQUAL case: still pays share) |
| UT-05 | EQUAL split odd amount              | 3 members, grandTotal=100,001   | Rounding adjusted             |

### Integration Tests

- [ ] **IT-01**: updateBillSettings saves correctly, recompute on next load

---

## 9. Dependencies

| Type           | Feature/Service | Status     | Notes               |
| -------------- | --------------- | ---------- | ------------------- |
| **Depends on** | F-005 Orders    | 🔴 Pending | Need order_items data|

---

## 10. Notes & Change Log

### Technical Notes

- `lib/bill.ts` must be pure functions with 100% unit test coverage
- BR04: Ship fee và service fee KHÔNG tham gia tỉ lệ — chỉ cộng thêm vào total
- T02: Bill tính từ `order_items.unit_final_price` snapshot — không join sang menu_items
- T03: Rounding correction: last-resort adjustment added to member with max memberSubtotal

### Change Log

| Date       | Author | Changes      |
| ---------- | ------ | ------------ |
| 2026-03-05 | Agent  | Initial spec |
