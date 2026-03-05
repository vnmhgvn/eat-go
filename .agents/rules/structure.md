---
trigger: always_on
---

# Project Structure & Naming Conventions

## Workspace Root Layout

```
/
├── .agents/             # AI Agent configuration
│   ├── agents/           # Sub-agent definitions
│   ├── rules/            # Project-wide constraints
│   ├── skills/           # Reusable AI skills (load on demand)
│   └── workflows/        # Automation workflows
├── docs/               # Centralized documentation
│   ├── api/            # API specifications (OpenAPI, etc.)
│   ├── architecture/   # System design, ADRs, architecture diagrams
│   ├── product/        # Product documentation — PRD, Roadmap, Vision, Changelog
│   │   ├── PRD.md                  # Product Requirements Document
│   │   ├── ROADMAP.md              # Feature roadmap and milestones
│   │   ├── VISION.md               # Product vision and goals
│   │   ├── CHANGELOG.md            # Version history and release notes
│   │   ├── epics/                  # Epic-level specs (one .md per epic)
│   │   │   └── epic-{name}.md      # Business context, scope, goals
│   │   ├── features/epic-{name}/   # Feature-level specs (one .md per feature)
│   │   │   └── feat-{name}.md      # Detailed requirements, AC, business rules
│   │   ├── bugs/                   # Bug reports (one .md per bug)
│   │   │   └── bug-{id}-{name}.md  # Root cause, resolution, verification
│   │   └── cr/                     # Change Requests (one .md per CR)
│   │       └── cr-{id}-{name}.md   # Impact analysis, acceptance criteria
│   ├── setup/          # Onboarding guides and environment setup
│   ├── templates/      # Reusable doc templates (epic, feature, bug, cr, business rules, load test)
│   └── project/        # Project-level artifacts (per-project, không commit vào repo chung)
│       ├── testcases/{epic-name}/    # QC testcases (manual)
│       ├── loadtests/{epic-name}/   # Load test scripts (k6/Gatling) — dùng LOAD_TEST_TEMPLATE.md
│       └── plans/{epic-name}/       # Orchestration state files
├── projects/           # All application source code
│   ├── <frontend>/     # e.g., web-app (Next.js)
│   └── <backend>/      # e.g., api-service (Spring Boot)
└── README.md
```

## Naming Conventions

- Use `kebab-case` for **all** directory and file names (e.g., `user-service`, `auth-handler`)
- Use descriptive names that reflect the content domain

> **Ghi chú**: Chi tiết package/folder structure của từng tech stack xem tại:
>
> - Backend (Java/Spring Boot): `rules/backend-rules.md` → Package Convention
> - Frontend (Next.js): `rules/frontend-rules.md` → Folder Structure
