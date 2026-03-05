---
trigger: glob
globs: **/*.{html,css}
---

# HTML/CSS Style Guide

> Ref: [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)

## Naming

| Thành phần      | Convention   | Ví dụ                |
| --------------- | ------------ | -------------------- |
| HTML elements   | lowercase    | `<div>`, `<section>` |
| HTML attributes | lowercase    | `class`, `data-id`   |
| CSS class       | kebab-case   | `.user-card`         |
| CSS ID          | kebab-case   | `#main-nav`          |
| CSS variable    | --kebab-case | `--primary-color`    |
| BEM Block       | kebab-case   | `.user-card`         |
| BEM Element     | \_\_element  | `.user-card__avatar` |
| BEM Modifier    | --modifier   | `.user-card--active` |

## Rules

- Indent: 2 spaces
- Dùng BEM cho CSS classes
- Tránh ID selectors
- Dùng CSS variables cho theming
