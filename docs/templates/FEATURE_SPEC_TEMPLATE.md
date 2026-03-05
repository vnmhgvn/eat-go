# 📄 Feature Specification

> Copy file này để tạo spec cho feature mới.
> Path: `docs/product/features/[EPIC-ID]/F-XXX-Feature-Name.md`

---

# F-[PREFIX]-[ID]: [Feature Name]

## 1. Meta

| Field         | Value                                                 |
| ------------- | ----------------------------------------------------- |
| **Epic**      | [EPIC-XXX: Epic Name](docs/product/epics/EPIC-XXX.md) |
| **Priority**  | P0 / P1 / P2                                          |
| **Status**    | 🔴 Not Started / 🟡 In Progress / 🟢 Done             |
| **Estimate**  | [X] points (XS/S/M/L/XL)                              |
| **BA Owner**  | [Name]                                                |
| **Dev Owner** | [Name]                                                |

---

## 2. Business Context

<!-- BA viết phần này -->

### Problem Statement

[Mô tả vấn đề cần giải quyết - tại sao cần feature này?]

### Business Value

- [Giá trị 1: ví dụ "Giảm thời gian xử lý 30%"]
- [Giá trị 2]

### Success Metrics (KPIs)

| Metric     | Target | Current |
| ---------- | ------ | ------- |
| [Metric 1] | X%     | -       |
| [Metric 2] | Y      | -       |

---

## 3. User Story

> **Là** [user type/role],  
> **Tôi muốn** [action/goal],  
> **Để** [benefit/value].

### User Flow

```
1. User [action 1]
2. System [response 1]
3. User [action 2]
4. System [response 2] → Done
```

---

## 4. Acceptance Criteria

<!-- Định nghĩa rõ ràng "Done" nghĩa là gì -->

- [ ] **AC-01**: [Điều kiện chấp nhận 1]
- [ ] **AC-02**: [Điều kiện chấp nhận 2]
- [ ] **AC-03**: [Điều kiện chấp nhận 3]

---

## 5. Out of Scope

<!-- QUAN TRỌNG: Tránh scope creep -->

> Những gì **KHÔNG** nằm trong feature này:

- [Item 1 - sẽ làm ở feature khác]
- [Item 2 - out of MVP]

---

## 6. UI/UX

<!-- BA/Designer viết -->

### Mockup / Wireframe

- [Link to Figma]
- [Screenshot embed]

### UI Notes

- [Note 1: ví dụ "Button phải disable khi form invalid"]
- [Note 2]

---

## 7. Technical Specs

<!-- DEV viết phần này - SCHEMA-FIRST: Define trước khi code -->

### 7.0 NFR Targets

> Declare SLA ở đây. Load test suite sẽ dùng các targets này để verify khi environment ready.

| NFR           | Target    | Priority  | Note               |
| ------------- | --------- | --------- | ------------------ |
| Response time | < Xms p95 | P0/P1/N/A | Endpoint cụ thể    |
| Throughput    | X RPS     | P0/P1/N/A |                    |
| Error rate    | < X%      | P0/P1/N/A |                    |
| Data volume   | X records | P0/P1/N/A | Nếu có heavy query |
| Availability  | 99.X%     | P0/P1/N/A |                    |

> Ghi `N/A` nếu feature không có SLA cụ thể. **Không được bỏ trống.**

### 7.1 API Endpoint

**Endpoint:** `[METHOD] /api/v1/[resource]`  
**Description:** [Mô tả ngắn]  
**Auth:** Required / Public

**Request:**

```json
{
  "field1": "string (required)",
  "field2": "number (optional)"
}
```

**Response (Success - 200/201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "field1": "value"
  }
}
```

**Error Responses:**
| Code | Condition | Message |
|------|-----------|---------|
| 400 | Validation failed | "Invalid input data" |
| 401 | Not authenticated | "Please login" |
| 403 | Not authorized | "Permission denied" |
| 404 | Resource not found | "Not found" |

### 7.2 Database Schema

**Table:** `[table_name]`

| Column     | Type         | Constraints | Description    |
| ---------- | ------------ | ----------- | -------------- |
| id         | UUID         | PK          | Primary key    |
| field1     | VARCHAR(255) | NOT NULL    | Description    |
| created_at | TIMESTAMP    | NOT NULL    | Auto-generated |
| updated_at | TIMESTAMP    | NOT NULL    | Auto-updated   |

### 7.3 Components (Frontend)

- `ComponentName.tsx` - [Mô tả]

---

## 8. Test Cases

### Unit Tests

| TC-ID | Test Name   | Input   | Expected   |
| ----- | ----------- | ------- | ---------- |
| UT-01 | [Test name] | [Input] | [Expected] |

### Integration Tests

- [ ] **IT-01**: [API test case]
- [ ] **IT-02**: [DB test case]

### E2E Tests

- [ ] **E2E-01**: [User scenario 1]
- [ ] **E2E-02**: [User scenario 2]

---

## 9. Dependencies

| Type           | Feature/Service | Status         | Notes  |
| -------------- | --------------- | -------------- | ------ |
| **Depends on** | F-XXX-Feature   | ✅ Done        | [Note] |
| **Blocks**     | F-YYY-Feature   | 🔴 Waiting     | [Note] |
| **External**   | [Service name]  | 🟡 In Progress | [Note] |

---

## 10. Notes & Change Log

### Technical Notes

[Ghi chú cho developers: libraries, patterns, edge cases, performance considerations]

### Change Log

| Date       | Author | Changes              |
| ---------- | ------ | -------------------- |
| YYYY-MM-DD | [Name] | Initial spec         |
| YYYY-MM-DD | [Name] | [Change description] |

---

**Template Version:** 2.0  
**Last Updated:** February 2, 2026
