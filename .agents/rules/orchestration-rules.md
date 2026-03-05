---
trigger: always_on
---

# Workflow Orchestration

## 1. Plan Node Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions).
- If something goes sideways, STOP and re-plan immediately — don't keep pushing.
- Use plan mode for verification steps, not just building.
- Write detailed specs upfront to reduce ambiguity.

## 2. Subagent Strategy

- Use subagents liberally to keep main context window clean.
- Offload research, exploration, and parallel analysis to subagents.
- For complex problems, throw more compute at it via subagents.
- One task per subagent for focused execution.

## 3. Self-Improve Loop

- After ANY correction from the user: update `docs/lessons.md` with the pattern.
- Write rules for yourself that prevent the same mistake.
- Review lessons at session start for the relevant project.

### Lessons Entry Format (MANDATORY)

Mỗi entry trong `docs/lessons.md` phải theo format sau:

```markdown
### [YYYY-MM-DD] Pattern: <tên pattern ngắn gọn>

- **What went wrong**: <mô tả lỗi cụ thể>
- **Root cause**: <tại sao agent/dev mắc lỗi này>
- **Rule added**: <rule nào đã được thêm/update để ngăn lặp lại>
- **Files affected**: <rule file hoặc agent file đã update>
```

### Khi nào PHẢI ghi

| Tình huống                                  | Hành động            |
| ------------------------------------------- | -------------------- |
| User sửa output của agent                   | PHẢI ghi lesson ngay |
| User reject approach, yêu cầu làm cách khác | PHẢI ghi lesson      |
| Agent tự phát hiện sai sau khi đã submit    | NÊN ghi lesson       |
| Task hoàn thành mà không có correction      | Không cần ghi        |

## 4. Verification Before Done

- Never mark a task complete without proving it works.
- Run tests, check logs, demonstrate correctness.
- Ask yourself: "Would a staff engineer approve this?"

## 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- Skip this for simple, obvious fixes — don't over-engineer.
- Challenge your own work before presenting it.

## 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding.
- Point at logs, errors, failing tests — then resolve them.

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **Evidence-Based**: Never claim done without proof — files exist, tests green, build passes.
- **Fail Fast**: Stop the pipeline early rather than cascading a broken state downstream.
- **User in Control**: Never rollback or destroy artifacts without explicit user consent.
