# LunchOrder — Technical Design Document (TDD)

> **Version:** 1.0  
> **Stack:** Next.js 15 · Supabase · Drizzle ORM · Vercel  
> **Tham chiếu:** LunchOrder BRD v1.0

---

## 1. Tech Stack Overview

| Layer            | Công nghệ                          | Ghi chú                                      |
|------------------|------------------------------------|----------------------------------------------|
| Framework        | Next.js 15 (App Router)            | Frontend + Backend trong cùng 1 repo         |
| Language         | TypeScript                         | Strict mode                                  |
| Backend logic    | Server Actions                     | Mutations; không dùng Route Handlers         |
| Database         | Supabase PostgreSQL                | Free tier: 500MB storage, 2 projects         |
| Auth             | Supabase Auth + Google OAuth 2.0   | Session quản lý bởi Supabase                 |
| ORM              | Drizzle ORM                        | Type-safe, nhẹ, migration tích hợp           |
| Styling          | TailwindCSS v4                     |                                              |
| UI Components    | shadcn/ui (Radix UI)               | Cài từng component, không bundle toàn bộ     |
| Icons            | Lucide React                       |                                              |
| State (client)   | Zustand                            | Chỉ dùng cho UI state & optimistic updates   |
| Form             | React Hook Form + Zod              | shadcn `<Form>` wraps RHF; Zod validate 2 lớp|
| Deploy           | Vercel (frontend + serverless)     | Free tier: 100GB bandwidth/tháng             |
| Image (QR)       | VietQR API (img.vietqr.io)         | Generate QR code phía client, không lưu      |

---

## 2. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Next.js 15)               │
│                                                     │
│  ┌──────────────┐        ┌──────────────────────┐   │
│  │  React Pages │◄──────►│   Server Actions     │   │
│  │  (Client)    │        │   (Mutations)        │   │
│  │              │        │                      │   │
│  │  Zustand     │        │  Drizzle ORM         │   │
│  │  RHF + Zod   │        │  Zod (re-validate)   │   │
│  └──────────────┘        └──────────┬───────────┘   │
│                                     │               │
└─────────────────────────────────────┼───────────────┘
                                      │ PostgreSQL wire protocol
                         ┌────────────▼────────────┐
                         │     Supabase             │
                         │  ┌─────────────────────┐ │
                         │  │  PostgreSQL (DB)     │ │
                         │  │  Auth (Google OAuth) │ │
                         │  │  Row Level Security  │ │
                         │  └─────────────────────┘ │
                         └─────────────────────────┘
```

### Luồng dữ liệu chính

```
User action (form submit)
  → React Hook Form validate (Zod — client)
  → Server Action được gọi
  → Zod re-validate (server — không tin client)
  → Drizzle query → Supabase PostgreSQL
  → Trả về { success, data, error }
  → Revalidate cache (revalidatePath / revalidateTag)
  → UI cập nhật
```

---

## 3. Authentication Flow

### 3.1 Google OAuth với Supabase Auth

```
User click "Đăng nhập Google"
  → supabase.auth.signInWithOAuth({ provider: 'google' })
  → Redirect sang Google consent screen
  → Google callback → Supabase Auth xử lý token
  → Supabase tạo session (cookie httpOnly)
  → Redirect về app → middleware.ts đọc session
  → User profile sync vào bảng users (nếu lần đầu)
```

### 3.2 Middleware bảo vệ route

```typescript
// middleware.ts
// Các route cần đăng nhập: /dashboard, /sessions/*, /admin/*
// Các route public: /, /sessions/[shareToken] (viewer)
// Redirect về /login nếu chưa auth
```

### 3.3 Role mapping

- Sau khi đăng nhập lần đầu → role mặc định là `member`
- `admin` được set thủ công trong bảng `users` bởi admin hiện tại
- `host` / `viewer` là role **trong phiên**, không phải role hệ thống

---

## 4. Database Schema (Drizzle ORM)

### 4.1 Sơ đồ quan hệ

```
users
  ├──< sessions (host_id)
  ├──< session_participants (user_id)
  └──< order_items (user_id)

restaurants
  └──< menu_items
        └──< topping_groups
               └──< topping_options

sessions
  ├── restaurant_id → restaurants
  ├──< session_vote_candidates (session_id)
  ├──< session_votes (session_id)
  ├──< session_participants (session_id)
  └──< order_items (session_id)

order_items
  └──< order_item_toppings (order_item_id)
```

### 4.2 Chi tiết các bảng

#### `users`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
email           text UNIQUE NOT NULL
name            text NOT NULL
avatarUrl       text
role            text NOT NULL DEFAULT 'member'  -- 'admin' | 'member'
bankCode        text        -- thông tin VietQR của user
accountNumber   text
accountName     text
createdAt       timestamptz DEFAULT now()
```

#### `restaurants`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text NOT NULL
category        text
address         text
phoneNumber     text
defaultShipFee  integer DEFAULT 0
note            text
isGlobal        boolean NOT NULL DEFAULT false
createdBy       uuid REFERENCES users(id)
createdAt       timestamptz DEFAULT now()
```

> `isGlobal = true` → Admin quản lý, dùng chung  
> `isGlobal = false` → Host tạo trong phiên, chỉ thuộc về phiên đó

#### `menu_items`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
restaurantId    uuid NOT NULL REFERENCES restaurants(id)
name            text NOT NULL
price           integer NOT NULL   -- đơn vị: đồng VNĐ
category        text
description     text
imageUrl        text
isAvailable     boolean NOT NULL DEFAULT true
createdAt       timestamptz DEFAULT now()
```

#### `topping_groups`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
menuItemId      uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE
groupName       text NOT NULL
isRequired      boolean NOT NULL DEFAULT false
minSelect       integer NOT NULL DEFAULT 0
maxSelect       integer NOT NULL DEFAULT 1
sortOrder       integer NOT NULL DEFAULT 0
```

#### `topping_options`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
toppingGroupId  uuid NOT NULL REFERENCES topping_groups(id) ON DELETE CASCADE
name            text NOT NULL
extraPrice      integer NOT NULL DEFAULT 0
isAvailable     boolean NOT NULL DEFAULT true
sortOrder       integer NOT NULL DEFAULT 0
```

#### `sessions`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
title           text NOT NULL
hostId          uuid NOT NULL REFERENCES users(id)
restaurantId    uuid REFERENCES restaurants(id)   -- null khi đang VOTING
isVotingEnabled boolean NOT NULL DEFAULT false
status          text NOT NULL DEFAULT 'ORDERING'
-- 'VOTING' | 'ORDERING' | 'LOCKED' | 'PAYING' | 'COMPLETED' | 'CANCELLED'
deadline        timestamptz
shipFee         integer NOT NULL DEFAULT 0
serviceFee      integer NOT NULL DEFAULT 0
grandTotal      integer   -- null = tự tính subtotal + extraFee
splitMethod     text NOT NULL DEFAULT 'BY_ITEM'  -- 'EQUAL' | 'BY_ITEM'
shareToken      text UNIQUE NOT NULL  -- token cho viewer link
createdAt       timestamptz DEFAULT now()
updatedAt       timestamptz DEFAULT now()
```

#### `session_vote_candidates`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
sessionId       uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE
restaurantId    uuid NOT NULL REFERENCES restaurants(id)
addedBy         uuid NOT NULL REFERENCES users(id)
```

#### `session_votes`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
sessionId       uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE
userId          uuid NOT NULL REFERENCES users(id)
candidateId     uuid NOT NULL REFERENCES session_vote_candidates(id)
createdAt       timestamptz DEFAULT now()
UNIQUE(sessionId, userId)   -- mỗi user 1 phiếu / phiên
```

#### `session_participants`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
sessionId       uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE
userId          uuid NOT NULL REFERENCES users(id)
joinedAt        timestamptz DEFAULT now()
UNIQUE(sessionId, userId)
```

#### `order_items`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
sessionId       uuid NOT NULL REFERENCES sessions(id)
userId          uuid NOT NULL REFERENCES users(id)
menuItemId      uuid NOT NULL REFERENCES menu_items(id)
quantity        integer NOT NULL DEFAULT 1
note            text
unitBasePrice   integer NOT NULL   -- snapshot giá base tại lúc order
unitFinalPrice  integer NOT NULL   -- snapshot giá sau topping
createdAt       timestamptz DEFAULT now()
updatedAt       timestamptz DEFAULT now()
```

#### `order_item_toppings`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
orderItemId     uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE
toppingOptionId uuid NOT NULL REFERENCES topping_options(id)
toppingName     text NOT NULL      -- snapshot tên
extraPrice      integer NOT NULL   -- snapshot giá
```

---

## 5. Row Level Security (RLS)

Supabase RLS đảm bảo security ở tầng database — không phụ thuộc hoàn toàn vào logic app.

| Bảng                     | SELECT                              | INSERT / UPDATE / DELETE              |
|--------------------------|-------------------------------------|---------------------------------------|
| `users`                  | Chính mình                          | Chính mình (profile)                  |
| `restaurants` (global)   | Tất cả authenticated                | Chỉ admin                             |
| `restaurants` (non-global)| Session participants               | Host của session liên quan            |
| `menu_items`             | Tất cả authenticated                | Admin (global) / Host (session)       |
| `sessions`               | Participants + viewer qua shareToken| Host (UPDATE), authenticated (INSERT) |
| `session_votes`          | Participants của session            | Chính mình, khi session VOTING        |
| `order_items`            | Participants của session            | Chính mình, khi session ORDERING      |
| `order_item_toppings`    | Theo order_item                     | Theo order_item                       |

---

## 6. Project Structure

```
lunchorder/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # Trang đăng nhập Google
│   ├── (app)/                        # Layout có sidebar/nav, yêu cầu auth
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Danh sách phiên của user
│   │   ├── sessions/
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Tạo phiên mới
│   │   │   └── [sessionId]/
│   │   │       ├── page.tsx          # Chi tiết phiên (order/vote)
│   │   │       ├── bill/
│   │   │       │   └── page.tsx      # Tổng kết bill & QR
│   │   │       └── summary/
│   │   │           └── page.tsx      # Lịch sử phiên đã xong
│   │   ├── restaurants/              # Quản lý nhà hàng (admin)
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx              # Cài đặt tài khoản, bank info
│   ├── share/
│   │   └── [shareToken]/
│   │       └── page.tsx              # Viewer public link (no auth)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts              # Supabase OAuth callback handler
│   └── layout.tsx
│
├── components/
│   ├── ui/                           # shadcn/ui components (auto-generated)
│   ├── session/
│   │   ├── SessionCard.tsx
│   │   ├── SessionStatusBadge.tsx
│   │   ├── VotePanel.tsx
│   │   └── OrderPanel.tsx
│   ├── bill/
│   │   ├── BillSummaryTable.tsx
│   │   └── VietQRCard.tsx
│   ├── restaurant/
│   │   ├── RestaurantSelector.tsx
│   │   └── MenuItemCard.tsx
│   └── shared/
│       ├── UserAvatar.tsx
│       └── ReloadButton.tsx          # Manual refresh button
│
├── actions/                          # Server Actions (mutations)
│   ├── sessionActions.ts             # createSession, lockSession, completeSession...
│   ├── orderActions.ts               # addOrderItem, updateOrderItem, removeOrderItem
│   ├── voteActions.ts                # castVote, changeVote, closeVoting
│   ├── restaurantActions.ts          # createRestaurant, updateMenuItem...
│   ├── billActions.ts                # updateBillSettings, markAsPaid
│   └── userActions.ts               # updateProfile, updateBankInfo
│
├── lib/
│   ├── db/
│   │   ├── index.ts                  # Drizzle client instance
│   │   ├── schema.ts                 # Tất cả Drizzle table definitions
│   │   └── migrations/               # Drizzle migration files
│   ├── supabase/
│   │   ├── client.ts                 # createBrowserClient()
│   │   └── server.ts                 # createServerClient() cho Server Components
│   ├── validations/                  # Zod schemas dùng chung client + server
│   │   ├── sessionSchema.ts
│   │   ├── orderSchema.ts
│   │   └── restaurantSchema.ts
│   ├── bill.ts                       # Pure functions tính bill (EQUAL / BY_ITEM)
│   └── utils.ts
│
├── stores/                           # Zustand stores
│   ├── sessionStore.ts               # UI state phiên hiện tại
│   └── orderStore.ts                 # Optimistic order updates
│
├── types/
│   └── index.ts                      # Shared TypeScript types / enums
│
├── middleware.ts                     # Auth guard + route protection
├── drizzle.config.ts
└── .env.local
```

---

## 7. Server Actions Pattern

Tất cả mutations đi qua Server Actions theo convention thống nhất:

```typescript
// actions/sessionActions.ts

'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { sessions } from '@/lib/db/schema'
import { createSessionSchema } from '@/lib/validations/sessionSchema'

export async function createSession(formData: unknown) {
  // 1. Auth check
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 2. Validate (Zod — server side, không tin client)
  const parsed = createSessionSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  // 3. Business logic + DB query (Drizzle)
  const newSession = await db.insert(sessions).values({
    title: parsed.data.title,
    hostId: user.id,
    // ...
  }).returning()

  // 4. Revalidate cache
  revalidatePath('/dashboard')

  return { success: true, data: newSession[0] }
}
```

---

## 8. Bill Calculation Module

Logic tính bill được tách thành **pure functions** trong `lib/bill.ts` — dễ test, không side effects.

```typescript
// lib/bill.ts

export interface MemberOrderSummary {
  userId: string
  memberName: string
  memberSubtotal: number   // Σ unitFinalPrice × quantity của member
}

export interface BillResult {
  subtotal: number
  extraFee: number
  grandTotal: number       // host nhập hoặc subtotal + extraFee
  memberBills: {
    userId: string
    memberName: string
    memberSubtotal: number
    amountToPay: number    // số tiền cuối cùng member phải trả
  }[]
}

// Chia đều
export function calculateEqualSplit(
  memberSummaries: MemberOrderSummary[],
  extraFee: number,
  overrideGrandTotal?: number
): BillResult { ... }

// Chia theo món: memberSubtotal × grandTotal / subtotal
export function calculateByItemSplit(
  memberSummaries: MemberOrderSummary[],
  extraFee: number,
  overrideGrandTotal?: number
): BillResult {
  const subtotal = memberSummaries.reduce((sum, m) => sum + m.memberSubtotal, 0)
  const grandTotal = overrideGrandTotal ?? subtotal + extraFee

  // Tính raw amount cho từng member
  const rawAmounts = memberSummaries.map(member => ({
    ...member,
    rawAmount: member.memberSubtotal * grandTotal / subtotal
  }))

  // Làm tròn đến đơn vị đồng, điều chỉnh phần lẻ vào member có subtotal lớn nhất
  const memberBills = adjustRoundingDiff(rawAmounts, grandTotal)

  return { subtotal, extraFee, grandTotal, memberBills }
}
```

---

## 9. VietQR Integration

QR code được generate **phía client**, không cần gọi API riêng — chỉ build URL:

```typescript
// components/bill/VietQRCard.tsx

const buildVietQRUrl = ({
  bankCode,
  accountNumber,
  accountName,
  amount,
  sessionId,
  memberName,
}: VietQRParams): string => {
  const transferContent = `LUNCHORDER ${sessionId.slice(0, 8).toUpperCase()} ${memberName}`
  return (
    `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png` +
    `?amount=${amount}` +
    `&addInfo=${encodeURIComponent(transferContent)}` +
    `&accountName=${encodeURIComponent(accountName)}`
  )
}
```

---

## 10. Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Drizzle (direct connection — dùng cho migrations & server-side)
DATABASE_URL=postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Lưu ý Supabase free tier:** Dùng `DATABASE_URL` với **connection pooling** (`?pgbouncer=true&connection_limit=1`) khi deploy lên Vercel serverless để tránh hết connection pool.

---

## 11. Free Tier Constraints & Giải pháp

| Giới hạn                         | Free Tier             | Giải pháp                                      |
|----------------------------------|-----------------------|------------------------------------------------|
| Supabase DB storage              | 500 MB                | Đủ cho 50 người × nhiều tháng; ảnh không lưu DB |
| Supabase Auth MAU                | 50,000 users/tháng    | Không lo với nhóm nội bộ                       |
| Supabase DB connections          | 60 direct connections | Dùng **Supabase Pooler** (port 6543) cho Vercel |
| Vercel serverless execution      | 100 GB-hrs/tháng      | Server Actions nhẹ, không lo                  |
| Vercel bandwidth                 | 100 GB/tháng          | Không serve media nặng                        |
| Supabase project pause (7 ngày)  | Project pause nếu inactive | Ping định kỳ hoặc upgrade nếu cần       |

---

## 12. Dependency List

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.0.0",

    "@supabase/supabase-js": "^2.0.0",
    "@supabase/ssr": "^0.0.10",

    "drizzle-orm": "^0.30.0",
    "postgres": "^3.4.0",

    "zod": "^3.22.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.3.0",

    "zustand": "^4.5.0",

    "tailwindcss": "^4.0.0",
    "lucide-react": "^0.363.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0"
  }
}
```

> **shadcn/ui** không phải npm package — cài từng component qua `npx shadcn@latest add [component]`

---

## 13. Development Workflow

```bash
# 1. Setup project
npx create-next-app@latest lunchorder --typescript --tailwind --app

# 2. Cài dependencies
npm install @supabase/supabase-js @supabase/ssr drizzle-orm postgres
npm install zod react-hook-form @hookform/resolvers zustand lucide-react
npm install -D drizzle-kit

# 3. Init shadcn/ui
npx shadcn@latest init

# 4. Drizzle migrations
npx drizzle-kit generate   # sinh migration files từ schema
npx drizzle-kit migrate    # apply lên Supabase

# 5. Supabase RLS
# Viết SQL policies trong Supabase Dashboard > Authentication > Policies
```

---

## 14. Các điểm kỹ thuật cần lưu ý

| ID   | Điểm cần chú ý                                                                                            |
|------|-----------------------------------------------------------------------------------------------------------|
| T01  | **Connection pooling**: Dùng Supabase Pooler URL (port 6543) cho Drizzle trong môi trường serverless Vercel |
| T02  | **Price snapshot**: `unitBasePrice` và `unitFinalPrice` lưu tại thời điểm order — không join sang `menu_items.price` khi tính bill |
| T03  | **grandTotal rounding**: Khi `splitMethod = BY_ITEM`, điều chỉnh phần lẻ vào member có `memberSubtotal` lớn nhất để Σ = grandTotal chính xác |
| T04  | **RLS + Server Actions**: Dù RLS đã bảo vệ ở DB layer, Server Actions vẫn phải check auth và ownership trước khi query |
| T05  | **shareToken**: Dùng `nanoid()` hoặc `crypto.randomUUID()` để sinh token ngắn, unique — không expose `sessionId` thật lên URL public |
| T06  | **Supabase project pause**: Free tier pause sau 7 ngày inactive — cân nhắc keep-alive cron job đơn giản hoặc nâng Pro nếu dùng thực tế |
| T07  | **Zustand scope**: Chỉ dùng Zustand cho UI state (modal open/close, optimistic update) — source of truth vẫn là DB |
| T08  | **Drizzle migrations**: Không sửa tay file migration đã apply — luôn dùng `drizzle-kit generate` để tạo migration mới |
