# F-005: Order Items & Topping Selection

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

Khi phiên ở trạng thái ORDERING, member cần xem menu của nhà hàng, chọn món (có thể thêm nhiều món), chọn topping, ghi chú, và lưu đơn của mình. Giá phải được snapshot tại thời điểm order.

### Business Value

- Mỗi thành viên tự chịu trách nhiệm chọn món của mình
- Price snapshot đảm bảo tính công bằng (BR05)
- Ghi chú giúp tùy chỉnh món (ít cay, không hành...)

---

## 3. User Story

> **Là** thành viên tham gia phiên,  
> **Tôi muốn** xem menu và thêm món vào đơn của mình,  
> **Để** chọn đúng những gì tôi muốn ăn.

### User Flow

```
1. Member mở phiên đang ORDERING
2. Thấy menu của nhà hàng đã chọn
3. Click "Thêm" → modal chọn số lượng, topping, ghi chú
4. Giá được snapshot: unitBasePrice = menu_items.price tại thời điểm đó
5. unitFinalPrice = unitBasePrice + Σ selectedToppings.extraPrice
6. Member có thể sửa/xóa món của mình khi phiên chưa LOCKED
7. Sau khi phiên LOCKED: chỉ xem, không sửa/xóa
```

---

## 4. Acceptance Criteria

- [ ] **AC-01**: Member xem được menu của nhà hàng đã chọn trong phiên
- [ ] **AC-02**: Member thêm món vào đơn: chọn số lượng, topping (required nhóm phải chọn), ghi chú
- [ ] **AC-03**: `unitBasePrice` = giá món tại thời điểm order (snapshot), không join về menu_items sau
- [ ] **AC-04**: `unitFinalPrice` = unitBasePrice + Σ extraPrice của toppings đã chọn
- [ ] **AC-05**: Member sửa/xóa được món của mình khi phiên còn ORDERING
- [ ] **AC-06**: Sau khi phiên LOCKED → tất cả actions add/edit/delete bị disabled (BR03)
- [ ] **AC-07**: 1 member chỉ có 1 đơn/phiên nhưng đơn có nhiều order items (BR01)
- [ ] **AC-08**: Topping required phải được chọn trước khi submit (validation)

---

## 5. Out of Scope

- Real-time sync (thay bằng manual reload)
- Upload ảnh từ member
- Đơn nhóm (group order từ nhiều member cùng submit 1 lần)

---

## 6. UI/UX

### UI Notes

- Menu hiển thị dạng card với ảnh, tên, giá
- Click vào card → drawer/modal chọn topping
- Topping groups hiển thị dạng radio (single select) hoặc checkbox (multi select)
- Giỏ đơn của member hiển thị ở bottom bar hoặc sidebar
- Design reference: `detailSession.html`

---

## 7. Technical Specs

### 7.0 NFR Targets

| NFR           | Target      | Priority | Note |
| ------------- | ----------- | -------- | ---- |
| Response time | < 400ms p95 | P1       | Add/edit order item |

### 7.1 Server Actions

- `src/features/orders/actions.ts`:
  - `addOrderItem(sessionId, { menuItemId, quantity, note, selectedToppingOptionIds })` — member
  - `updateOrderItem(orderItemId, { quantity, note, selectedToppingOptionIds })` — self only
  - `removeOrderItem(orderItemId)` — self only

### 7.2 Database Schema

**Table:** `order_items`

| Column         | Type       | Constraints         | Description                         |
| -------------- | ---------- | ------------------- | ----------------------------------- |
| id             | uuid       | PK                  |                                     |
| session_id     | uuid       | FK → sessions       |                                     |
| user_id        | uuid       | FK → users          |                                     |
| menu_item_id   | uuid       | FK → menu_items     |                                     |
| quantity       | integer    | DEFAULT 1 NOT NULL  |                                     |
| note           | text       |                     | Custom note (e.g. "ít cay")        |
| unit_base_price| integer    | NOT NULL            | Snapshot of menu_items.price        |
| unit_final_price| integer   | NOT NULL            | unit_base_price + Σ topping prices  |
| created_at     | timestamptz| DEFAULT now()       |                                     |
| updated_at     | timestamptz| DEFAULT now()       |                                     |

**Table:** `order_item_toppings`

| Column           | Type    | Constraints           | Description              |
| ---------------- | ------- | --------------------- | ------------------------ |
| id               | uuid    | PK                    |                          |
| order_item_id    | uuid    | FK → order_items CASCADE|                        |
| topping_option_id| uuid    | FK → topping_options  |                          |
| topping_name     | text    | NOT NULL              | Snapshot tên             |
| extra_price      | integer | NOT NULL              | Snapshot giá topping     |

**RLS:**
- `order_items`: SELECT → session participants; INSERT/UPDATE/DELETE → self, only when ORDERING
- `order_item_toppings`: Follow order_item permission

### 7.3 Components

- `src/features/orders/components/menu-item-card.tsx`
- `src/features/orders/components/order-item-drawer.tsx` — Topping selection modal
- `src/features/orders/components/order-summary.tsx` — Member's current order
- `src/features/orders/schemas.ts`
- `src/features/orders/actions.ts`

---

## 8. Test Cases

### Unit Tests

| TC-ID | Test Name                        | Input                        | Expected                    |
| ----- | -------------------------------- | ---------------------------- | --------------------------- |
| UT-01 | addOrderItem snapshots price     | Menu item with price changes | unitBasePrice stays original|
| UT-02 | addOrderItem validates required topping | Missing required topping | Validation error         |
| UT-03 | updateOrderItem recalculates unitFinalPrice| New toppings     | Correct total price         |

### Integration Tests

- [ ] **IT-01**: Member adds order item → stored with correct price snapshot
- [ ] **IT-02**: Member cannot add item when LOCKED (RLS enforcement)
- [ ] **IT-03**: Member cannot edit another member's order item

---

## 9. Dependencies

| Type           | Feature/Service | Status     | Notes      |
| -------------- | --------------- | ---------- | ---------- |
| **Depends on** | F-003 Sessions  | 🔴 Pending | Need session ORDERING state |
| **Depends on** | F-002 Restaurants| 🔴 Pending | Need menu items |

---

## 10. Notes & Change Log

### Technical Notes

- Price snapshot: fetch `menu_items.price` in the Server Action at order time, do NOT join after
- For `updateOrderItem`: delete all `order_item_toppings` first, then re-insert (simpler than diff)
- Topping validation: check required groups have selection before submit

### Change Log

| Date       | Author | Changes      |
| ---------- | ------ | ------------ |
| 2026-03-05 | Agent  | Initial spec |
