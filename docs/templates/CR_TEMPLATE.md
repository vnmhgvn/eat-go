# 🔄 Change Request

> Copy file này để tạo CR mới.
> Path: `docs/product/cr/cr-{id}-{short-name}.md`

---

# CR-[ID]: [Change Request Title]

## 1. Meta

| Field            | Value                                                 |
| ---------------- | ----------------------------------------------------- |
| **Epic**         | [epic-XXX: Epic Name](docs/product/epics/epic-XXX.md) |
| **Feature**      | [feat-XXX: Feature Name](docs/product/features/epic-XXX/feat-XXX.md) |
| **Priority**     | P0 / P1 / P2                                          |
| **Status**       | 🔴 Pending / 🟡 In Progress / 🟢 Done                 |
| **Requested By** | [Client / BA / PO Name]                               |
| **Assignee**     | [Dev Name]                                            |
| **Request Date** | YYYY-MM-DD                                            |
| **Due Date**     | YYYY-MM-DD                                            |

---

## 2. Change Description

### Current Behavior

[Mô tả behavior hiện tại — hệ thống đang hoạt động như thế nào]

### Requested Change

[Mô tả chi tiết thay đổi được yêu cầu — behavior mới mong muốn]

### Reason / Business Justification

[Tại sao cần thay đổi? Yêu cầu từ client, regulation, business process change, etc.]

---

## 3. Impact Analysis

### Affected Components

| Component | Type | Impact |
| --------- | ---- | ------ |
| [Module/Service] | Backend / Frontend / DB | [Mô tả ảnh hưởng] |

### Affected Features

- [F-XXX: Feature bị ảnh hưởng]
- [F-YYY: Feature cần cập nhật theo]

### Breaking Changes

- [ ] **Có breaking change**: [Mô tả — API contract change, DB migration, etc.]
- [ ] **Không breaking change** — backward compatible

### Effort Estimation

| Task | Estimate | Assignee |
| ---- | -------- | -------- |
| Backend changes | [X] points | [Name] |
| Frontend changes | [X] points | [Name] |
| Testing | [X] points | [Name] |
| **Total** | **[X] points** | |

---

## 4. Acceptance Criteria

<!-- Định nghĩa rõ ràng "Done" nghĩa là gì -->

- [ ] **AC-01**: [Điều kiện chấp nhận 1]
- [ ] **AC-02**: [Điều kiện chấp nhận 2]
- [ ] **AC-03**: [Điều kiện chấp nhận 3]

---

## 5. Technical Specs

<!-- DEV viết phần này -->

### Changes Required

#### Backend

- [ ] [Mô tả thay đổi backend — API, Handler, DB, etc.]

#### Frontend

- [ ] [Mô tả thay đổi frontend — component, page, etc.]

#### Database

- [ ] [Migration nếu có — thêm column, index, etc.]

### API Changes (nếu có)

**Before:**
```json
{ "field": "old_format" }
```

**After:**
```json
{ "field": "new_format", "new_field": "value" }
```

---

## 6. Test Plan

### Test Cases

- [ ] **TC-01**: [Test case cho behavior mới]
- [ ] **TC-02**: [Regression test cho behavior cũ không bị ảnh hưởng]
- [ ] **TC-03**: [Edge case]

### Verification

- [ ] Unit tests updated/added
- [ ] Integration tests passed
- [ ] Manual testing on staging
- [ ] Code review passed

---

## 7. Approval

| Role | Name | Decision | Date |
| ---- | ---- | -------- | ---- |
| Product Owner | [Name] | ✅ Approved / ❌ Rejected | YYYY-MM-DD |
| Tech Lead | [Name] | ✅ Approved / ❌ Rejected | YYYY-MM-DD |

---

## 8. Related PR/Branch

- Branch: `cr/CR-{id}-{short-name}`
- PR: [Link to PR]

---

## 9. Change Log

| Date       | Author | Changes                |
| ---------- | ------ | ---------------------- |
| YYYY-MM-DD | [Name] | CR requested           |
| YYYY-MM-DD | [Name] | Impact analysis done   |
| YYYY-MM-DD | [Name] | Implementation started |
| YYYY-MM-DD | [Name] | Verified and closed    |

---

**Template Version:** 1.0  
**Created:** February 25, 2026
