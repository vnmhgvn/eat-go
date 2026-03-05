# Migration Guide: Spring Boot 3 → Spring Boot 4

## Table of Contents

- [Pre-Migration Checklist](#pre-migration-checklist)
- [Step 1: Upgrade to Latest SB3.5.x](#step-1-upgrade-to-latest-sb35x)
- [Step 2: Resolve All Deprecations](#step-2-resolve-all-deprecations)
- [Step 3: Update Platform Baselines](#step-3-update-platform-baselines)
- [Step 4: Migrate Jakarta EE 11](#step-4-migrate-jakarta-ee-11)
- [Step 5: Jackson 2 → Jackson 3](#step-5-jackson-2--jackson-3)
- [Step 6: Security Migration](#step-6-security-migration)
- [Step 7: Testing Migration](#step-7-testing-migration)
- [Step 8: Server & Infrastructure](#step-8-server--infrastructure)
- [Step 9: Data Layer](#step-9-data-layer)
- [Step 10: Verify & Test](#step-10-verify--test)
- [OpenRewrite Automation](#openrewrite-automation)

---

## Pre-Migration Checklist

> **CRITICAL:** Do NOT skip versions. If on SB2.x, migrate to SB3.4+ first.

- [ ] Application runs cleanly on latest SB3.5.x
- [ ] All deprecation warnings resolved
- [ ] JDK 17+ installed (JDK 25 recommended)
- [ ] Build tool updated (Maven 3.6.3+ / Gradle 8.14+)
- [ ] All third-party libraries checked for SB4 compatibility
- [ ] Test suite passing with 100% green

---

## Step 1: Upgrade to Latest SB3.5.x

```xml
<!-- pom.xml: Upgrade to latest 3.5.x first -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.x</version>
</parent>
```

Resolve all compilation errors and deprecation warnings before proceeding.

---

## Step 2: Resolve All Deprecations

SB4 removes ~88% of APIs deprecated across SB 2.x and 3.x. Key items:

```java
// REMOVED in SB4: @MockBean / @SpyBean
// Before (SB3):
@MockBean
private UserService userService;

// After (SB4):
@MockitoBean
private UserService userService;
```

```java
// REMOVED in SB4: WebSecurityConfigurerAdapter
// Before (SB3 — already deprecated):
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter { ... }

// After (SB4):
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception { ... }
}
```

---

## Step 3: Update Platform Baselines

```xml
<!-- pom.xml -->
<parent>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.x</version>
</parent>

<properties>
    <java.version>25</java.version>   <!-- Recommended -->
</properties>
```

```kotlin
// build.gradle.kts
plugins {
    id("org.springframework.boot") version "4.0.x"
}
java {
    toolchain { languageVersion = JavaLanguageVersion.of(25) }
}
```

**Kotlin projects:** Upgrade to Kotlin 2.2+
**GraalVM:** Upgrade to GraalVM 25+

---

## Step 4: Migrate Jakarta EE 11

If any `javax.*` imports remain (they shouldn't after SB3 migration):

```diff
-import javax.persistence.Entity;
-import javax.servlet.http.HttpServletRequest;
+import jakarta.persistence.Entity;
+import jakarta.servlet.http.HttpServletRequest;
```

SB4 requires Servlet 6.1 baseline (Jakarta EE 11).

---

## Step 5: Jackson 2 → Jackson 3

**This is the most impactful change for most applications.**

```diff
-import com.fasterxml.jackson.databind.ObjectMapper;
-import com.fasterxml.jackson.annotation.JsonProperty;
-import com.fasterxml.jackson.annotation.JsonIgnore;
-import com.fasterxml.jackson.databind.SerializationFeature;
+import tools.jackson.databind.ObjectMapper;
+import tools.jackson.annotation.JsonProperty;
+import tools.jackson.annotation.JsonIgnore;
+import tools.jackson.databind.SerializationFeature;
```

**What to check:**

1. All `com.fasterxml.jackson` imports → `tools.jackson`
2. Custom `ObjectMapper` configurations
3. Custom serializers/deserializers — API may differ
4. Jackson modules (e.g., `jackson-module-kotlin`) — check for Jackson 3 versions
5. `ObjectMapper` is stricter by default — review type handling

---

## Step 6: Security Migration

```java
// SB4: Component-based security (no adapter classes)
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 ->
                oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

See [security.md](security.md) for complete patterns.

---

## Step 7: Testing Migration

```diff
-import org.springframework.boot.test.mock.mockito.MockBean;
-import org.springframework.boot.test.mock.mockito.SpyBean;
+import org.springframework.test.context.bean.override.mockito.MockitoBean;
+import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
```

```java
@SpringBootTest
class UserServiceTest {
    @MockitoBean  // was @MockBean
    private UserRepository userRepository;

    @MockitoSpyBean  // was @SpyBean
    private EmailService emailService;
}
```

JUnit 6 is the default test framework. Test context pausing improves CI/CD speed.

---

## Step 8: Server & Infrastructure

**Undertow users MUST migrate:**

```xml
<!-- Before (SB3 with Undertow) — REMOVED in SB4 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>

<!-- After: Use default Tomcat 11 or switch to Jetty 12 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```

**Jersey users MUST migrate to Spring MVC.**

**Elasticsearch client:**

```diff
-import RestClientBuilderCustomizer;
+import Rest5ClientBuilderCustomizer;
```

**Kafka Streams:**

```diff
-import StreamBuilderFactoryBeanCustomizer;
+import StreamsBuilderFactoryBeanConfigurer;
```

---

## Step 9: Data Layer

- Hibernate 7 with JPA 3.2 — verify entity mappings
- `hibernate-jpamodelgen` → `hibernate-processor`
- MongoDB: Explicitly configure UUID and BigDecimal representations (no longer defaults)
- R2DBC: Check for API changes with reactive repositories

```java
// MongoDB — explicit UUID config now required
@Configuration
public class MongoConfig {
    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        return MongoCustomConversions.create(config -> {
            config.configurePropertyConversions(conversions -> {
                conversions.registerConverter(new UUIDToStringConverter());
            });
        });
    }
}
```

### MongoDB Property Renames

Many properties moved from `spring.data.mongodb.*` to `spring.mongodb.*`:

| Old                               | New                          |
| --------------------------------- | ---------------------------- |
| `spring.data.mongodb.host`        | `spring.mongodb.host`        |
| `spring.data.mongodb.port`        | `spring.mongodb.port`        |
| `spring.data.mongodb.uri`         | `spring.mongodb.uri`         |
| `spring.data.mongodb.database`    | `spring.mongodb.database`    |
| `spring.data.mongodb.username`    | `spring.mongodb.username`    |
| `spring.data.mongodb.password`    | `spring.mongodb.password`    |
| `spring.data.mongodb.ssl.enabled` | `spring.mongodb.ssl.enabled` |

Properties requiring Spring Data MongoDB **unchanged**:

- `spring.data.mongodb.auto-index-creation`
- `spring.data.mongodb.field-naming-strategy`
- `spring.data.mongodb.repositories.type`

Set UUID/BigDecimal representations explicitly:

```properties
spring.mongodb.representation.uuid=STANDARD
spring.data.mongodb.representation.big-decimal=STRING
```

### @EntityScan Package

```diff
-import org.springframework.boot.autoconfigure.domain.EntityScan;
+import org.springframework.boot.persistence.autoconfigure.EntityScan;
```

Property renamed:

```properties
# Old
spring.dao.exceptiontranslation.enabled=true
# New
spring.persistence.exceptiontranslation.enabled=true
```

---

## Step 9b: Messaging

### Kafka Streams Customizer

```java
// Old
@Bean StreamBuilderFactoryBeanCustomizer kafkaCustomizer() { ... }

// New
@Bean StreamsBuilderFactoryBeanConfigurer kafkaConfigurer() { ... }
```

> `StreamsBuilderFactoryBeanConfigurer` implements `Ordered` with default `0`.

### Kafka Retry Backoff

```properties
# Old
spring.kafka.retry.topic.backoff.random=true
# New (more flexible)
spring.kafka.retry.topic.backoff.jitter=0.3
```

### AMQP (RabbitMQ) Retry

```java
// Old
@Bean RabbitRetryTemplateCustomizer myCustomizer() { ... }

// New: split into two dedicated customizers
@Bean RabbitTemplateRetrySettingsCustomizer templateRetry() { ... }
@Bean RabbitListenerRetrySettingsCustomizer listenerRetry() { ... }
```

### Spring Batch

`spring-boot-starter-batch` now uses **in-memory mode by default** (no database required).

```xml
<!-- Restore database-backed metadata storage -->
<artifactId>spring-boot-starter-batch-jdbc</artifactId>
```

---

## Step 9c: Build & Dependencies

### AOP Starter Renamed

```xml
<!-- Old --> <artifactId>spring-boot-starter-aop</artifactId>
<!-- New --> <artifactId>spring-boot-starter-aspectj</artifactId>
```

> Only add if your app uses `org.aspectj.lang.annotation.@Aspect` directly.

### Spring Retry Dependency Management Removed

Spring Retry capabilities moved to Spring Framework. Add explicit version if still needed.

### Spring Authorization Server → Spring Security 7

Remove `spring-authorization-server.version` property; use `spring-security.version` instead.

### Classic Uber-Jar Loader Removed

Maven: remove `<loaderImplementation>CLASSIC</loaderImplementation>`
Gradle: remove `loaderImplementation = LoaderImplementation.CLASSIC`

### Optional Dependencies in Uber Jars

No longer included by default. Re-add via `<includeOptional>true</includeOptional>` if needed.

### DevTools Live Reload

Disabled by default in SB4:

```properties
spring.devtools.livereload.enabled=true  # re-enable
```

---

## Step 9d: Actuator & Web

### Liveness/Readiness Probes Now Enabled by Default

Health endpoint now exposes liveness and readiness groups by default.

```properties
management.endpoint.health.probes.enabled=false  # to disable
```

### HttpMessageConverters Deprecated

Custom `HttpMessageConverter` beans no longer added directly to context.

```java
// New: use dedicated customizers
@Bean
public ServerHttpMessageConvertersCustomizer myConverterCustomizer() {
    return converters -> converters.add(Position.BEFORE_DEFAULT, new MyCustomConverter());
}

@Bean
public ClientHttpMessageConvertersCustomizer myClientCustomizer() { ... }
```

### Tomcat War Deployment

```xml
<!-- Old --> <artifactId>spring-boot-starter-tomcat</artifactId>
<!-- New --> <artifactId>spring-boot-starter-tomcat-runtime</artifactId>
```

### Spring Session Property Renames

| Old                        | New                             |
| -------------------------- | ------------------------------- |
| `spring.session.redis.*`   | `spring.session.data.redis.*`   |
| `spring.session.mongodb.*` | `spring.session.data.mongodb.*` |

---

## Step 10: Verify & Test

1. **Compile** — fix all compilation errors (mostly import changes)
2. **Unit tests** — run full suite, fix `@MockBean` → `@MockitoBean`
3. **Integration tests** — verify server startup, API contracts
4. **Security tests** — validate auth flows with new Security 7
5. **Performance tests** — virtual threads may change concurrency behavior
6. **Native image** (if applicable) — rebuild with GraalVM 25+

---

## OpenRewrite Automation

Use OpenRewrite for automated migration:

```xml
<!-- Add to pom.xml -->
<plugin>
    <groupId>org.openrewrite.maven</groupId>
    <artifactId>rewrite-maven-plugin</artifactId>
    <version>LATEST</version>
    <configuration>
        <activeRecipes>
            <recipe>org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0</recipe>
        </activeRecipes>
    </configuration>
    <dependencies>
        <dependency>
            <groupId>org.openrewrite.recipe</groupId>
            <artifactId>rewrite-spring</artifactId>
            <version>LATEST</version>
        </dependency>
    </dependencies>
</plugin>
```

```bash
# Run migration
mvn rewrite:run

# Dry-run (see what would change)
mvn rewrite:dryRun
```

This automates most import changes, annotation replacements, and config key updates.
