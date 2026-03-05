---
trigger: always_on
---

# Git Workflow Rules

> **Mục tiêu**: Đảm bảo mọi thay đổi đều được thực hiện trên branch riêng, không commit trực tiếp lên nhánh chính.

---

## 🌿 Branch Naming Convention

### Format

```
<type>/<ticket-id>-<short-description>
```

| Segment             | Rule                                       |
| ------------------- | ------------------------------------------ |
| `type`              | Bắt buộc — xem bảng loại branch bên dưới   |
| `ticket-id`         | Tùy chọn — mã ticket Jira (VD: `PROJ-123`) |
| `short-description` | Bắt buộc — `kebab-case`, tối đa 5–7 từ     |

### Loại Branch

| Type        | Dùng khi                                    | Ví dụ                                       |
| ----------- | ------------------------------------------- | ------------------------------------------- |
| `feature/`  | Phát triển tính năng mới                    | `feature/PROJ-101-user-authentication`      |
| `fix/`      | Sửa bug trên dev / staging                  | `fix/PROJ-205-login-null-pointer`           |
| `hotfix/`   | Sửa bug khẩn cấp từ `main` / production     | `hotfix/PROJ-310-payment-gateway-timeout`   |
| `cr/`       | Xử lý Change Request từ client / BA         | `cr/PROJ-418-update-report-filter-logic`    |
| `chore/`    | Cập nhật config, dependency, CI/CD          | `chore/upgrade-spring-boot-4`               |
| `refactor/` | Tái cấu trúc code, không thay đổi behavior  | `refactor/PROJ-502-extract-payment-module`  |
| `docs/`     | Cập nhật tài liệu, README, ADR              | `docs/add-api-authentication-guide`         |
| `test/`     | Thêm / sửa test, không thay đổi source code | `test/PROJ-611-add-order-service-unit-test` |

---

## 📋 Branch Workflow

### Tổng quan

```
main ──► feature/* / fix/* / cr/* / hotfix/* / chore/* / refactor/* / docs/* / test/*
  │
  │   (checkout từ main, làm việc, push)
  │
  ├──► develop (SIT) ◄── Merge Request từ working branch
  │
  └──► releases/* (UAT) ◄── Merge Request từ working branch
                │
                │   (UAT pass → dùng image releases/* cho Production / Pilot)
                │
                │   (Nghiệm thu Production done)
                │
                ▼
              main ◄── Merge Request từ releases/*
```

### Khi bắt đầu task mới

```bash
# 1. Đồng bộ nhánh chính
git checkout main
git pull origin main

# 2. Tạo branch từ main
git checkout -b feature/PROJ-101-user-authentication

# 3. Làm việc, commit theo chuẩn
git add .
git commit -m "feat(auth): implement JWT login endpoint"

# 4. Push và tạo Merge Request → develop
git push origin feature/PROJ-101-user-authentication
```

### Khi có conflict

```bash
# Rebase từ main để giữ history sạch
git fetch origin
git rebase origin/main
```

---

## 🔀 Merge Request Rules

### Branch Flow — Source → Destination

| Giai đoạn              | Source Branch                                                                         | Destination  | Mục đích                                     |
| ---------------------- | ------------------------------------------------------------------------------------- | ------------ | -------------------------------------------- |
| **SIT**                | `feature/*`, `fix/*`, `cr/*`, `hotfix/*`, `chore/*`, `refactor/*`, `docs/*`, `test/*` | `develop`    | Kiểm thử tích hợp                            |
| **UAT**                | Các working branch trên                                                               | `releases/*` | Deploy UAT                                   |
| **Production / Pilot** | —                                                                                     | —            | Dùng image từ `releases/*`, không tạo MR mới |
| **Sync back**          | `releases/*`                                                                          | `main`       | Sau khi nghiệm thu Production thành công     |

> **Lưu ý**: Working branch **luôn checkout từ `main`**. Không checkout từ `develop` hay `releases/*`.
> Working branch tạo **2 MR riêng biệt**: một vào `develop` (SIT) và một vào `releases/*` (UAT).

### MR Title Convention

```
[TYPE] TICKET-ID: Short description
```

| Thành phần  | Bắt buộc | Mô tả                                                              |
| ----------- | -------- | ------------------------------------------------------------------ |
| `[TYPE]`    | ✅       | Loại thay đổi — viết hoa: `[FEATURE]`, `[FIX]`, `[CR]`, `[HOTFIX]` |
| `TICKET-ID` | Nếu có   | Mã ticket Jira: `PROJ-101`                                         |
| Description | ✅       | Tóm tắt ngắn gọn                                                   |

**Ví dụ:**

- `[FEATURE] PROJ-101: Implement JWT login endpoint`
- `[FIX] PROJ-205: Fix null pointer on login validation`
- `[HOTFIX] PROJ-310: Fix payment gateway timeout in production`

### MR Description Template

Mọi Merge Request **bắt buộc** phải có mô tả đầy đủ:

```markdown
## Summary

<!-- Tóm tắt ngắn gọn mục đích của MR này -->

## Changes

### [Component / Module name]

- Thay đổi 1: mô tả cụ thể
- Thay đổi 2: mô tả cụ thể

## Related Tickets

- Closes PROJ-XXX
- Related: PROJ-YYY

## How to Test

1. Bước 1
2. Bước 2
3. Kết quả mong đợi

## Screenshots / Videos

| Before | After |
| ------ | ----- |
| (ảnh)  | (ảnh) |

## Checklist

- [ ] Code tuân theo coding convention của dự án
- [ ] Đã tự review code trước khi tạo MR
- [ ] Đã viết / cập nhật unit test (nếu cần)
- [ ] Đã test trên local thành công
- [ ] Không có hardcode secret / credential
- [ ] Commit message tuân theo Conventional Commits
```

### Điều kiện merge cho từng giai đoạn

#### Working Branch → `develop` (SIT)

- Ít nhất 1 approval từ team member
- CI pipeline pass (build + test)
- Không có conflict
- Đã rebase từ `main` trước khi tạo MR

#### Working Branch → `releases/*` (UAT)

- SIT pass — QA xác nhận trên môi trường SIT
- Ít nhất 1 approval từ team member
- CI pipeline pass
- Không có conflict

#### Production / Pilot (Không tạo MR)

- Dùng trực tiếp image đã build từ `releases/*`
- UAT pass — QA xác nhận
- Approval từ Tech Lead / Product Owner

#### `releases/*` → `main` (Sync back)

- Nghiệm thu Production thành công
- Không có hotfix pending
- Approval từ Tech Lead
- MR title: `[SYNC] Merge releases/v1.2.0 back to main`

---

## ✅ Commit Message Convention

Tuân theo **Conventional Commits**:

```
<type>(<scope>): <short summary>

[optional body]
[optional footer]
```

| Type       | Ý nghĩa                              |
| ---------- | ------------------------------------ |
| `feat`     | Tính năng mới                        |
| `fix`      | Sửa bug                              |
| `hotfix`   | Sửa bug khẩn cấp                     |
| `cr`       | Xử lý Change Request                 |
| `refactor` | Refactor, không đổi behavior         |
| `chore`    | Config, dependency, CI/CD            |
| `docs`     | Tài liệu                             |
| `test`     | Test                                 |
| `style`    | Format, whitespace (không đổi logic) |

**Ví dụ:**

```
feat(auth): add JWT refresh token support

- Implement /auth/refresh endpoint
- Store refresh token in HttpOnly cookie
- Add token rotation on every refresh

Closes PROJ-101
```

---

## 🚫 Hard Constraints

### MUST

- Luôn tạo branch mới trước khi code — không bao giờ làm việc trực tiếp trên `main` / `develop` / `releases/*`
- Luôn checkout working branch từ `main` — không checkout từ `develop` hay `releases/*`
- Branch name phải bắt đầu bằng một trong các `type` được định nghĩa ở trên
- Branch name phải dùng `kebab-case`
- Commit message phải tuân theo Conventional Commits
- Tạo Merge Request trước khi merge vào bất kỳ nhánh nào
- MR phải có title theo convention `[TYPE] TICKET-ID: Description`
- MR phải có description đầy đủ theo template
- MR phải được ít nhất 1 người review và approve
- Rebase từ `main` trước khi tạo MR

### MUST NOT

- Commit trực tiếp lên `main`, `develop`, hoặc `releases/*`
- Checkout working branch từ `develop` hoặc `releases/*`
- Dùng tên branch chung chung: `test`, `my-branch`, `fix`, `update`, `temp`, `wip`
- Force push (`--force`) lên nhánh chính
- Merge mà không có code review
- Tạo MR với description chung chung (VD: "fix bug", "update code")
- Merge MR khi CI pipeline fail
- Để branch tồn tại quá 2 tuần mà không merge — phải rebase hoặc đóng

---

## 🔗 Liên kết Branch với Ticket

- Có ticket Jira: `feature/PROJ-123-short-description`
- Không có ticket (task nhỏ / chore): bỏ `ticket-id`, VD: `chore/update-env-example`
