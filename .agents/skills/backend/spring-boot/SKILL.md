---
name: spring-boot
description: Expert guide for building Spring Boot applications, with deep specialization in Spring Boot 4 (latest, built on Spring Framework 7). Use when creating, modifying, debugging, or migrating Spring Boot projects. Covers project initialization, architecture patterns (layered, hexagonal, modular), REST APIs, data access (JPA/Hibernate 7), security (Spring Security 7), testing (JUnit 6), observability (Micrometer 2/OpenTelemetry), GraalVM native images, virtual threads, declarative HTTP clients, API versioning, and migration from Spring Boot 3 to 4. Triggers on any Spring Boot, Spring Framework, or Java backend development task.
---

# Spring Boot Development Skill

Expert-level guidance for Spring Boot applications — general best practices and Spring Boot 4 specifics.

## Quick Reference

| Component        | Spring Boot 4 Version         |
| ---------------- | ----------------------------- |
| Spring Framework | 7.0+                          |
| Java             | Min 17, Recommended 25        |
| Jakarta EE       | 11 (Servlet 6.1)              |
| Kotlin           | 2.2+                          |
| Hibernate        | 7.0 (JPA 3.2)                 |
| Jackson          | 3.x (`tools.jackson` package) |
| JUnit            | 6                             |
| Build Tools      | Maven 3.6.3+ / Gradle 8.14+   |

## Project Initialization

### Maven (pom.xml)

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.x</version>
</parent>

<properties>
    <java.version>25</java.version>
</properties>

<dependencies>
    <!-- Modular starters — add only what you need -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

### Gradle (build.gradle.kts)

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.0.x"
    id("io.spring.dependency-management") version "1.1.x"
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

## Project Architecture

### Recommended: Feature-Based (Domain-Driven)

```
src/main/java/com/example/app/
├── Application.java                    # @SpringBootApplication in root
├── common/                             # Shared utilities
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java # @ControllerAdvice
│   │   └── BusinessException.java
│   ├── config/
│   │   └── AppConfig.java
│   └── dto/
│       └── ApiResponse.java
├── user/                               # Feature module
│   ├── UserController.java
│   ├── UserService.java
│   ├── UserRepository.java
│   ├── User.java                       # Entity
│   └── dto/
│       ├── UserRequest.java            # Java Record
│       └── UserResponse.java           # Java Record
├── order/                              # Another feature
│   ├── OrderController.java
│   ├── OrderService.java
│   └── ...
└── product/
    └── ...
```

### Key Architecture Rules

1. **Main class in root package** — enables component scanning of all sub-packages
2. **Use constructor injection** — never field injection with `@Autowired`
3. **DTOs as Java Records** — immutable, concise, pattern-matching ready
4. **Service layer owns business logic** — controllers only handle HTTP
5. **Repository per aggregate root** — avoid excessive repository fragmentation
6. **Global exception handler** — centralized `@ControllerAdvice` with `ProblemDetail` (RFC 9457)

## Spring Boot 4 Key Patterns

### REST Controller

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> findAll() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public UserResponse findById(@PathVariable Long id) {
        return userService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody UserRequest request) {
        return userService.create(request);
    }
}
```

### DTOs as Records

```java
public record UserRequest(
    @NotBlank String name,
    @Email String email,
    @NotNull Role role
) {}

public record UserResponse(
    Long id,
    String name,
    String email,
    LocalDateTime createdAt
) {}
```

### Global Exception Handling (RFC 9457 ProblemDetail)

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Validation Failed");
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField, FieldError::getDefaultMessage));
        problem.setProperty("errors", errors);
        return problem;
    }
}
```

### Native API Versioning (SB4 New)

```java
@RestController
@RequestMapping(path = "/api/users", version = "2")
public class UserV2Controller {

    @GetMapping("/{id}")
    public UserV2Response findById(@PathVariable Long id) {
        // V2-specific logic
    }
}
```

Strategies: Path-based (`/v1/...`), Header-based (`X-API-Version`), Query parameter — all built-in.

### Declarative HTTP Clients (SB4 New)

```java
@HttpServiceClient
public interface InventoryClient {

    @GetExchange("/api/inventory/{productId}")
    InventoryResponse getStock(@PathVariable String productId);

    @PostExchange("/api/inventory/reserve")
    ReservationResponse reserve(@RequestBody ReservationRequest request);
}
```

Register with `@ImportHttpServices`:

```java
@Configuration
@ImportHttpServices(clients = {InventoryClient.class})
public class HttpClientConfig {}
```

Built-in support for retry, circuit breaker, and centralized config.

### Virtual Threads (Default in SB4)

```properties
# application.properties — virtual threads are the default in SB4
spring.threads.virtual.enabled=true
```

Virtual threads are now the standard execution model for Tomcat/Jetty.
No code changes needed — blocking I/O is efficiently handled via virtual threads.

### JSpecify Null Safety

```java
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;

public class UserService {
    public @NonNull UserResponse findById(@NonNull Long id) { ... }
    public @Nullable UserResponse findByEmail(@NonNull String email) { ... }
}
```

## Configuration

Use `@ConfigurationProperties` for type-safe config:

```java
@ConfigurationProperties(prefix = "app")
public record AppProperties(
    String name,
    SecurityProperties security,
    CacheProperties cache
) {
    public record SecurityProperties(String jwtSecret, Duration tokenExpiry) {}
    public record CacheProperties(Duration ttl, int maxSize) {}
}
```

```yaml
# application.yml
app:
  name: my-service
  security:
    jwt-secret: ${JWT_SECRET}
    token-expiry: 1h
  cache:
    ttl: 5m
    max-size: 1000

# Profile-specific: application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/mydb
    hikari:
      maximum-pool-size: 20
```

## Data Access (JPA / Hibernate 7)

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private Role role;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // Constructors, getters — or use Lombok @Data
}

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.role = :role AND u.createdAt > :since")
    List<User> findActiveByRole(@Param("role") Role role, @Param("since") LocalDateTime since);
}
```

## Deep-Dive References

Load these references based on the task at hand:

| Task                           | Reference                                                       |
| ------------------------------ | --------------------------------------------------------------- |
| Understanding SB4 new features | [spring-boot4-features.md](references/spring-boot4-features.md) |
| Migrating SB3 → SB4            | [migration-guide.md](references/migration-guide.md)             |
| Jackson 3 import & API changes | [jackson3.md](references/jackson3.md)                           |
| Project layout & architecture  | [project-structure.md](references/project-structure.md)         |
| Config properties & profiles   | [configuration.md](references/configuration.md)                 |
| Authentication & authorization | [security.md](references/security.md)                           |
| Metrics, tracing, logging      | [observability.md](references/observability.md)                 |
| GraalVM native & AOT           | [native-image.md](references/native-image.md)                   |
| Testing patterns & JUnit 6     | [testing.md](references/testing.md)                             |

## Critical Rules

1. **Always use `jakarta.*`** — never `javax.*` (fully removed in SB4)
2. **Jackson 3 uses `tools.jackson` package** — not `com.fasterxml.jackson`
3. **No `WebSecurityConfigurerAdapter`** — use component-based Security config
4. **No `@MockBean`/`@SpyBean`** — use `@MockitoBean`/`@MockitoSpyBean` (SB4)
5. **Undertow is removed** — only Tomcat 11 or Jetty 12
6. **Jersey support dropped** — use Spring MVC or WebFlux
7. **Prefer Records for DTOs** — immutable, clean, Java 17+ native
8. **Use `RestClient` or declarative HTTP clients** — `RestTemplate` is legacy
9. **Enable virtual threads** — default in SB4, massive concurrency gain
10. **Modular starters** — import only needed modules, not monolithic starters
