# Java Performance Optimization

Best practices for optimizing Java application performance.

## JVM Tuning

### Memory Settings

```bash
# Heap settings
-Xms4g                  # Initial heap size
-Xmx4g                  # Maximum heap size (same as Xms for predictable performance)

# Metaspace
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=512m

# GC logging
-Xlog:gc*:file=gc.log:time,uptime,level,tags
```

### Garbage Collectors

| GC | Best For | Latency | Throughput | Command |
|----|----------|---------|------------|---------|
| G1GC | General (default) | Medium | High | `-XX:+UseG1GC` |
| ZGC | Low latency (<10ms) | Very Low | Medium | `-XX:+UseZGC` |
| Shenandoah | Low latency | Very Low | Medium | `-XX:+UseShenandoahGC` |
| Parallel GC | Batch processing | High | Very High | `-XX:+UseParallelGC` |

### G1GC Tuning

```bash
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200      # Target pause time
-XX:G1HeapRegionSize=16m      # Region size (1-32MB)
-XX:InitiatingHeapOccupancyPercent=45
```

### ZGC Tuning (Java 21+)

```bash
-XX:+UseZGC
-XX:+ZGenerational              # Generational ZGC (Java 21+)
-XX:SoftMaxHeapSize=8g          # Soft heap limit
```

---

## String Optimization

### String Interning

```java
// ✅ Intern frequently used strings
String status = statusFromDb.intern();  // Reuse from string pool

// ❌ Avoid for unique strings
String uuid = UUID.randomUUID().toString().intern();  // Wastes memory
```

### StringBuilder for Concatenation

```java
// ❌ Slow in loops
String result = "";
for (String s : list) {
  result += s;  // Creates new String each time
}

// ✅ Use StringBuilder
StringBuilder sb = new StringBuilder();
for (String s : list) {
  sb.append(s);
}
String result = sb.toString();

// ✅ Or use String.join / Collectors.joining
String result = String.join(",", list);
String result = list.stream().collect(Collectors.joining(","));
```

### String Templates (Java 25)

```java
// ✅ Efficient string formatting
String msg = STR."Hello, \{name}! You have \{count} messages.";
```

---

## Collection Optimization

### Choose Right Collection

| Use Case | Collection | Why |
|----------|------------|-----|
| Fast random access | `ArrayList` | O(1) get |
| Frequent insertions | `LinkedList` | O(1) insert |
| Unique elements | `HashSet` | O(1) contains |
| Sorted unique | `TreeSet` | O(log n) operations |
| Key-value lookup | `HashMap` | O(1) get |
| Ordered map | `LinkedHashMap` | Insertion order |
| Thread-safe map | `ConcurrentHashMap` | Lock striping |

### Pre-size Collections

```java
// ❌ Resizing overhead
List<String> list = new ArrayList<>();  // Default capacity 10
for (int i = 0; i < 10000; i++) {
  list.add(data[i]);  // Multiple resizes
}

// ✅ Pre-size when count known
List<String> list = new ArrayList<>(10000);
for (int i = 0; i < 10000; i++) {
  list.add(data[i]);  // No resizing
}
```

### Unmodifiable Collections

```java
// ✅ Use factory methods (Java 9+)
List<String> list = List.of("a", "b", "c");
Set<String> set = Set.of("a", "b", "c");
Map<String, Integer> map = Map.of("a", 1, "b", 2);

// ✅ Use toList() instead of collect(toList())
List<String> result = stream.toList();  // Unmodifiable
```

---

## Stream Optimization

### Parallel Streams

```java
// ✅ Use for CPU-intensive, large datasets
list.parallelStream()
    .filter(x -> complexPredicate(x))
    .map(x -> heavyTransformation(x))
    .toList();

// ❌ Don't use for I/O operations
list.parallelStream()
    .map(id -> httpClient.fetch(id))  // Blocks common pool!
    .toList();

// ✅ Use Virtual Threads for I/O instead
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
  list.stream()
      .map(id -> executor.submit(() -> httpClient.fetch(id)))
      .map(Future::join)
      .toList();
}
```

### Short-Circuit Operations

```java
// ✅ Short-circuit when possible
boolean hasAdmin = users.stream()
    .anyMatch(u -> u.getRole() == Role.ADMIN);  // Stops on first match

// ✅ Use findFirst/findAny instead of filter().findFirst()
Optional<User> admin = users.stream()
    .filter(u -> u.isAdmin())
    .findFirst();
```

### Avoid Boxing

```java
// ❌ Boxing overhead
int sum = list.stream()
    .mapToInt(Integer::intValue)
    .sum();

// ✅ Use primitive streams
int sum = IntStream.of(1, 2, 3, 4, 5).sum();

// ✅ Use mapToInt, mapToLong, mapToDouble
long total = orders.stream()
    .mapToLong(Order::getAmount)
    .sum();
```

---

## Memory Optimization

### Avoid Memory Leaks

```java
// ❌ Listener leak
eventBus.register(this);
// Forgot to unregister!

// ✅ Use weak references or unregister
@PreDestroy
void cleanup() {
  eventBus.unregister(this);
}

// ✅ Or use WeakReference
Map<Key, WeakReference<Value>> cache = new WeakHashMap<>();
```

### Object Pooling (Rare Cases)

```java
// ✅ Pool expensive objects (rare)
ObjectPool<ExpensiveObject> pool = new GenericObjectPool<>(factory);
ExpensiveObject obj = pool.borrowObject();
try {
  obj.doWork();
} finally {
  pool.returnObject(obj);
}

// ❌ Don't pool cheap objects - JVM is optimized for allocation
// String, StringBuilder, small arrays - just create new ones
```

---

## Profiling Tools

### JFR (Java Flight Recorder)

```bash
# Start with JFR
java -XX:StartFlightRecording=filename=recording.jfr,duration=60s MyApp

# Analyze with JMC (JDK Mission Control)
jmc recording.jfr
```

### JMH (Java Microbenchmark Harness)

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Benchmark)
public class MyBenchmark {
  
  private List<Integer> list;
  
  @Setup
  public void setup() {
    list = IntStream.range(0, 1000).boxed().toList();
  }
  
  @Benchmark
  public int forLoop() {
    int sum = 0;
    for (int i : list) {
      sum += i;
    }
    return sum;
  }
  
  @Benchmark
  public int streamSum() {
    return list.stream().mapToInt(i -> i).sum();
  }
}
```

### async-profiler

```bash
# CPU profiling
./profiler.sh -d 30 -f profile.html <pid>

# Allocation profiling
./profiler.sh -e alloc -d 30 -f alloc.html <pid>
```

---

## Best Practices Checklist

- [ ] Use appropriate GC for workload
- [ ] Pre-size collections when size is known
- [ ] Use primitive streams to avoid boxing
- [ ] Profile before optimizing
- [ ] Use StringBuilder for string concatenation in loops
- [ ] Avoid creating objects in hot paths
- [ ] Use lazy initialization for expensive objects
- [ ] Cache expensive computations
- [ ] Use parallel streams only for CPU-bound, large datasets
- [ ] Monitor with JFR in production

