# GraalVM Native Image & AOT

## Table of Contents
- [Overview](#overview)
- [Maven Configuration](#maven-configuration)
- [Gradle Configuration](#gradle-configuration)
- [Build & Run](#build--run)
- [AOT Processing](#aot-processing)
- [Common Pitfalls](#common-pitfalls)
- [Native Image Hints](#native-image-hints)
- [Docker Native Image](#docker-native-image)
- [Project Leyden (Static Images)](#project-leyden-static-images)

---

## Overview

Spring Boot 4 provides first-class GraalVM native image support:
- Millisecond startup times
- Reduced memory footprint (50-80% less)
- Ideal for serverless, cloud functions, and containerized workloads
- Requires GraalVM 25+

**Trade-offs:**
- Longer build times (minutes vs seconds)
- No runtime reflection by default (needs hints)
- No runtime class loading
- Some libraries may not be compatible

---

## Maven Configuration

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.x</version>
</parent>

<build>
    <plugins>
        <plugin>
            <groupId>org.graalvm.buildtools</groupId>
            <artifactId>native-maven-plugin</artifactId>
        </plugin>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>

<!-- Activate native profile -->
<profiles>
    <profile>
        <id>native</id>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.graalvm.buildtools</groupId>
                    <artifactId>native-maven-plugin</artifactId>
                    <executions>
                        <execution>
                            <id>build-native</id>
                            <goals><goal>compile-no-fork</goal></goals>
                            <phase>package</phase>
                        </execution>
                    </executions>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```

---

## Gradle Configuration

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.0.x"
    id("io.spring.dependency-management") version "1.1.x"
    id("org.graalvm.buildtools.native") version "0.10.x"
}

graalvmNative {
    binaries {
        named("main") {
            imageName.set("my-app")
            buildArgs.add("--enable-url-protocols=http,https")
            javaLauncher.set(javaToolchains.launcherFor {
                languageVersion.set(JavaLanguageVersion.of(25))
                vendor.set(JvmVendorSpec.GRAALVM_CE)
            })
        }
    }
}
```

---

## Build & Run

### Build Native Image

```bash
# Maven
./mvnw -Pnative native:compile

# Gradle
./gradlew nativeCompile

# Build time: 3-10 minutes depending on app size
```

### Run Native Image

```bash
# Direct
./target/my-app

# Startup time: ~50-100ms (vs 2-5s for JVM)
```

### Build Container with Buildpacks (No GraalVM locally needed)

```bash
# Maven
./mvnw spring-boot:build-image -Pnative

# Gradle
./gradlew bootBuildImage
```

---

## AOT Processing

Spring Boot 4's Ahead-of-Time processing generates:
- Bean definitions at build time
- Configuration metadata
- Proxy classes
- Reflection/resource hints

### Test AOT Compatibility

```bash
# Run with AOT mode (JVM, for testing)
./mvnw spring-boot:run -Dspring.aot.enabled=true
```

### AOT Conditions

Some beans may behave differently in AOT mode. Check:
- `@ConditionalOnProperty` — evaluated at build time
- `@Profile` — evaluated at build time
- Dynamic bean registration — may need hints

---

## Common Pitfalls

### 1. Reflection

GraalVM doesn't support arbitrary reflection. Spring Boot auto-generates hints, but custom reflection needs explicit registration:

```java
@Configuration
@ImportRuntimeHints(MyRuntimeHints.class)
public class NativeConfig {}

public class MyRuntimeHints implements RuntimeHintsRegistrar {
    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
        // Register classes needing reflection
        hints.reflection()
            .registerType(MyDtoClass.class,
                MemberCategory.INVOKE_DECLARED_CONSTRUCTORS,
                MemberCategory.INVOKE_DECLARED_METHODS,
                MemberCategory.DECLARED_FIELDS);

        // Register resources
        hints.resources().registerPattern("my-templates/*.json");
    }
}
```

### 2. Dynamic Proxies

```java
// Register proxy hints
hints.proxies().registerJdkProxy(MyInterface.class);
```

### 3. Serialization

```java
hints.serialization().registerType(MySerializableClass.class);
```

### 4. Libraries Not Compatible

Some libraries use heavy reflection. Check native compatibility:
- ✅ Spring Data JPA, Spring Security, Spring WebMVC
- ✅ HikariCP, Flyway, Micrometer
- ⚠️ Some Kafka, Elasticsearch modules need extra hints
- ❌ Libraries using bytecode manipulation at runtime

---

## Native Image Hints

### Using @RegisterReflectionForBinding

```java
@RestController
@RegisterReflectionForBinding({UserRequest.class, UserResponse.class})
public class UserController { ... }
```

### Resource Hints

```java
hints.resources()
    .registerPattern("db/migration/*.sql")
    .registerPattern("templates/*.html")
    .registerPattern("*.properties");
```

---

## Docker Native Image

### Multi-stage Dockerfile

```dockerfile
# Stage 1: Build native image
FROM ghcr.io/graalvm/native-image-community:25 AS build
WORKDIR /app
COPY . .
RUN ./mvnw -Pnative native:compile -DskipTests

# Stage 2: Minimal runtime
FROM debian:bookworm-slim
WORKDIR /app
COPY --from=build /app/target/my-app ./my-app
EXPOSE 8080
ENTRYPOINT ["./my-app"]
```

### Using Buildpacks (Simpler)

```bash
./mvnw spring-boot:build-image \
    -Pnative \
    -Dspring-boot.build-image.imageName=my-app:native
```

---

## Project Leyden (Static Images)

SB4 integrates with Project Leyden for "Static Images":
- Instant startup (faster than GraalVM native)
- Retains JVM flexibility (monitoring, profiling)
- Smaller image size
- Still experimental but promising for production use

```properties
# Enable Leyden optimization
spring.aot.leyden.enabled=true
```

This represents the future direction for Spring Boot deployment optimization.
