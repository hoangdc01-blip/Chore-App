---
name: rwos-framework
description: RWOS đánh giá + 4 Nỗ Lực + JIT cân bằng
---

# RWOS Framework

> RWOS = Tag trạng thái E/F → Chọn Nỗ Lực

## RWOS Tags

| Tag | River | ABCEF | Strategy |
|-----|-------|-------|----------|
| **R** Risk | F tiềm ẩn | F chưa xảy | PREVENT |
| **W** Weakness | F đang có | F hoạt động | ELIMINATE |
| **O** Opportunity | E bị tắc | E blocked | REALIZE |
| **S** Strength | E chảy | E hoạt động | PROTECT |

## 4 Nỗ Lực × RWOS

| Nỗ lực | Target | RWOS | Action |
|--------|--------|------|--------|
| 🚫 CHẶN | F | R,W | Chặn upstream |
| 🔓 KHƠI | E tắc | O | Thông dòng |
| 🛡️ GIỮ | E chảy | S | Bảo vệ |
| 🔄 BÙ | Bay hơi | - | Sustain |

## Severity (R & W)

| Level | Impact | Action |
|-------|--------|--------|
| CRITICAL | Chặn release | Fix ngay |
| HIGH | Ảnh hưởng lớn | Fix trong phase |
| MEDIUM | Có workaround | Schedule |
| LOW | Nhỏ | Khi rảnh |

## Priority

```
L1: R-Crit/High → PREVENT ngay
L2: W-Crit/High → ELIMINATE ngay
L3: R/W-Medium
L4: O → REALIZE
L5: R/W-Low
L6: S → PROTECT
```

## 3A × RWOS

| 3A | R | W | O | S |
|----|---|---|---|---|
| LÝ (Acc) | Logic sai | Edge cases thiếu | Thêm rules | Logic đủ |
| KHÍ (Ass) | Perf@scale | Error weak | Cache/retry | Robust |
| HÌNH (App) | UX confuse | UI inconsistent | Polish | Đẹp |

## JIT Check

```
🎯 CHỖ: Đúng bottleneck?
✨ CHẤT: Over-engineering?
📊 LƯỢNG: Thừa?
⏰ LÚC: Cần ngay?
```

## Flow

```
/eval → RWOS findings
           │
/council ──┼── /causes → Causal Rivers
           ├── /research → Facts
           └── /solutions → 4 Nỗ Lực
                   │
           Action Plan
```
