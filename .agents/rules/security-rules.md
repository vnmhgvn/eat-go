---
trigger: always_on
---

# Security Guardrails

> **Mục tiêu**: Bảo vệ hệ thống khỏi các lỗ hổng phổ biến, tuân thủ yêu cầu bảo mật của fintech và ngăn chặn sai sót của con người.

---

## 🚫 1. FORBIDDEN ACTIONS (Cấm tuyệt đối)

1. **Hardcode Secrets**:
   - Không bao giờ viết API Key, Password, Token, JWT Secret trực tiếp vào source code.
   - Luôn dùng `@Value`, `@ConfigurationProperties`, hoặc Vault/Secret Manager.
2. **Commit Secrets**:
   - Kiểm tra `.gitignore` trước khi commit.
   - Đảm bảo `.env`, `application-local.*`, `*.key`, `*.pem`, `*.p12` nằm trong `.gitignore`.
   - Nếu phát hiện secret đã commit → kích hoạt ngay **Incident Protocol** (Mục 5).
3. **Xóa Database**:
   - Không bao giờ chạy `DROP TABLE`, `TRUNCATE`, hay xóa production data nếu không có lệnh rõ ràng từ user và xác nhận 2 lần.

---

## 🛡️ 2. CODING STANDARDS (Tiêu chuẩn Code An toàn)

### Input Validation & Injection Prevention

- **SQL Injection**: Luôn dùng Parameterized Queries qua Spring Data JPA / JDBC. Cấm nối chuỗi vào SQL.
- **Input Validation**: Validate tất cả input tại API boundary bằng `@Valid`, `@NotNull`, `@Size`, `@Positive`.
- **Deserialization**: Không deserialize dữ liệu từ nguồn không tin cậy mà không có type-safe schema.

### Authentication & Authorization

- **Password hashing**: BCrypt (cost ≥ 12) hoặc Argon2id. Cấm MD5/SHA1.
- **JWT**:
  - Access token TTL ≤ 15 phút.
  - Refresh token TTL ≤ 7 ngày, lưu `HttpOnly` cookie — không lưu `localStorage`.
  - Rotate refresh token sau mỗi lần dùng (token rotation).
  - JWT secret lưu trong env var / Vault — không hardcode.
- **RBAC**: `@PreAuthorize` tại API layer — không check permission trong Handler hay Service.
- **Rate Limiting**: Áp dụng cho mọi public auth endpoint (`/auth/**`): tối đa 5 lần/phút/IP.

### API Security

- **CORS**: Whitelist explicit origins — không dùng `*` trên production.
- **CSRF**: Bật cho state-changing endpoints khi dùng cookie-based auth.
- **Security Headers**: Cấu hình `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.
- **Sensitive data in logs**: Không log password, OTP, token, account number, card number. Mask bằng `***` nếu cần.

### Dependency Security

- Chạy `mvn dependency-check:check` — không merge PR nếu có HIGH/CRITICAL CVE.
- Dependencies có CVE critical: patch trong vòng 48 giờ. CVE high: patch trong vòng 1 tuần.

---

## 💳 3. FINTECH-SPECIFIC STANDARDS (Tiêu chuẩn Đặc thù Fintech)

### Transaction Idempotency

**Mọi mutation endpoint xử lý giao dịch tài chính PHẢI có idempotency key.**

```java
// MUST: idempotency key check trước khi xử lý
@PostMapping("/payments")
@PreAuthorize("hasRole('USER')")
public ResponseEntity<PaymentResponse> initiatePayment(
    @RequestHeader("Idempotency-Key") String idempotencyKey,
    @Valid @RequestBody PaymentCommand command
) {
    // Nếu key đã xử lý → trả về kết quả cũ, không xử lý lại
    return paymentHandler.handle(idempotencyKey, command);
}
```

- Lưu idempotency key + result vào Redis với TTL 24h.
- Nếu request giống key đã có → trả response cũ, không tạo transaction mới.
- Không bao giờ bỏ qua idempotency cho payment, transfer, refund endpoints.

### Immutable Audit Trail

**Mọi event phải có audit log immutable.**

- Audit log phải có: `who` (userId), `what` (action), `when` (timestamp), `before` (state trước), `after` (state sau), `correlationId`.
- Audit entity phải là append-only — không có `update` hay `delete` method.
- Lưu vào store immutable (append-only DB table, WORM storage, hoặc SIEM).
- Không log audit vào cùng transaction với business operation — dùng `@TransactionalEventListener`.

```java
// MUST: audit event sau commit, không nằm trong cùng transaction
@TransactionalEventListener(phase = AFTER_COMMIT)
public void onPaymentCreated(PaymentCreatedEvent event) {
    auditRepository.save(AuditEntry.of(event));
}
```

### Sensitive Data Masking

- Account number: hiển thị chỉ 4 số cuối: `****1234`
- Card number: mask theo PCI-DSS: `4111 **** **** 1111`
- OTP: không bao giờ log OTP value, chỉ log `"OTP verified"`
- Không trả về sensitive fields trong API response nếu không cần thiết

### Concurrent Writes

- Dùng `@Lock(LockModeType.PESSIMISTIC_WRITE)` hoặc `SELECT FOR UPDATE` cho concurrent balance updates.
- Dùng `@Transactional(isolation = Isolation.SERIALIZABLE)` cho các operation critical (debit/credit).
- Không bao giờ đọc balance → update balance trong hai transaction riêng biệt (TOCTOU race condition).

---

## 📋 4. AUDIT & OBSERVABILITY

| Sự kiện                                | Phải log                                                |
| -------------------------------------- | ------------------------------------------------------- |
| Login thành công / thất bại            | userId (nếu có), IP, timestamp, user-agent              |
| Thay đổi password / thông tin nhạy cảm | userId, IP, timestamp                                   |
| Truy cập dữ liệu tài chính             | userId, resource, action, timestamp                     |
| Khởi tạo giao dịch                     | userId, amount, currency, correlationId, idempotencyKey |
| Token revoke / logout                  | userId, timestamp, reason                               |
| Admin action                           | adminId, targetId, action, before/after, timestamp      |

- **KHÔNG** log raw request body chứa credentials hoặc sensitive data.
- Audit logs phải **immutable** và **tamper-evident**.

---

## 🚨 5. INCIDENT PROTOCOL

Khi phát hiện lỗ hổng bảo mật hoặc nghi ngờ lộ secret:

1. **DỪNG**: Ngừng mọi tác vụ hiện tại.
2. **BÁO CÁO**: Thông báo ngay cho user bằng cảnh báo 🔴 **RED ALERT**.
3. **KHẮC PHỤC ngay**:
   - Rotate secret bị lộ (API key, JWT secret, DB password).
   - Revoke tất cả active sessions nếu JWT secret bị lộ.
   - Xóa commit chứa secret khỏi git history (`git filter-repo` hoặc BFG Repo-Cleaner).
4. **POST-MORTEM**: Ghi lại timeline, root cause, và biện pháp phòng ngừa.
