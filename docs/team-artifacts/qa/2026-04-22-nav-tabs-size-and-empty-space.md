# QA Report — NavTabs Size Changes + Empty Space Investigation

**Date:** 2026-04-22  
**Feature:** NavTabs — larger font/icon sizes + PreflightResumeBanner wrapper gap diagnosis  
**Component:** `src/lib/components/nav-tabs.svelte`, `src/routes/(app)/formations/[id]/+layout.svelte`  
**Tester:** qa-tester (Marie persona)

---

## 1. Verdict

**PASS** (size changes) + **BUG IDENTIFIED** (empty space — root cause found)

---

## 2. Visual Changes — Results

| Change | Expected | Measured/Observed | Result |
|--------|----------|-------------------|--------|
| Remove `text-sm` (14px → 16px base) | Larger tab labels | Visible in screenshot: labels clearly larger | **PASS** |
| Tab icons: `size-4` → `size-[18px]` | Slightly larger icons | Visible in screenshot | **PASS** |
| Chevron arrows: `size-4` → `size-5` | 20px chevrons | Confirmed in source | **PASS** |
| Button: `size-8` → `size-9` (32→36px) | 36×36px circle | `browser_get_bounding_box` → **w=36, h=36** | **PASS** |
| Nav bar height with larger content | Taller bar | Was 38px → now **42px** (h=42) | **PASS** |

**Screenshot:** `page-2026-04-22T08-08-23-751Z.png` — shows larger tab text + circular 36px arrow at right edge.

---

## 3. Empty Space Investigation

### Measurements (all at current effective viewport)

| Element | x | w | Right edge |
|---------|---|---|------------|
| `<nav>` Formation sections | 82 | 841 | **x=923** |
| Right arrow button | 885 | 36 | **x=921** (2px `mr-0.5` gap) |
| Aperçu tab (leftmost) | 82 | 112 | x=194 |
| Combobox "Sélectionner le type" | 523 | 400 | **x=923** |
| HudBanner "Formateurs" button | 810 | 113 | **x=923** |

All content consistently ends at **x=923**. The nav (and its content children) spans exactly **841px**.

### Root Cause

The sticky header (`<div class="sticky top-0 z-40 bg-background">`) contains a flex row:

```svelte
<div class="flex min-w-0 items-center gap-2">
  <div class="min-w-0 flex-1">           <!-- NavTabs wrapper -->
    <NavTabs ... />
  </div>
  <div class="shrink-0 pr-4 pb-1">      <!-- ← ALWAYS IN DOM, ALWAYS 16px WIDE -->
    <PreflightResumeBanner />           <!-- renders nothing (no returnTo param) -->
  </div>
</div>
```

`PreflightResumeBanner` uses `{#if visible}...{/if}` and renders **zero DOM nodes** when `visible=false`. However, its **wrapper `<div class="shrink-0 pr-4 pb-1">`** is unconditionally rendered in `+layout.svelte`.

An empty div with only `padding-right: 16px` (pr-4) in a flex container:
- Has intrinsic width = **16px** (just its right padding)
- `shrink-0` prevents it from collapsing to 0

Combined with `gap-2` (8px):
- **24px** is permanently consumed to the right of the NavTabs flex-1 wrapper
- The NavTabs wrapper (`flex-1`) is **24px narrower** than the full sticky header width
- The sticky header's `bg-background` fills the extra 24px past `x=923`, appearing as an extension of the tab bar with no content

This creates:
1. **24px of whitespace** to the right of the right arrow button (x=921→947)
2. The `nav-tabs::after` border-bottom (`right: -1rem`) extends only 16px past the nav (to x=939), leaving an ~8px area with no bottom border but still with `bg-background` fill — a subtle visual "tear" at the right edge of the tab bar

### Diagram

```
x=82                                   x=923 x=939  x=947
|←————————— nav (841px) ————————————→| ←16→ |←8px→|
|←tabs────────────[gradient][btn(36)]|::after|      |
                              x=885 x=921   ↑      ↑
                                       border  sticky-header
                                       ends    ends (bg fills this)
                                              
"Empty space visible to user": x=921 → x=947 ≈ 26px after the button
```

### What Marie Sees

After the circular arrow button, there is ~26px of blank white background before the visible content edge, where the tab bar "looks like it continues but has nothing in it." The bottom border line ends 8px before the background, creating a subtle misalignment.

---

## 4. Recommended Fix

**Option A — Cleanest (conditional wrapper in layout):**

Move the wrapper div inside a Svelte conditional using a prop/slot that PreflightResumeBanner exposes, OR check the URL param at layout level:

```svelte
<!-- src/routes/(app)/formations/[id]/+layout.svelte -->
{#if page.url.searchParams.has('returnTo')}
  <div class="shrink-0 pr-4 pb-1">
    <PreflightResumeBanner />
  </div>
{/if}
```

**Option B — Self-contained (move wrapper into PreflightResumeBanner):**

Remove the wrapper div from `+layout.svelte` and have the component own its spacing:

```svelte
<!-- In +layout.svelte: -->
<PreflightResumeBanner />  <!-- no wrapper -->

<!-- In PreflightResumeBanner.svelte: -->
{#if visible}
  <div class="shrink-0 pr-4 pb-1">
    <div role="status" ...>...</div>
  </div>
{/if}
```

**Option C — Remove the right-padding from the always-rendered wrapper:**

If the wrapper must always be present for some reason, removing `pr-4` eliminates the 16px width (the div collapses to 0 when empty with only `pb-1` which doesn't affect width).

**Recommendation: Option B** — self-contained banner is cleaner, avoids the layout needing to know about the banner's visibility logic.

---

## 5. Screenshots

| State | File |
|-------|------|
| Current state — larger font/icons/buttons visible | `page-2026-04-22T08-08-23-751Z.png` |
| Previous session — initial load screenshot | `page-2026-04-22T07-56-32-277Z.png` |
