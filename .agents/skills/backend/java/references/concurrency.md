# Java Concurrency Patterns

Quick reference for modern concurrency in Java 21/25.

## Thread Type Decision

| Scenario | Thread Type | Reason |
|----------|-------------|--------|
| HTTP requests | Virtual | I/O-bound |
| Database queries | Virtual | I/O-bound |
| File operations | Virtual | I/O-bound |
| CPU computation | Platform | Needs dedicated core |
| Image processing | Platform | CPU-intensive |

> **Note**: For Virtual Threads details, see `java-21-features.md`  
> For Structured Concurrency & Scoped Values, see `java-25-features.md`

## CompletableFuture Patterns

```java
// Basic composition
CompletableFuture<UserProfile> profile = CompletableFuture
    .supplyAsync(() -> fetchUser(userId))
    .thenCompose(user -> fetchProfile(user.profileId()))
    .exceptionally(ex -> UserProfile.defaultProfile());

// Parallel execution
CompletableFuture<User> userFuture = CompletableFuture.supplyAsync(() -> fetchUser(id));
CompletableFuture<List<Order>> ordersFuture = CompletableFuture.supplyAsync(() -> fetchOrders(id));

CompletableFuture.allOf(userFuture, ordersFuture).join();
UserData data = new UserData(userFuture.join(), ordersFuture.join());

// With Virtual Threads
ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> blockingCall(), executor);
```

## Thread-Safe Collections

| Use Case | Collection |
|----------|------------|
| High-throughput map | `ConcurrentHashMap` |
| Read-heavy list | `CopyOnWriteArrayList` |
| Producer-consumer | `BlockingQueue` |
| Non-blocking queue | `ConcurrentLinkedQueue` |

```java
// ConcurrentHashMap
ConcurrentMap<String, User> cache = new ConcurrentHashMap<>();
cache.computeIfAbsent(userId, id -> loadUser(id));

// BlockingQueue
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(1000);
queue.put(task);        // Blocks if full
Task t = queue.take();  // Blocks if empty
```

## Virtual Threads Pinning Quick Reference

```java
// ❌ PINS - avoid synchronized with I/O
synchronized (lock) { socket.read(); }

// ✅ OK - use ReentrantLock
lock.lock();
try { socket.read(); } 
finally { lock.unlock(); }
```

## Best Practices

1. **Virtual Threads for I/O** - HTTP, database, file operations
2. **Platform Threads for CPU** - Computation-heavy tasks
3. **Avoid synchronized with I/O** - Causes virtual thread pinning
4. **Use Structured Concurrency** (Java 25) - For related concurrent tasks
5. **Use Scoped Values** (Java 25) - Replace ThreadLocal with virtual threads
6. **Prefer concurrent collections** - Over synchronized wrappers

