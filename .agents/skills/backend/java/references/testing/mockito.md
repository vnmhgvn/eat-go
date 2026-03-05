# Mockito Patterns

## Mocking Basics

```java
// Return value
when(repository.findById(1L)).thenReturn(Optional.of(order));

// Throw exception
when(repository.findById(999L)).thenThrow(new EntityNotFoundException());

// Answer (dynamic response)
when(repository.save(any(Order.class))).thenAnswer(invocation -> {
  Order order = invocation.getArgument(0);
  order.setId(123L);
  return order;
});

// Multiple calls
when(service.getStatus())
    .thenReturn("PENDING")
    .thenReturn("PROCESSING")
    .thenReturn("COMPLETED");
```

## Void Methods

```java
// Do nothing (default for mocks)
doNothing().when(emailService).send(any());

// Throw exception
doThrow(new EmailException()).when(emailService).send(null);

// Execute real method on spy
doCallRealMethod().when(spy).process();
```

## Verification

```java
// Called exactly once
verify(repository).save(any());

// Call count
verify(repository, times(2)).findById(any());
verify(repository, never()).delete(any());
verify(repository, atLeast(1)).findAll();
verify(repository, atMost(3)).save(any());

// Argument verification
verify(repository).save(argThat(order -> 
    order.getStatus() == OrderStatus.PENDING
));

// Using captor
verify(repository).save(orderCaptor.capture());
Order captured = orderCaptor.getValue();
assertThat(captured.getCustomerId()).isEqualTo(1L);

// Order verification
InOrder inOrder = inOrder(repository, paymentService);
inOrder.verify(repository).save(any());
inOrder.verify(paymentService).process(any());

// No more interactions
verifyNoMoreInteractions(repository);
```

## Argument Matchers

```java
// Any
any()                    // Any object
any(Order.class)         // Any Order
anyLong()                // Any long
anyString()              // Any String
anyList()                // Any List

// Null
isNull()
isNotNull()

// Equality
eq(expectedValue)

// Custom
argThat(order -> order.getAmount().compareTo(BigDecimal.ZERO) > 0)
```

