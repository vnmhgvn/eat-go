# F-004: Voting System

## 1. Meta

| Field         | Value                                                          |
| ------------- | -------------------------------------------------------------- |
| **Epic**      | [EPIC-01: LunchOrder](docs/product/epics/epic-01-lunchorder.md) |
| **Priority**  | P1                                                             |
| **Status**    | 🔴 Not Started                                                 |
| **Estimate**  | 8 points (L)                                                   |
| **BA Owner**  | Team                                                           |
| **Dev Owner** | Dev                                                            |

---

## 2. Business Context

### Problem Statement

Khi host bật tính năng vote, thành viên cần vote để chọn nhà hàng trước khi order. Mỗi người chỉ có 1 phiếu, có thể thay đổi trong khi phiên còn VOTING. Kết quả hòa thì host quyết định.

### Business Value

- Dân chủ hóa việc chọn nhà hàng, tăng sự hài lòng của nhóm
- Tránh tình trạng host áp đặt nhà hàng không hợp ý đa số

---

## 3. User Story

> **Là** thành viên tham gia phiên,  
> **Tôi muốn** vote cho nhà hàng tôi thích,  
> **Để** nhà hàng được chọn phản ánh ý kiến của cả nhóm.

### User Flow

```
1. Host tạo phiên với isVotingEnabled = true
2. Host thêm ít nhất 2 nhà hàng ứng cử vào phiên (VOTING state)
3. Member mở link → thấy danh sách ứng cử viên, vote 1 nhà hàng
4. Member có thể thay đổi phiếu khi phiên còn VOTING
5. Host xem kết quả (số phiếu công khai)
6. Host đóng vote → nhà hàng nhiều phiếu nhất được chọn, phiên → ORDERING
7. Nếu hòa → host chọn thủ công (BR07)
```

---

## 4. Acceptance Criteria

- [ ] **AC-01**: Host thêm được ít nhất 2 nhà hàng ứng cử vào phiên VOTING
- [ ] **AC-02**: Mỗi member chỉ có 1 phiếu duy nhất (UNIQUE constraint)
- [ ] **AC-03**: Member có thể thay đổi phiếu khi phiên còn VOTING
- [ ] **AC-04**: Kết quả vote hiển thị công khai: số phiếu từng nhà hàng, ai vote gì
- [ ] **AC-05**: Host đóng vote → nhà hàng nhiều phiếu được set là `restaurantId` của phiên → ORDERING
- [ ] **AC-06**: Trường hợp hòa → host phải chọn 1 nhà hàng thủ công (BR07)
- [ ] **AC-07**: Sau khi phiên chuyển ORDERING, không nhận vote mới

---

## 5. Out of Scope

- Vote nhiều vòng
- Điểm ưu tiên (ranked choice voting)
- Ẩn danh phiếu vote

---

## 6. UI/UX

### UI Notes

- Vote panel hiển thị danh sách nhà hàng dạng card
- Mỗi card có số phiếu và danh sách người vote (avatar)
- Current user's vote được highlight
- Nút "Đóng vote" chỉ hiển thị với host
- Nếu hòa: modal để host chọn winner

---

## 7. Technical Specs

### 7.0 NFR Targets

| NFR           | Target      | Priority | Note |
| ------------- | ----------- | -------- | ---- |
| Response time | < 300ms p95 | P1       |      |

### 7.1 Server Actions

- `src/features/voting/actions.ts`:
  - `addVoteCandidate(sessionId, restaurantId)` — host only
  - `castVote(sessionId, candidateId)` — authenticated session participant
  - `changeVote(sessionId, newCandidateId)` — same as castVote (upsert)
  - `closeVoting(sessionId, winnerCandidateId?)` — host only

### 7.2 Database Schema

**Table:** `session_vote_candidates`

| Column       | Type | Constraints   | Description      |
| ------------ | ---- | ------------- | ---------------- |
| id           | uuid | PK            |                  |
| session_id   | uuid | FK CASCADE    |                  |
| restaurant_id| uuid | FK → restaurants|                |
| added_by     | uuid | FK → users    |                  |

**Table:** `session_votes`

| Column       | Type       | Constraints             | Description     |
| ------------ | ---------- | ----------------------- | --------------- |
| id           | uuid       | PK                      |                 |
| session_id   | uuid       | FK CASCADE              |                 |
| user_id      | uuid       | FK → users              |                 |
| candidate_id | uuid       | FK → session_vote_candidates|             |
| created_at   | timestamptz| DEFAULT now()           |                 |
| UNIQUE       |            | (session_id, user_id)   | 1 vote per user |

**RLS:**
- `session_vote_candidates`: SELECT participants; INSERT host
- `session_votes`: SELECT participants (result visible); INSERT/UPDATE self when status=VOTING

### 7.3 Components

- `src/features/voting/components/vote-panel.tsx` — Vote listing & cast
- `src/features/voting/components/vote-candidate-card.tsx` — Per restaurant card
- `src/features/voting/components/close-voting-dialog.tsx` — Confirm + handle tie
- `src/features/voting/actions.ts`
- `src/features/voting/schemas.ts`

---

## 8. Test Cases

### Unit Tests

| TC-ID | Test Name                    | Input                          | Expected          |
| ----- | ---------------------------- | ------------------------------ | ----------------- |
| UT-01 | castVote when not VOTING     | Session in ORDERING state      | Error: not voting |
| UT-02 | closeVoting tie scenario     | 2 candidates equal votes       | Requires winner param |

### Integration Tests

- [ ] **IT-01**: Member casts vote → stored in session_votes
- [ ] **IT-02**: Non-participant cannot vote (RLS)

---

## 9. Dependencies

| Type           | Feature/Service | Status     | Notes |
| -------------- | --------------- | ---------- | ----- |
| **Depends on** | F-003 Sessions  | 🔴 Pending |       |

---

## 10. Notes & Change Log

### Change Log

| Date       | Author | Changes      |
| ---------- | ------ | ------------ |
| 2026-03-05 | Agent  | Initial spec |
