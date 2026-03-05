# LunchOrder — Business Requirements Document (BRD)

> **Version:** 1.0  
> **Trạng thái:** Draft  
> **Mục tiêu:** Tài liệu nghiệp vụ cho ứng dụng đặt đồ ăn nhóm nội bộ

---

## 1. Tổng quan hệ thống

### 1.1 Mục tiêu

LunchOrder là ứng dụng web nội bộ giúp nhóm văn phòng (5–50 người):

- Tạo phiên đặt đồ ăn theo nhóm một cách nhanh chóng
- Quản lý danh sách nhà hàng yêu thích và menu lưu sẵn
- Vote chọn nhà hàng/menu trước khi chốt đơn (tùy chọn)
- Chia hóa đơn chính xác theo 2 phương thức: chia đều hoặc chia theo món
- Tự động tính tổng tiền mỗi người bao gồm phí ship/phí công
- Theo dõi trạng thái thanh toán qua QR code VietQR

### 1.2 Phạm vi (Scope)

- Nhóm nội bộ từ **5 đến 50 người**
- **Không** phải nền tảng thương mại, không tích hợp payment gateway thực
- Deploy miễn phí trên **Vercel + Supabase**
- Không có realtime (cập nhật thủ công qua nút Reload)

### 1.3 Vai trò người dùng

| Vai trò  | Mô tả                                                   | Phạm vi quyền                                        |
|----------|---------------------------------------------------------|------------------------------------------------------|
| `admin`  | Quản trị viên hệ thống, quản lý dữ liệu dùng chung     | Toàn quyền nhà hàng/menu global, quản lý người dùng |
| `host`   | Người tạo phiên, quản lý phiên, chốt đơn               | Full access phiên mình tạo, tạo nhà hàng/menu tạm   |
| `member` | Thành viên tham gia phiên, chọn món, vote               | Chỉnh sửa đơn của bản thân trong phiên               |
| `viewer` | Người xem kết quả (chưa đăng nhập hoặc chỉ xem link)  | Read-only toàn bộ phiên                              |

---

## 2. Authentication & Authorization

### 2.1 Đăng nhập

- Sử dụng **Google OAuth 2.0** — không yêu cầu email công ty cụ thể
- Sau lần đăng nhập đầu tiên, hệ thống tạo tài khoản người dùng với thông tin từ Google (tên, avatar, email)
- Người dùng chưa đăng nhập có thể xem phiên qua link chia sẻ với quyền `viewer`

### 2.2 Phân quyền theo vai trò

| Hành động                              | admin | host | member | viewer |
|----------------------------------------|-------|------|--------|--------|
| Đăng nhập Google                       | ✅    | ✅   | ✅     | ❌     |
| Tạo phiên mới                          | ✅    | ✅   | ❌     | ❌     |
| Chỉnh sửa/xóa phiên                    | ✅    | ✅*  | ❌     | ❌     |
| Thêm món vào phiên                     | ✅    | ✅   | ✅     | ❌     |
| Sửa/xóa món của bản thân              | ✅    | ✅   | ✅     | ❌     |
| Vote nhà hàng/menu                     | ✅    | ✅   | ✅     | ❌     |
| Chốt đơn / kết thúc phiên             | ✅    | ✅*  | ❌     | ❌     |
| Quản lý nhà hàng/menu **global**       | ✅    | ❌   | ❌     | ❌     |
| Tạo nhà hàng/menu **tạm trong phiên** | ❌    | ✅   | ❌     | ❌     |
| Xem lịch sử phiên                      | ✅    | ✅   | ✅     | ✅**   |

> (*) Chỉ áp dụng cho phiên do chính họ tạo  
> (**) Chỉ xem được nếu có link chia sẻ phiên

---

## 3. Quản lý Nhà hàng & Menu

### 3.1 Phân loại dữ liệu

Hệ thống có 2 loại nhà hàng/menu:

#### a) Dữ liệu Global (Admin quản lý)
- Danh sách nhà hàng và menu được lưu vĩnh viễn, dùng chung cho tất cả phiên
- Chỉ `admin` có quyền thêm, sửa, xóa
- Dữ liệu này xuất hiện làm **gợi ý mặc định** khi host tạo phiên

#### b) Dữ liệu Tạm (Host tạo trong phiên)
- Host có thể tạo nhà hàng/menu mới **ngay trong lúc tạo phiên**
- Dữ liệu này chỉ tồn tại trong phiên đó, **không ảnh hưởng** đến danh sách global
- Sau khi phiên kết thúc, dữ liệu tạm vẫn được lưu lại trong lịch sử phiên

### 3.2 Thông tin Nhà hàng

| Trường          | Kiểu dữ liệu | Bắt buộc | Mô tả                          |
|-----------------|--------------|----------|--------------------------------|
| `name`          | String       | ✅        | Tên nhà hàng                   |
| `category`      | String       | ❌        | Loại món (cơm, bún, bánh mì…) |
| `address`       | String       | ❌        | Địa chỉ                        |
| `phoneNumber`   | String       | ❌        | Số điện thoại đặt hàng         |
| `defaultShipFee`| Number       | ❌        | Phí ship mặc định gợi ý        |
| `note`          | String       | ❌        | Ghi chú (giờ mở cửa, lưu ý…) |
| `isGlobal`      | Boolean      | ✅        | Global hay tạm trong phiên     |

### 3.3 Thông tin Menu Item

| Trường       | Kiểu dữ liệu | Bắt buộc | Mô tả                         |
|--------------|--------------|----------|-------------------------------|
| `name`       | String       | ✅        | Tên món                       |
| `price`      | Number       | ✅        | Giá base (VNĐ), chưa tính topping |
| `category`   | String       | ❌        | Nhóm món (khai vị, chính…)   |
| `description`| String       | ❌        | Mô tả ngắn                    |
| `imageUrl`   | String       | ❌        | Ảnh minh họa                  |
| `isAvailable`| Boolean      | ✅        | Món còn phục vụ không         |
| `toppings`   | List<Topping>| ❌        | Danh sách topping đi kèm (xem 3.4) |

### 3.4 Thông tin Topping

Topping là các lựa chọn bổ sung đi kèm một món (VD: size, đường/đá, thêm trứng...).  
Mỗi Menu Item có thể có **nhiều nhóm topping**, mỗi nhóm có nhiều lựa chọn.

**Thông tin Topping Group** (nhóm lựa chọn):

| Trường        | Kiểu dữ liệu | Bắt buộc | Mô tả                                            |
|---------------|--------------|----------|--------------------------------------------------|
| `groupName`   | String       | ✅        | Tên nhóm (VD: "Size", "Đường", "Topping thêm") |
| `isRequired`  | Boolean      | ✅        | Bắt buộc chọn hay không                         |
| `minSelect`   | Number       | ✅        | Số lựa chọn tối thiểu (thường 0 hoặc 1)         |
| `maxSelect`   | Number       | ✅        | Số lựa chọn tối đa (1 = chọn 1 trong nhóm)     |
| `options`     | List<ToppingOption> | ✅  | Danh sách các lựa chọn trong nhóm              |

**Thông tin Topping Option** (từng lựa chọn):

| Trường        | Kiểu dữ liệu | Bắt buộc | Mô tả                               |
|---------------|--------------|----------|-------------------------------------|
| `name`        | String       | ✅        | Tên lựa chọn (VD: "Size L", "Thêm trứng") |
| `extraPrice`  | Number       | ✅        | Giá thêm (0 nếu miễn phí)          |
| `isAvailable` | Boolean      | ✅        | Lựa chọn còn khả dụng không        |

**Ví dụ cấu trúc topping:**
```
Trà sữa trân châu — 35,000đ
├── [Nhóm] Size (*bắt buộc, chọn 1)
│   ├── M  — +0đ
│   ├── L  — +5,000đ
│   └── XL — +10,000đ
├── [Nhóm] Đường (tùy chọn, chọn 1)
│   ├── 100% — +0đ
│   ├── 70%  — +0đ
│   └── 50%  — +0đ
└── [Nhóm] Topping thêm (tùy chọn, chọn 0–3)
    ├── Trân châu đen — +5,000đ
    ├── Pudding       — +8,000đ
    └── Thạch dừa     — +5,000đ
```

> **Lưu ý:** Giá của một Order Item = `price` (base) + Σ `extraPrice` của các topping được chọn.  
> Toàn bộ snapshot giá (bao gồm topping) được lưu tại thời điểm member chọn món (BR05).

---

## 4. Phiên Order (Order Session)

### 4.1 Vòng đời phiên

```
[Tạo phiên] → [Mở vote*] → [Đang order] → [Chốt đơn] → [Thanh toán] → [Kết thúc]
                 ↑ tùy chọn
```

| Trạng thái    | Mô tả                                                         |
|---------------|---------------------------------------------------------------|
| `VOTING`      | Đang vote nhà hàng/menu (nếu host bật tính năng vote)        |
| `ORDERING`    | Thành viên đang chọn món                                      |
| `LOCKED`      | Đã chốt đơn, không nhận thêm order                          |
| `PAYING`      | Đang trong quá trình thu tiền / xác nhận thanh toán          |
| `COMPLETED`   | Phiên hoàn tất                                               |
| `CANCELLED`   | Phiên bị hủy bởi host                                        |

### 4.2 Thông tin Phiên

| Trường           | Kiểu dữ liệu | Bắt buộc | Mô tả                                      |
|------------------|--------------|----------|--------------------------------------------|
| `title`          | String       | ✅        | Tên phiên (VD: "Trưa thứ 2 tuần này")     |
| `hostId`         | UUID         | ✅        | Người tạo phiên                            |
| `restaurantId`   | UUID         | ❌        | Nhà hàng được chọn (sau vote hoặc chọn ngay)|
| `isVotingEnabled`| Boolean      | ✅        | Có bật tính năng vote không                |
| `deadline`       | Timestamp    | ❌        | Thời hạn chốt đơn tự động (nếu có)        |
| `shipFee`        | Number       | ❌        | Phí ship (host nhập thủ công)              |
| `serviceFee`     | Number       | ❌        | Phí công/phí dịch vụ thêm (host nhập)     |
| `grandTotal`     | Number       | ❌        | Tổng cuối host nhập tay (mặc định = subtotal + extraFee) |
| `splitMethod`    | Enum         | ✅        | `EQUAL` hoặc `BY_ITEM`                     |
| `shareLink`      | String       | ✅        | Link chia sẻ cho viewer                    |
| `status`         | Enum         | ✅        | Trạng thái phiên (xem 4.1)                |
| `createdAt`      | Timestamp    | ✅        | Thời điểm tạo phiên                        |

### 4.3 Tạo phiên — Các bước

**Bước 1 — Thông tin cơ bản:**
- Nhập tên phiên
- Chọn bật/tắt vote
- Đặt deadline (tùy chọn)

**Bước 2 — Chọn nhà hàng:**
- Nếu **vote bật**: thêm tối thiểu 2 nhà hàng làm ứng cử viên để vote
- Nếu **vote tắt**: chọn ngay 1 nhà hàng từ danh sách global hoặc tạo mới

**Bước 3 — Cài đặt bill:**
- Chọn phương thức chia bill: Chia đều (`EQUAL`) hoặc Chia theo món (`BY_ITEM`)
- Nhập phí ship (tùy chọn)
- Nhập phí công/phí dịch vụ (tùy chọn)

**Bước 4 — Chia sẻ:**
- Hệ thống sinh link chia sẻ phiên
- Host chia sẻ link cho thành viên tham gia

### 4.4 Deadline & Chốt đơn

- **Deadline tự động**: Nếu host đặt deadline, hệ thống tự động chuyển trạng thái sang `LOCKED` khi đến giờ
- **Chốt tay**: Host có thể bấm "Chốt đơn" bất cứ lúc nào để chuyển ngay sang `LOCKED`
- Sau khi `LOCKED`: member không thể thêm/sửa/xóa món, chỉ host mới có thể mở lại (nếu cần)

---

## 5. Tính năng Vote

> Chỉ hoạt động khi host bật `isVotingEnabled = true` khi tạo phiên

### 5.1 Luồng vote

```
Host thêm danh sách ứng cử viên (nhà hàng/menu)
        ↓
Phiên mở ở trạng thái VOTING
        ↓
Thành viên vote (mỗi người 1 phiếu)
        ↓
Host kết thúc vote thủ công hoặc khi đủ thành viên vote
        ↓
Nhà hàng/menu nhiều vote nhất được chọn
(hòa: host quyết định)
        ↓
Phiên chuyển sang ORDERING
```

### 5.2 Quy tắc vote

- Mỗi `member` và `host` được **1 phiếu duy nhất**
- Có thể **thay đổi phiếu** trong khi phiên còn ở trạng thái `VOTING`
- **Kết quả hòa**: host được quyền quyết định chọn cái nào
- Kết quả vote được hiển thị công khai (số phiếu, ai vote gì)

---

## 6. Quản lý Order của Member

### 6.1 Chọn món

- Member truy cập phiên qua link hoặc dashboard
- Xem menu của nhà hàng được chọn (sau khi vote xong hoặc host đã chọn)
- Thêm nhiều món vào đơn của mình, mỗi món có thể chỉnh số lượng
- Thêm ghi chú riêng cho từng món (VD: "ít cay", "không hành")
- Có thể sửa/xóa món của mình miễn phiên chưa `LOCKED`

### 6.2 Thông tin Order Item

| Trường            | Kiểu dữ liệu        | Bắt buộc | Mô tả                                        |
|-------------------|---------------------|----------|----------------------------------------------|
| `menuItemId`      | UUID                | ✅        | Món được chọn                                |
| `quantity`        | Number              | ✅        | Số lượng                                     |
| `note`            | String              | ❌        | Ghi chú cá nhân cho món                      |
| `unitBasePrice`   | Number              | ✅        | Giá base món tại thời điểm order (snapshot)  |
| `selectedToppings`| List<SelectedTopping>| ❌       | Các topping đã chọn (snapshot tên + giá)     |
| `unitFinalPrice`  | Number              | ✅        | Giá cuối = basePrice + Σ extraPrice topping  |

> `unitFinalPrice` là giá dùng để tính `memberSubtotal` trong công thức chia bill.

---

## 7. Chia Bill

### 7.1 Công thức tính chung

```
Tổng tiền món  (subtotal)   = Σ unitFinalPrice × quantity — toàn phiên
Phí phát sinh  (extraFee)   = shipFee + serviceFee  (host nhập, mặc định 0)
Tổng cuối      (grandTotal) = host nhập thủ công  |  mặc định = subtotal + extraFee
```

> Host có thể nhập `grandTotal` trực tiếp (ví dụ: sau khi áp mã giảm giá, làm tròn tổng bill thực tế từ nhà hàng...). Nếu không nhập, hệ thống tự tính `subtotal + extraFee`.

### 7.2 Phương thức 1: Chia đều (`EQUAL`)

```
Số tiền mỗi người = grandTotal ÷ số member tham gia

Ví dụ:
  subtotal   = 350,000đ
  extraFee   =  30,000đ  (ship 20k + công 10k)
  grandTotal = 380,000đ  (default = subtotal + extraFee)
  Số member  = 4 người

  → Mỗi người trả: 380,000 ÷ 4 = 95,000đ
```

### 7.3 Phương thức 2: Chia theo món (`BY_ITEM`)

Mỗi member trả một phần của `grandTotal` tương ứng với tỉ lệ tiền món của họ trong tổng `subtotal`.

```
Member X phải trả = memberSubtotal_X × grandTotal ÷ subtotal
```

Công thức này đảm bảo:
- Ship, discount, phí công đều được phân bổ theo tỉ lệ tự nhiên
- Σ tiền tất cả member = grandTotal (không dư, không thiếu)

**Ví dụ:**
```
  Member A order: 120,000đ
  Member B order:  90,000đ
  Member C order: 140,000đ
  subtotal      = 350,000đ
  extraFee      =  30,000đ  (ship 20k + công 10k)
  grandTotal    = 330,000đ  (host nhập thủ công)

  → A phải trả: 120,000 × 330,000 ÷ 350,000 = 113,142.86 ~ 113,143đ
  → B phải trả:  90,000 × 330,000 ÷ 350,000 =  84,857.14 ~  84,857đ
  → C phải trả: 140,000 × 330,000 ÷ 350,000 = 132,000.00 = 132,000đ

  Kiểm tra: 113,143 + 84,857 + 132,000 = 330,000đ ✅
```

> **Quy tắc làm tròn:** Làm tròn đến **đơn vị đồng** (không làm tròn lên 1,000đ).  
> Để đảm bảo tổng bằng đúng `grandTotal`, phần lẻ sẽ được cộng/trừ vào member có `memberSubtotal` lớn nhất.

### 7.4 Hiển thị bảng tổng kết bill

| Member  | Tiền món | Tổng phải trả  | Trạng thái   |
|---------|----------|----------------|--------------|
| Minh    | 120,000đ | 113,143đ       | ⏳ Chưa trả  |
| Lan     |  90,000đ |  84,857đ       | ✅ Đã trả    |
| Hùng    | 140,000đ | 132,000đ       | ⏳ Chưa trả  |
| **Tổng**| **350,000đ (subtotal)** | **330,000đ (grandTotal)** | |

> Phần mô tả chi tiết phép tính hiển thị bên dưới tên mỗi member:  
> `120,000 × 330,000 ÷ 350,000 = 113,143đ`

---

## 8. Thanh toán VietQR

### 8.1 Mô hình thanh toán

- **Host** (hoặc người được chỉ định) là người **ứng tiền đặt hàng**
- Sau khi phiên `LOCKED`, các member chuyển khoản lại cho host
- Mỗi member nhìn thấy đúng **số tiền cần chuyển** và **QR code riêng** của mình

### 8.2 Thông tin tài khoản nhận tiền

Host nhập thông tin tài khoản ngân hàng một lần, lưu vào profile:

| Trường        | Mô tả                             |
|---------------|-----------------------------------|
| `bankCode`    | Mã ngân hàng (VD: VCB, TCB, MB…) |
| `accountNumber`| Số tài khoản                     |
| `accountName` | Tên chủ tài khoản                 |

### 8.3 Sinh QR code

- Sử dụng **VietQR API** (miễn phí, `img.vietqr.io`)
- Format URL:  
  ```
  https://img.vietqr.io/image/{bankCode}-{accountNumber}-{template}.png
    ?amount={soTien}
    &addInfo={noiDungChuyenKhoan}
    &accountName={tenChuTK}
  ```
- `addInfo` (nội dung chuyển khoản) tự động sinh:  
  `LUNCHORDER #{sessionId} - {memberName}`

### 8.4 Xác nhận thanh toán

- Host xem danh sách member và **đánh dấu thủ công** khi nhận được tiền
- Trạng thái thanh toán từng member: `PENDING` → `PAID`
- Member cũng có thể tự nhấn **"Tôi đã chuyển"** (không tự động xác nhận, chỉ nhắc host)
- Khi tất cả member `PAID` → host có thể chuyển phiên sang `COMPLETED`

---

## 9. Lịch sử Phiên

- Tất cả phiên đã `COMPLETED` hoặc `CANCELLED` được lưu lại vĩnh viễn
- Member xem được lịch sử phiên của mình: tổng chi tiêu, món đã order, nhà hàng
- Host xem được toàn bộ lịch sử phiên mình tạo
- Lịch sử không thể chỉnh sửa sau khi phiên `COMPLETED`

---

## 10. Tính năng bổ sung (Nice-to-have / Roadmap)

Các tính năng dưới đây chưa nằm trong MVP nhưng có thể thêm vào các phiên bản sau:

| Tính năng                   | Mô tả                                                                 | Độ ưu tiên |
|-----------------------------|-----------------------------------------------------------------------|------------|
| **Thống kê cá nhân**        | Tổng chi tiêu theo tháng, món hay order nhất, nhà hàng hay đến nhất  | Cao        |
| **Template phiên**          | Lưu cấu hình phiên hay dùng để tạo lại nhanh                         | Cao        |
| **Copy phiên**              | Duplicate phiên cũ (nhà hàng, cấu hình bill) để tạo phiên mới nhanh | Trung bình |
| **Gợi ý nhà hàng**         | Dựa vào lịch sử, gợi ý nhà hàng "lâu chưa đặt"                      | Trung bình |
| **Export bill**             | Xuất bảng tổng kết bill ra file PDF / ảnh để chia sẻ                 | Trung bình |
| **Thông báo Slack/GG Chat** | Tự động gửi tin nhắn khi có phiên mới hoặc sắp deadline              | Thấp       |
| **Webhook khi chốt đơn**    | Gửi danh sách order ra bên ngoài (tích hợp chatbot đặt hàng)         | Thấp       |

---

## 11. Luồng nghiệp vụ tổng thể (Happy Path)

```
1. Host đăng nhập Google → Tạo phiên mới
        ↓
2. [Nếu vote] Thêm nhà hàng ứng cử → Chia sẻ link → Member vote → Host chốt kết quả vote
   [Nếu không vote] Chọn nhà hàng ngay
        ↓
3. Phiên ORDERING → Member mở link → Chọn món → Lưu đơn
        ↓
4. Host chốt đơn (thủ công hoặc hết deadline) → Phiên LOCKED
        ↓
5. Host xem tổng kết bill → Hệ thống tính tiền từng người
        ↓
6. Từng member xem QR code → Chuyển khoản cho host
        ↓
7. Host đánh dấu "Đã nhận tiền" từng người → Tất cả PAID
        ↓
8. Host kết thúc phiên → Phiên COMPLETED → Lưu lịch sử
```

---

## 12. Các ràng buộc & quy tắc nghiệp vụ

| ID   | Quy tắc                                                                                         |
|------|-------------------------------------------------------------------------------------------------|
| BR01 | Một member chỉ có **1 đơn** trong mỗi phiên (nhưng đơn có thể có nhiều món)                   |
| BR02 | Chỉ host mới được chốt đơn, hủy phiên, hoặc thay đổi phương thức chia bill                    |
| BR03 | Sau khi phiên `LOCKED`, member **không thể** thêm/sửa/xóa món                                 |
| BR04 | Phí ship và phí công **không tham gia** tính tỉ lệ chia — chỉ là số tiền cộng thêm            |
| BR05 | `subtotal` tính dựa trên **giá tại thời điểm order** (snapshot), không thay đổi dù admin sửa menu sau |
| BR06 | Nếu member chưa chọn món nào khi phiên chốt, họ vẫn xuất hiện trong danh sách với tổng = 0đ  |
| BR07 | Trong trường hợp vote hòa, host **phải** chọn thủ công trước khi chuyển sang `ORDERING`        |
| BR08 | Host có thể **mở lại** phiên từ `LOCKED` về `ORDERING` nếu chưa có ai thanh toán              |
| BR09 | Dữ liệu nhà hàng/menu tạm do host tạo trong phiên **không** được tự động đẩy lên global       |
| BR10 | Admin không thể xóa nhà hàng/menu global đang được tham chiếu bởi phiên chưa `COMPLETED`     |
