# Load Test Suite: [Epic / Feature Name]

> **Path**: `docs/project/loadtests/[epic-name]/[feature-name]-load-test.md`  
> **Nguồn NFR**: `docs/product/features/[epic-name]/feat-[name].md` → Section 7.0

---

## 1. Meta

| Field           | Value                               |
| --------------- | ----------------------------------- |
| **Feature**     | [F-XXX: Feature Name]               |
| **NFR source**  | [Link to feature spec]              |
| **Tool**        | k6 / Gatling (tùy project)          |
| **Status**      | 🔴 Pending / 🟡 Draft / 🟢 Verified |
| **Last run**    | YYYY-MM-DD                          |
| **Environment** | SIT / Staging / Prod                |

---

## 2. NFR Targets (từ Feature Spec)

| NFR           | Target    | Result (last run) | Pass? |
| ------------- | --------- | ----------------- | ----- |
| Response time | < Xms p95 | -                 | -     |
| Throughput    | X RPS     | -                 | -     |
| Error rate    | < X%      | -                 | -     |

---

## 3. Test Scenarios

### Scenario 1 — Normal Load

- **Mục tiêu**: Verify target throughput ở baseline load
- **Cấu hình**:
  - Virtual users: X
  - Duration: Xm
  - Ramp-up: Xs

```javascript
// k6 example — thay bằng Gatling nếu project dùng Java
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 50 }, // ramp up
    { duration: "2m", target: 50 }, // sustained load
    { duration: "30s", target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<200"], // NFR: < 200ms p95
    http_req_failed: ["rate<0.001"], // NFR: < 0.1% error rate
  },
};

export default function () {
  const payload = JSON.stringify({
    // request body
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${__ENV.API_TOKEN}`,
      "Idempotency-Key": `lt-${__VU}-${__ITER}`, // unique per iteration
    },
  };

  const res = http.post(`${__ENV.BASE_URL}/api/v1/[endpoint]`, payload, params);

  check(res, {
    "status is 200/201": (r) => r.status === 200 || r.status === 201,
    "response time < 200ms": (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

### Scenario 2 — Spike Load

- **Mục tiêu**: Verify hệ thống không crash khi traffic đột biến
- **Cấu hình**:
  - Baseline: X VUs → spike lên 10X trong 30s → về baseline

```javascript
export const options = {
  stages: [
    { duration: "30s", target: 10 }, // baseline
    { duration: "10s", target: 100 }, // spike
    { duration: "1m", target: 100 }, // sustain spike
    { duration: "10s", target: 10 }, // recover
    { duration: "30s", target: 10 }, // baseline again
  ],
};
```

### Scenario 3 — Idempotency Under Concurrent Load (Fintech only)

- **Mục tiêu**: Verify idempotency key hoạt động đúng khi concurrent requests

```javascript
// Gửi cùng 1 idempotency key từ nhiều VUs song song
// Expected: chỉ 1 transaction được tạo, rest trả về kết quả cũ
export const options = {
  vus: 10,
  duration: "30s",
};

const IDEMPOTENCY_KEY = "test-concurrent-key-001"; // shared key

export default function () {
  const res = http.post(
    `${__ENV.BASE_URL}/api/v1/payments`,
    JSON.stringify({ amount: 100000 }),
    { headers: { "Idempotency-Key": IDEMPOTENCY_KEY } },
  );

  check(res, {
    "status 200 or 201": (r) => [200, 201].includes(r.status),
  });
}
// Post-run: verify DB chỉ có 1 payment record với key này
```

---

## 4. Run Instructions

```bash
# Prerequisites:
# - k6 installed: https://k6.io/docs/get-started/installation/
# - Environment variables set

# Normal load
k6 run \
  -e BASE_URL=https://your-sit-url \
  -e API_TOKEN=<token> \
  load-test.js

# Output to file
k6 run --out json=results.json load-test.js
```

---

## 5. Results Log

| Date       | Environment | Scenario    | p50 | p95 | Error rate | Pass? | Notes |
| ---------- | ----------- | ----------- | --- | --- | ---------- | ----- | ----- |
| YYYY-MM-DD | SIT         | Normal Load | -   | -   | -          | -     | -     |

---

## 6. Issues Found

- [ ] [Issue description — link to bug if created]

---

**Template Version:** 1.0  
**Last Updated:** February 26, 2026
