# F-003: Order Session Lifecycle

## 1. Meta

| Field         | Value                                                          |
| ------------- | -------------------------------------------------------------- |
| **Epic**      | [EPIC-01: LunchOrder](docs/product/epics/epic-01-lunchorder.md) |
| **Priority**  | P0                                                             |
| **Status**    | 🔴 Not Started                                                 |
| **Estimate**  | 13 points (XL)                                                 |
| **BA Owner**  | Team                                                           |
| **Dev Owner** | Dev                                                            |

---

## 2. Business Context

### Problem Statement

Phiên order là trung tâm của hệ thống. Host tạo phiên với các thông số (nhà hàng, vote, deadline, chia bill), chia sẻ link cho thành viên, và quản lý vòng đời phiên từ VOTING → ORDERING → LOCKED → PAYING → COMPLETED.

### Business Value

- Tập trung toàn bộ thông tin order vào 1 phiên có vòng đời rõ ràng
- Link chia sẻ giúp thành viên tham gia không cần biết sessionId thực

---

## 3. User Story

> **Là** host của nhóm,  
> **Tôi muốn** tạo một phiên order mới và chia sẻ link cho thành viên,  
> **Để** mọi người cùng chọn món trên cùng một giao diện.

### User Flow

```
1. Host vào /sessions/new → điền thông tin cơ bản (tên, vote, deadline)
2. Chọn nhà hàng (hoặc thêm nhà hàng ứng cử nếu vote bật)
3. Cài đặt bill (EQUAL/BY_ITEM, ship fee, service fee)
4. Hệ thống tạo phiên, sinh shareToken
5. Host copy link /share/[shareToken] → gửi cho team
6. Member mở link → tham gia phiên
7. Host bấm "Chốt đơn" → phiên LOCKED
8. Host xem bill → chuyển sang PAYING/COMPLETED
```

---

## 4. Acceptance Criteria

- [ ] **AC-01**: Host tạo phiên với title, vote on/off, deadline tùy chọn, split method
- [ ] **AC-02**: Hệ thống sinh `shareToken` unique (nanoid/UUID) khi tạo phiên
- [ ] **AC-03**: Dashboard hiển thị danh sách phiên của user (tạo + tham gia)
- [ ] **AC-04**: Host có thể chốt đơn thủ công (ORDERING → LOCKED)
- [ ] **AC-05**: Sau khi LOCKED, member KHÔNG thể thêm/sửa/xóa món (BR03)
- [ ] **AC-06**: Host có thể mở lại phiên LOCKED → ORDERING nếu chưa có ai thanh toán (BR08)
- [ ] **AC-07**: Host có thể hủy phiên (→ CANCELLED)
- [ ] **AC-08**: Phiên COMPLETED được lưu vào lịch sử
- [ ] **AC-09**: Link `/share/[shareToken]` accessible không cần đăng nhập (viewer)
- [ ] **AC-10**: Nếu deadline được đặt, deadline phải hiển thị countdown timer

---

## 5. Out of Scope

- Auto deadline (chuyển LOCKED tự động khi hết giờ không nằm trong MVP, cần cron job)
- Copy/duplicate phiên (roadmap)
- Template phiên (roadmap)

---

## 6. UI/UX

### UI Notes

- Dashboard: danh sách session cards với status badge (color-coded)
- Session detail: header có status + deadline countdown, tab order/vote
- Status badge: VOTING=blue, ORDERING=green, LOCKED=orange, PAYING=yellow, COMPLETED=gray, CANCELLED=red
- Design reference: `detailSession.html`, `homePage.html`

---

## 7. Technical Specs

### 7.0 NFR Targets

| NFR           | Target      | Priority | Note                    |
| ------------- | ----------- | -------- | ----------------------- |
| Response time | < 500ms p95 | P1       | Session create/list     |
| N/A           | N/A         | N/A      |                         |

### 7.1 Server Actions

- `src/features/sessions/actions.ts`:
  - `createSession(data)` — host/admin
  - `updateSession(id, data)` — host only
  - `lockSession(id)` — host only → LOCKED
  - `unlockSession(id)` — host only → ORDERING (nếu chưa có ai PAID)
  - `cancelSession(id)` — host only → CANCELLED
  - `completeSession(id)` — host only → COMPLETED (khi tất cả PAID)
  - `joinSession(shareToken)` — authenticated user join as participant

### 7.2 Database Schema

**Table:** `sessions`

| Column           | Type       | Constraints         | Description                    |
| ---------------- | ---------- | ------------------- | ------------------------------ |
| id               | uuid       | PK                  |                                |
| title            | text       | NOT NULL            | Session display name           |
| host_id          | uuid       | FK → users NOT NULL | Session creator                |
| restaurant_id    | uuid       | FK → restaurants    | null when VOTING               |
| is_voting_enabled| boolean    | DEFAULT false       |                                |
| status           | text       | DEFAULT 'ORDERING'  | See lifecycle                  |
| deadline         | timestamptz|                     | Auto-lock time (optional)      |
| ship_fee         | integer    | DEFAULT 0           |                                |
| service_fee      | integer    | DEFAULT 0           |                                |
| grand_total      | integer    |                     | null = auto-calc               |
| split_method     | text       | DEFAULT 'BY_ITEM'   | 'EQUAL' \| 'BY_ITEM'           |
| share_token      | text       | UNIQUE NOT NULL     | Public share URL token         |
| created_at       | timestamptz| DEFAULT now()       |                                |
| updated_at       | timestamptz| DEFAULT now()       |                                |

**Table:** `session_participants`

| Column    | Type       | Constraints      | Description |
| --------- | ---------- | ---------------- | ----------- |
| id        | uuid       | PK               |             |
| session_id| uuid       | FK CASCADE       |             |
| user_id   | uuid       | FK → users       |             |
| joined_at | timestamptz| DEFAULT now()    |             |
| UNIQUE    |            | (session_id, user_id) |        |

**RLS:**
- `sessions`: SELECT participants + viewer via shareToken; INSERT authenticated; UPDATE host only
- `session_participants`: SELECT self; INSERT self (join)

### 7.3 Components (Frontend)

- `app/(app)/dashboard/page.tsx` — Session list (RSC)
- `app/(app)/sessions/new/page.tsx` — Create session form
- `app/(app)/sessions/[sessionId]/page.tsx` — Session detail
- `app/share/[shareToken]/page.tsx` — Public viewer
- `src/features/sessions/components/session-card.tsx`
- `src/features/sessions/components/session-status-badge.tsx`
- `src/features/sessions/components/create-session-form.tsx`
- `src/features/sessions/schemas.ts`
- `src/features/sessions/actions.ts`

---

## 8. Test Cases

### Unit Tests

| TC-ID | Test Name                   | Input                   | Expected                       |
| ----- | --------------------------- | ----------------------- | ------------------------------ |
| UT-01 | createSession validates title | `{ title: '' }`       | Validation error               |
| UT-02 | lockSession status check    | Session in LOCKED state | Error: already locked          |
| UT-03 | shareToken uniqueness       | Multiple sessions       | Each session has unique token  |

### Integration Tests

- [ ] **IT-01**: Host creates session → appears in dashboard
- [ ] **IT-02**: Public shareToken link accessible without auth
- [ ] **IT-03**: Non-host cannot lock session (RLS)

### E2E Tests

- [ ] **E2E-01**: Full session creation flow → share → member joins → host locks

---

## 9. Dependencies

| Type           | Feature/Service | Status     | Notes              |
| -------------- | --------------- | ---------- | ------------------ |
| **Depends on** | F-001 Auth      | 🔴 Pending |                    |
| **Depends on** | F-002 Restaurants| 🔴 Pending| Need restaurant list|
| **Blocks**     | F-004 Voting    | 🔴 Waiting |                    |
| **Blocks**     | F-005 Orders    | 🔴 Waiting |                    |

---

## 10. Notes & Change Log

### Technical Notes

- `shareToken` sinh bằng `nanoid(12)` — không expose UUID thật (T05)
- Deadline auto-lock cần background job (Vercel Cron) — không trong MVP scope; chỉ hiển thị countdown
- BR08: chỉ cho phép mở lại nếu không có `order_items` nào có payment status PAID

### Change Log

| Date       | Author | Changes      |
| ---------- | ------ | ------------ |
| 2026-03-05 | Agent  | Initial spec |
