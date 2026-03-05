# F-001: Authentication & User Profile

## 1. Meta

| Field         | Value                                                          |
| ------------- | -------------------------------------------------------------- |
| **Epic**      | [EPIC-01: LunchOrder](docs/product/epics/epic-01-lunchorder.md) |
| **Priority**  | P0                                                             |
| **Status**    | 🔴 Not Started                                                 |
| **Estimate**  | 5 points (M)                                                   |
| **BA Owner**  | Team                                                           |
| **Dev Owner** | Dev                                                            |

---

## 2. Business Context

### Problem Statement

Hệ thống cần xác thực người dùng qua Google OAuth để phân quyền (admin/host/member/viewer). Sau khi đăng nhập lần đầu, tài khoản được tạo tự động. User cần có profile để lưu thông tin ngân hàng cho VietQR.

### Business Value

- Bảo vệ phiên order — chỉ người đã đăng nhập mới tạo/tham gia phiên
- Tự động tạo profile từ Google (tên, avatar, email)
- Lưu bank info 1 lần, dùng cho mọi phiên về sau

---

## 3. User Story

> **Là** thành viên văn phòng,  
> **Tôi muốn** đăng nhập bằng tài khoản Google,  
> **Để** tham gia phiên order mà không cần đăng ký tài khoản riêng.

### User Flow

```
1. User vào app, click "Đăng nhập Google"
2. Redirect sang Google consent screen
3. Google callback → Supabase Auth xử lý session
4. Nếu lần đầu → tạo profile trong bảng users (role = 'member')
5. Redirect về /dashboard
```

---

## 4. Acceptance Criteria

- [ ] **AC-01**: User click "Đăng nhập Google" → redirect sang Google OAuth
- [ ] **AC-02**: Sau khi OAuth success, session được lưu dưới dạng HttpOnly cookie
- [ ] **AC-03**: Lần đầu đăng nhập → profile được upsert vào bảng `users` với role = 'member'
- [ ] **AC-04**: Middleware chặn truy cập `/dashboard`, `/sessions/*`, `/admin/*` khi chưa đăng nhập
- [ ] **AC-05**: Route `/share/[shareToken]` public — không cần đăng nhập
- [ ] **AC-06**: User có thể cập nhật `bankCode`, `accountNumber`, `accountName` trong `/profile`
- [ ] **AC-07**: Đăng xuất xóa session cookie, redirect về `/login`

---

## 5. Out of Scope

- Đăng nhập bằng email/password (chỉ Google OAuth)
- Quản lý role admin trong UI (set thủ công trong DB)
- Two-factor authentication

---

## 6. UI/UX

### UI Notes

- Trang login: nền hero với ảnh đẹp, button "Tiếp tục với Google" có Google icon
- Profile page: form đơn giản, fields bank info với placeholder rõ ràng
- Branding: `eat`**together.** với primary color #6CC208

---

## 7. Technical Specs

### 7.0 NFR Targets

| NFR           | Target      | Priority | Note              |
| ------------- | ----------- | -------- | ----------------- |
| Response time | < 200ms p95 | P1       | OAuth callback    |
| Availability  | 99.9%       | P0       | Phụ thuộc Supabase|

### 7.1 Server Actions / Routes

- `GET /auth/callback/route.ts` — Supabase OAuth callback handler
- `src/features/auth/actions.ts` — `signInWithGoogle()`, `signOut()`, `updateBankInfo()`

### 7.2 Database Schema

**Table:** `users`

| Column        | Type      | Constraints | Description                    |
| ------------- | --------- | ----------- | ------------------------------ |
| id            | uuid      | PK          | Supabase Auth user ID          |
| email         | text      | UNIQUE NOT NULL | Google email               |
| name          | text      | NOT NULL    | Google display name            |
| avatar_url    | text      |             | Google avatar URL              |
| role          | text      | DEFAULT 'member' | 'admin' \| 'member'       |
| bank_code     | text      |             | VietQR bank code               |
| account_number| text      |             | Bank account number            |
| account_name  | text      |             | Account holder name            |
| created_at    | timestamptz| DEFAULT now()|                              |

**RLS:**
- SELECT: Chính mình (`auth.uid() = id`)
- UPDATE: Chính mình (profile fields only)

### 7.3 Components (Frontend)

- `app/(auth)/login/page.tsx` — Trang đăng nhập (Server Component)
- `app/auth/callback/route.ts` — OAuth callback route
- `app/(app)/profile/page.tsx` — Profile + bank info form
- `src/features/auth/components/login-button.tsx` — Google Sign In button
- `src/features/auth/schemas.ts` — Zod schema cho bank info update
- `src/features/auth/actions.ts` — Server Actions

---

## 8. Test Cases

### Unit Tests

| TC-ID | Test Name                        | Input              | Expected               |
| ----- | -------------------------------- | ------------------ | ---------------------- |
| UT-01 | updateBankInfo validates bankCode | `{ bankCode: '' }` | Returns validation error |
| UT-02 | updateBankInfo success            | Valid bank data    | Returns `{ success: true }` |

### Integration Tests

- [ ] **IT-01**: Google OAuth redirect URL được tạo đúng
- [ ] **IT-02**: Callback handler tạo profile khi user lần đầu đăng nhập

### E2E Tests

- [ ] **E2E-01**: Full Google login flow → redirect về dashboard
- [ ] **E2E-02**: Unauthenticated access /dashboard → redirect /login

---

## 9. Dependencies

| Type           | Feature/Service | Status     | Notes  |
| -------------- | --------------- | ---------- | ------ |
| **External**   | Supabase Auth   | ✅ Ready   | Google OAuth configured |
| **External**   | Google OAuth    | Pending    | Cần setup credentials |

---

## 10. Notes & Change Log

### Technical Notes

- Dùng `@supabase/ssr` createServerClient với cookie handling đúng theo Supabase docs
- Middleware dùng `supabase.auth.getUser()` (không dùng `getSession()` — deprecated)
- Role 'admin' set thủ công, không expose trong UI

### Change Log

| Date       | Author | Changes          |
| ---------- | ------ | ---------------- |
| 2026-03-05 | Agent  | Initial spec     |
