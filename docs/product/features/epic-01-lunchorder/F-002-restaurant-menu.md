# F-002: Restaurant & Menu Management

## 1. Meta

| Field         | Value                                                          |
| ------------- | -------------------------------------------------------------- |
| **Epic**      | [EPIC-01: LunchOrder](docs/product/epics/epic-01-lunchorder.md) |
| **Priority**  | P0                                                             |
| **Status**    | 🔴 Not Started                                                 |
| **Estimate**  | 8 points (L)                                                   |
| **BA Owner**  | Team                                                           |
| **Dev Owner** | Dev                                                            |

---

## 2. Business Context

### Problem Statement

Hệ thống cần quản lý danh sách nhà hàng và menu gồm 2 loại: Global (admin quản lý, dùng chung toàn hệ thống) và Tạm (host tạo trong phiên, chỉ tồn tại trong phiên đó). Menu item có thể có nhiều topping group với nhiều option.

### Business Value

- Admin xây dựng được thư viện nhà hàng/menu dùng chung
- Host linh hoạt tạo nhà hàng/menu tạm khi cần đặt chỗ mới
- Data snapshot đảm bảo giá không thay đổi sau khi order

---

## 3. User Story

> **Là** admin hệ thống,  
> **Tôi muốn** quản lý danh sách nhà hàng và menu global,  
> **Để** host có thể chọn khi tạo phiên order.

---

## 4. Acceptance Criteria

- [ ] **AC-01**: Admin có thể thêm/sửa/xóa nhà hàng global (`isGlobal = true`)
- [ ] **AC-02**: Admin có thể thêm/sửa menu item với topping groups cho nhà hàng global
- [ ] **AC-03**: Host có thể tạo nhà hàng tạm (`isGlobal = false`) trong khi tạo phiên
- [ ] **AC-04**: Nhà hàng tạm chỉ visible cho phiên đó, không xuất hiện trong danh sách global
- [ ] **AC-05**: Menu item có thể có nhiều topping groups, mỗi group có nhiều options
- [ ] **AC-06**: Admin không thể xóa nhà hàng đang được tham chiếu trong phiên chưa COMPLETED (BR10)
- [ ] **AC-07**: Danh sách nhà hàng global visible cho mọi authenticated user (READ only)

---

## 5. Out of Scope

- Upload ảnh nhà hàng/menu (dùng URL external)
- Rating, review nhà hàng
- Import nhà hàng từ file CSV/Excel
- Tích hợp với delivery platform thực

---

## 6. UI/UX

### UI Notes

- Admin có trang `/restaurants` để quản lý
- Danh sách nhà hàng có search/filter theo category
- Accordion để expand menu items và toppings
- Hiển thị badge `Global` vs `Phiên tạm`

---

## 7. Technical Specs

### 7.0 NFR Targets

| NFR           | Target      | Priority | Note                    |
| ------------- | ----------- | -------- | ----------------------- |
| Response time | < 500ms p95 | P1       | List query              |
| N/A           | N/A         | N/A      |                         |

### 7.1 Server Actions

- `src/features/restaurants/actions.ts`:
  - `createRestaurant(data)` — Admin only
  - `updateRestaurant(id, data)` — Admin only
  - `deleteRestaurant(id)` — Admin only, with BR10 check
  - `createMenuItem(restaurantId, data)` — Admin/Host
  - `updateMenuItem(id, data)` — Admin/Host
  - `createToppingGroup(menuItemId, data)` — Admin only
  - `createToppingOption(groupId, data)` — Admin only

### 7.2 Database Schema

**Table:** `restaurants`

| Column           | Type       | Constraints    | Description              |
| ---------------- | ---------- | -------------- | ------------------------ |
| id               | uuid       | PK             | Primary key              |
| name             | text       | NOT NULL       | Restaurant name          |
| category         | text       |                | Food category            |
| address          | text       |                | Address                  |
| phone_number     | text       |                | Phone                    |
| default_ship_fee | integer    | DEFAULT 0      | Default ship fee (VNĐ)   |
| note             | text       |                | Notes                    |
| is_global        | boolean    | NOT NULL       | Global or session-temp   |
| created_by       | uuid       | FK → users     | Creator                  |
| created_at       | timestamptz| DEFAULT now()  |                          |

**Table:** `menu_items`

| Column       | Type       | Constraints    | Description              |
| ------------ | ---------- | -------------- | ------------------------ |
| id           | uuid       | PK             |                          |
| restaurant_id| uuid       | FK NOT NULL    | Parent restaurant        |
| name         | text       | NOT NULL       | Item name                |
| price        | integer    | NOT NULL       | Base price (VNĐ)         |
| category     | text       |                | Food group               |
| description  | text       |                | Short description        |
| image_url    | text       |                | Food image URL           |
| is_available | boolean    | DEFAULT true   | Still serving?           |
| created_at   | timestamptz| DEFAULT now()  |                          |

**Table:** `topping_groups`

| Column      | Type    | Constraints | Description                     |
| ----------- | ------- | ----------- | ------------------------------- |
| id          | uuid    | PK          |                                 |
| menu_item_id| uuid    | FK CASCADE  |                                 |
| group_name  | text    | NOT NULL    | e.g. "Size", "Đường"            |
| is_required | boolean | DEFAULT false|                                |
| min_select  | integer | DEFAULT 0   |                                 |
| max_select  | integer | DEFAULT 1   |                                 |
| sort_order  | integer | DEFAULT 0   |                                 |

**Table:** `topping_options`

| Column         | Type    | Constraints | Description         |
| -------------- | ------- | ----------- | ------------------- |
| id             | uuid    | PK          |                     |
| topping_group_id| uuid   | FK CASCADE  |                     |
| name           | text    | NOT NULL    | e.g. "Size L"       |
| extra_price    | integer | DEFAULT 0   | Additional price    |
| is_available   | boolean | DEFAULT true|                     |
| sort_order     | integer | DEFAULT 0   |                     |

**RLS:**
- `restaurants (isGlobal=true)`: SELECT all authenticated; INSERT/UPDATE/DELETE only admin
- `restaurants (isGlobal=false)`: SELECT session participants; INSERT/UPDATE host
- `menu_items`: SELECT all authenticated; INSERT/UPDATE admin (global) / host (session)

### 7.3 Components (Frontend)

- `app/(app)/restaurants/page.tsx` — Admin restaurant management page
- `src/features/restaurants/components/restaurant-list.tsx`
- `src/features/restaurants/components/restaurant-form.tsx`
- `src/features/restaurants/components/menu-item-form.tsx`
- `src/features/restaurants/components/topping-group-form.tsx`
- `src/features/restaurants/schemas.ts` — Zod schemas
- `src/features/restaurants/actions.ts` — Server Actions

---

## 8. Test Cases

### Unit Tests

| TC-ID | Test Name                             | Input                    | Expected               |
| ----- | ------------------------------------- | ------------------------ | ---------------------- |
| UT-01 | createRestaurant validates name       | `{ name: '' }`           | Validation error       |
| UT-02 | deleteRestaurant with active sessions | Restaurant with ORDERING session | Error: cannot delete |

### Integration Tests

- [ ] **IT-01**: Admin creates global restaurant
- [ ] **IT-02**: Non-admin cannot create global restaurant (RLS check)

---

## 9. Dependencies

| Type           | Feature/Service | Status     | Notes  |
| -------------- | --------------- | ---------- | ------ |
| **Depends on** | F-001 Auth      | 🔴 Pending | Need auth context |

---

## 10. Notes & Change Log

### Technical Notes

- `isGlobal` flag determines permissions via RLS
- Price snapshot in orders means menu price changes don't affect existing orders (BR05)

### Change Log

| Date       | Author | Changes      |
| ---------- | ------ | ------------ |
| 2026-03-05 | Agent  | Initial spec |
