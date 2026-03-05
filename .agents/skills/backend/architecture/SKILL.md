---
name: architecture
description: >
  Application architecture patterns for Java 21+ / Spring Boot 4 projects.
  Covers Clean Architecture, Hexagonal (Ports & Adapters), CQRS, Three-Layer,
  and Vertical Slice Architecture with Java code examples and package structures.
  Recommends Clean Architecture + CQRS + Vertical Slice combination.
  Use when designing module structure, defining layer boundaries, choosing
  architecture patterns, reviewing package organization, or making architecture
  decisions for Spring Boot applications.
---

# Architecture Patterns — Java 21+ / Spring Boot 4

Application-level architecture patterns with Java/Spring Boot implementations.

## Quick Reference

| Pattern                | Core Idea                                      | Complexity  | Best For                                  |
| ---------------------- | ---------------------------------------------- | ----------- | ----------------------------------------- |
| **Three-Layer**        | Controller → Service → Repository              | Low         | Simple CRUD, MVPs, small teams            |
| **Clean Architecture** | Dependency rule: inner layers don't know outer | Medium      | Domain-rich apps, long-lived projects     |
| **Hexagonal**          | Ports & Adapters — swap infrastructure         | Medium      | Integration-heavy apps, testability       |
| **CQRS**               | Separate read/write models                     | Medium–High | Read-heavy, complex queries, event-driven |
| **Vertical Slice**     | Feature-first, not layer-first                 | Medium      | Large codebases, team autonomy            |

## Recommended Combination

> **Clean Architecture + CQRS-Lite + Vertical Slice Module**

This combination provides:

- **Clean Architecture** — dependency rule keeps domain pure, framework-independent
- **CQRS-Lite** — Command/Query separation without separate databases
- **Vertical Slice** — feature-scoped packages prevent cross-cutting coupling

### Resulting Package Structure

```
com.company.project
├── epic_{epic_name}/
│   └── feature_{feature_name}/         # ← Vertical Slice
│       ├── {Name}Command.java          # CQRS: write intent (record)
│       ├── {Name}Query.java            # CQRS: read intent (record)
│       ├── {Name}Event.java            # Domain event (record)
│       ├── {Name}Api.java              # Interface Adapter (Clean Arch)
│       ├── {Name}Handler.java          # Use Case (Clean Arch)
│       └── {Name}SpecTest.java         # Spec test
└── common/
    ├── domain/                         # Shared domain primitives
    ├── exception/                      # GlobalExceptionHandler
    └── config/                         # Infrastructure config
```

### How the Patterns Compose

```
┌─────────────────────────────────────────────┐
│  Vertical Slice (per feature)               │
│  ┌────────────────────────────────────────┐  │
│  │  Clean Architecture Layers            │  │
│  │                                        │  │
│  │  Api (Interface Adapter)               │  │
│  │    ↓ delegates to                      │  │
│  │  Handler (Use Case) ← @Transactional   │  │
│  │    ↓ uses                              │  │
│  │  Domain Entities + Events              │  │
│  │                                        │  │
│  │  CQRS: Command → Handler (write)       │  │
│  │        Query   → Handler (read)        │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### When NOT to Combine

- **MVP / prototype** → use Three-Layer, migrate later
- **Pure CRUD with no domain logic** → Three-Layer is sufficient
- **Team < 3 developers** → simpler pattern reduces cognitive overhead

## Pattern References

Load the relevant reference file for in-depth pattern details:

| Pattern                     | Reference                                   |
| --------------------------- | ------------------------------------------- |
| Clean Architecture          | `references/clean-architecture.md`          |
| Hexagonal Architecture      | `references/hexagonal-architecture.md`      |
| CQRS                        | `references/cqrs.md`                        |
| Three-Layer Architecture    | `references/three-layer-architecture.md`    |
| Vertical Slice Architecture | `references/vertical-slice-architecture.md` |

## Decision Guide

```
Start here:
  ↓
Is the domain complex? (many business rules, workflows)
  NO  → Three-Layer Architecture
  YES ↓
Do you need infrastructure swappability? (multiple DBs, external APIs)
  YES → Hexagonal Architecture
  NO  ↓
Do read and write patterns differ significantly?
  YES → Add CQRS
  NO  → Clean Architecture alone
  ↓
Is the codebase large or multi-team?
  YES → Organize as Vertical Slices
  NO  → Package by layer within Clean Architecture
```
