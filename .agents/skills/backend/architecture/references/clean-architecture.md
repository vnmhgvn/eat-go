# Clean Architecture — Java 21+ / Spring Boot 4

Robert C. Martin's Clean Architecture: domain at center, dependencies point inward.

## Dependency Rule

```
Framework & Drivers (outermost)
  ↓ depends on
Interface Adapters
  ↓ depends on
Use Cases (Application)
  ↓ depends on
Entities (Domain) ← innermost, no dependencies
```

**Rule:** Inner layers NEVER import from outer layers. Outer layers depend on interfaces defined in inner layers.

## Layer Mapping to Spring Boot

| Clean Arch Layer      | Spring Boot Mapping                                    | Allowed Dependencies |
| --------------------- | ------------------------------------------------------ | -------------------- |
| **Entity**            | Domain classes, Value Objects, `record` DTOs           | None (pure Java)     |
| **Use Case**          | `@Service` Handler classes                             | Entity layer only    |
| **Interface Adapter** | `@RestController`, `@Repository` impl, `@HttpExchange` | Use Case + Entity    |
| **Framework**         | Spring config, Security, JPA config, Kafka config      | All layers           |

## Package Structure

```
com.company.project
├── domain/                          # Entity layer
│   ├── model/
│   │   ├── Order.java               # JPA @Entity
│   │   ├── OrderStatus.java         # Enum
│   │   └── Money.java               # Value Object (record)
│   ├── event/
│   │   └── OrderCreatedEvent.java   # Domain event (record)
│   └── port/                        # Interfaces (driven ports)
│       ├── OrderRepository.java     # Interface
│       └── PaymentGateway.java      # Interface
├── application/                     # Use Case layer
│   ├── CreateOrderHandler.java      # @Service @Transactional
│   └── GetOrderHandler.java         # @Service @Transactional(readOnly)
├── adapter/                         # Interface Adapter layer
│   ├── in/
│   │   └── web/
│   │       ├── OrderApi.java        # @RestController
│   │       └── CreateOrderRequest.java  # record
│   └── out/
│       ├── persistence/
│       │   └── JpaOrderRepository.java  # implements OrderRepository
│       └── payment/
│           └── StripePaymentGateway.java # implements PaymentGateway
└── config/                          # Framework layer
    ├── SecurityConfig.java
    └── JpaConfig.java
```

## Code Example

### Entity Layer (pure Java, no Spring imports)

```java
// Domain model
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        Objects.requireNonNull(amount);
        Objects.requireNonNull(currency);
        if (amount.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("Amount must be non-negative");
    }
}

// Port interface — defined in domain, implemented in adapter
public interface OrderRepository {
    Optional<Order> findById(Long id);
    Order save(Order order);
}
```

### Use Case Layer

```java
@Service
@Transactional
@RequiredArgsConstructor
public class CreateOrderHandler {
    private final OrderRepository orderRepo;          // port interface
    private final ApplicationEventPublisher publisher;

    @Observed(name = "order.create")
    public Long handle(CreateOrderCommand cmd) {
        var order = Order.create(cmd.userId(), cmd.items());
        orderRepo.save(order);
        publisher.publishEvent(new OrderCreatedEvent(order.getId()));
        return order.getId();
    }
}
```

### Interface Adapter Layer

```java
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderApi {
    private final CreateOrderHandler createHandler;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Long> create(@Valid @RequestBody CreateOrderRequest req) {
        var id = createHandler.handle(req.toCommand());
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }
}
```

## Key Principles

- Domain layer has **zero framework imports** — pure Java
- Use Case layer depends on **interfaces** (ports), not implementations
- Adapter layer **implements** ports and **maps** between external/internal models
- Dependency Injection wires adapters to ports at runtime
- Test Use Cases by mocking ports — no Spring context needed

## Anti-Patterns

- Domain importing `@Entity` JPA annotations → leaks framework into domain
- Handler calling `RestTemplate` directly → bypasses port abstraction
- Controller containing business logic → violates single responsibility
- Circular dependencies between layers → breaks dependency rule
