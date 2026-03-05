# Vertical Slice Architecture — Java 21+ / Spring Boot 4

Jimmy Bogard's Vertical Slice: organize by feature, not by layer.

## Core Concept

```
Traditional (Horizontal Layers):       Vertical Slices (per Feature):

Controllers/                            feature_create_order/
  OrderController.java                    CreateOrderCommand.java
  UserController.java                     CreateOrderApi.java
Services/                                 CreateOrderHandler.java
  OrderService.java                       CreateOrderEvent.java
  UserService.java                        CreateOrderSpecTest.java
Repositories/                           feature_get_order/
  OrderRepository.java                    GetOrderQuery.java
  UserRepository.java                     GetOrderApi.java
                                          GetOrderHandler.java
  → Changes touch 3+ folders              GetOrderSpecTest.java
  → Merge conflicts across features
                                        → Changes touch 1 folder
                                        → Zero cross-feature conflicts
```

## The 5-File Pattern

Each vertical slice contains exactly 5 files:

| File                                       | Purpose                  | Annotation                                  |
| ------------------------------------------ | ------------------------ | ------------------------------------------- |
| `{Name}Command.java` or `{Name}Query.java` | Intent (write/read)      | `record` with `@Valid`                      |
| `{Name}Event.java`                         | Domain event after write | `record`                                    |
| `{Name}Api.java`                           | HTTP endpoint            | `@RestController` + `@PreAuthorize`         |
| `{Name}Handler.java`                       | All business logic       | `@Service` + `@Transactional` + `@Observed` |
| `{Name}SpecTest.java`                      | Specification test       | JUnit 5 + BDDMockito                        |

> For read-only features: skip Event file (no state change = no event).

## Package Structure

```
com.company.project
├── epic_order/                              # Business epic
│   ├── feature_create_order/                # Write slice
│   │   ├── CreateOrderCommand.java
│   │   ├── CreateOrderEvent.java
│   │   ├── CreateOrderApi.java
│   │   ├── CreateOrderHandler.java
│   │   └── CreateOrderSpecTest.java
│   ├── feature_get_order/                   # Read slice
│   │   ├── GetOrderQuery.java
│   │   ├── GetOrderResponse.java
│   │   ├── GetOrderApi.java
│   │   ├── GetOrderHandler.java
│   │   └── GetOrderSpecTest.java
│   └── feature_cancel_order/                # Write slice
│       ├── CancelOrderCommand.java
│       ├── CancelOrderEvent.java
│       ├── CancelOrderApi.java
│       ├── CancelOrderHandler.java
│       └── CancelOrderSpecTest.java
├── epic_user/
│   └── feature_register_user/
│       └── ...
└── common/                                  # Shared infrastructure
    ├── domain/
    │   ├── Order.java                       # @Entity (shared across slices)
    │   └── User.java
    ├── exception/
    │   └── GlobalExceptionHandler.java
    └── config/
        ├── SecurityConfig.java
        └── JpaConfig.java
```

## Code Example — Complete Slice

### Command (Intent)

```java
public record CreateOrderCommand(
    @NotNull Long userId,
    @NotEmpty List<@Valid OrderItemDto> items
) {}

public record OrderItemDto(
    @NotNull Long productId,
    @Positive int quantity
) {}
```

### Event (After Write)

```java
public record CreateOrderEvent(
    Long orderId,
    Long userId,
    BigDecimal total,
    Instant createdAt
) {}
```

### Api (HTTP → Handler)

```java
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class CreateOrderApi {
    private final CreateOrderHandler handler;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Long> execute(@Valid @RequestBody CreateOrderCommand cmd) {
        return ResponseEntity.status(HttpStatus.CREATED).body(handler.handle(cmd));
    }
}
```

### Handler (Business Logic)

```java
@Service
@Transactional
@RequiredArgsConstructor
public class CreateOrderHandler {
    private final OrderRepository orderRepo;
    private final ProductRepository productRepo;
    private final ApplicationEventPublisher publisher;

    @Observed(name = "epic_order.feature_create_order")
    public Long handle(CreateOrderCommand cmd) {
        // Validate products exist
        var products = productRepo.findAllById(
            cmd.items().stream().map(OrderItemDto::productId).toList()
        );
        if (products.size() != cmd.items().size()) {
            throw new BusinessException("Some products not found");
        }

        // Create order
        var order = Order.create(cmd.userId(), cmd.items(), products);
        orderRepo.save(order);

        // Publish event
        publisher.publishEvent(new CreateOrderEvent(
            order.getId(), cmd.userId(), order.getTotal(), Instant.now()
        ));

        return order.getId();
    }
}
```

### SpecTest (BDDMockito)

```java
@ExtendWith(MockitoExtension.class)
class CreateOrderSpecTest {
    @InjectMocks CreateOrderHandler handler;
    @Mock OrderRepository orderRepo;
    @Mock ProductRepository productRepo;
    @Mock ApplicationEventPublisher publisher;

    @Test
    void should_create_order_when_all_products_exist() {
        // given
        var cmd = new CreateOrderCommand(1L, List.of(new OrderItemDto(10L, 2)));
        given(productRepo.findAllById(List.of(10L))).willReturn(List.of(mockProduct(10L)));
        given(orderRepo.save(any(Order.class))).willReturn(mockOrder(99L));

        // when
        var orderId = handler.handle(cmd);

        // then
        assertThat(orderId).isEqualTo(99L);
        then(publisher).should().publishEvent(any(CreateOrderEvent.class));
    }
}
```

## Shared Code Strategy

| What to Share      | Where               | Example                                       |
| ------------------ | ------------------- | --------------------------------------------- |
| JPA Entities       | `common/domain/`    | `Order.java`, `User.java`                     |
| Exception handling | `common/exception/` | `GlobalExceptionHandler`, `BusinessException` |
| Config             | `common/config/`    | `SecurityConfig`, `JpaConfig`                 |
| Cross-cutting      | `common/util/`      | `PageResponse<T>`, `DateUtils`                |

**Rule:** If code is used by 3+ slices, move to `common/`. Otherwise keep in the slice.

## Benefits

- **Feature isolation** — each feature is self-contained, minimal merge conflicts
- **Easy to delete** — remove feature = delete one package
- **Parallel development** — teams work on different slices independently
- **Clear ownership** — one developer/PR per feature slice
- **Low coupling** — slices don't import from each other

## Anti-Patterns

- Slice importing from another slice → use `common/` or domain events
- Shared Service used by 10+ slices → split into focused handlers
- Huge `common/` package → keep it lean, only truly shared code
- Feature package with 15+ files → split into sub-features
