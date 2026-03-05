# Spring Boot 4 — New Features & Breaking Changes

## Table of Contents

- [Modularized Starters](#modularized-starters)
- [Native API Versioning](#native-api-versioning)
- [Declarative HTTP Clients](#declarative-http-clients)
- [JSpecify Null Safety](#jspecify-null-safety)
- [Virtual Threads Default](#virtual-threads-default)
- [Jackson 3 Migration](#jackson-3-migration)
- [Hibernate 7 / JPA 3.2](#hibernate-7--jpa-32)
- [Spring Security 7](#spring-security-7)
- [Observability (Micrometer 2)](#observability-micrometer-2)
- [Spring AI Integration](#spring-ai-integration)
- [Removals & Deprecations](#removals--deprecations)

---

## Modularized Starters

SB4 decouples monolithic starters into smaller, focused modules.

**Impact:**

- `spring-boot-starter-web` is split (WebMVC separated from Jackson, etc.)
- Final JAR size reduced by up to 30%
- Faster startup, better GraalVM native image builds
- New naming: `spring-boot-<technology>` / `spring-boot-starter-<technology>`

**Action:** Review dependencies — import only what you actually use. Remove transitive dependencies that are no longer bundled.

---

## Native API Versioning

Built-in API versioning via annotations — no custom `WebMvcConfigurer` beans needed.

```java
// Path-based versioning
@RestController
@RequestMapping(path = "/api/users", version = "2")
public class UserV2Controller {
    @GetMapping("/{id}")
    public UserV2Response findById(@PathVariable Long id) { ... }
}

// Header-based versioning (X-API-Version header)
@RestController
@RequestMapping(path = "/api/users")
public class UserController {
    @GetMapping(value = "/{id}", version = "1")
    public UserV1Response findByIdV1(@PathVariable Long id) { ... }

    @GetMapping(value = "/{id}", version = "2")
    public UserV2Response findByIdV2(@PathVariable Long id) { ... }
}
```

**Strategies supported out of the box:**

- Path-based: `/v1/users`, `/v2/users`
- Header-based: `X-API-Version: 2`
- Query parameter: `?version=2`

---

## Declarative HTTP Clients

Replace OpenFeign with native Spring HTTP clients.

```java
@HttpServiceClient
public interface PaymentClient {

    @GetExchange("/api/payments/{id}")
    PaymentResponse getPayment(@PathVariable String id);

    @PostExchange("/api/payments")
    PaymentResponse createPayment(@RequestBody PaymentRequest request);

    @DeleteExchange("/api/payments/{id}")
    void cancelPayment(@PathVariable String id);
}

// Configuration
@Configuration
@ImportHttpServices(clients = {PaymentClient.class, InventoryClient.class})
public class HttpClientConfig {
    // Centralized config, retry, circuit breaker support built-in
}
```

**Key benefits:**

- No external library needed (replaces OpenFeign)
- Built-in resilience (retry, circuit breaker)
- Centralized configuration
- Full integration with Spring's `RestClient` / `WebClient` underneath

---

## JSpecify Null Safety

Standardized null safety across the entire Spring ecosystem.

```java
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.jspecify.annotations.NullMarked;

@NullMarked  // All params/returns are non-null by default in this class
@Service
public class ProductService {

    public ProductResponse findById(Long id) {
        // id is @NonNull by default (class is @NullMarked)
        return productRepository.findById(id)
            .map(this::toResponse)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    public @Nullable ProductResponse findBySku(String sku) {
        // Explicitly nullable return
        return productRepository.findBySku(sku)
            .map(this::toResponse)
            .orElse(null);
    }
}
```

**Impact:**

- IDEs (IntelliJ) detect `NullPointerException` at compile time
- Seamless Java-Kotlin interop
- May cause compilation warnings/errors if using Kotlin or null checkers

---

## Virtual Threads Default

Virtual threads (Project Loom) are the default execution model.

```properties
# Enabled by default in SB4 — explicit setting:
spring.threads.virtual.enabled=true
```

**What changes:**

- Tomcat/Jetty use virtual threads for request handling
- Massive concurrency without thread pool tuning
- Blocking I/O (JDBC, HTTP calls) no longer wastes platform threads
- `@Async` tasks run on virtual threads by default
- Scheduled tasks (`@Scheduled`) also benefit

**When NOT to use:**

- CPU-intensive computation — virtual threads don't help with CPU-bound work
- When using `synchronized` blocks extensively — prefer `ReentrantLock`
- ThreadLocal abuse — virtual threads have different lifecycle semantics

---

## Jackson 3 Migration

**Critical breaking change:** Package namespace changed.

| Jackson 2                                       | Jackson 3                               |
| ----------------------------------------------- | --------------------------------------- |
| `com.fasterxml.jackson.databind.ObjectMapper`   | `tools.jackson.databind.ObjectMapper`   |
| `com.fasterxml.jackson.annotation.JsonProperty` | `tools.jackson.annotation.JsonProperty` |
| `com.fasterxml.jackson.core.*`                  | `tools.jackson.core.*`                  |

**Action items:**

1. Replace all `com.fasterxml.jackson` imports with `tools.jackson`
2. Review custom serializers/deserializers — API changes in Jackson 3
3. `ObjectMapper` has stricter type handling by default
4. Module consolidation — some separate modules merged into core

---

## Hibernate 7 / JPA 3.2

- Full JPA 3.2 support
- Better support for Java Records as entities/embeddables
- Improved query performance and batch operations
- `jakarta.persistence.*` namespace (no `javax.persistence.*`)

```java
// Java Record as embeddable
@Embeddable
public record Address(
    String street,
    String city,
    String zipCode,
    String country
) {}

@Entity
public class Customer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Embedded
    private Address address;  // Record as embedded
}
```

---

## Spring Security 7

- `WebSecurityConfigurerAdapter` **fully removed**
- Component-based configuration only
- OAuth 2.1 and OpenID Connect built-in
- Pre-hardened security defaults

See [security.md](security.md) for complete patterns.

---

## Observability (Micrometer 2)

- Micrometer 2 with native OpenTelemetry (OTLP)
- Automatic correlation IDs across services
- Unified metrics, traces, and logs
- Updated Actuator module

See [observability.md](observability.md) for complete setup.

---

## Spring AI Integration

Initial hooks for AI integrations:

- LLM client auto-configuration
- Embedding and RAG pipeline support
- Local model support
- Vector store integration

---

## JmsClient

New fluent JMS API alongside the existing `JmsTemplate`:

```java
@Autowired
JmsClient jmsClient;

jmsClient.send("my-queue", session -> session.createTextMessage("hello"));
```

`JmsTemplate` and `JmsMessagingTemplate` remain unchanged and fully supported.

---

## Task Decoration

Multiple `TaskDecorator` beans are now supported. Spring Boot composes them into a `CompositeTaskDecorator`. Applies to both `ThreadPoolTaskScheduler` and `ThreadPoolTaskExecutor`.

```java
@Bean
@Order(1)
public TaskDecorator loggingDecorator() {
    return runnable -> () -> {
        log.info("Task started");
        runnable.run();
    };
}

@Bean
@Order(2)
public TaskDecorator tracingDecorator() { ... }
```

---

## OpenTelemetry Starter

New starter providing full OTLP observability (metrics + traces):

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-opentelemetry</artifactId>
</dependency>
```

Auto-configures the OpenTelemetry SDK. Replaces manual SDK wiring.
Liveness and Readiness probes are now **enabled by default** in this version.

---

## Kotlin Serialization

Native Kotlin serialization support:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-kotlin-serialization</artifactId>
</dependency>
```

- Contributes a `Json` bean; configure via `spring.kotlinx.serialization.json.*`
- Registers `HttpMessageConverter` ahead of other JSON converters

---

## RestTestClient

New preferred test HTTP client replacing `TestRestTemplate`. Works with MockMvc or real server:

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
            .expectStatus().isOk();
    }
}

// Integration test (real server)
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class MyIT {
    @Autowired RestTestClient restTestClient;
}
```

---

## Redis Improvements

### Static Master/Replica (Lettuce only)

```properties
spring.data.redis.masterreplica.nodes=redis://localhost:6379,redis://localhost:6380
```

### Observability

Upgraded from `MicrometerCommandLatencyRecorder` to `MicrometerTracing` — provides both metrics and spans via the Observation API.

---

## MongoDB Health Indicators

Health indicators no longer require Spring Data MongoDB. Moved from `spring-boot-data-mongodb` to `spring-boot-mongodb`. Use MongoDB Java Driver directly and still get health info.

New property:

```properties
# Control BigDecimal/BigInteger storage format
spring.data.mongodb.representation.big-decimal=STRING
```

---

## Gradle 9 Support

Gradle 9 is now supported alongside Gradle 8.14+.

---

## Miscellaneous Improvements

| Feature                           | Detail                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| Milestones on Maven Central       | SB4.x milestones (M1, RC) published to Maven Central — no `repo.spring.io` needed                  |
| Console logging toggle            | `logging.console.enabled=false` disables console output                                            |
| Virtual threads for HTTP clients  | JDK `HttpClient`-backed clients use virtual threads when `spring.threads.virtual.enabled=true`     |
| Elasticsearch API Key             | `spring.elasticsearch.api-key` property                                                            |
| MongoDB Testcontainers            | `@ServiceConnection` now supports `MongoDBAtlasLocalContainer`                                     |
| `@MeterTag` support               | Works on `@Counted`/`@Timed` with SpEL `ValueExpressionResolver`                                   |
| AWS ECS platform                  | Recognized as `CloudPlatform`                                                                      |
| Tomcat cache size                 | `server.tomcat.resource.cache-max-size` configures static resource cache                           |
| Tracing export toggle             | `management.tracing.export.enabled` (renamed from `management.tracing.enabled`)                    |
| Persistence exception translation | `spring.persistence.exceptiontranslation.enabled` (from `spring.dao.exceptiontranslation.enabled`) |

---

## Removals & Deprecations

| Removed                                 | Replacement                                      |
| --------------------------------------- | ------------------------------------------------ | --- |
| `javax.*` packages                      | `jakarta.*`                                      |
| `@MockBean` / `@SpyBean`                | `@MockitoBean` / `@MockitoSpyBean`               |
| `WebSecurityConfigurerAdapter`          | Component-based `SecurityFilterChain`            |
| `RestTemplate` (not removed but legacy) | `RestClient` or Declarative HTTP Clients         |
| Undertow server                         | Tomcat 11 or Jetty 12                            |
| Jersey auto-config                      | Spring MVC                                       |
| `com.fasterxml.jackson.*`               | `tools.jackson.*` (Jackson 3)                    | \   |
| `RestClient` (Elasticsearch)            | `Rest5Client`                                    |
| `RestClientBuilderCustomizer`           | `Rest5ClientBuilderCustomizer`                   |
| `StreamBuilderFactoryBeanCustomizer`    | `StreamsBuilderFactoryBeanConfigurer`            |
| Undertow                                | Use Tomcat or Jetty (not Servlet 6.1 compatible) |
| Pulsar Reactive                         | Use non-reactive Spring Pulsar                   |
| Spring Session Hazelcast                | Manage directly from Hazelcast                   |
| Spring Session MongoDB                  | Manage directly from MongoDB                     |
| Embedded Launch Scripts                 | Use `java -jar` or Gradle application plugin     |
| Spock Integration                       | Groovy 5 not yet supported — use JUnit 5         |
| Classic Uber-Jar loader                 | Remove `CLASSIC` loader config                   |
| Various deprecated config keys          | See SB4 release notes                            |

**Migration tool:** Use [OpenRewrite](https://docs.openrewrite.org) "Migrate to Spring Boot 4.0" recipe for automated migration.
