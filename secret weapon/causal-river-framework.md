---
name: causal-river-framework
description: Mô hình Hồ Nước + ABCEF - phân tích nhân duyên
---

# Causal River Framework

> Dòng chảy = Nhân duyên. E→A→B, F→A, A→C

## Mental Model

```
🏔️ UPSTREAM
├── 🔵 E (nước trong) ──SANH──┐
└── 🟤 F (nước đục) ──DIỆT───┤
                              ▼
              ┌─────────────────────┐
              │    🌊 HỒ (A)        │
              │  TRONG↔ĐỤC (chất)  │
              │  ĐẦY↔VƠI (lượng)   │
              └────┬──────────┬─────┘
                   ▼          ▼
             🌾 B (lợi)   🔥 C (hại)
                   │
              ☀️ BAY HƠI
```

## ABCEF = Chuỗi Nhân Duyên

```
E ──SANH──► A ──SANH──► B
            │
F ──DIỆT──► A ──DIỆT──► C
```

| Ký hiệu | Nghĩa | Hỏi |
|---------|-------|-----|
| **A** | Action đang xét | "Làm gì?" |
| **E** | Enabler (sanh A) | "Gì giúp A?" |
| **F** | Friction (diệt A) | "Gì phá A?" |
| **B** | Beneficiary | "Ai lợi?" |
| **C** | Casualty | "Ai hại?" |

## 4 Nỗ Lực

| Trạng thái | Nỗ lực | RWOS |
|------------|--------|------|
| Có F | 🚫 CHẶN upstream | R→PREVENT, W→ELIMINATE |
| Thiếu E | 🔓 KHƠI thông | O→REALIZE |
| E đủ | 🛡️ GIỮ GÌN | S→PROTECT |
| Bay hơi | 🔄 BÙ | Sustain |

## JIT = 4 Vừa Đủ

| | Nghĩa | Anti-pattern |
|---|-------|--------------|
| 🎯 CHỖ | Đúng bottleneck | Tràn lan |
| ✨ CHẤT | Đủ tốt | Over-engineering |
| 📊 LƯỢNG | Đủ dùng | Tích trữ thừa |
| ⏰ LÚC | Đúng thời điểm | Quá sớm |

## Trade-off

```
A ít    → B thiếu
A nhiều → C hại
A đủ    → B đủ + C OK ✓
```

## Câu Hỏi Chẩn Đoán

```
1. A là gì?
2. E - gì sanh A? (≥2 levels)
3. F - gì diệt A? (≥2 levels)
4. B - ai lợi?
5. C - ai hại?
6. Hồ tự cạn? (bay hơi)
7. Cần bao nhiêu? (JIT)
```

## Anti-patterns

| ❌ | ✅ |
|---|---|
| Chỉ B, quên C | Cả B và C |
| Chặn ở hồ | Chặn upstream |
| Chỉ F, quên E | Cả CHẶN F + KHƠI E |
