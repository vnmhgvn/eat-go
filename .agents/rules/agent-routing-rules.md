---
trigger: always_on
---

# Agent Routing Rules

> **Mục tiêu**: Đảm bảo mọi yêu cầu từ người dùng được xử lý đúng agent, đúng flow — không thiếu bước, không thừa overhead.

---

## 🎯 1. Prompt Enhancement

**Khi nào cần enhance:**

| Tình huống                                                | Hành động                                                       |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| Yêu cầu mơ hồ, thiếu scope, thiếu constraint              | **BẮT BUỘC** — load `prompt-engineer`, enhance rồi mới thực thi |
| Yêu cầu phức tạp (nhiều bước, nhiều agent, cross-service) | **BẮT BUỘC** — cấu trúc lại thành spec có AC trước khi delegate |
| Yêu cầu rõ ràng, đơn giản                                 | **BỎ QUA** — thực thi trực tiếp                                 |

### MUST NOT

- Suy diễn scope khi người dùng chưa confirm
- Bỏ qua enhancement cho task phức tạp

---

## 🔧 2. Routing Decision Table

| Loại yêu cầu                      | Route to                                                | Tier xác định |
| --------------------------------- | ------------------------------------------------------- | ------------- |
| Feature mới, epic mới             | `orchestrator`                                          | Tier 2–3      |
| Change Request (CR)               | `orchestrator`                                          | Tier 2–3      |
| Hotfix / Fix bug                  | `orchestrator` hoặc trực tiếp (\*)                      | Tier 1–3      |
| Refactor code                     | `orchestrator`                                          | Tier 2–3      |
| Cập nhật config / chore           | `orchestrator` hoặc trực tiếp (\*)                      | Tier 1        |
| Viết / cập nhật test              | `orchestrator` hoặc `testing-specialist` trực tiếp (\*) | Tier 1–2      |
| Hỏi kiến thức / giải thích code   | Trả lời trực tiếp                                       | —             |
| Tạo/cập nhật tài liệu (docs only) | Trả lời trực tiếp                                       | —             |
| Tạo rule / skill / workflow       | Trả lời trực tiếp                                       | —             |

> (\*) = xem Direct Bypass ở Mục 3

---

## 📊 3. Task Complexity Tier

### Bảng phân loại

| Tier  | Tên      | Điều kiện                                                                                 | Orchestrator Flow                                                                                |
| ----- | -------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **1** | Simple   | ≤ 3 files thay đổi · không cần thiết kế mới · không ảnh hưởng API contract                | Bỏ Step 1 (Requirements) nếu spec có sẵn                                                         |
| **2** | Standard | Feature mới trong 1 module/service · bug fix có impact trung bình                         | Full flow Step 0 → 7, skip `document-analyzer` nếu spec có sẵn                                   |
| **3** | Complex  | Cross-service/module · breaking API change · cần architecture decision mới · NFR thay đổi | Full flow **bắt buộc** · `architect-specialist` phải approve trước khi bất kỳ code nào được viết |

### ⚡ Quick Tier Decision — Dùng checklist này MỖI KHI nhận task mới

> **Bắt buộc hoàn thành trước khi route task.** Trả lời theo thứ tự, dừng ngay khi có YES đầu tiên.

```
┌─────────────────────────────────────────────────────────────────┐
│  TIER DECISION CHECKLIST                                        │
├─────────────────────────────────────────────────────────────────┤
│  [ ] 1. Breaking API change hoặc cross-service impact?  → Tier 3│
│  [ ] 2. Cần thiết kế mới (DB schema, auth, saga)?       → Tier 3│
│  [ ] 3. Ảnh hưởng > 3 files hoặc > 1 module?           → Tier 2│
│  [ ] 4. Feature mới trong 1 module duy nhất?            → Tier 2│
│  [ ] 5. Chỉ sửa ≤ 3 files, không cần design mới?       → Tier 1│
│                                                                 │
│  Kết quả: Tier ___                                              │
└─────────────────────────────────────────────────────────────────┘
```

> **Khi nghi ngờ giữa 2 tier** → luôn chọn tier cao hơn. Chi phí over-engineering thấp hơn chi phí rework.

### Chi tiết câu hỏi xác định Tier

```
Hỏi theo thứ tự, dừng lại khi có câu trả lời YES:

1. Có thay đổi API contract hoặc breaking change không?           → YES = Tier 3
2. Có ảnh hưởng > 1 service hoặc module không?                   → YES = Tier 3
3. Có cần thiết kế mới (DB schema, auth flow, idempotency)?      → YES = Tier 2-3
4. Có ảnh hưởng > 3 files không?                                 → YES = Tier 2
5. Chỉ sửa 1 bug nhỏ trong 1 function/handler?                   → YES = Tier 1
6. Thêm field vào endpoint đã có, không đổi contract?            → YES = Tier 1-2
```

### Direct Bypass — Tier 1 không cần full orchestrator

Với **Tier 1**, được phép gọi specialist agent trực tiếp (không qua orchestrator) khi:

| Tình huống                                | Agent trực tiếp        | Điều kiện                                      |
| ----------------------------------------- | ---------------------- | ---------------------------------------------- |
| Fix bug nhỏ đã biết rõ root cause         | `debugging-specialist` | File ≤ 3, không cần architect                  |
| Viết test cho 1 feature đã implement xong | `testing-specialist`   | Spec + code đã có                              |
| Review nhanh 1 file trước merge           | `reviewer`             | Không có blocking issue cần redesign           |
| Implement NestJS/non-Spring backend nhỏ   | `backend-specialist`   | Fallback cho NestJS — không có dedicated agent |

> Direct Bypass chỉ áp dụng khi **chắc chắn** là Tier 1. Khi nghi ngờ → route qua orchestrator.

### Escalation Path

Khi agent không thể xử lý tiếp:

```
debugging-specialist thất bại 3 lần  →  architect-specialist (redesign)
testing-specialist phát hiện bug      →  orchestrator → debugging-specialist
reviewer phát hiện Blocking issue     →  orchestrator → specialist → fix → re-review
architect không rõ requirement        →  orchestrator → document-analyzer → clarify
```

---

## 🔄 4. Full Routing Flow

```
Nhận yêu cầu
    │
    ▼
[1] Prompt Enhancement
    ├── Rõ ràng?  → tiếp tục
    └── Mơ hồ?   → load prompt-engineer → enhance → xác nhận → tiếp tục
    │
    ▼
[2] Phân loại yêu cầu
    ├── KHÔNG liên quan code? → xử lý trực tiếp
    └── Liên quan CODE?
        │
        ▼
    [3] Xác định Complexity Tier (1 / 2 / 3)
        │
        ├── Tier 1 → Direct Bypass? (xem bảng trên)
        │             YES → gọi specialist trực tiếp
        │             NO  → orchestrator (fast-track: bỏ Step 1)
        │
        ├── Tier 2 → orchestrator (full flow, có thể skip document-analyzer)
        │
        └── Tier 3 → orchestrator → architect-specialist first (MANDATORY)
                                         ↓
                                   architect approve
                                         ↓
                              implement (backend/frontend)
```
