---
trigger: model_decision
description: Load when working with Java, Spring Boot, backend APIs, services, data layer, or any JVM-related tasks.
---

# Backend Rules — Clean Architecture · Vertical Slice · CQRS

> **Trigger**: Load khi làm việc với Java/Spring Boot code, backend APIs, services, hoặc data layer.

> **Stack**: Java 21+ · Spring Boot 4 · Spring Framework 7 · Jakarta EE 11 · Spring Security 7 · Spring Data JPA/JDBC · Micrometer 2

> **Deep-dive patterns & code examples** → Load skill `spring-boot` hoặc `java` khi cần.

> **Package convention & file structure** → xem `rules/structure.md`

---

## Java 21+ — Mandatory Language Features

| Feature                       | Khi nào dùng                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------- |
| **`record`**                  | TẤT CẢ DTOs, Commands, Queries, Events — immutable, không cần Lombok              |
| **`sealed interface`**        | Fixed-subtype domain types (e.g., `Result<S,F>`, `DomainEvent` hierarchy)         |
| **Pattern Matching `switch`** | Thay `if-else instanceof`; exhaustive matching trên sealed types                  |
| **`Optional<T>`**             | Không bao giờ return `null` từ service/repository — dùng `Optional<T>` hoặc throw |
| **`@Nullable` / `@NonNull`**  | JSpecify (`org.jspecify.annotations`) — null contracts tại class/method level     |

> Luôn dùng `jakarta.*` — không bao giờ dùng `javax.*`.

---

## Hard Constraints

### MUST

- Đọc `docs/architecture/` và `docs/product/{epics|features|cr|bugs}` trước khi implement
- Dùng Java `record` cho TẤT CẢ Commands, Queries, Events, Response DTOs
- Dùng `sealed interface` cho fixed type hierarchies với exhaustive `switch`
- Dùng `Enum` cho fixed value sets — không dùng magic strings
- Tất cả business logic trong Handler — không bao giờ trong `@RestController`
- `@PreAuthorize` tại API method — không bao giờ trong Handler
- Publish events qua `ApplicationEventPublisher` sau khi write thành công
- Annotate Handler với `@Observed` cho Micrometer 2 tracing
- Dùng JSpecify `@Nullable` / `@NonNull` cho null contracts
- `ProblemDetail` + `GlobalExceptionHandler` cho tất cả error responses (RFC 7807)
- Constructor injection only (`@RequiredArgsConstructor` + `private final`)
- Dùng `@HttpExchange` cho declarative HTTP clients
- Dùng `SecurityFilterChain` DSL — không extend `WebSecurityConfigurerAdapter`
- Validate inputs: `@NotNull`, `@Valid`, `@Size`, `@Positive`

### MUST (Fintech-specific)

- **Idempotency key** bắt buộc cho mọi financial mutation endpoint (payment, transfer, refund)
- Lưu idempotency key + result vào Redis với TTL 24h — check trước khi xử lý
- Dùng `@Transactional(isolation = Isolation.SERIALIZABLE)` cho financial writes
- Dùng `@Lock(LockModeType.PESSIMISTIC_WRITE)` cho concurrent balance/inventory updates
- Audit event phải dùng `@TransactionalEventListener(AFTER_COMMIT)` — không nằm trong cùng transaction với business operation
- Audit entity phải append-only — không có `update` hay `delete` operation
- Mask sensitive data trong logs: account number → `****1234`, card → `4111 **** **** 1111`

### MUST NOT

- Business logic trong `@RestController`
- `ServiceImpl` / `IService` cho single feature
- Expose JPA `@Entity` trực tiếp từ REST — luôn dùng `record` DTOs
- `Map<String, Object>` cho data transfer
- `@Autowired` field injection
- `synchronized` holding I/O — dùng `ReentrantLock`
- `ThreadLocal` trong virtual thread context — dùng `ScopedValue`
- `try-catch` cho business validation — throw trực tiếp
- Empty `catch` blocks
- Raw `RestTemplate` — dùng `@HttpExchange`
- `@SuppressWarnings("unchecked")` không có documented reason
- Dùng `SecurityContextHolder` trong business logic — chỉ dùng ở security/filter layer
- Disable CSRF không có documented reason
- Log raw sensitive data (password, OTP, token, account number, card number)

---

## Package Convention — Vertical Slice

```
com.company.project
├── epic_{epic_name}/
│   └── feature_{feature_name}/      # ← một self-contained slice
│       ├── {Name}Command.java       # hoặc Query.java — Java record
│       ├── {Name}Event.java         # Java record, fire-after-commit
│       ├── {Name}Api.java           # @RestController, no logic
│       ├── {Name}Handler.java       # @Service @Transactional, all logic
│       └── {Name}SpecTest.java      # JUnit 5 + BDDMockito
└── common/
    ├── exception/GlobalExceptionHandler.java
    ├── audit/AuditEntity.java        # append-only audit entity
    └── config/
```
