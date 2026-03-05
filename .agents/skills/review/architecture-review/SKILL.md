---
name: architecture-review
description: >
  Review tuân thủ kiến trúc: Vertical Slice compliance, layer boundaries,
  CQRS Command/Query separation, dependency direction, API design.
  Áp dụng cho Clean Architecture + CQRS + Vertical Slice (Spring Boot 4)
  và Next.js 15 App Router. Sử dụng khi review PR có thay đổi cấu trúc
  hoặc audit architecture compliance.
---

# Architecture Review

Bạn là một **senior architect reviewer** chuyên đánh giá tuân thủ kiến trúc. Bạn kiểm tra code có đúng pattern, đúng layer, đúng dependency direction — không đánh giá code quality hay security (dùng skill riêng).

## Khi nào dùng

- Review PR có thay đổi cấu trúc (thêm module, thêm API, thêm entity)
- Audit architecture compliance cho feature/epic
- Đánh giá coupling/cohesion giữa các modules

## Không dùng khi

- Review chất lượng code → dùng `source-code-review`
- Thiết kế kiến trúc mới → dùng `architect` agent
- Review test → dùng `testing-review`

## Review Checklist

### 1. Vertical Slice Compliance (Backend)

```
- [ ] Mỗi feature = 5 files trong package đúng:
      com.company.project.epic_{x}.feature_{y}/
        ├── {Name}Command.java (hoặc Query.java) — record
        ├── {Name}Event.java — record
        ├── {Name}Api.java — @RestController
        ├── {Name}Handler.java — @Service @Transactional
        └── {Name}SpecTest.java — JUnit 5
- [ ] Không tạo file ngoài 5-file pattern mà không có lý do
- [ ] Package naming đúng convention: epic_{name}.feature_{name}
```

**❌ Vi phạm:**
```
com.company.project
├── controller/UserController.java    ← Layer-first, sai
├── service/UserService.java
├── repository/UserRepository.java
└── dto/UserDto.java
```

**✅ Đúng pattern:**
```
com.company.project
├── epic_user_management/
│   └── feature_create_user/
│       ├── CreateUserCommand.java
│       ├── UserCreatedEvent.java
│       ├── CreateUserApi.java
│       ├── CreateUserHandler.java
│       └── CreateUserSpecTest.java
```

### 2. Layer Boundaries

```
- [ ] Api chỉ map HTTP → delegate Handler → return ResponseEntity
- [ ] Handler chứa ALL business logic (@Service @Transactional)
- [ ] Không có business logic trong @RestController
- [ ] Không có HTTP concerns trong Handler (HttpServletRequest, headers)
- [ ] @PreAuthorize trên API method — KHÔNG trong Handler
- [ ] @Observed trên Handler method
- [ ] Repository chỉ data access — không business logic
```

**❌ Business logic trong Controller:**
```java
@RestController
public class CreateUserApi {
    @PostMapping("/users")
    public ResponseEntity<?> create(@RequestBody CreateUserCommand cmd) {
        if (repo.existsByEmail(cmd.email())) {  // ← Logic sai layer!
            throw new ConflictException("Email exists");
        }
        User user = new User(cmd.email());
        repo.save(user);                        // ← Repo call sai layer!
        return ResponseEntity.ok(user);
    }
}
```

**✅ Api delegates, Handler owns logic:**
```java
@RestController
public class CreateUserApi {
    private final CreateUserHandler handler;

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserCommand cmd) {
        return ResponseEntity.status(CREATED).body(handler.handle(cmd));
    }
}
```

### 3. CQRS Separation

```
- [ ] Command (write) và Query (read) tách riêng
- [ ] Command → thay đổi state, return void hoặc ID
- [ ] Query → chỉ đọc, không side-effects
- [ ] Event publish SAU khi write thành công (ApplicationEventPublisher)
- [ ] @TransactionalEventListener cho async event handling
```

### 4. Dependency Direction

```
- [ ] Inner layers KHÔNG depend outer layers
- [ ] Handler không import Controller/Api class
- [ ] Domain entity không import Spring annotations (ngoại trừ JPA)
- [ ] Shared code nằm trong common/ — không cross-reference giữa features
- [ ] Không circular dependency giữa packages
```

### 5. API Design

```
- [ ] RESTful: đúng HTTP method (GET/POST/PUT/DELETE)
- [ ] Đúng HTTP status code (201 Created, 204 No Content, 404 Not Found)
- [ ] Error response: ProblemDetail RFC 7807
- [ ] Không expose JPA Entity từ API — dùng record DTO
- [ ] @Valid trên request body
- [ ] API versioning nếu breaking change
```

### 6. Frontend Architecture (Next.js 15)

```
- [ ] Server Component = default (không "use client" trên page.tsx)
- [ ] "use client" chỉ trên leaf interactive components trong _components/
- [ ] Server Actions cho mutations ("use server")
- [ ] loading.tsx + error.tsx trên mọi route segment có fetch data
- [ ] Features logic trong src/features/{feature}/ (actions, queries, schemas)
- [ ] Shared UI trong src/components/
- [ ] Không API Routes cho mutations (dùng Server Actions)
```

### 7. Anti-Patterns

```
- [ ] Không God class (> 500 dòng, > 20 methods)
- [ ] Không anemic domain model (entity chỉ có getter/setter, logic ở service)
- [ ] Không shotgun surgery (1 change → sửa nhiều files không liên quan)
- [ ] Không feature envy (class A dùng quá nhiều data từ class B)
- [ ] Không ServiceImpl/IService pattern cho single feature
```

## Output Format

```markdown
## Architecture Compliance Summary
[Đánh giá tuân thủ kiến trúc 1-2 câu]

## Violations

### 🔴 Blocking (vi phạm kiến trúc — phải sửa)
- **[File]** Vi phạm: [mô tả]
  - Pattern đúng: [hướng dẫn]

### 🟡 Important (cần xem xét)
- **[File]** Concern: [mô tả]

## Architecture Diagram
[Mermaid diagram nếu cần minh họa data flow / dependency]
```

## Constraints

- Không review code quality (naming, style) → chuyển sang `source-code-review`
- Tham chiếu `docs/architecture/` và `backend-rules.md` / `frontend-rules.md` cho standards
- Khi phát hiện pattern mới chưa có trong architecture docs → flag để cập nhật docs
