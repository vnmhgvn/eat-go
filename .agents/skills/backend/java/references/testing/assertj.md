# AssertJ Assertions

Fluent assertions for readable tests.

## Basic Assertions

```java
// Object assertions
assertThat(order).isNotNull();
assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING);
assertThat(order).hasFieldOrPropertyWithValue("status", OrderStatus.PENDING);

// String assertions
assertThat(message)
    .isNotBlank()
    .startsWith("Hello")
    .contains("World")
    .endsWith("!");

// Number assertions
assertThat(amount)
    .isPositive()
    .isGreaterThan(100)
    .isBetween(100, 200);

// Boolean
assertThat(user.isActive()).isTrue();
```

## Collection Assertions

```java
// Size
assertThat(orders).hasSize(3);
assertThat(orders).isNotEmpty();

// Contains
assertThat(orders).contains(order1, order2);
assertThat(orders).containsExactly(order1, order2, order3);
assertThat(orders).containsExactlyInAnyOrder(order3, order1, order2);

// Extract and verify
assertThat(orders)
    .extracting(Order::getStatus)
    .containsOnly(OrderStatus.PENDING, OrderStatus.CONFIRMED);

assertThat(orders)
    .extracting("customerId", "status")
    .contains(tuple(1L, OrderStatus.PENDING));

// Filter and verify
assertThat(orders)
    .filteredOn(o -> o.getAmount().compareTo(BigDecimal.valueOf(100)) > 0)
    .hasSize(2);
```

## Exception Assertions

```java
assertThatThrownBy(() -> orderService.cancelOrder(orderId))
    .isInstanceOf(BusinessException.class)
    .hasMessage("Order not found")
    .hasFieldOrPropertyWithValue("code", "ORDER_NOT_FOUND");

assertThatCode(() -> orderService.process(validOrder))
    .doesNotThrowAnyException();
```

## Soft Assertions

```java
// All assertions run, failures collected at end
SoftAssertions.assertSoftly(softly -> {
  softly.assertThat(user.getName()).isEqualTo("John");
  softly.assertThat(user.getEmail()).isEqualTo("john@example.com");
  softly.assertThat(user.getAge()).isGreaterThan(18);
});
```

