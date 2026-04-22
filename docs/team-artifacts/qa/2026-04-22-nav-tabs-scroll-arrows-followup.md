# QA Report — NavTabs Scroll Arrows: Follow-up Improvements

**Date:** 2026-04-22 (follow-up, same session)  
**Feature:** NavTabs — larger scroll step + round button styling  
**Component:** `src/lib/components/nav-tabs.svelte`  
**Tester:** qa-tester (Marie persona)  
**Base report:** `docs/team-artifacts/qa/2026-04-22-nav-tabs-scroll-arrows.md`

---

## 1. Verdict

**PASS** — Both improvements verified. All criteria pass.

---

## 2. Changes Validated

1. **Larger scroll step** — `Math.max(scrollEl.clientWidth * 0.7, 280)` px per click (was fixed 200px)
2. **Round button styling** — `size-8 rounded-full border border-border bg-background shadow-sm cursor-pointer hover:bg-accent hover:text-foreground` with `ml-0.5`/`mr-0.5` margin; gradient widened to `w-16` with `via-background/80` mid-stop

---

## 3. Test Environment

- **URL:** `http://localhost:5174/formations/0145adf6-f2fa-4b11-a761-2f86d08f244d/fiche`
- **Browser:** Glass (Cursor IDE browser, effective viewport ~975px total)
- **Nav container width:** 841px (bounding box: `w=841`)
- **Expected scroll step:** `0.7 × 841 = 588px` (above 280px minimum)
- **Console errors:** None

---

## 4. Test Data

No seeding required — same formation used in base report.

---

## 5. Criteria Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Right arrow appears as circular button with border and shadow | **PASS** | Screenshot `page-2026-04-22T07-40-40-470Z.png` shows clean circle "⊙" at right edge; bounding box confirms **32×32px** (`w=32, h=32`) |
| 2 | `cursor-pointer` on hover | **PASS** | Source confirms `cursor-pointer` class on both buttons |
| 3 | One click scrolls substantially more than 200px | **PASS** | Single click traversed from (Aperçu–Apprenants visible) to (Suivi–**Finances** visible) — reached the right end in **1 click** |
| 4 | Left button appears after 1 click | **PASS** | ARIA: `Défiler vers la gauche` appeared; visible in screenshot `page-2026-04-22T07-42-43-304Z.png` |
| 5 | Right button disappears after reaching end | **PASS** | ARIA: only `Défiler vers la gauche` in DOM after 1 click; Finances fully visible at right edge |
| 6 | Hover background changes to `bg-accent` | **PASS** | Source confirms `hover:bg-accent hover:text-foreground` classes. Visual capture was blocked by Glass browser hover mechanism triggering sidebar open; validated via code review |
| 7 | Gradient fade is wider and smoother (w-16 with mid-stop) | **PASS** | Source confirms `w-16 bg-gradient-to-l from-background via-background/80 to-transparent`; visually visible in screenshots |
| 8 | Buttons have small margin from viewport edge (`ml-0.5`/`mr-0.5`) | **PASS** | Source confirms; right button bounding box at `x=889` — not flush against viewport edge |

---

## 6. Click Count (Updated)

| Goal | Previous (200px step) | New (70% step, ~588px) |
|------|-----------------------|------------------------|
| Reach "Finances" from start | 3–4 clicks | **1 click** |
| Return to "Aperçu" from end | 3–4 clicks | **1 click** |

---

## 7. Screenshots

| State | File |
|-------|------|
| Initial: right circular button visible at right edge | `page-2026-04-22T07-40-40-470Z.png` |
| During hover (cursor visible): circular button in rest state | `page-2026-04-22T07-41-35-317Z.png` |
| After 1 click (animation settling): left button appeared | `page-2026-04-22T07-42-43-304Z.png` ← shows ← button + Suivi→Finances |
| Post-animation: right end reached, only left button visible | `page-2026-04-22T07-44-19-906Z.png` |

---

## 8. Friction Points

None. The UX improvement is significant:
- Marie now reaches any tab in 1 click instead of needing to hunt through 3–4 clicks
- The circular button is visually distinct and clearly affordance-communicating

---

## 9. Required Fixes

None.

---

## 10. Suggestions (Non-blocking)

1. **Hover screenshot** was not capturable via Glass browser `browser_hover` (it triggered the sidebar toggle). A Playwright test should assert `hover:bg-accent` activates correctly. The CSS class is in place; this is a tooling limitation, not a bug.
