---
trigger: glob
globs: **/*.{java,js,jsx,ts,tsx,html,css}
---

# Common Style Rules

> **Indentation: 2 spaces cho TẤT CẢ ngôn ngữ. KHÔNG dùng tabs.**

## Naming Conventions

| Pattern            | Sử dụng cho                                   |
| ------------------ | --------------------------------------------- |
| `UpperCamelCase`   | Classes, Interfaces, Types, Enums, Components |
| `lowerCamelCase`   | Variables, Functions, Methods, Parameters     |
| `UPPER_SNAKE_CASE` | Constants, Environment variables              |
| `kebab-case`       | URLs, CSS classes, HTML attrs, JS/TS files    |

## Line Length

- Tối đa: **100 ký tự**
- Ngoại lệ: URLs, import paths

## Comments

```
// Single line (Java, JS, C++, Go)
# Single line (Python, Shell)
-- Single line (SQL)
/* Multi-line */
/** Documentation */
```

## Best Practices

1. **Consistency** - Áp dụng nhất quán trong toàn dự án
2. **Automation** - Sử dụng linters/formatters
3. **Meaningful Names** - Đặt tên có ý nghĩa, tự mô tả
4. **Comments** - Chỉ comment code phức tạp

## Tools

| Ngôn ngữ | Linter     | Formatter          |
| -------- | ---------- | ------------------ |
| Java     | Checkstyle | google-java-format |
| JS/TS    | ESLint     | Prettier           |
