# 🐛 Bug Report

# BUG-03: Invalid UUID Syntax Error when Navigating to /sessions/new

## 1. Meta

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| **Epic**       | [epic-01-lunchorder](docs/product/epics/epic-01-lunchorder.md) |
| **Feature**    | [F-003: Order Session Lifecycle](docs/product/features/epic-01-lunchorder/F-003-order-session.md) |
| **Priority**   | P1 (High)                                       |
| **Severity**   | 🔴 Blocker for creating new sessions                  |
| **Status**     | 🟢 Resolved                                        |
| **Reporter**   | User                                                |
| **Assignee**   | Debugging Specialist                                |
| **Environment**| Local Development                                     |
| **Version**    | feature/epic-01-lunchorder-initial-impl               |

---

## 2. Description

### Summary

When clicking to create a new session (navigating to `/sessions/new`), the application attempts to load the dynamic route `/sessions/[sessionId]`, treating `"new"` as the `sessionId`. This causes a PostgreSQL error when Drizzle attempts to query the `sessions` table using the string `"new"` for a UUID column.

### Steps to Reproduce

```
1. Log in to the application.
2. Click the button to create a new session, which navigates to `/sessions/new`.
3. Observe: A 500 error occurs with `invalid input syntax for type uuid: "new"`.
```

### Expected Behavior

The application should either route correctly to a standalone `/sessions/new` page to create a session, or if creating a session is handled via a modal/server action directly from the dashboard, it shouldn't try to query the DB with "new" as an ID. The dynamic route `[sessionId]` validation should return a 404 (Not Found) if the `sessionId` is not a valid UUID.

### Actual Behavior

The Next.js App Router matches `/sessions/new` to `src/app/(app)/sessions/[sessionId]/page.tsx` and passes `"new"` as the parameter. Drizzle tries to execute `select ... from sessions where id = 'new'`, which Postgres rejects because `id` is a UUID column type.

---

## 3. Evidence

### Screenshots / Videos

- N/A

### Logs / Error Messages

```
Error: Failed query: select ... from "sessions" where "sessions"."id" = $1 params: new
[cause]: Error [PostgresError]: invalid input syntax for type uuid: "new"
    routine: 'string_to_uuid'
```

### Related Data

- URL: `/sessions/new`

---

## 4. Impact Analysis

### Users Affected

- Any host trying to create a new session.

### Business Impact

- Users cannot create new sessions, blocking the core flow of the application.

### Workaround

- [x] **Không có workaround** — cần fix ngay

---

## 5. Root Cause Analysis

### Root Cause
The `Dashboard` page contains a link to create a new session pointing to `/sessions/new`. However, the `/sessions/new/page.tsx` file was never created during the initial feature implementation. Because Next.js uses file-system based routing, when a user accesses `/sessions/new`, Next.js falls back to the dynamic route `src/app/(app)/sessions/[sessionId]/page.tsx` and passes the string literal `"new"` as the `sessionId` parameter. 

The `page.tsx` file immediately tries to query the database using Drizzle: `db.select().from(sessions).where(eq(sessions.id, sessionId))`. Since the `sessions.id` column is a UUID, PostgreSQL throws a syntax error `invalid input syntax for type uuid: "new"` when trying to compare it with the string `"new"`, crashing the page.

### Affected Files
| File | Issue |
| ---- | ----- |
| `src/app/(app)/sessions/new/page.tsx` | Missing entirely, causing fallback to dynamic route. |
| `src/app/(app)/sessions/[sessionId]/page.tsx` | Missing UUID parameter validation before DB query. |
| `src/app/(app)/sessions/[sessionId]/bill/page.tsx` | Missing UUID parameter validation before DB query. |

---

## 6. Resolution

### Fix Description
1. Created the missing `src/app/(app)/sessions/new/page.tsx` to handle the session creation form properly. It collects `title`, `isVotingEnabled`, `restaurantId` (if voting disabled), fees, and split method, and then calls the `createSession` server action.
2. Added a robust standard UUID format validation regex (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) to the dynamic `sessionId` parameter in both `[sessionId]/page.tsx` and `[sessionId]/bill/page.tsx` before executing any DB queries. If the query parameter is not a valid UUID format, `notFound()` is immediately called, gracefully showing a 404 page rather than crashing the Postgres integration.

### Fix Verification
- [x] Unit test added cho scenario gây bug (N/A — UI routing & Validation)
- [x] Regression test: các flows liên quan vẫn hoạt động
- [x] Bug không reproduce được sau fix
- [x] Code review passed

### Related PR/Branch
- Branch: `fix/BUG-03-session-new-uuid`
- PR: N/A

---

## 7. Change Log

| Date       | Author | Changes                |
| ---------- | ------ | ---------------------- |
| 2026-03-05 | Antigravity | Bug reported           |
| 2026-03-05 | Antigravity | Root cause identified: Missing route causes fallback |
| 2026-03-05 | Antigravity | Fix implemented: Added `sessions/new` and UUID validation |
| 2026-03-05 | Antigravity | Verified and closed    |
