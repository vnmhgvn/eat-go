---
trigger: model_decision
description: Load when working with TypeScript, Next.js, React, UI components, pages, server actions, or any frontend/web-related tasks.
---

# Frontend Rules — Next.js 15 · React 19 · TypeScript 5

> **Stack**: Next.js 15 (App Router) · React 19 · TypeScript 5 · Tailwind CSS · shadcn/ui · TanStack Query · Zod · React Hook Form

> **Trigger**: Load khi làm việc với TypeScript/Next.js code, UI components, pages, hoặc server actions.

---

## Hard Constraints

### MUST

- Default to **Server Components** — `"use client"` only on leaf interactive components
- Co-locate client components inside `_components/` of their page folder
- Use **Zod** for ALL validation — forms, API responses, env vars
- Use **TypeScript strict mode** — no `any`, no `@ts-ignore` without comment
- Use **Server Actions** for mutations — not client-side fetch to local API routes
- Authenticate at the **layout level** — redirect unauthenticated users in layout
- `loading.tsx` + `error.tsx` on every route segment that fetches data
- Always `next/image` — never `<img>` tag
- Always `next/font` — never `@import` in CSS
- **`Promise.all()`** for independent parallel fetches — never sequential awaits
- **`next/dynamic`** for heavy client components (charts, editors, maps)
- **Suspense boundaries** around every slow data fetch
- Validate env vars with Zod schema at startup
- Load the appropriate skill before any UI task

### MUST NOT

- `"use client"` on page-level `page.tsx` — push boundary down to leaf components
- `useEffect` for data fetching — Server Components are async by default
- Use `any` type — always define proper TypeScript interfaces
- Expose `process.env.SECRET_*` to browser — only `NEXT_PUBLIC_*` vars
- API Routes for mutations that can use Server Actions
- Prop drilling more than 2 levels — use composition or React Context
- Barrel imports from `index.ts` — import directly from source file
- `useMemo` / `useCallback` without proven performance issue
- `localStorage` / `sessionStorage` on first render → hydration mismatch
- Generic aesthetics — avoid overused fonts, purple gradients, cookie-cutter layouts

---

## Folder Structure — Next.js App Router

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/login/
│   │   ├── page.tsx              # Server Component (default)
│   │   └── _components/         # Co-located client components
│   ├── (dashboard)/users/
│   │   ├── page.tsx
│   │   └── _components/
│   ├── api/                      # API Routes (webhooks only)
│   └── layout.tsx
├── components/                   # Shared UI (shadcn/ui, layout)
├── features/                     # Feature-scoped logic
│   └── {feature}/
│       ├── actions.ts            # Server Actions ("use server")
│       ├── queries.ts            # TanStack Query hooks
│       ├── api.ts                # Fetch functions (server-side)
│       ├── schemas.ts            # Zod schemas
│       └── types.ts
└── lib/                          # Shared utilities (auth, fetch, utils)
```

### Layer Responsibilities

| Layer                | File                    | Responsibility                                        |
| -------------------- | ----------------------- | ----------------------------------------------------- |
| **Page**             | `app/**/page.tsx`       | Server Component — fetch data, no interactivity       |
| **Layout**           | `app/**/layout.tsx`     | Server Component — shell, auth check                  |
| **Server Action**    | `features/*/actions.ts` | `"use server"` — mutations, revalidation              |
| **Client Component** | `_components/*.tsx`     | `"use client"` — interactivity, receive data as props |
| **Query Hook**       | `features/*/queries.ts` | TanStack Query — client-side data fetching            |
| **Schema**           | `features/*/schemas.ts` | Zod — shared validation (server + client)             |

---

## State Management

| State Type                      | Solution                             |
| ------------------------------- | ------------------------------------ |
| Server data (cached)            | RSC + `fetch` with `revalidate`      |
| Server data (real-time)         | TanStack Query                       |
| Form state                      | React Hook Form + Zod                |
| URL state (filters, pagination) | `useSearchParams` + `nuqs`           |
| Global client UI state          | `useState` / `useReducer` in Context |

---

## Pre-Implementation Checklist

1. **Which skill?** — Read the relevant `SKILL.md` first
2. **Server or Client?** — Interactivity needed? If no → Server Component
3. **Data fetch?** — Page (server) or TanStack Query (client)?
4. **Mutation?** — Server Action (forms) or useMutation (dynamic)?
5. **Loading/Error?** — `loading.tsx` + `error.tsx` in place?
6. **Auth guard?** — Layout-level redirect? `auth()` in Server Action?
7. **Aesthetic score ≥ 7/10?** — Evaluate against WCAG 2.1 AA before shipping
