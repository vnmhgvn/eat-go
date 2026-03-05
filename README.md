# Antigravity Setup

> **Version:** 2.0  
> **Last Updated:** 2026-02-26

Cấu hình AI Agent system cho dự án. Bao gồm các agents, rules, và skills để hỗ trợ toàn bộ quy trình phát triển từ thiết kế đến deploy.

---

## 📁 Cấu trúc thư mục

```
.
├── .agents/
│   ├── agents/          # Định nghĩa sub-agents
│   ├── rules/           # Quy tắc áp dụng cho toàn dự án
│   └── skills/          # Skills tái sử dụng (load theo nhu cầu)
├── docs/
│   ├── api/             # API specifications (OpenAPI)
│   ├── architecture/    # System design, ADRs
│   ├── product/         # PRD, Roadmap, Epics, Features, Bugs, CRs
│   ├── setup/           # Onboarding, environment setup
│   └── templates/       # Templates chuẩn (epic, feature, bug, CR)
├── projects/
│   ├── <backend>/       # Java 21+ / Spring Boot 4
│   ├── <frontend>/      # Next.js 15 / TypeScript 5
│   └── <fullstack>/     # Next.js 15 / Supabase / TypeScript 5    
└── README.md
```

---

## 🤖 Agents

| Agent                  | Trách nhiệm                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `orchestrator`         | Điều phối toàn bộ pipeline từ requirements → ship                  |
| `architect-specialist` | Thiết kế hệ thống, API contract, data model, ADR                   |
| `backend-specialist`   | Java 21+ / Spring Boot 4 — Vertical Slice implementation           |
| `frontend-specialist`  | Next.js 15 — pages, components, server actions                     |
| `fullstack-mvp-specialist` | Next.js 15 + Supabase — Fullstack MVP, Server actions, PostgreSQL RLS |
| `testing-specialist`   | Viết tests (TDD / Post-Impl), audit coverage                       |
| `reviewer`             | Code review — source, testing, architecture, security, performance |
| `debugging-specialist` | Root cause investigation và fix                                    |
| `document-analyzer`    | Phân tích tài liệu (PDF, DOCX, PPTX, XLSX)                         |

**Language**: Tất cả agents viết bằng **tiếng Anh**.

---

## 📋 Rules

| Rule file                | Trigger        | Mô tả                                                  |
| ------------------------ | -------------- | ------------------------------------------------------ |
| `orchestration-rules.md` | always_on      | Meta-principles cho orchestration                      |
| `agent-routing-rules.md` | always_on      | Routing logic và Task Complexity Tier                  |
| `security-rules.md`      | always_on      | Security guardrails + fintech standards                |
| `workflow-rules.md`      | always_on      | Quy trình tạo tài liệu, changelog, checklist           |
| `git-rules.md`           | always_on      | Branch convention, MR rules, commit convention         |
| `structure.md`           | always_on      | Project structure và naming conventions                |
| `backend-rules.md`       | model_decision | Java / Spring Boot hard constraints + fintech patterns |
| `frontend-rules.md`      | model_decision | TypeScript / Next.js hard constraints                  |
| `fullstack-mvp-rules.md` | model_decision | Next.js Fullstack, Supabase Auth, PostgreSQL guardrails|

**Language**: Tất cả rules viết bằng **tiếng Việt**, thuật ngữ kỹ thuật giữ nguyên tiếng Anh.

---

## 🛠 Tech Stack

| Layer             | Technology                                                       |
| ----------------- | ---------------------------------------------------------------- |
| **Backend**       | Java 21+ · Spring Boot 4 · Spring Framework 7 · Jakarta EE 11    |
| **Security**      | Spring Security 7 · JWT · OAuth 2.1                              |
| **Data**          | Spring Data JPA · PostgreSQL · Redis · Flyway                    |
| **Messaging**     | Apache Kafka                                                     |
| **Observability** | Micrometer 2 · OpenTelemetry · Prometheus · Grafana              |
| **Frontend**      | Next.js 15 · React 19 · TypeScript 5                             |
| **Fullstack MVP** | Next.js 15 · Supabase (Auth + PostgreSQL) · TypeScript 5 · Zod   |
| **Testing**       | JUnit 5 · BDDMockito · Testcontainers · Vitest · Testing Library |

---

## 🏗 Architecture Pattern

### 1. Enterprise Backend (Spring Boot)
Toàn bộ backend tuân theo **Vertical Slice Architecture** với CQRS-Lite:

```
com.company.project
└── epic_{name}/
    └── feature_{name}/
        ├── {Name}Command.java    # hoặc Query — Java record
        ├── {Name}Event.java      # Java record, fire-after-commit
        ├── {Name}Api.java        # @RestController — no business logic
        ├── {Name}Handler.java    # @Service @Transactional — all logic
        └── {Name}SpecTest.java   # JUnit 5 + BDDMockito
```

---

### 2. Fullstack MVP (Next.js + Supabase)
Gom nhóm theo feature-driven (Vertical Slice cho Next.js):
```
src/
├── app/                            # Routing shell (RSC)
└── features/
    └── {feature_name}/
        ├── actions.ts              # "use server" - Supabase mutations
        ├── components/             # RSC & Client components
        └── schemas.ts              # Zod validation schemas
```

---

## 🔄 Development Workflow

```
1. Nhận yêu cầu → orchestrator phân tích và lên kế hoạch
2. architect-specialist → thiết kế API contract + data model
3. backend-specialist → implement vertical slice
4. testing-specialist → viết tests (TDD hoặc Post-Impl)
5. reviewer → code review toàn diện
6. Tạo MR → develop (SIT) và releases/* (UAT)
```

---

## 📌 Standards

Các tiêu chuẩn sau được enforce tự động:

- **Idempotency**: Mọi financial mutation endpoint phải có `Idempotency-Key` header
- **Audit trail**: Mọi financial event có immutable audit log (append-only)
- **Data masking**: Không log account number, card number, OTP
- **Transaction safety**: `SERIALIZABLE` isolation + `PESSIMISTIC_WRITE` cho concurrent writes
- **JWT rotation**: Access token TTL ≤ 15 phút, refresh token rotation bắt buộc
