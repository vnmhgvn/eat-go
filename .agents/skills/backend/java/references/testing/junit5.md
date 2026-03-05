# JUnit 5 Basics

## Test Structure (AAA Pattern)

```java
@Test
@DisplayName("Should create order when valid request provided")
void shouldCreateOrderWhenValidRequest() {
  // Arrange
  OrderRequest request = OrderRequest.builder()
      .customerId(1L)
      .items(List.of(item))
      .build();
  when(orderRepository.save(any())).thenReturn(savedOrder);
  
  // Act
  Order result = orderService.createOrder(request);
  
  // Assert
  assertThat(result).isNotNull();
  assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
  verify(orderRepository).save(any(Order.class));
}
```

## Test Class Structure

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

  @Mock
  private OrderRepository orderRepository;
  
  @Mock
  private PaymentService paymentService;
  
  @Spy
  private OrderMapper orderMapper = new OrderMapperImpl();
  
  @InjectMocks
  private OrderServiceImpl orderService;
  
  @Captor
  private ArgumentCaptor<Order> orderCaptor;
  
  @BeforeEach
  void setUp() {
    // Common setup
  }
  
  @AfterEach
  void tearDown() {
    // Cleanup
  }
}
```

## Lifecycle Annotations

| Annotation | Description |
|------------|-------------|
| `@BeforeEach` | Run before each test |
| `@AfterEach` | Run after each test |
| `@BeforeAll` | Run once before all tests (static) |
| `@AfterAll` | Run once after all tests (static) |

## JUnit 5 Assertions

```java
// Basic assertions
assertEquals(expected, actual);
assertNotEquals(unexpected, actual);
assertTrue(condition);
assertFalse(condition);
assertNull(object);
assertNotNull(object);

// Exception assertion
assertThrows(BusinessException.class, () -> {
  orderService.cancelOrder(orderId);
});

// Grouped assertions (all run even if one fails)
assertAll(
    () -> assertEquals("John", user.getName()),
    () -> assertEquals("john@example.com", user.getEmail()),
    () -> assertTrue(user.isActive())
);

// Timeout
assertTimeout(Duration.ofSeconds(1), () -> {
  slowOperation();
});
```

## Parameterized Tests

```java
@ParameterizedTest
@ValueSource(strings = {"active", "pending", "confirmed"})
void shouldAcceptValidStatus(String status) {
  assertThat(OrderStatus.isValid(status)).isTrue();
}

@ParameterizedTest
@NullAndEmptySource
@ValueSource(strings = {"  ", "\t", "\n"})
void shouldRejectInvalidInput(String input) {
  assertThrows(IllegalArgumentException.class, () -> 
      service.process(input)
  );
}

@ParameterizedTest
@CsvSource({
    "1, PENDING, true",
    "2, CANCELLED, false",
    "3, COMPLETED, true"
})
void shouldValidateOrder(Long id, String status, boolean expected) {
  Order order = new Order(id, OrderStatus.valueOf(status));
  assertThat(order.isProcessable()).isEqualTo(expected);
}

@ParameterizedTest
@MethodSource("orderProvider")
void shouldProcessOrders(Order order, boolean expected) {
  assertThat(service.canProcess(order)).isEqualTo(expected);
}

static Stream<Arguments> orderProvider() {
  return Stream.of(
      Arguments.of(validOrder(), true),
      Arguments.of(cancelledOrder(), false),
      Arguments.of(expiredOrder(), false)
  );
}
```

