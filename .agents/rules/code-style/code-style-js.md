---
trigger: glob
globs: **/*.{js,jsx,ts,tsx}
---

# TypeScript / JavaScript Style Guide

> Ref: [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)

## Naming

| Thành phần      | Convention       | Ví dụ             |
| --------------- | ---------------- | ----------------- |
| File            | kebab-case       | `user-service.ts` |
| Class           | UpperCamelCase   | `UserService`     |
| Interface/Type  | UpperCamelCase   | `UserResponse`    |
| Function/Method | lowerCamelCase   | `getUserById`     |
| Variable        | lowerCamelCase   | `userName`        |
| Constant        | UPPER_SNAKE_CASE | `MAX_COUNT`       |
| Enum            | UpperCamelCase   | `HttpStatus`      |
| Enum member     | UPPER_SNAKE_CASE | `NOT_FOUND`       |

## Rules

- Dùng `const`/`let`, KHÔNG dùng `var`
- Dùng template literals: `` `Hello ${name}` ``
- Dùng async/await thay vì callbacks
- Dùng optional chaining `?.` và nullish coalescing `??`
- Indent: 2 spaces

## Bad / Good Examples

### Type safety — không dùng `any`

```typescript
// ❌ BAD
async function getUser(id: any): Promise<any> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

// ✅ GOOD
async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return UserSchema.parse(await res.json()); // Zod validation
}
```

### Optional chaining + nullish coalescing

```typescript
// ❌ BAD
const name =
  user && user.profile && user.profile.displayName
    ? user.profile.displayName
    : "Anonymous";

// ✅ GOOD
const name = user?.profile?.displayName ?? "Anonymous";
```

### Async/await — không để unhandled rejection

```typescript
// ❌ BAD
fetchData().then((data) => setData(data)); // no error handling

// ✅ GOOD
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  console.error("fetchData failed:", error);
  setError(error);
}
```

### Const assertions — tránh magic strings

```typescript
// ❌ BAD
const status = "PENDING"; // string, no type safety

// ✅ GOOD
const STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
type Status = (typeof STATUS)[keyof typeof STATUS];
```

### Error messages — rõ ràng có context

```typescript
// ❌ BAD
throw new Error("Invalid");

// ✅ GOOD
throw new Error(`Invalid payment amount: ${amount}. Must be > 0.`);
```
