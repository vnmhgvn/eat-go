# Java 21 Features (LTS)

Java 21 is a Long-Term Support release (September 2023) with major features finalized from Project Loom, Amber, and Panama.

## Virtual Threads (JEP 444) - STABLE

Lightweight threads managed by JVM, perfect for I/O-bound workloads.

### Creating Virtual Threads

```java
// Direct creation
Thread vThread = Thread.ofVirtual().name("worker").start(() -> {
  System.out.println("Running in virtual thread");
});

// Virtual thread executor (preferred)
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
  IntStream.range(0, 10_000).forEach(i -> 
      executor.submit(() -> {
        Thread.sleep(Duration.ofSeconds(1));
        return i;
      })
  );
}  // Auto-closes and waits for all tasks
```

### Best Practices

```java
// ✅ DO: Use for I/O-bound tasks
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
  List<Future<Response>> futures = urls.stream()
      .map(url -> executor.submit(() -> httpClient.get(url)))
      .toList();
}

// ❌ DON'T: Use synchronized (causes pinning)
synchronized (lock) {
  socket.read();  // Virtual thread is pinned to carrier thread
}

// ✅ DO: Use ReentrantLock instead
lock.lock();
try {
  socket.read();  // Virtual thread can unmount
} finally {
  lock.unlock();
}
```

### Spring Boot Integration

```java
// application.yml
spring:
  threads:
    virtual:
      enabled: true  # Enables virtual threads for request handling

// Or manual Tomcat configuration
@Bean
TomcatProtocolHandlerCustomizer<?> virtualThreads() {
  return handler -> handler.setExecutor(
      Executors.newVirtualThreadPerTaskExecutor()
  );
}
```

---

## Pattern Matching for switch (JEP 441) - STABLE

Enhanced switch with type patterns, guards, and null handling.

### Basic Pattern Matching

```java
String format(Object obj) {
  return switch (obj) {
    case Integer i -> "Integer: %d".formatted(i);
    case Long l    -> "Long: %d".formatted(l);
    case Double d  -> "Double: %.2f".formatted(d);
    case String s  -> "String: %s".formatted(s);
    case null      -> "null";
    default        -> "Unknown: " + obj.getClass();
  };
}
```

### Guarded Patterns

```java
String describeNumber(Object obj) {
  return switch (obj) {
    case Integer i when i < 0  -> "Negative integer: " + i;
    case Integer i when i == 0 -> "Zero";
    case Integer i             -> "Positive integer: " + i;
    case null, default         -> "Not an integer";
  };
}
```

### Exhaustiveness

```java
// Sealed class hierarchy
sealed interface Shape permits Circle, Rectangle, Triangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}
record Triangle(double a, double b, double c) implements Shape {}

double area(Shape shape) {
  return switch (shape) {
    case Circle(var r)          -> Math.PI * r * r;
    case Rectangle(var w, var h) -> w * h;
    case Triangle(var a, var b, var c) -> {
      double s = (a + b + c) / 2;
      yield Math.sqrt(s * (s - a) * (s - b) * (s - c));
    }
  };  // No default needed - exhaustive for sealed types
}
```

---

## Record Patterns (JEP 440) - STABLE

Deconstruct records in pattern matching.

### Basic Deconstruction

```java
record Point(int x, int y) {}

void printSum(Object obj) {
  if (obj instanceof Point(int x, int y)) {
    System.out.println("Sum: " + (x + y));
  }
}
```

### Nested Patterns

```java
record Point(int x, int y) {}
record Line(Point start, Point end) {}

int lineLength(Object obj) {
  return switch (obj) {
    case Line(Point(var x1, var y1), Point(var x2, var y2)) -> 
        (int) Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    default -> 0;
  };
}
```

### Combined with Guards

```java
record Order(String id, Status status, BigDecimal amount) {}

String processOrder(Order order) {
  return switch (order) {
    case Order(var id, Status.PENDING, var amt) when amt.compareTo(BigDecimal.valueOf(1000)) > 0 ->
        "High-value pending order: " + id;
    case Order(var id, Status.PENDING, _) ->
        "Standard pending order: " + id;
    case Order(_, Status.COMPLETED, _) ->
        "Order already completed";
    case Order(var id, Status.CANCELLED, _) ->
        "Order cancelled: " + id;
  };
}
```

---

## Sequenced Collections (JEP 431) - STABLE

New interfaces for collections with defined encounter order.

### Interface Hierarchy

```
SequencedCollection<E>
├── SequencedSet<E>
│   └── SortedSet<E>
│       └── NavigableSet<E>
└── List<E>
    └── Deque<E>

SequencedMap<K,V>
└── SortedMap<K,V>
    └── NavigableMap<K,V>
```

### New Methods

```java
// SequencedCollection methods
interface SequencedCollection<E> extends Collection<E> {
  E getFirst();
  E getLast();
  void addFirst(E e);
  void addLast(E e);
  E removeFirst();
  E removeLast();
  SequencedCollection<E> reversed();
}

// SequencedMap methods
interface SequencedMap<K, V> extends Map<K, V> {
  Entry<K, V> firstEntry();
  Entry<K, V> lastEntry();
  Entry<K, V> pollFirstEntry();
  Entry<K, V> pollLastEntry();
  V putFirst(K k, V v);
  V putLast(K k, V v);
  SequencedMap<K, V> reversed();
}
```

### Usage Examples

```java
// List
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
String first = list.getFirst();      // "a"
String last = list.getLast();        // "c"
list.addFirst("z");                  // ["z", "a", "b", "c"]
List<String> rev = list.reversed();  // View: ["c", "b", "a", "z"]

// LinkedHashSet (ordered set)
SequencedSet<Integer> set = new LinkedHashSet<>(List.of(1, 2, 3));
set.addFirst(0);                     // [0, 1, 2, 3]
set.getLast();                       // 3

// LinkedHashMap (ordered map)
SequencedMap<String, Integer> map = new LinkedHashMap<>();
map.put("one", 1);
map.put("two", 2);
map.put("three", 3);
map.firstEntry();                    // one=1
map.lastEntry();                     // three=3
map.putFirst("zero", 0);             // {zero=0, one=1, two=2, three=3}
```

---

## String Templates (JEP 430) - PREVIEW

**Note**: Preview in Java 21, use `--enable-preview` flag.

```java
// Basic interpolation
String name = "World";
String greeting = STR."Hello, \{name}!";

// Expressions
int x = 10, y = 20;
String math = STR."\{x} + \{y} = \{x + y}";

// Multi-line
String json = STR."""
    {
      "name": "\{name}",
      "value": \{x + y}
    }
    """;

// FMT processor for formatting
double price = 19.99;
String formatted = FMT."Price: $%.2f\{price}";
```

---

## Scoped Values (JEP 446) - PREVIEW

**Note**: Preview in Java 21, stable in Java 25.

```java
// Define scoped value
private static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance();

// Bind and run
void handleRequest(User user) {
  ScopedValue.runWhere(CURRENT_USER, user, () -> {
    processRequest();
  });
}

// Access in nested call
void processRequest() {
  User user = CURRENT_USER.get();
  // Use user...
}

// With return value
String result = ScopedValue.callWhere(CURRENT_USER, user, () -> {
  return computeResult();
});
```

---

## Structured Concurrency (JEP 453) - PREVIEW

**Note**: Preview in Java 21, stable in Java 25.

```java
Response handle(Request request) throws Exception {
  try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    // Fork subtasks
    Supplier<User> user = scope.fork(() -> fetchUser(request.userId()));
    Supplier<Order> order = scope.fork(() -> fetchOrder(request.orderId()));
    
    // Wait for all tasks
    scope.join();
    
    // Propagate exceptions
    scope.throwIfFailed();
    
    // Combine results
    return new Response(user.get(), order.get());
  }
}

// ShutdownOnSuccess - return first successful result
try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {
  scope.fork(() -> fetchFromPrimary());
  scope.fork(() -> fetchFromBackup());
  
  scope.join();
  return scope.result();  // First successful result
}
```

