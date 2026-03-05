# Java 25 Features (LTS)

Java 25 is a Long-Term Support release (September 2025) with many features graduating from preview to stable.

## Stable Features (from Preview)

### String Templates (JEP 484) - STABLE

String interpolation with template processors.

```java
// STR processor - basic interpolation
String name = "Alice";
int age = 30;
String bio = STR."Name: \{name}, Age: \{age}";

// Expressions in templates
int x = 10, y = 20;
String math = STR."\{x} + \{y} = \{x + y}";

// Method calls
String upper = STR."Hello, \{name.toUpperCase()}!";

// Multi-line templates
String json = STR."""
    {
      "name": "\{name}",
      "age": \{age},
      "adult": \{age >= 18}
    }
    """;

// FMT processor - with formatting
double price = 1234.5678;
String formatted = FMT."Price: $%,.2f\{price}";  // "Price: $1,234.57"

// RAW processor - for custom processing
StringTemplate template = RAW."Hello, \{name}!";
List<Object> values = template.values();       // [Alice]
String raw = template.interpolate();            // "Hello, Alice!"
```

---

### Scoped Values (JEP 487) - STABLE

Immutable, inheritable, thread-local-like values optimized for Virtual Threads.

```java
// Define scoped value (immutable by design)
public static final ScopedValue<UserContext> USER_CTX = ScopedValue.newInstance();

// Bind value for a scope (void)
void handleRequest(UserContext ctx) {
  ScopedValue.runWhere(USER_CTX, ctx, () -> {
    processRequest();  // ctx available here and in all nested calls
  });
}

// Bind value for a scope (with return)
String result = ScopedValue.callWhere(USER_CTX, ctx, this::processAndReturn);

// Access value
void processRequest() {
  if (USER_CTX.isBound()) {
    UserContext ctx = USER_CTX.get();
    // use ctx...
  }
}

// Rebind in nested scope
void outerMethod() {
  ScopedValue.runWhere(USER_CTX, outerCtx, () -> {
    // USER_CTX.get() == outerCtx
    
    ScopedValue.runWhere(USER_CTX, innerCtx, () -> {
      // USER_CTX.get() == innerCtx (shadowed)
    });
    
    // USER_CTX.get() == outerCtx (restored)
  });
}

// Multiple scoped values
public static final ScopedValue<Transaction> TX = ScopedValue.newInstance();
public static final ScopedValue<Logger> LOG = ScopedValue.newInstance();

ScopedValue.runWhere(USER_CTX, user,
    ScopedValue.runWhere(TX, transaction, () -> {
      // Both USER_CTX and TX are bound
    })
);
```

---

### Structured Concurrency (JEP 480) - STABLE

Treat related concurrent tasks as a single unit of work.

```java
// ShutdownOnFailure - all tasks must succeed
Response fetchData(long userId, long orderId) throws Exception {
  try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Supplier<User> user = scope.fork(() -> fetchUser(userId));
    Supplier<Order> order = scope.fork(() -> fetchOrder(orderId));
    Supplier<List<Item>> items = scope.fork(() -> fetchItems(orderId));
    
    scope.join();           // Wait for all tasks
    scope.throwIfFailed();  // Rethrow first exception
    
    return new Response(user.get(), order.get(), items.get());
  }
}

// ShutdownOnSuccess - first success wins
String fetchFromAnyMirror(List<String> mirrorUrls) throws Exception {
  try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {
    for (String url : mirrorUrls) {
      scope.fork(() -> fetchFrom(url));
    }
    
    scope.join();
    return scope.result();  // First successful result
  }
}

// Custom scope with timeout
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
  scope.fork(() -> task1());
  scope.fork(() -> task2());
  
  scope.joinUntil(Instant.now().plusSeconds(5));  // Timeout after 5s
  scope.throwIfFailed();
}

// Subtask states
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
  StructuredTaskScope.Subtask<String> subtask = scope.fork(() -> compute());
  scope.join();
  
  switch (subtask.state()) {
    case SUCCESS    -> System.out.println("Result: " + subtask.get());
    case FAILED     -> System.out.println("Error: " + subtask.exception());
    case UNAVAILABLE -> System.out.println("Not completed");
  }
}
```

---

### Unnamed Variables & Patterns (JEP 456) - STABLE

Use `_` for unused variables.

```java
// Unused variable in enhanced for
for (Order _ : orders) {
  count++;
}

// Unused parameter in lambda
map.forEach((_, value) -> process(value));

// Unused catch variable
try {
  riskyOperation();
} catch (IOException _) {
  log.error("IO operation failed");
}

// Unused pattern variable
if (obj instanceof Point(int x, int _)) {
  // Only care about x
  System.out.println("x = " + x);
}

// Multiple unused in switch
String result = switch (obj) {
  case Point(int x, int _) when x > 0 -> "Positive x";
  case Point(int _, int y) when y > 0 -> "Positive y";
  case Point(_, _) -> "Origin or negative";
  default -> "Not a point";
};

// Unused in try-with-resources
try (var _ = ScopedContext.open(ctx)) {
  // Don't need the resource reference
  doWork();
}

// Unused in record pattern
record Box<T>(T value) {}
if (obj instanceof Box<?>(var _)) {
  System.out.println("It's a Box!");
}
```

---

## Preview Features (Java 25)

### Primitive Types in Patterns (JEP 488) - PREVIEW

Pattern matching extended to primitive types.

```java
// Enable with: --enable-preview

// Primitive patterns in switch
String classify(int value) {
  return switch (value) {
    case 0 -> "zero";
    case int i when i > 0 -> "positive: " + i;
    case int i -> "negative: " + i;
  };
}

// Primitive type widening/narrowing in patterns
Object obj = 42;
if (obj instanceof byte b) {
  System.out.println("Fits in byte: " + b);
} else if (obj instanceof int i) {
  System.out.println("Int value: " + i);
}

// Combined with record patterns
record Measurement(double value, String unit) {}

String format(Measurement m) {
  return switch (m) {
    case Measurement(int v, var u) -> v + u;           // Exact int
    case Measurement(double v, var u) -> "%.2f%s".formatted(v, u);
  };
}
```

---

### Value Classes (JEP 489) - PREVIEW

Identity-free classes for better performance.

```java
// Enable with: --enable-preview

value class Point {
  private final int x;
  private final int y;
  
  public Point(int x, int y) {
    this.x = x;
    this.y = y;
  }
  
  public int x() { return x; }
  public int y() { return y; }
}

// Usage - behaves like primitives
Point p1 = new Point(1, 2);
Point p2 = new Point(1, 2);
// p1 == p2 compares by value, not identity

// Value records (implicit)
value record Complex(double real, double imag) {}

// Benefits:
// - No object header overhead
// - Can be flattened in arrays
// - No identity, no synchronization
// - Better cache locality
```

---

### Null-Restricted Types (JEP 490) - PREVIEW

Express nullability in type system.

```java
// Enable with: --enable-preview

// Non-null type annotation
void process(String! name) {  // name cannot be null
  System.out.println(name.length());  // Safe, no null check needed
}

// Nullable type (explicit)
String? findById(Long id) {  // May return null
  return repository.findById(id).orElse(null);
}

// In generics
List<String!> names;    // List of non-null strings
List<String?> maybeNames; // List that may contain nulls

// Method signatures
String! processNonNull(String! input);   // Takes non-null, returns non-null
String? processNullable(String? input);  // Takes nullable, returns nullable
```

---

## Enhanced APIs in Java 25

### Gatherers API (Stable)

```java
// Custom intermediate operations for streams
List<List<Integer>> batches = Stream.of(1, 2, 3, 4, 5, 6, 7)
    .gather(Gatherers.windowFixed(3))
    .toList();
// [[1,2,3], [4,5,6], [7]]

// Sliding window
List<List<Integer>> sliding = Stream.of(1, 2, 3, 4, 5)
    .gather(Gatherers.windowSliding(3))
    .toList();
// [[1,2,3], [2,3,4], [3,4,5]]

// Fold (reduce with intermediate results)
List<Integer> runningSum = Stream.of(1, 2, 3, 4, 5)
    .gather(Gatherers.fold(() -> 0, Integer::sum))
    .toList();
// [1, 3, 6, 10, 15]
```

### Stream Enhancements

```java
// mapMulti (stable from 16)
Stream<Integer> flattened = Stream.of(1, 2, 3)
    .<Integer>mapMulti((num, consumer) -> {
      consumer.accept(num);
      consumer.accept(num * 10);
    });
// [1, 10, 2, 20, 3, 30]

// toList() shorthand
List<String> list = stream.toList();  // Unmodifiable list
```

### Class-File API (JEP 484)

```java
// Generate class files programmatically
ClassFile cf = ClassFile.of();
byte[] bytes = cf.build(ClassDesc.of("com.example.Hello"), classBuilder -> {
  classBuilder.withMethod("greet", MethodTypeDesc.of(CD_void), ACC_PUBLIC | ACC_STATIC,
      methodBuilder -> methodBuilder.withCode(codeBuilder -> {
        codeBuilder.getstatic(CD_System, "out", CD_PrintStream)
                   .ldc("Hello, World!")
                   .invokevirtual(CD_PrintStream, "println", MTD_void_String)
                   .return_();
      }));
});
```

