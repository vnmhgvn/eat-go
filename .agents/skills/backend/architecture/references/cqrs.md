# CQRS — Java 21+ / Spring Boot 4

Command Query Responsibility Segregation: separate models for reads and writes.

## CQRS Spectrum

```
Simple CRUD ──────── CQRS-Lite ──────── Full CQRS + Event Sourcing
  (same model)     (separate handlers)   (separate DBs + events)
                        ↑
                   Recommended start
```

### CQRS-Lite (Recommended)

- Same database, same schema
- Separate Command/Query Java `record` types
- Separate Handler classes for read vs write
- No separate read database or event store

### Full CQRS

- Separate write DB (PostgreSQL) and read DB (Elasticsearch/MongoDB)
- Event Sourcing for write side
- Projections to sync read models
- Significantly more complex — use only when justified

## Core Concepts

| Concept             | Purpose                        | Java Mapping                               |
| ------------------- | ------------------------------ | ------------------------------------------ |
| **Command**         | Express write intent           | `record CreateOrderCommand(...)`           |
| **Query**           | Express read intent            | `record GetOrderQuery(Long id)`            |
| **Command Handler** | Execute write + publish event  | `@Service @Transactional`                  |
| **Query Handler**   | Execute read (no side effects) | `@Service @Transactional(readOnly = true)` |
| **Event**           | Notify after state change      | `record OrderCreatedEvent(...)`            |

## Package Structure (CQRS-Lite)

```
com.company.project.epic_order.feature_create_order/
├── CreateOrderCommand.java       # Write intent (record)
├── CreateOrderEvent.java         # Domain event (record)
├── CreateOrderApi.java           # @RestController (POST)
├── CreateOrderHandler.java       # @Service @Transactional
└── CreateOrderSpecTest.java      # BDDMockito test

com.company.project.epic_order.feature_get_order/
├── GetOrderQuery.java            # Read intent (record)
├── GetOrderResponse.java         # Read projection (record)
├── GetOrderApi.java              # @RestController (GET)
├── GetOrderHandler.java          # @Service @Transactional(readOnly)
└── GetOrderSpecTest.java
```

## Code Example

### Command + Handler (Write Side)

```java
// Command — immutable intent
public record CreateOrderCommand(
    @NotNull Long userId,
    @NotEmpty List<OrderItemDto> items
) {}

// Event — published after commit
public record OrderCreatedEvent(Long orderId, Long userId, Instant createdAt) {}

// Handler — all business logic here
@Service
@Transactional
@RequiredArgsConstructor
public class CreateOrderHandler {
    private final OrderRepository orderRepo;
    private final ApplicationEventPublisher publisher;

    @Observed(name = "order.create")
    public Long handle(@Valid CreateOrderCommand cmd) {
        var order = Order.create(cmd.userId(), cmd.items());
        orderRepo.save(order);
        publisher.publishEvent(
            new OrderCreatedEvent(order.getId(), cmd.userId(), Instant.now())
        );
        return order.getId();
    }
}
```

### Query + Handler (Read Side)

```java
// Query — read intent
public record GetOrderQuery(@NotNull Long orderId) {}

// Response — optimized read projection
public record GetOrderResponse(
    Long id, String status, BigDecimal total, List<OrderItemDto> items
) {}

// Handler — read-only, no side effects
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetOrderHandler {
    private final OrderRepository orderRepo;

    @Observed(name = "order.get")
    public GetOrderResponse handle(GetOrderQuery query) {
        return orderRepo.findById(query.orderId())
            .map(GetOrderResponse::fromEntity)
            .orElseThrow(() -> new EntityNotFoundException("Order", query.orderId()));
    }
}
```

### Event Listener

```java
@Component
@RequiredArgsConstructor
public class OrderEventListener {
    private final NotificationService notification;

    @TransactionalEventListener(phase = AFTER_COMMIT)
    @Async
    public void onOrderCreated(OrderCreatedEvent event) {
        notification.sendOrderConfirmation(event.orderId());
    }
}
```

## When to Use CQRS

| Scenario                                          | CQRS-Lite? | Full CQRS?          |
| ------------------------------------------------- | ---------- | ------------------- |
| Complex domain with different read/write patterns | ✅         | ❌                  |
| Need audit trail of all changes                   | ❌         | ✅ (Event Sourcing) |
| Read-heavy with complex aggregations              | ✅         | ✅                  |
| Simple CRUD application                           | ❌         | ❌                  |
| Multiple read projections (API, report, search)   | ❌         | ✅                  |

## Anti-Patterns

- Command Handler returning complex read model → use Query for reads
- Query Handler modifying state → queries must be side-effect-free
- Publishing events inside `@Transactional` before commit → use `@TransactionalEventListener(phase = AFTER_COMMIT)`
- Overusing Full CQRS for simple domains → start with CQRS-Lite
- Skipping validation on Commands → always `@Valid` + Bean Validation
