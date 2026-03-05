# Configuration Patterns & Properties

## Table of Contents
- [Type-Safe Configuration](#type-safe-configuration)
- [Profile Management](#profile-management)
- [Common Properties](#common-properties)
- [Database Configuration](#database-configuration)
- [Externalized Secrets](#externalized-secrets)
- [Logging Configuration](#logging-configuration)

---

## Type-Safe Configuration

Always prefer `@ConfigurationProperties` over `@Value`.

```java
@ConfigurationProperties(prefix = "app")
public record AppProperties(
    String name,
    String version,
    ApiProperties api,
    SecurityProperties security,
    CacheProperties cache,
    RetryProperties retry
) {
    public record ApiProperties(
        String baseUrl,
        Duration timeout,
        int maxRetries
    ) {}

    public record SecurityProperties(
        String jwtSecret,
        Duration tokenExpiry,
        Duration refreshExpiry,
        List<String> allowedOrigins
    ) {}

    public record CacheProperties(
        Duration ttl,
        int maxSize,
        boolean enableStats
    ) {}

    public record RetryProperties(
        int maxAttempts,
        Duration initialDelay,
        double multiplier
    ) {}
}
```

Enable it:
```java
@SpringBootApplication
@ConfigurationPropertiesScan  // Auto-scan @ConfigurationProperties
public class Application { ... }
```

---

## Profile Management

```yaml
# application.yml — shared/default config
spring:
  application:
    name: my-service
  jpa:
    open-in-view: false                    # Always disable
    hibernate:
      ddl-auto: validate                   # Never auto in prod
    properties:
      hibernate:
        format_sql: true

server:
  port: 8080
  error:
    include-message: always
    include-binding-errors: always

app:
  name: My Service
  api:
    timeout: 30s
    max-retries: 3
```

```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb_dev
    username: dev_user
    password: dev_pass
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

logging:
  level:
    com.example: DEBUG
    org.hibernate.SQL: DEBUG
```

```yaml
# application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASS}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      connection-timeout: 20000

  jpa:
    show-sql: false

server:
  port: ${PORT:8080}

logging:
  level:
    com.example: INFO
    root: WARN
```

Activate: `--spring.profiles.active=prod` or `SPRING_PROFILES_ACTIVE=prod`

---

## Common Properties

### Server
```yaml
server:
  port: 8080
  servlet:
    context-path: /api
  compression:
    enabled: true
    mime-types: application/json,text/html
  shutdown: graceful                       # Graceful shutdown
  tomcat:
    threads:
      max: 200
      min-spare: 10
```

### Virtual Threads (SB4 default)
```yaml
spring:
  threads:
    virtual:
      enabled: true                        # Default in SB4
```

### Jackson (SB4 — Jackson 3)
```yaml
spring:
  jackson:
    serialization:
      write-dates-as-timestamps: false     # Use ISO-8601
      indent-output: false                 # Compact JSON in prod
    deserialization:
      fail-on-unknown-properties: false
    default-property-inclusion: non_null   # Omit nulls
    date-format: yyyy-MM-dd'T'HH:mm:ss.SSS'Z'
```

### Actuator
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
  info:
    env:
      enabled: true
```

---

## Database Configuration

### PostgreSQL (Most Common)
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: postgres
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 15
      minimum-idle: 5
      idle-timeout: 300000
      max-lifetime: 1800000
      connection-timeout: 20000
      pool-name: MyApp-HikariPool

  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        default_schema: public
        jdbc:
          batch_size: 25
        order_inserts: true
        order_updates: true
```

### Flyway Migration
```yaml
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
    schemas: public
```

---

## Externalized Secrets

**Never hardcode secrets.** Use environment variables or a vault.

```yaml
# application-prod.yml
spring:
  datasource:
    password: ${DB_PASSWORD}           # From env var

app:
  security:
    jwt-secret: ${JWT_SECRET}          # From env var
```

For Kubernetes:
```yaml
# Mount as env or ConfigMap/Secret
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-secret
        key: password
```

---

## Logging Configuration

```yaml
# application.yml
logging:
  level:
    root: INFO
    com.example.app: DEBUG
    org.springframework.web: INFO
    org.hibernate.SQL: DEBUG                # Show SQL queries
    org.hibernate.type.descriptor.sql: TRACE # Show bind params
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/app.log
    max-size: 10MB
    max-history: 30
```

Use SLF4J in code:
```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    // Or use Lombok: @Slf4j

    public OrderResponse createOrder(CreateOrderRequest request) {
        log.info("Creating order for user={}", request.userId());
        // ...
        log.debug("Order created: id={}, total={}", order.getId(), order.getTotal());
        return mapper.toResponse(order);
    }
}
```
