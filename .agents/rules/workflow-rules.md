---
trigger: always_on
---

# Workflow Rules — Quy trình làm việc

> **Áp dụng cho tất cả agents**. Các quy tắc này là bắt buộc khi thực hiện bất kỳ task nào trong dự án.

---

## 1. Sử dụng Template

Khi tạo mới epic, feature, bug, CR, hoặc bất kỳ tài liệu sản phẩm nào — **PHẢI** sử dụng template trong `docs/templates/`.

| Loại tài liệu  | Template                                       | Đường dẫn output                                   |
| -------------- | ---------------------------------------------- | -------------------------------------------------- |
| Epic mới       | `docs/templates/EPIC_TEMPLATE.md`              | `docs/product/epics/epic-{name}.md`                |
| Feature mới    | `docs/templates/FEATURE_SPEC_TEMPLATE.md`      | `docs/product/features/epic-{name}/feat-{name}.md` |
| Feature (nhẹ)  | `docs/templates/FEATURE_SPEC_TEMPLATE_LITE.md` | `docs/product/features/epic-{name}/feat-{name}.md` |
| Bug report     | `docs/templates/BUG_TEMPLATE.md`               | `docs/product/bugs/bug-{id}-{name}.md`             |
| Change Request | `docs/templates/CR_TEMPLATE.md`                | `docs/product/cr/cr-{id}-{name}.md`                |
| Business Rules | `docs/templates/BUSINESS_RULES_TEMPLATE.md`    | `docs/product/features/` (đi kèm feature)          |

### MUST

- Copy template → điền thông tin → lưu vào đúng đường dẫn output
- Giữ nguyên cấu trúc sections của template — không xóa section
- Điền đầy đủ các fields bắt buộc (Meta, Status, Acceptance Criteria)

### MUST NOT

- Tạo tài liệu từ scratch mà không dùng template
- Thay đổi cấu trúc template gốc trong `docs/templates/`
- Bỏ qua sections quan trọng (Acceptance Criteria, Out of Scope)

---

## 2. Cập nhật Changelog

Sau khi hoàn thành bất kỳ task nào (feature, fix, CR, chore) — **PHẢI** cập nhật `docs/product/CHANGELOG.md`.

### Format (Keep a Changelog)

```markdown
## [Unreleased]

### Added

- Mô tả feature/functionality mới (TICKET-ID)

### Changed

- Mô tả thay đổi behavior hiện có (TICKET-ID)

### Fixed

- Mô tả bug đã fix (TICKET-ID)

### Removed

- Mô tả feature/code đã loại bỏ (TICKET-ID)
```

### Rules

- Ghi ngay sau khi task hoàn thành — không đợi cuối sprint
- Mỗi entry phải có Ticket ID (nếu có): `PROJ-101`, `GH-42`
- Mô tả ngắn gọn, dùng động từ hoặc danh từ
- Khi release: đổi `[Unreleased]` → `[version] - YYYY-MM-DD`

---

## 3. Cập nhật Checklist/Tasklist trong Epic/Feature Docs

Sau khi hoàn thành epic, feature, CR, hoặc bugfix — **PHẢI** cập nhật checklist/tasklist trong tài liệu tương ứng.

| Tài liệu                           | Cập nhật                                                            |
| ---------------------------------- | ------------------------------------------------------------------- |
| Epic (`docs/product/epics/`)       | Đánh dấu `[x]` Goals, Features table status → 🟢, Milestones status |
| Feature (`docs/product/features/`) | Đánh dấu `[x]` Acceptance Criteria, Test Cases, status → 🟢 Done    |
| Bug (`docs/product/bugs/`)         | Cập nhật Resolution, status → 🟢 Resolved                           |
| CR (`docs/product/cr/`)            | Cập nhật Implementation Status, status → 🟢 Done                    |

### MUST

- Cập nhật **ngay** khi task hoàn thành — không để lại "sẽ cập nhật sau"
- Ghi thêm vào Change Log section trong tài liệu
- Nếu scope thay đổi so với spec ban đầu → ghi notes rõ ràng

### MUST NOT

- Để tài liệu ở status "In Progress" khi đã hoàn thành
- Bỏ qua việc đánh dấu Acceptance Criteria
- Quên cập nhật Epic khi tất cả Features của nó đã Done
