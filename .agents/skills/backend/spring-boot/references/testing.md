# Testing Patterns — JUnit 6 & Spring Boot 4

## Table of Contents

- [Test Structure](#test-structure)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [Web Layer Tests (@WebMvcTest)](#web-layer-tests-webmvctest)
- [Data Layer Tests (@DataJpaTest)](#data-layer-tests-datajpatest)
- [Full Application Tests (@SpringBootTest)](#full-application-tests-springboottest)
- [Testcontainers](#testcontainers)
- [Key Changes in SB4](#key-changes-in-sb4)
- [Best Practices](#best-practices)

---

## Test Structure

Mirror `src/main/java` structure in `src/test/java`:

```
src/test/java/com/example/app/
├── user/
│   ├── UserControllerTest.java       # @WebMvcTest
│   ├── UserServiceTest.java          # Unit test
│   └── UserRepositoryTest.java       # @DataJpaTest
├── order/
│   ├── OrderControllerTest.java
│   └── OrderServiceTest.java
└── integration/
    └── OrderFlowIntegrationTest.java # @SpringBootTest
```

---

## Unit Tests

Pure unit tests — no Spring context, fast execution.

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    @Test
    void findById_existingUser_returnsResponse() {
        // Given
        var user = new User(1L, "John", "john@example.com", Role.USER);
        var expected = new UserResponse(1L, "John", "john@example.com", null);

        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(userMapper.toResponse(user)).willReturn(expected);

        // When
        var result = userService.findById(1L);

        // Then
        assertThat(result).isEqualTo(expected);
        verify(userRepository).findById(1L);
    }

    @Test
    void findById_nonExistentUser_throwsException() {
        given(userRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findById(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("99");
    }
}
```

---

## Integration Tests

### Web Layer Tests (@WebMvcTest)

Tests controllers in isolation — only loads web layer, not full context.

```java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean  // SB4: Not @MockBean!
    private UserService userService;

    @Test
    void findAll_returnsUsers() throws Exception {
        var users = List.of(
            new UserResponse(1L, "John", "john@example.com", null),
            new UserResponse(2L, "Jane", "jane@example.com", null)
        );
        given(userService.findAll()).willReturn(users);

        mockMvc.perform(get("/api/users")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].name").value("John"))
            .andExpect(jsonPath("$[1].name").value("Jane"));
    }

    @Test
    void create_validRequest_returns201() throws Exception {
        var request = new UserRequest("John", "john@example.com", Role.USER);
        var response = new UserResponse(1L, "John", "john@example.com", null);

        given(userService.create(any(UserRequest.class))).willReturn(response);

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "email": "john@example.com",
                        "role": "USER"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("John"));
    }

    @Test
    void create_invalidRequest_returns400() throws Exception {
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "",
                        "email": "not-an-email"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }
}
```

---

## Data Layer Tests (@DataJpaTest)

Tests JPA repositories with an in-memory database or Testcontainers.

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class UserRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void findByEmail_existingEmail_returnsUser() {
        // Given
        var user = new User(null, "John", "john@example.com", Role.USER);
        entityManager.persistAndFlush(user);

        // When
        var found = userRepository.findByEmail("john@example.com");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("John");
    }

    @Test
    void findByEmail_nonExistentEmail_returnsEmpty() {
        var found = userRepository.findByEmail("none@example.com");
        assertThat(found).isEmpty();
    }
}
```

---

## Full Application Tests (@SpringBootTest)

### With WebEnvironment

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class OrderFlowIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void createAndRetrieveOrder() {
        // Create
        var request = new CreateOrderRequest("user-1", List.of(
            new OrderItemRequest("prod-1", 2)));

        var createResponse = restTemplate.postForEntity(
            "/api/orders", request, OrderResponse.class);
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        Long orderId = createResponse.getBody().id();

        // Retrieve
        var getResponse = restTemplate.getForEntity(
            "/api/orders/{id}", OrderResponse.class, orderId);
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody().id()).isEqualTo(orderId);
    }
}
```

---

## Testcontainers

### Base Test Class (Reusable)

```java
@Testcontainers
public abstract class BaseIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES =
        new PostgreSQLContainer<>("postgres:17")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
}

// Usage
@SpringBootTest
class UserServiceIntegrationTest extends BaseIntegrationTest {
    // Tests use shared Postgres container
}
```

### Dependency

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-testcontainers</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
```

---

## Key Changes in SB4

| SB3                                              | SB4                                                  |
| ------------------------------------------------ | ---------------------------------------------------- |
| `@MockBean`                                      | `@MockitoBean`                                       |
| `@SpyBean`                                       | `@MockitoSpyBean`                                    |
| `import o.s.boot.test.mock.mockito.*`            | `import o.s.test.context.bean.override.mockito.*`    |
| JUnit 5 default                                  | **JUnit 6** default                                  |
| Standard test context                            | **Test Context Pausing** — faster CI/CD              |
| `@SpringBootTest` auto-configures MockMVC        | Must add `@AutoConfigureMockMvc` explicitly          |
| `@SpringBootTest` auto-provides TestRestTemplate | Must add `@AutoConfigureTestRestTemplate` explicitly |

### @SpringBootTest No Longer Auto-Configures MockMVC

```java
// SB3 — MockMvc auto-configured
@SpringBootTest
class MyTest { @Autowired MockMvc mockMvc; }

// SB4 — explicit annotation required!
@SpringBootTest
@AutoConfigureMockMvc
class MyTest { @Autowired MockMvc mockMvc; }
```

### HtmlUnit Attribute Renamed

```java
// SB3
@AutoConfigureMockMvc(webClientEnabled = false, webDriverEnabled = false)

// SB4
@AutoConfigureMockMvc(htmlUnit = @HtmlUnit(webClient = false, webDriver = false))
```

### @SpringBootTest No Longer Provides TestRestTemplate

```java
// SB4 — must add annotation + dependency
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
class MyIT {
    @Autowired TestRestTemplate restTemplate;
}
```

Add test-scoped dependency:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-resttestclient</artifactId>
    <scope>test</scope>
</dependency>
```

Package change: `org.springframework.boot.resttestclient.TestRestTemplate`

### RestTestClient — Preferred Replacement for TestRestTemplate

```java
// With MockMvc
@SpringBootTest
@AutoConfigureMockMvc
class MyTest {
    @Autowired RestTestClient restTestClient;

    @Test
    void test() {
        restTestClient.get().uri("/api/users")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.length()").isEqualTo(3);
    }
}

// Integration test (real server)
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class MyIT {
    @Autowired RestTestClient restTestClient;
}
```

### MockitoTestExecutionListener Removed

Use `@ExtendWith(MockitoExtension.class)` instead:

```java
// SB3 — MockitoTestExecutionListener handled @Mock/@Captor in @SpringBootTest-style tests
// SB4 — removed; use MockitoExtension for pure unit tests
@ExtendWith(MockitoExtension.class)
class MyServiceTest {
    @Mock UserRepository userRepository;
    @Captor ArgumentCaptor<User> userCaptor;
}
```

### @PropertyMapping Relocated

```diff
-import org.springframework.boot.test.autoconfigure.properties.PropertyMapping;
+import org.springframework.boot.test.context.PropertyMapping;
```

### Test Context Pausing

SB4 introduces test context pausing for faster CI/CD:

- Pauses idle application contexts between test classes
- Resumes them when needed
- Reduces total memory usage for large test suites
- Enabled automatically

---

## Best Practices

1. **Use AssertJ** over JUnit assertions — more readable, fluent API
2. **Use BDDMockito** (`given().willReturn()`) over standard Mockito
3. **Prefer `@WebMvcTest`/`@DataJpaTest`** over `@SpringBootTest` — faster
4. **One assertion concern per test** — test one behavior
5. **Given-When-Then** structure in every test
6. **Use Testcontainers** for repository tests — avoid H2 differences
7. **Text blocks** for JSON request bodies (Java 17+)
8. **`@MockitoBean`** in SB4 — never `@MockBean`
9. **Parallel test execution** — configure in `junit-platform.properties`:

```properties
# src/test/resources/junit-platform.properties
junit.jupiter.execution.parallel.enabled=true
junit.jupiter.execution.parallel.mode.default=concurrent
junit.jupiter.execution.parallel.mode.classes.default=concurrent
```

10. **Test naming convention**: `methodName_scenario_expectedResult`
