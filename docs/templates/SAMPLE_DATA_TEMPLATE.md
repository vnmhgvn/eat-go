# 🧪 Sample Data: [Feature Name]

> **Feature:** [F-XXX: Feature Name](./FEATURE_SPEC_TEMPLATE.md)  
> **Last Updated:** [Date]

---

## 1. Valid Data Examples

### Example 1: Happy Path (Standard Case)

```json
{
  "field1": "valid_value",
  "email": "user@example.com",
  "amount": 100,
  "type": "standard"
}
```

**Expected:** ✅ Success (201 Created)

---

### Example 2: Minimum Valid Data

```json
{
  "field1": "abc",
  "email": "a@b.co"
}
```

**Expected:** ✅ Success (201 Created) - Optional fields use defaults

---

### Example 3: Maximum Valid Data

```json
{
  "field1": "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
  "email": "very.long.email.address@subdomain.company.com",
  "amount": 999999,
  "description": "Full description with all optional fields filled"
}
```

**Expected:** ✅ Success (201 Created)

---

## 2. Invalid Data Examples

### 2.1 Validation Errors (400)

| #   | Scenario               | Input                                     | Expected Error                         |
| --- | ---------------------- | ----------------------------------------- | -------------------------------------- |
| 1   | Missing required field | `{ "email": "test@test.com" }`            | "field1 is required"                   |
| 2   | Invalid email format   | `{ "field1": "x", "email": "not-email" }` | "Invalid email format"                 |
| 3   | Below minimum          | `{ "field1": "ab" }`                      | "field1 must be at least 3 characters" |
| 4   | Above maximum          | `{ "amount": 1000001 }`                   | "amount must not exceed 999999"        |
| 5   | Wrong type             | `{ "amount": "abc" }`                     | "amount must be a number"              |

---

### 2.2 Business Rule Errors (422)

| #   | Scenario        | Input          | Expected Error               |
| --- | --------------- | -------------- | ---------------------------- |
| 1   | Duplicate entry | Existing email | "Email already registered"   |
| 2   | Quota exceeded  | User at limit  | "Maximum limit reached"      |
| 3   | Invalid state   | Wrong status   | "Cannot perform this action" |

---

## 3. Boundary Values Testing

| Field    | Type   | Min | Max    | Test Values                                           |
| -------- | ------ | --- | ------ | ----------------------------------------------------- |
| `field1` | string | 3   | 100    | `"ab"` ❌, `"abc"` ✅, `100 chars` ✅, `101 chars` ❌ |
| `amount` | number | 0   | 999999 | `-1` ❌, `0` ✅, `999999` ✅, `1000000` ❌            |
| `items`  | array  | 1   | 50     | `[]` ❌, `[1]` ✅, `[50 items]` ✅, `[51 items]` ❌   |

---

## 4. Test Users & Accounts

| Username            | Password      | Role    | Description     | Use For                |
| ------------------- | ------------- | ------- | --------------- | ---------------------- |
| `admin@test.com`    | `Admin123!`   | Admin   | Full access     | Admin feature testing  |
| `manager@test.com`  | `Manager123!` | Manager | Approval rights | Workflow testing       |
| `staff@test.com`    | `Staff123!`   | Staff   | Standard user   | Normal operations      |
| `partner@test.com`  | `Partner123!` | Partner | External user   | Partner portal testing |
| `readonly@test.com` | `Read123!`    | Viewer  | Read-only       | Permission testing     |

> ⚠️ **Lưu ý:** Chỉ dùng cho môi trường test/staging. KHÔNG dùng production.

---

## 5. Database Seed Data

### SQL Seed Script

```sql
-- Clean existing test data
DELETE FROM [table_name] WHERE id LIKE 'test-%';

-- Insert test records
INSERT INTO [table_name] (id, field1, email, created_at) VALUES
  ('test-001', 'Test Record 1', 'test1@example.com', NOW()),
  ('test-002', 'Test Record 2', 'test2@example.com', NOW()),
  ('test-003', 'Test Record 3', 'test3@example.com', NOW());

-- Insert edge case data
INSERT INTO [table_name] (id, field1, email, status) VALUES
  ('test-edge-001', 'Pending Record', 'pending@test.com', 'PENDING'),
  ('test-edge-002', 'Approved Record', 'approved@test.com', 'APPROVED');
```

### JSON Seed File

```json
[
  { "id": "test-001", "field1": "Test 1", "email": "test1@example.com" },
  { "id": "test-002", "field1": "Test 2", "email": "test2@example.com" }
]
```

---

## 6. Test Scenarios Matrix

| #   | Scenario                 | Precondition    | Action            | Expected Result | Data Needed |
| --- | ------------------------ | --------------- | ----------------- | --------------- | ----------- |
| 1   | Create success           | User logged in  | POST valid data   | 201 Created     | Example 1   |
| 2   | Create fail - validation | User logged in  | POST invalid data | 400 Error       | Invalid 2.1 |
| 3   | Update success           | Record exists   | PUT valid data    | 200 OK          | Example 1   |
| 4   | Delete as admin          | Admin logged in | DELETE record     | 204 No Content  | test-001    |
| 5   | Delete as staff          | Staff logged in | DELETE record     | 403 Forbidden   | test-001    |

---

**Template Version:** 2.0  
**Last Updated:** February 2, 2026
