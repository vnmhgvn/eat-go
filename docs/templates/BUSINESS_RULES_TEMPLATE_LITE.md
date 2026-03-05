# Business Rules: [Feature Name]

> **Feature:** [Feature Name](./FEATURE_SPEC_TEMPLATE_LITE.md)  
> **Last Updated:** [Date]

---

## Validation Rules

| Field  | Rule                  | Error Message                                          |
| ------ | --------------------- | ------------------------------------------------------ |
| field1 | Required, min 3 chars | "Field1 is required and must be at least 3 characters" |
| field2 | Must be valid email   | "Please enter a valid email address"                   |

---

## Business Logic

### Rule 1: [Rule Name]

**Condition:** When [condition]...  
**Action:** Then [action]...  
**Example:**

```
Input: X
Output: Y
```

### Rule 2: [Rule Name]

**Condition:** When [condition]...  
**Action:** Then [action]...

---

## Edge Cases

| #   | Scenario                | Expected Behavior    |
| --- | ----------------------- | -------------------- |
| 1   | [Edge case description] | [What should happen] |
| 2   | [Edge case description] | [What should happen] |

---

## Permissions

| Role    | Can Create | Can Read | Can Update | Can Delete |
| ------- | ---------- | -------- | ---------- | ---------- |
| Admin   | ✅         | ✅       | ✅         | ✅         |
| Staff   | ✅         | ✅       | ✅         | ❌         |
| Partner | ❌         | ✅       | ❌         | ❌         |

---

## Error Handling

| Error Code | Condition         | Message                     |
| ---------- | ----------------- | --------------------------- |
| 400        | Invalid input     | "Invalid request data"      |
| 401        | Not authenticated | "Please login to continue"  |
| 403        | Not authorized    | "You don't have permission" |
