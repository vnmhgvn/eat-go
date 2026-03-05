# 🎯 Epic: LunchOrder — Internal Group Food Ordering System

> **Epic ID:** EPIC-01  
> **Status:** 🟡 In Progress  
> **Priority:** P0  
> **Phase:** Phase 1 (MVP)  
> **Owner:** Team

---

## 1. Overview

LunchOrder là ứng dụng web nội bộ giúp nhóm văn phòng (5–50 người) tổ chức đặt đồ ăn nhóm một cách nhanh chóng và minh bạch. Hệ thống cho phép host tạo phiên đặt đồ ăn, thành viên vote nhà hàng và chọn món, sau đó tự động tính chia bill theo 2 phương thức (chia đều hoặc chia theo món) và hiển thị QR code VietQR để thanh toán.

### Business Value

- **Tiết kiệm thời gian**: Thay thế các group chat lộn xộn bằng một luồng tập trung, có tổ chức.
- **Minh bạch tài chính**: Tự động tính tiền từng người, tránh nhầm lẫn và tranh chấp.
- **Trải nghiệm mượt mà**: UI đẹp, dark mode, mobile-friendly, VietQR tích hợp.
- **Chi phí triển khai = $0**: Chạy miễn phí trên Vercel + Supabase free tier.

---

## 2. Goals & Success Metrics

### Goals

- [ ] Goal 1: Triển khai đầy đủ luồng đặt đồ ăn từ tạo phiên → chọn món → chốt đơn → thanh toán
- [ ] Goal 2: Hỗ trợ vote nhà hàng trước khi order
- [ ] Goal 3: Tính bill chính xác theo 2 phương thức EQUAL và BY_ITEM
- [ ] Goal 4: Tích hợp VietQR để member tự quét thanh toán

### Success Metrics (KPIs)

| Metric                       | Baseline | Target | Current |
| ---------------------------- | -------- | ------ | ------- |
| Thời gian tạo phiên          | N/A      | < 60s  | -       |
| Độ chính xác tính bill       | N/A      | 100%   | -       |
| Tỉ lệ build success          | N/A      | 100%   | -       |
| Số feature hoàn thành / tổng | 0/7      | 7/7    | -       |

---

## 3. Timeline & Milestones

| Milestone               | Target Date | Status | Owner  |
| ----------------------- | ----------- | :----: | ------ |
| 📋 Design Complete      | 2026-03-05  |   🟢   | Team   |
| 💻 Development Complete | 2026-03-15  |   🔴   | Dev    |
| 🧪 QA Complete          | 2026-03-17  |   🔴   | QA     |
| 🚀 Release              | 2026-03-20  |   🔴   | Team   |

---

## 4. Features

| ID    | Feature                          | Priority | Status | Points | Owner | Link                                                                              |
| ----- | -------------------------------- | :------: | :----: | :----: | ----- | ---------------------------------------------------------------------------------  |
| F-001 | Authentication & User Profile    |    P0    |   🔴   |   5    | Dev   | [→](docs/product/features/epic-01-lunchorder/F-001-auth-user-profile.md)         |
| F-002 | Restaurant & Menu Management     |    P0    |   🔴   |   8    | Dev   | [→](docs/product/features/epic-01-lunchorder/F-002-restaurant-menu.md)           |
| F-003 | Order Session Lifecycle          |    P0    |   🔴   |   13   | Dev   | [→](docs/product/features/epic-01-lunchorder/F-003-order-session.md)             |
| F-004 | Voting System                    |    P1    |   🔴   |   8    | Dev   | [→](docs/product/features/epic-01-lunchorder/F-004-voting-system.md)             |
| F-005 | Order Items & Topping Selection  |    P0    |   🔴   |   8    | Dev   | [→](docs/product/features/epic-01-lunchorder/F-005-order-items-toppings.md)      |
| F-006 | Bill Splitting & Calculation     |    P0    |   🔴   |   8    | Dev   | [→](docs/product/features/epic-01-lunchorder/F-006-bill-splitting.md)            |
| F-007 | VietQR Payment Tracking          |    P1    |   🔴   |   5    | Dev   | [→](docs/product/features/epic-01-lunchorder/F-007-vietqr-payment.md)            |

**Total Story Points:** 55

---

## 5. Out of Scope

> ⚠️ **QUAN TRỌNG**: Những gì KHÔNG làm trong Epic này

- Payment gateway thực (Stripe, ZaloPay, Momo) — chỉ dùng VietQR tĩnh
- Realtime update (thay bằng manual reload button)
- Thống kê cá nhân, template phiên, copy phiên
- Export bill PDF, Slack/GG Chat webhook
- Mobile native app (web responsive only)

---

## 6. Dependencies

### Internal Dependencies

| Dependency       | Type     |   Status   | Impact                          |
| ---------------- | -------- | :--------: | ------------------------------- |
| Supabase project | Requires |   Pending  | Auth + DB foundation            |
| Next.js project  | Requires |   Pending  | Project scaffolding             |

### External Dependencies

| Dependency       | Type        |  Status   | Contact          |
| ---------------- | ----------- | :-------: | ---------------- |
| Supabase Free    | Hosting     | ✅ Public | supabase.com     |
| Vercel Free      | Deploy      | ✅ Public | vercel.com       |
| VietQR API       | Integration | ✅ Public | img.vietqr.io    |
| Google OAuth     | Auth        | ✅ Public | console.google   |

---

## 7. Risks & Mitigations

| Risk                                  | Probability |  Impact  | Mitigation                                    | Owner |
| ------------------------------------- | :---------: | :------: | --------------------------------------------- | ----- |
| Supabase project pause (7 ngày idle)  |    Medium   |   High   | Keep-alive cron hoặc upgrade Pro khi dùng thực | Dev   |
| Connection pool exhausted (60 limit)  |    Low      |   High   | Dùng Supabase Pooler URL (port 6543)           | Dev   |
| Bill rounding errors                  |    Low      |   High   | Unit test đầy đủ cho calculateByItemSplit      | Dev   |

---

## 8. Technical Notes

### Architecture Decisions

- **Fullstack Next.js 15 App Router**: Server Actions cho mutations, RSC cho data fetching
- **Vertical Slice Architecture**: Code tổ chức theo `src/features/{feature-name}/`
- **Database-level Security**: Row Level Security (RLS) bắt buộc cho mọi bảng
- **Drizzle ORM**: Type-safe schema, migrations kiểm soát version
- **CQRS-Lite**: Tách biệt mutations (Server Actions) và queries (RSC queries)

### Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS v4, shadcn/ui, Zustand, RHF + Zod
- **Backend**: Next.js Server Actions, Drizzle ORM, Zod validation
- **Database**: Supabase PostgreSQL + Row Level Security
- **Auth**: Supabase Auth + Google OAuth 2.0
- **Deploy**: Vercel (serverless)

---

## 9. Open Questions

- [x] ✅ Stack đã xác định: Next.js 15 + Supabase + Drizzle ORM
- [x] ✅ Auth: Google OAuth via Supabase Auth (không yêu cầu email cụ thể)
- [x] ✅ Bill rounding: Cộng phần lẻ vào member có memberSubtotal lớn nhất
- [ ] ❓ Supabase project URL + anon key (cần user cung cấp cho .env.local)
- [ ] ❓ Google OAuth client ID (cần setup trong Supabase dashboard)

---

## 10. Change Log

| Date       | Author | Changes                        |
| ---------- | ------ | ------------------------------ |
| 2026-03-05 | Agent  | Initial epic created from BRD/TDD |

---

**Template Version:** 2.0  
**Last Updated:** 2026-03-05
