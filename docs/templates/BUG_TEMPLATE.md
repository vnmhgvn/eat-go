# 🐛 Bug Report

> Copy file này để tạo bug report mới.
> Path: `docs/product/bugs/bug-{id}-{short-name}.md`

---

# BUG-[ID]: [Bug Title]

## 1. Meta

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| **Epic**       | [epic-XXX: Epic Name](docs/product/epics/epic-XXX.md) |
| **Feature**    | [feat-XXX: Feature Name](docs/product/features/epic-XXX/feat-XXX.md) |
| **Priority**   | P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)   |
| **Severity**   | 🔴 Blocker / 🟠 Major / 🟡 Minor / 🟢 Trivial        |
| **Status**     | 🔴 Open / 🟡 In Progress / 🟢 Resolved / ⚫ Closed    |
| **Reporter**   | [Name]                                                |
| **Assignee**   | [Name]                                                |
| **Environment**| Production / Staging / Development / Local             |
| **Version**    | [App version hoặc branch]                              |

---

## 2. Description

### Summary

[Mô tả ngắn gọn bug — 1-2 câu]

### Steps to Reproduce

```
1. [Bước 1 — cụ thể, có thể reproduce]
2. [Bước 2]
3. [Bước 3]
4. Observe: [Kết quả thực tế]
```

### Expected Behavior

[Mô tả kết quả mong đợi đúng]

### Actual Behavior

[Mô tả kết quả thực tế sai — càng cụ thể càng tốt]

---

## 3. Evidence

### Screenshots / Videos

- [Đính kèm ảnh chụp hoặc video minh họa bug]

### Logs / Error Messages

```
[Paste log hoặc error message liên quan]
[Stack trace nếu có]
```

### Related Data

- URL: [URL khi bug xảy ra, nếu có]
- User/Account: [Test account hoặc user bị ảnh hưởng]
- Request/Response: [API request/response nếu relevant]

---

## 4. Impact Analysis

### Users Affected

- [Mô tả phạm vi ảnh hưởng: tất cả users / specific role / specific condition]

### Business Impact

- [Mô tả ảnh hưởng business: mất revenue, UX kém, data sai, etc.]

### Workaround

- [ ] **Có workaround**: [Mô tả cách tạm thời giải quyết]
- [ ] **Không có workaround** — cần fix ngay

---

## 5. Root Cause Analysis

<!-- DEV điền sau khi investigate -->

### Root Cause

[Mô tả nguyên nhân gốc — không phải symptom]

### Affected Files

| File | Issue |
| ---- | ----- |
| `path/to/file.java` | [Mô tả vấn đề trong file] |

---

## 6. Resolution

<!-- DEV điền khi fix xong -->

### Fix Description

[Mô tả giải pháp đã implement]

### Fix Verification

- [ ] Unit test added cho scenario gây bug
- [ ] Regression test: các flows liên quan vẫn hoạt động
- [ ] Bug không reproduce được sau fix
- [ ] Code review passed

### Related PR/Branch

- Branch: `fix/BUG-{id}-{short-name}`
- PR: [Link to PR]

---

## 7. Change Log

| Date       | Author | Changes                |
| ---------- | ------ | ---------------------- |
| YYYY-MM-DD | [Name] | Bug reported           |
| YYYY-MM-DD | [Name] | Root cause identified  |
| YYYY-MM-DD | [Name] | Fix implemented        |
| YYYY-MM-DD | [Name] | Verified and closed    |

---

**Template Version:** 1.0  
**Created:** February 25, 2026
