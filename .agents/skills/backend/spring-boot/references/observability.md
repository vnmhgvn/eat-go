# Observability: Micrometer 2 & OpenTelemetry

## Table of Contents
- [Quick Setup](#quick-setup)
- [Metrics with Micrometer 2](#metrics-with-micrometer-2)
- [Distributed Tracing](#distributed-tracing)
- [Structured Logging](#structured-logging)
- [Custom Metrics](#custom-metrics)
- [Health Checks](#health-checks)
- [Actuator Endpoints](#actuator-endpoints)
- [Grafana / Prometheus Stack](#grafana--prometheus-stack)

---

## Quick Setup

### Dependencies

```xml
<!-- Actuator + Observability -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

<!-- OpenTelemetry (SB4 native support) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-opentelemetry</artifactId>
</dependency>

<!-- Prometheus metrics exporter -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

### Configuration

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,loggers
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true    # Kubernetes liveness/readiness
  metrics:
    tags:
      application: ${spring.application.name}
    distribution:
      percentiles-histogram:
        http.server.requests: true
  tracing:
    sampling:
      probability: 1.0   # 100% in dev, tune for prod

  # OpenTelemetry export
  otlp:
    tracing:
      endpoint: http://otel-collector:4318/v1/traces
    metrics:
      endpoint: http://otel-collector:4318/v1/metrics
```

---

## Metrics with Micrometer 2

SB4 uses Micrometer 2 — automatic metrics for:
- HTTP server requests (`http.server.requests`)
- HTTP client requests (`http.client.requests`)
- JVM metrics (memory, GC, threads)
- Database connection pool (HikariCP)
- Cache metrics
- Scheduled task metrics

### Prometheus Endpoint

Exposed at `/actuator/prometheus` — scrape with Prometheus or OTLP collector.

---

## Distributed Tracing

SB4 provides native OpenTelemetry integration with automatic correlation IDs.

```yaml
management:
  tracing:
    sampling:
      probability: 0.1   # 10% sampling in production
    propagation:
      type: w3c           # W3C Trace Context (default)
```

Traces propagate automatically across:
- REST controllers
- `RestClient` / declarative HTTP clients
- JPA/JDBC queries
- Kafka messages
- Scheduled tasks

### Manual Span Creation

```java
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;

@Service
public class PaymentService {

    private final ObservationRegistry observationRegistry;

    public PaymentResponse processPayment(PaymentRequest request) {
        return Observation.createNotStarted("payment.process", observationRegistry)
            .lowCardinalityKeyValue("payment.method", request.method().name())
            .observe(() -> {
                // Business logic here — automatically traced
                return doProcessPayment(request);
            });
    }
}
```

---

## Structured Logging

Configure structured (JSON) logging for log aggregation:

```yaml
logging:
  structured:
    format: ecs            # Elastic Common Schema
    # Or: logfmt, gelf

# Trace IDs automatically included in log output
```

```java
// Trace context automatically injected into MDC
log.info("Processing order orderId={}", orderId);
// Output includes traceId, spanId automatically
```

---

## Custom Metrics

```java
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

@Service
public class OrderService {

    private final Counter orderCounter;
    private final Timer orderProcessingTimer;

    public OrderService(MeterRegistry registry) {
        this.orderCounter = Counter.builder("orders.created")
            .description("Total orders created")
            .tag("service", "order")
            .register(registry);

        this.orderProcessingTimer = Timer.builder("orders.processing.time")
            .description("Order processing duration")
            .register(registry);
    }

    public OrderResponse createOrder(CreateOrderRequest request) {
        return orderProcessingTimer.record(() -> {
            OrderResponse response = processOrder(request);
            orderCounter.increment();
            return response;
        });
    }
}
```

### Gauge Example

```java
@Configuration
public class MetricsConfig {

    @Bean
    public MeterBinder queueSizeGauge(OrderQueue queue) {
        return registry -> Gauge.builder("queue.size", queue, OrderQueue::size)
            .description("Current order queue size")
            .register(registry);
    }
}
```

---

## Health Checks

### Built-in Health Indicators

SB4 auto-configures health checks for: DB, Redis, Kafka, Elasticsearch, RabbitMQ, disk space, mail.

### Custom Health Indicator

```java
@Component
public class ExternalApiHealthIndicator implements HealthIndicator {

    private final ExternalApiClient apiClient;

    @Override
    public Health health() {
        try {
            apiClient.ping();
            return Health.up()
                .withDetail("service", "external-api")
                .withDetail("status", "reachable")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("service", "external-api")
                .withException(e)
                .build();
        }
    }
}
```

### Kubernetes Probes

```yaml
management:
  endpoint:
    health:
      probes:
        enabled: true
      group:
        liveness:
          include: livenessState
        readiness:
          include: readinessState,db
```

Endpoints: `/actuator/health/liveness`, `/actuator/health/readiness`

---

## Actuator Endpoints

| Endpoint | Purpose |
| --- | --- |
| `/actuator/health` | Application health |
| `/actuator/info` | Build/app info |
| `/actuator/metrics` | All available metrics |
| `/actuator/prometheus` | Prometheus scrape endpoint |
| `/actuator/loggers` | View/change log levels at runtime |
| `/actuator/env` | Environment properties |
| `/actuator/beans` | All Spring beans |
| `/actuator/mappings` | All request mappings |

### Security for Actuator

```java
// In SecurityConfig
.requestMatchers("/actuator/health/**").permitAll()
.requestMatchers("/actuator/prometheus").permitAll()
.requestMatchers("/actuator/**").hasRole("ADMIN")
```

---

## Grafana / Prometheus Stack

### Docker Compose (Dev)

```yaml
services:
  prometheus:
    image: prom/prometheus
    ports: ["9090:9090"]
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports: ["3000:3000"]
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin

  otel-collector:
    image: otel/opentelemetry-collector
    ports: ["4318:4318"]
```

```yaml
# prometheus.yml
scrape_configs:
  - job_name: spring-boot
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: ["host.docker.internal:8080"]
```
