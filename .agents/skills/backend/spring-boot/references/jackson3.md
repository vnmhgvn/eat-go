# Jackson 3 Migration Guide

Spring Boot 4 upgrades to **Jackson 3** as the default JSON library. This is a significant breaking change.

## Table of Contents

1. [Group ID Changes](#group-id-changes)
2. [Renamed Classes](#renamed-classes)
3. [Renamed Annotations](#renamed-annotations)
4. [Property Changes](#property-changes)
5. [New Auto-Module Detection](#new-auto-module-detection)
6. [Jackson 2 Compatibility Path](#jackson-2-compatibility-path)

---

## Group ID Changes

| Jackson 2                                                               | Jackson 3         |
| ----------------------------------------------------------------------- | ----------------- |
| `com.fasterxml.jackson.*`                                               | `tools.jackson.*` |
| `com.fasterxml.jackson.core` (jackson-annotations only – **unchanged**) | —                 |

**Exception**: `jackson-annotations` module keeps the `com.fasterxml.jackson.core` group ID and `com.fasterxml.jackson.annotation` package.

### Maven Migration

```diff
-<groupId>com.fasterxml.jackson.core</groupId>
-<artifactId>jackson-databind</artifactId>
+<groupId>tools.jackson.core</groupId>
+<artifactId>jackson-databind</artifactId>
```

### Import Migration

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

> Note: `com.fasterxml.jackson.annotation.JsonProperty` (from `jackson-annotations`) is the **exception** — it keeps the old package for binary compat.

---

## Renamed Classes

| Old (SB3 / Jackson 2)                   | New (SB4 / Jackson 3)         |
| --------------------------------------- | ----------------------------- |
| `JsonObjectSerializer`                  | `ObjectValueSerializer`       |
| `JsonValueDeserializer`                 | `ObjectValueDeserializer`     |
| `Jackson2ObjectMapperBuilderCustomizer` | `JsonMapperBuilderCustomizer` |

---

## Renamed Annotations

| Old              | New                 |
| ---------------- | ------------------- |
| `@JsonComponent` | `@JacksonComponent` |
| `@JsonMixin`     | `@JacksonMixin`     |

All supporting classes renamed: `Json` prefix → `Jackson` prefix.

---

## Property Changes

| Old Property (SB3.x)     | New Property (SB4.x)          |
| ------------------------ | ----------------------------- |
| `spring.jackson.read.*`  | `spring.jackson.json.read.*`  |
| `spring.jackson.write.*` | `spring.jackson.json.write.*` |

---

## New Auto-Module Detection

In SB4, Jackson **automatically detects and registers all modules** on the classpath (not just "well-known" ones as in SB3).

To disable:

```properties
spring.jackson.find-and-add-modules=false
```

---

## Jackson 2 Compatibility Path

### Quick Compat Mode (Recommended First Step)

Enable Jackson 2-compatible defaults to reduce migration friction:

```properties
spring.jackson.use-jackson2-defaults=true
```

### Full Jackson 2 Module (Deprecated Stop-Gap)

For teams needing more time to migrate, add the `spring-boot-jackson2` module:

**Maven:**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-jackson2</artifactId>
</dependency>
```

**Gradle:**

```kotlin
implementation("org.springframework.boot:spring-boot-jackson2")
```

Jackson 2 properties available under `spring.jackson2.*` (equivalent to `spring.jackson.*` in SB3.5).

> ⚠️ `spring-boot-jackson2` ships **deprecated** and will be removed in a future release. Migrate to Jackson 3 ASAP.

### Jersey + Jackson

Jersey 4.0 does not yet support Jackson 3. For JSON with Jersey:

```xml
<!-- Use alongside spring-boot-jackson -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-jackson2</artifactId>
</dependency>
```
