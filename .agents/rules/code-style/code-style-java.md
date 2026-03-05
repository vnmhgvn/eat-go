---
trigger: glob
globs: **/*.java
---

# Java Style Guide

> Ref: [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)

## Naming

| Thành phần      | Convention       | Ví dụ                 |
| --------------- | ---------------- | --------------------- |
| Package         | lowercase        | `com.example.project` |
| Class/Interface | UpperCamelCase   | `MyClass`, `Runnable` |
| Method          | lowerCamelCase   | `getUserName()`       |
| Constant        | UPPER_SNAKE_CASE | `MAX_SIZE`            |
| Variable        | lowerCamelCase   | `userName`            |
| Type Parameter  | Single uppercase | `E`, `T`, `K`, `V`    |

## Rules

- Package: lowercase, không underscore
- Import: không dùng wildcard `*`
- Braces: K&R style (opening brace cùng dòng)
- Indent: 2 spaces
- Line length: max 100 chars

## Bad / Good Examples

### Null Safety — dùng Optional, không return null

```java
// ❌ BAD
public User getUser(Long id) {
  return userRepository.findById(id); // returns null if not found
}

// ✅ GOOD
public Optional<User> getUser(Long id) {
  return userRepository.findById(id);
}
// caller: getUser(id).orElseThrow(() -> new UserNotFoundException(id));
```

### Exception — message rõ ràng, có context

```java
// ❌ BAD
throw new RuntimeException("Not found");

// ✅ GOOD
throw new UserNotFoundException("User not found: id=" + userId);
```

### Annotation ordering — nhất quán trên method

```java
// ❌ BAD
@Transactional @PreAuthorize("hasRole('USER')") @Observed(name = "user.create")
public UserResponse createUser(CreateUserCommand command) { ... }

// ✅ GOOD — mỗi annotation 1 dòng, thứ tự: Spring → Security → Observability
@Observed(name = "user.create")
@Transactional
@PreAuthorize("hasRole('USER')")
public UserResponse createUser(CreateUserCommand command) { ... }
```

### Pattern matching switch — thay if-else instanceof

```java
// ❌ BAD
if (event instanceof PaymentCreatedEvent e) {
  process(e);
} else if (event instanceof PaymentFailedEvent e) {
  handle(e);
}

// ✅ GOOD
switch (event) {
  case PaymentCreatedEvent e -> process(e);
  case PaymentFailedEvent e -> handle(e);
}
```

### Constructor injection — không dùng @Autowired field

```java
// ❌ BAD
@Service
public class UserHandler {
  @Autowired private UserRepository userRepository;
}

// ✅ GOOD
@Service
@RequiredArgsConstructor
public class UserHandler {
  private final UserRepository userRepository;
}
```
