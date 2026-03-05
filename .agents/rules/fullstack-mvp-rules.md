---
trigger: model_decision
description: Load khi làm việc với Next.js Fullstack, Supabase Auth, PostgreSQL, hoặc UI Components trong dự án MVP.
---

# Fullstack MVP Rules — Next.js 15 · Supabase (PostgreSQL) · TypeScript 5

> **Stack**: Next.js 15 (App Router) · React 19 · Supabase (Auth + DB) · Tailwind CSS · shadcn/ui · Zod · React Hook Form

## Hard Constraints (MUST DO)

### 1. Supabase & PostgreSQL (Bảo mật & CSDL)
- **Ủy quyền cho RLS (Row Level Security)**: BẮT BUỘC bật RLS cho mọi bảng dữ liệu mới. Không viết code check quyền sở hữu (ownership) trong Server Action nếu RLS có thể đảm nhiệm việc đó.
- **Khởi tạo Client An Toàn**:
  - File `"use client"`: Dùng `createBrowserClient`.
  - File `"use server"` (hoặc RSC): Dùng `createServerClient` lấy từ `lib/supabase/server.ts` (phải xử lý cookie theo document mới nhất của Supabase).
- **Tuyệt đối KHÔNG**: Dùng `SUPABASE_SERVICE_ROLE_KEY` trong code thông thường (bypass toàn bộ RLS, gây nguy cơ bảo mật nghiêm trọng). Chỉ dùng cho webhooks nội bộ.
- **Tối ưu Query (Postgres)**: Tránh lấy thừa dữ liệu (`.select('*')`). Sử dụng foreign key constraints thay vì tự handle logic liên kết ở App level.

### 2. Kiến Trúc Next.js & Server Actions
- **Feature-based Structure**: Code logic nằm ở `src/features/{tên-tính-năng}/`. Thư mục `app/` chỉ làm nhiệm vụ routing.
- **Validation 100%**: MỌI Server Action phải bắt đầu bằng việc `.parse()` input thông qua Zod Schema.
- **Data Mutation UX**: Luôn bắt trạng thái `isPending` (qua `useTransition` hoặc hook form) khi gọi Server Action. Có UI xử lý Error State hiển thị lỗi từ server trả về.

### 3. Quy ước Code (Coding Standards)
- **TypeScript**: Sử dụng type an toàn sinh ra từ Supabase CLI (`Database` type). Không dùng `any`.
- Mảng data render từ DB lấy lên luôn phải kiểm tra null/undefined và cung cấp Empty State (UI báo trống) nếu không có dữ liệu.

## Thư Mục Mẫu (MVP Vertical Slice với Supabase)

```text
src/
├── app/
│   └── (dashboard)/tasks/page.tsx      # RSC: Fetch data qua Supabase client + render <TaskList />
├── components/                         # UI Components dùng chung
├── lib/
│   └── supabase/
│       ├── server.ts                   # Chứa hàm tạo client cho Server (xử lý cookie)
│       ├── client.ts                   # Chứa hàm tạo client cho Browser
│       └── database.types.ts           # Types auto-generated từ Supabase CLI
└── features/
    └── tasks/
        ├── actions.ts                  # "use server" - Gọi Supabase mutation
        ├── components/                 # Các Client/Server components của feature
        └── schemas.ts                  # Zod schema cho Task