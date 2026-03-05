# Feature Specification Template (Lite)

> **Version:** 1.0 - Lightweight format for faster documentation  
> **Philosophy:** Focus on WHAT, not HOW. Technical details live in code.

---

## Template

```markdown
# F-{EPIC}-{NNN}: {Feature Name}

| Attribute        | Value          |
| ---------------- | -------------- |
| **Feature ID**   | F-{EPIC}-{NNN} |
| **Priority**     | P0/P1/P2       |
| **Phase**        | 1A/1B/1C       |
| **Story Points** | 1/2/3/5/8      |

## User Story

> Là {role}, tôi muốn {action} để {benefit}.

## Acceptance Criteria

- [ ] AC-1: {Criterion 1 - testable, specific}
- [ ] AC-2: {Criterion 2}
- [ ] AC-3: {Criterion 3}

## Business Rules

- BR-001: {Rule 1}
- BR-002: {Rule 2}

## Edge Cases _(optional)_

- EC-001: {Edge case → expected behavior}

## Technical Notes _(optional, only if critical)_

- {Important constraint or dependency}
```

---

## Guidelines

### ✅ DO

- **Keep it short** - 1 page max per feature
- **Use bullet points** - Easy to scan
- **Focus on behavior** - What should happen, not how to implement
- **Make ACs testable** - QA should be able to verify each one
- **Number everything** - BR-001, EC-001 for easy reference

### ❌ DON'T

- Don't write SQL queries (that's code)
- Don't specify API request/response (that's API docs)
- Don't include database schema (that's in TECHNICAL_DESIGN.md)
- Don't over-engineer edge cases

---

## Story Point Reference

| Points | Complexity | Examples                          |
| :----: | ---------- | --------------------------------- |
|   1    | Trivial    | Config change, text update        |
|   2    | Simple     | CRUD with no special logic        |
|   3    | Medium     | Logic with 2-3 business rules     |
|   5    | Large      | Complex flow, multiple components |
|   8    | X-Large    | New architecture, integration     |

---

## Example: Simple Feature

```markdown
# F-CHAT-004: Typing Indicator

| Attribute        | Value      |
| ---------------- | ---------- |
| **Feature ID**   | F-CHAT-004 |
| **Priority**     | P1         |
| **Phase**        | 1B         |
| **Story Points** | 3          |

## User Story

> Là User, tôi muốn thấy khi người khác đang gõ để biết họ đang respond.

## Acceptance Criteria

- [ ] Hiển thị "User is typing..." khi đối phương đang gõ
- [ ] Typing indicator disappear sau 5 giây không có keystroke
- [ ] Multiple typers: "User A and User B are typing..."
- [ ] Không hiển thị cho chính mình

## Technical Notes

- Debounce typing events (500ms)
- TTL 5 seconds trong Redis
```

---

## Example: Medium Feature

```markdown
# F-CHAT-007: File Attachments

| Attribute        | Value      |
| ---------------- | ---------- |
| **Feature ID**   | F-CHAT-007 |
| **Priority**     | P1         |
| **Phase**        | 1C         |
| **Story Points** | 8          |

## User Story

> Là User, tôi muốn gửi file đính kèm (logs, screenshots) để minh họa issue.

## Acceptance Criteria

- [ ] Drag & drop hoặc click để chọn files
- [ ] Preview trước khi gửi
- [ ] Progress indicator khi uploading
- [ ] Thumbnail cho images
- [ ] Click để download/view
- [ ] Multiple files trong một message (max 5)

## Business Rules

- BR-001: Max file size: 10MB per file
- BR-002: Allowed types: jpg, jpeg, png, gif, pdf, json, xml, txt, log, zip
- BR-003: Max 5 files per message
- BR-004: Files lưu trữ permanent (không auto-delete)

## Edge Cases

- EC-001: Upload fail → show error, allow retry
- EC-002: File type not allowed → show clear error message
- EC-003: File too large → show size limit message
```

---

## When to Add More Detail?

| Situation              | Action                                         |
| ---------------------- | ---------------------------------------------- |
| Complex business logic | Create separate `F-XXX-Business-Rules.md` file |
| Many edge cases        | Create separate `F-XXX-Edge-Cases.md` file     |
| Needs sample data      | Create separate `F-XXX-Sample-Data.md` file    |
| API contract critical  | Reference API doc: `See API.md#endpoint-name`  |

---

## Comparison: Lite vs Detailed

| Aspect                | Lite Template | Detailed Template    |
| --------------------- | ------------- | -------------------- |
| **Time to write**     | 10-15 mins    | 30-60 mins           |
| **Maintenance**       | Easy          | Hard (outdates fast) |
| **Best for**          | Most features | Complex integrations |
| **Developer freedom** | High          | Low                  |
| **Ambiguity risk**    | Medium        | Low                  |

---

**Use Lite for:** 80% of features  
**Use Detailed for:** Critical/complex features, external integrations
