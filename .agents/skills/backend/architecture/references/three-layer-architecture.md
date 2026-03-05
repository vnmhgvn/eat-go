# Three-Layer Architecture — Java 21+ / Spring Boot 4

Traditional layered architecture: Presentation → Business Logic → Data Access.

## Layer Structure

```
┌─────────────────────────────────────┐
│  Presentation Layer                  │
│  @RestController / @Controller       │
│  Request/Response mapping            │
├─────────────────────────────────────┤
│  Business Logic Layer                │
│  @Service                            │
│  All business rules + validation     │
├─────────────────────────────────────┤
│  Data Access Layer                   │
│  @Repository / Spring Data JPA       │
│  Database queries + persistence      │
└─────────────────────────────────────┘
         ↓ depends on ↓
    ┌───────────────┐
    │   Database     │
    └───────────────┘
```

**Rule:** Each layer only calls the layer directly below it. Never skip layers.

## Package Structure

```
com.company.project
├── controller/
│   ├── OrderController.java          # @RestController
│   ├── request/
│   │   └── CreateOrderRequest.java   # record
│   └── response/
│       └── OrderResponse.java        # record
├── service/
│   ├── OrderService.java             # @Service (interface)
│   └── OrderServiceImpl.java         # @Service (implementation)
├── repository/
│   ├── OrderRepository.java          # extends JpaRepository
│   └── OrderSpecification.java       # JPA Specification for queries
├── entity/
│   ├── Order.java                    # @Entity
│   └── OrderStatus.java             # Enum
├── exception/
│   └── GlobalExceptionHandler.java   # @RestControllerAdvice
└── config/
    └── SecurityConfig.java
```

## Code Example

### Controller (Presentation Layer)

```java
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest req) {
        var response = orderService.createOrder(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrder(id));
    }
}
```

### Service (Business Logic Layer)

```java
@Service
@Transactional
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private final OrderRepository orderRepo;

    @Override
    public OrderResponse createOrder(CreateOrderRequest req) {
        var order = new Order();
        order.setUserId(req.userId());
        order.setItems(req.toItems());
        order.setStatus(OrderStatus.CREATED);
        order.calculateTotal();

        var saved = orderRepo.save(order);
        return OrderResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long id) {
        return orderRepo.findById(id)
            .map(OrderResponse::from)
            .orElseThrow(() -> new EntityNotFoundException("Order", id));
    }
}
```

### Repository (Data Access Layer)

```java
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdAndStatus(Long userId, OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.createdAt >= :since")
    List<Order> findRecentOrders(@Param("since") Instant since);
}
```

## Pros and Cons

**Pros:**

- Simple, well-understood by all developers
- Low cognitive overhead — clear "where does this go?"
- Fast onboarding for new team members
- Works well for CRUD-heavy applications
- Excellent tooling support (Spring Boot generators)

**Cons:**

- Business logic tightly coupled to framework
- Service layer tends to grow into "God Service" classes
- Entity model shared across all layers → changes ripple everywhere
- Difficult to test business rules without Spring context
- No natural boundary for feature isolation → merge conflicts in large teams

## When to Use

- **MVP / Prototype** — speed matters more than structure
- **Simple CRUD** — no complex domain logic
- **Small team** (1–3 devs) — communication overhead is low
- **Short-lived project** — won't need long-term maintenance

## Evolution Path to Clean Architecture

When three-layer becomes limiting, evolve incrementally:

```
Step 1: Extract records for Commands/Queries (separate from @Entity)
Step 2: Move business logic from Service → Handler classes
Step 3: Define port interfaces for Repository
Step 4: Separate read/write handlers (CQRS-Lite)
Step 5: Reorganize packages by feature (Vertical Slice)
```

Each step is backward-compatible — no big-bang rewrite needed.

## Anti-Patterns

- Controller containing business logic → always delegate to Service
- Service calling another Service's Repository directly → go through Service
- Entity used as REST response DTO → always map to `record` response
- "God Service" with 50+ methods → split by use case
- Repository with business logic in `@Query` → move to Service layer
