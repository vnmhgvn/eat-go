# Project Structure & Architecture

## Table of Contents

- [Feature-Based Structure (Recommended)](#feature-based-structure-recommended)
- [Layered Structure (Simple Apps)](#layered-structure-simple-apps)
- [Hexagonal / Clean Architecture](#hexagonal--clean-architecture)
- [Multi-Module Project](#multi-module-project)
- [Key Conventions](#key-conventions)
- [Package Naming](#package-naming)

---

## Feature-Based Structure (Recommended)

Best for medium-to-large applications, microservices, and DDD.

```
src/main/java/com/example/app/
├── Application.java                        # @SpringBootApplication
├── common/
│   ├── config/
│   │   ├── AppConfig.java
│   │   ├── SecurityConfig.java
│   │   ├── HttpClientConfig.java
│   │   └── ObservabilityConfig.java
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java     # @ControllerAdvice
│   │   ├── BusinessException.java
│   │   └── ResourceNotFoundException.java
│   ├── dto/
│   │   ├── ApiResponse.java                # Generic response wrapper
│   │   └── PageResponse.java              # Pagination wrapper
│   ├── security/
│   │   ├── JwtTokenProvider.java
│   │   └── JwtAuthenticationFilter.java
│   └── util/
│       └── DateUtils.java
│
├── user/                                   # Feature module
│   ├── UserController.java
│   ├── UserService.java
│   ├── UserRepository.java
│   ├── User.java                           # Entity
│   ├── UserMapper.java                     # Entity ↔ DTO mapping
│   └── dto/
│       ├── CreateUserRequest.java          # Record
│       ├── UpdateUserRequest.java          # Record
│       └── UserResponse.java              # Record
│
├── order/
│   ├── OrderController.java
│   ├── OrderService.java
│   ├── OrderRepository.java
│   ├── Order.java
│   ├── OrderItem.java                      # Child entity
│   ├── OrderMapper.java
│   ├── OrderStatus.java                    # Enum
│   └── dto/
│       ├── CreateOrderRequest.java
│       └── OrderResponse.java
│
└── product/
    ├── ProductController.java
    ├── ProductService.java
    └── ...

src/main/resources/
├── application.yml
├── application-dev.yml
├── application-prod.yml
├── db/
│   └── migration/                          # Flyway / Liquibase
│       ├── V1__create_users.sql
│       ├── V2__create_orders.sql
│       └── V3__create_products.sql
└── static/                                 # Only if serving static content
```

---

## Layered Structure (Simple Apps)

For small applications or prototypes.

```
src/main/java/com/example/app/
├── Application.java
├── controller/
│   ├── UserController.java
│   └── OrderController.java
├── service/
│   ├── UserService.java
│   └── OrderService.java
├── repository/
│   ├── UserRepository.java
│   └── OrderRepository.java
├── entity/
│   ├── User.java
│   └── Order.java
├── dto/
│   ├── UserRequest.java
│   └── UserResponse.java
├── config/
│   └── SecurityConfig.java
└── exception/
    └── GlobalExceptionHandler.java
```

---

## Hexagonal / Clean Architecture

> For Hexagonal, Clean Architecture, and CQRS patterns → load the `architecture` skill.
> See: `skills/backend/architecture/references/hexagonal-architecture.md`

---

## Multi-Module Project

For large applications or shared libraries.

```
my-app/
├── pom.xml                                # Parent POM
├── app-domain/
│   ├── pom.xml
│   └── src/main/java/.../domain/
├── app-service/
│   ├── pom.xml                            # Depends on app-domain
│   └── src/main/java/.../service/
├── app-infrastructure/
│   ├── pom.xml                            # Depends on app-service
│   └── src/main/java/.../infrastructure/
└── app-web/
    ├── pom.xml                            # Depends on app-service, app-infrastructure
    └── src/main/java/.../web/
        └── Application.java              # @SpringBootApplication here
```

---

## Key Conventions

| Convention   | Rule                                                      |
| ------------ | --------------------------------------------------------- |
| Main class   | Root package, `@SpringBootApplication`                    |
| Controllers  | Thin — validate, delegate to service, return DTO          |
| Services     | Business logic, transaction boundaries (`@Transactional`) |
| Repositories | Data access only, extend `JpaRepository`                  |
| DTOs         | Java Records, separate request/response                   |
| Entities     | JPA entities, never exposed to API                        |
| Mappers      | Entity ↔ DTO conversion (manual or MapStruct)             |
| Config       | `@Configuration` classes in `common/config/`              |
| Exceptions   | Centralized `@ControllerAdvice` with `ProblemDetail`      |
| Constants    | Enums preferred over string constants                     |

---

## Package Naming

```
com.company.project          # Group ID + Artifact ID
com.company.project.user     # Feature
com.company.project.common   # Shared
```

- Never use the default (unnamed) package
- Avoid deep nesting — 3-4 levels max
- Main class MUST be in root package for component scanning
