# Java Testing

Testing best practices with JUnit 5, Mockito, and AssertJ.

## Quick Reference

| Topic   | File                 | Use When                                       |
| ------- | -------------------- | ---------------------------------------------- |
| JUnit 5 | `testing/junit5.md`  | Test structure, lifecycle, parameterized tests |
| Mockito | `testing/mockito.md` | Mocking, stubbing, verification                |
| AssertJ | `testing/assertj.md` | Fluent assertions, collections                 |

## Best Practices

1. **One assertion concept per test** - Test one thing at a time
2. **Descriptive test names** - `shouldThrowExceptionWhenOrderNotFound`
3. **Use @DisplayName** for readable test output
4. **Prefer AssertJ** over JUnit assertions
5. **Don't mock what you don't own** - Wrap external APIs
6. **Use Testcontainers** for integration tests with real databases
7. **Keep tests independent** - No shared state between tests
8. **Test behavior, not implementation** - Focus on outcomes

## Test Naming Convention

```java
// Format: should[ExpectedBehavior]When[Condition]
void shouldReturnEmptyListWhenNoOrdersExist() {}
void shouldThrowExceptionWhenOrderNotFound() {}
void shouldCreateOrderWhenValidRequest() {}
```

## Dependencies

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>postgresql</artifactId>
  <scope>test</scope>
</dependency>
```
