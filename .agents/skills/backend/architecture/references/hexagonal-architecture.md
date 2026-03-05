# Hexagonal Architecture — Java 21+ / Spring Boot 4

Alistair Cockburn's Ports & Adapters: application core communicates through defined ports.

## Core Concept

```
┌──────────────────────────────────────────────────────┐
│                    Adapters (outer)                    │
│  ┌──────────┐                        ┌──────────┐    │
│  │  REST API │ ──▶ ┌──────────────┐  │  JPA DB  │    │
│  │ (driving) │     │              │  │(driven)  │    │
│  └──────────┘     │  Application  │  └──────────┘    │
│  ┌──────────┐     │     Core      │  ┌──────────┐    │
│  │  CLI     │ ──▶ │              │──▶│  Kafka   │    │
│  │ (driving) │     │  (Domain +   │  │(driven)  │    │
│  └──────────┘     │   Use Cases) │  └──────────┘    │
│  ┌──────────┐     │              │  ┌──────────┐    │
│  │  gRPC    │ ──▶ └──────────────┘──▶│  Redis   │    │
│  │ (driving) │           ↑    ↓      │(driven)  │    │
│  └──────────┘      Ports (interfaces) └──────────┘   │
└──────────────────────────────────────────────────────┘
```

## Port Types

| Port Type              | Direction      | Purpose              | Spring Mapping                                 |
| ---------------------- | -------------- | -------------------- | ---------------------------------------------- |
| **Driving (Primary)**  | Outside → Core | Trigger use cases    | `@RestController`, CLI, `@KafkaListener`       |
| **Driven (Secondary)** | Core → Outside | Infrastructure needs | `@Repository`, `@HttpExchange`, Kafka producer |

## Package Structure

```
com.company.project
├── core/                              # Application Core (no framework deps)
│   ├── domain/
│   │   ├── Order.java                 # Entity
│   │   ├── OrderStatus.java           # Enum
│   │   └── Money.java                 # Value Object (record)
│   ├── port/
│   │   ├── in/                        # Driving ports (use case interfaces)
│   │   │   ├── CreateOrderUseCase.java
│   │   │   └── GetOrderUseCase.java
│   │   └── out/                       # Driven ports (infrastructure interfaces)
│   │       ├── OrderPersistencePort.java
│   │       └── PaymentPort.java
│   └── service/
│       └── OrderService.java          # Implements driving ports
├── adapter/
│   ├── in/                            # Driving adapters
│   │   ├── web/
│   │   │   └── OrderController.java   # @RestController → calls driving port
│   │   └── messaging/
│   │       └── OrderEventListener.java
│   └── out/                           # Driven adapters
│       ├── persistence/
│       │   ├── JpaOrderAdapter.java   # implements OrderPersistencePort
│       │   └── OrderJpaEntity.java    # JPA-specific entity
│       └── payment/
│           └── StripeAdapter.java     # implements PaymentPort
└── config/
    └── BeanConfig.java                # Wire adapters to ports
```

## Code Example

### Driving Port (Use Case Interface)

```java
// Defined in core — no framework annotations
public interface CreateOrderUseCase {
    Long createOrder(CreateOrderCommand command);
}

public record CreateOrderCommand(
    Long userId,
    List<OrderItem> items
) {}
```

### Core Service (implements driving port)

```java
@RequiredArgsConstructor
public class OrderService implements CreateOrderUseCase {
    private final OrderPersistencePort persistence;  // driven port
    private final PaymentPort payment;               // driven port

    @Override
    public Long createOrder(CreateOrderCommand cmd) {
        var order = Order.create(cmd.userId(), cmd.items());
        payment.reserve(order.totalAmount());
        return persistence.save(order);
    }
}
```

### Driven Port + Adapter

```java
// Port (in core — pure interface)
public interface OrderPersistencePort {
    Long save(Order order);
    Optional<Order> findById(Long id);
}

// Adapter (in adapter/out — has Spring/JPA deps)
@Repository
@RequiredArgsConstructor
public class JpaOrderAdapter implements OrderPersistencePort {
    private final OrderJpaRepository jpaRepo;

    @Override
    public Long save(Order order) {
        var entity = OrderJpaEntity.fromDomain(order);
        return jpaRepo.save(entity).getId();
    }
}
```

### Driving Adapter

```java
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final CreateOrderUseCase createOrder;  // driving port

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Long> create(@Valid @RequestBody CreateOrderRequest req) {
        var id = createOrder.createOrder(req.toCommand());
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }
}
```

## Clean Architecture vs Hexagonal

| Aspect          | Clean Architecture              | Hexagonal                     |
| --------------- | ------------------------------- | ----------------------------- |
| **Focus**       | Layer dependency rule           | Port/Adapter substitution     |
| **Ports**       | Implicit (interfaces in domain) | Explicit (in/out ports)       |
| **Adapters**    | Interface Adapter layer         | Named driving/driven adapters |
| **Testability** | Mock ports in domain            | Swap entire adapters          |
| **Best for**    | Domain-rich business logic      | Integration-heavy systems     |

Both share the same core principle: **business logic is independent of infrastructure**.

## When to Use Hexagonal

- Multiple entry points (REST + CLI + messaging)
- Need to swap infrastructure (PostgreSQL ↔ MongoDB, Stripe ↔ PayPal)
- Integration-heavy system with many external dependencies
- Emphasis on testability via adapter substitution

## Anti-Patterns

- Core importing Spring annotations → framework leaks into domain
- Adapter containing business logic → violates core isolation
- Driven port returning JPA entities → domain depends on infrastructure model
- Missing port interface (core calling adapter directly) → tight coupling
