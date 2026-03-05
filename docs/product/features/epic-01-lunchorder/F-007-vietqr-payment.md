# F-007: VietQR Payment Tracking

## 1. Meta

| Field         | Value                                                          |
| ------------- | -------------------------------------------------------------- |
| **Epic**      | [EPIC-01: LunchOrder](docs/product/epics/epic-01-lunchorder.md) |
| **Priority**  | P1                                                             |
| **Status**    | 🔴 Not Started                                                 |
| **Estimate**  | 5 points (M)                                                   |
| **BA Owner**  | Team                                                           |
| **Dev Owner** | Dev                                                            |

---

## 2. Business Context

### Problem Statement

Sau khi phiên LOCKED và bill được tính, mỗi member cần chuyển khoản cho host. Hệ thống cần hiển thị QR code VietQR riêng cho từng member với đúng số tiền và nội dung chuyển khoản. Host đánh dấu thủ công khi nhận được tiền.

### Business Value

- Loại bỏ việc host tự tính và thông báo từng người phải trả bao nhiêu
- QR code tự động điền sẵn số tiền và nội dung → giảm lỗi chuyển khoản
- Tracking trạng thái thanh toán rõ ràng

---

## 3. User Story

> **Là** thành viên tham gia phiên,  
> **Tôi muốn** quét QR code để chuyển khoản đúng số tiền cho host,  
> **Để** không cần hỏi lại số tài khoản hay số tiền phải trả.

---

## 4. Acceptance Criteria

- [ ] **AC-01**: Host nhập thông tin tài khoản ngân hàng 1 lần trong Profile (`bankCode`, `accountNumber`, `accountName`)
- [ ] **AC-02**: Khi phiên sang PAYING, mỗi member thấy QR code VietQR riêng của mình
- [ ] **AC-03**: QR code URL build đúng format: `img.vietqr.io/image/{bankCode}-{accountNumber}-compact2.png?amount={amount}&addInfo={content}&accountName={name}`
- [ ] **AC-04**: `addInfo` = `LUNCHORDER #{sessionId_short} {memberName}` (8 ký tự đầu của sessionId, uppercase)
- [ ] **AC-05**: Member click "Tôi đã chuyển" → status của member trong phiên chuyển sang `PENDING_CONFIRM` (thông báo host kiểm tra)
- [ ] **AC-06**: Host đánh dấu từng member "Đã nhận tiền" → status → `PAID`
- [ ] **AC-07**: Khi tất cả member PAID → host có thể chuyển phiên → COMPLETED
- [ ] **AC-08**: QR code được render phía client (không server-side, không lưu ảnh)

---

## 5. Out of Scope

- Auto-detect payment (webhook ngân hàng, bank API)
- Payment gateway (Stripe, ZaloPay, Momo)
- Email/Slack notification khi nhận tiền

---

## 6. UI/UX

### UI Notes

- Trang bill `/sessions/[sessionId]/bill`: mỗi member row có nút "Xem QR"
- QR card: hiển thị QR image + số tiền + nội dung chuyển khoản (rõ ràng)
- Badge trạng thái: ⏳ Chưa trả | 🔔 Đã chuyển (chờ xác nhận) | ✅ Đã nhận
- Nút confirm "Đã nhận tiền" chỉ hiển thị với host
- Design reference: `orderDetail.html`

---

## 7. Technical Specs

### 7.0 NFR Targets

| NFR           | Target      | Priority | Note           |
| ------------- | ----------- | -------- | -------------- |
| Response time | < 200ms p95 | P1       | Client-side QR |
| N/A           | N/A         | N/A      |                |

### 7.1 VietQR Client-side URL Builder

```typescript
// src/features/payment/utils/viet-qr.ts
export function buildVietQRUrl({
  bankCode,
  accountNumber,
  accountName,
  amount,
  sessionId,
  memberName,
}: VietQRParams): string {
  const transferContent = `LUNCHORDER ${sessionId.slice(0, 8).toUpperCase()} ${memberName}`;
  return (
    `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png` +
    `?amount=${amount}` +
    `&addInfo=${encodeURIComponent(transferContent)}` +
    `&accountName=${encodeURIComponent(accountName)}`
  );
}
```

### 7.2 Server Actions

- `src/features/payment/actions.ts`:
  - `markAsSent(sessionId)` — member: self declares payment sent
  - `markAsPaid(sessionId, memberId)` — host: confirms payment received
  - `completeSession(sessionId)` — host: all paid → COMPLETED

### 7.3 Database Schema

Add payment status to `session_participants`:

| Column           | Type | Constraints     | Description                        |
| ---------------- | ---- | --------------- | ---------------------------------- |
| payment_status   | text | DEFAULT 'PENDING'| 'PENDING' \| 'SENT' \| 'PAID'     |
| payment_confirmed_at | timestamptz |         | When host confirmed                |

### 7.4 Components

- `src/features/payment/components/viet-qr-card.tsx` — QR code display
- `src/features/payment/components/payment-status-badge.tsx`
- `src/features/payment/components/payment-tracker.tsx` — Full payment table for host
- `src/features/payment/utils/viet-qr.ts` — URL builder
- `src/features/payment/actions.ts`

---

## 8. Test Cases

### Unit Tests

| TC-ID | Test Name                     | Input                    | Expected                           |
| ----- | ----------------------------- | ------------------------ | ---------------------------------- |
| UT-01 | buildVietQRUrl format correct | Valid params             | Correct URL with encoded values    |
| UT-02 | buildVietQRUrl encodes spaces | memberName = "Nguyễn Văn A" | URL has encoded %20 and diacritics |
| UT-03 | addInfo format correct        | sessionId, memberName    | `LUNCHORDER ABCD1234 MemberName`  |

### Integration Tests

- [ ] **IT-01**: markAsPaid by non-host fails (RLS)
- [ ] **IT-02**: completeSession with not all PAID returns error

---

## 9. Dependencies

| Type           | Feature/Service | Status     | Notes         |
| -------------- | --------------- | ---------- | ------------- |
| **Depends on** | F-006 Bill      | 🔴 Pending | Need amountToPay |
| **Depends on** | F-001 Auth (profile/bank info) | 🔴 Pending | Host bank info |
| **External**   | VietQR API      | ✅ Public  | Free, client-side |

---

## 10. Notes & Change Log

### Technical Notes

- QR generation is entirely client-side — just an `<img src={url} />` with the VietQR URL
- No API key needed for VietQR public endpoint
- Host bank info stored in `users.bank_code`, `users.account_number`, `users.account_name`

### Change Log

| Date       | Author | Changes      |
| ---------- | ------ | ------------ |
| 2026-03-05 | Agent  | Initial spec |
