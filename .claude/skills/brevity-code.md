---
name: brevity-code
description: Khi viết output → Format chuẩn, 1 dòng = 1 fact, giảm 75% tokens
---

# Brevity Code

> Mỗi từ có nghĩa cố định, mỗi dòng = 1 fact. Giảm 75% tokens.

---

## Brevity Codes Chuẩn

### Data Types & Constraints
| Code | Meaning |
|------|---------|
| `str` | string |
| `int` | integer |
| `bool` | boolean |
| `uuid` | UUID |
| `ts` | timestamp |
| `req` | required |
| `opt` | optional |
| `uniq` | unique |
| `PK` | primary key |
| `FK` | foreign key |
| `ref` | references |
| `auto` | auto-generated |
| `def:X` | default value X |
| `min:X` | minimum X |
| `max:X` | maximum X |
| `enum:a,b,c` | enum values |

### Flow & Logic
| Code | Meaning |
|------|---------|
| `→` | leads to / triggers / then |
| `←` | receives from / depends on |
| `↔` | bidirectional |
| `\|` | or |
| `+` | and |
| `?` | conditional |
| `!` | important / required |
| `×` | blocked / error |
| `✓` | success / pass |

### References
| Code | Meaning |
|------|---------|
| `See:` | xem file khác |
| `P1:` | Phase 1 |
| `F001:` | Feature 001 |
| `T1:` | Test case 1 |
| `AC1:` | Acceptance criteria 1 |

### Status
| Code | Meaning |
|------|---------|
| `TODO` | chưa làm |
| `WIP` | đang làm |
| `DONE` | xong |
| `BLOCK` | bị chặn |
| `SKIP` | bỏ qua |

---

## Patterns

| Type | Brevity Example |
|------|-----------------|
| Entity | `User: id(uuid,PK,auto) + email(str,req,uniq) + pwd(str,req,min:8)` |
| API | `POST /auth/login ← email+pwd → 200:token \| 401:invalid` |
| Tree | `Page ├── Form → API │ ├── Input └── Btn` |
| Flow | `/login → submit → ✓ /dashboard \| × retry` |
| Deps | `F001 → F002 (needs auth)` |
| Test | `T1: login(valid) → /dashboard` |
| AC | `AC1: login(email+pwd) → token \| error` |

---

## Rules

```text
✅ DO:                          ❌ DON'T:
1 dòng = 1 fact                 Paragraphs dài
Tables > prose                  "Người dùng có thể..."
Trees > descriptions            Lặp lại từ Arch
Arrows (→←) > verbs             Code examples chi tiết
Codes (req,opt) > words         Từ đệm: "sau đó", "tiếp theo"
References (See:) > repeats
```
