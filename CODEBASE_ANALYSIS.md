# Angular Codebase Analysis & Improvement Recommendations

**Date:** March 28, 2026
**Project:** ng-vaule (Angular 21)
**Analyzer:** Claude Code (Refreshed Analysis)

---

## Executive Summary

This Angular 21 repository implements a drawer component library. Since the [previous analysis (Feb 27, 2026)](CODEBASE_ANALYSIS.md), several improvements have been made — standalone components are now correctly configured (no explicit `standalone: true`, matching Angular v20+ defaults), `@HostListener` was replaced with the `host` object, `@ViewChild` decorators were partially removed, and the overlay uses a semantic `<button>` instead of a bare `<div>`. However, **significant issues remain** in service architecture, type safety, lifecycle management, and testing coverage.

### Overall Health Score: ⚠️ 52/100 (was 42)

| Category             | Score | Δ vs Feb | Status         |
| -------------------- | ----- | -------- | -------------- |
| Component Design     | 6/10  | +2       | ⚠️ Improved    |
| Service Architecture | 3/10  | —        | ❌ Monolithic  |
| Accessibility        | 5/10  | +3       | ⚠️ Partial     |
| Type Safety          | 4/10  | -1       | ❌ Needs Work  |
| Testing              | 5/10  | +1       | ⚠️ Gaps Remain |
| Build Config         | 7/10  | —        | ✅ Good        |

---

## What Improved Since Last Analysis

| Item                  | Before (Feb)                                       | Now (Mar)                                                                    |
| --------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Standalone components | `standalone: true` explicitly set (wrong for v20+) | Correctly omitted — default                                                  |
| `@HostListener`       | Used in drawer                                     | Replaced with `host` object in `@Component`                                  |
| Overlay element       | `<div>` — inaccessible                             | `<button>` with `aria-label`, `aria-hidden`                                  |
| Drawer ARIA           | Missing `aria-modal`, `aria-label`                 | Present: `role="dialog"`, `aria-modal="true"`, `aria-label`                  |
| Escape key            | Not handled                                        | Handled in `AppComponent.ngOnInit` via `DestroyRef` cleanup                  |
| Focus management      | None                                               | `effect()` moves focus to close button on open, restores to trigger on close |
| `DestroyRef` usage    | Not used                                           | Used in `AppComponent` and `DrawerComponent` (`takeUntilDestroyed`)          |
| Dismissible control   | Not present                                        | Overlay click + Escape respect `dismissible` flag                            |
| Snap navigation       | Not present                                        | `goToAdjacentSnap()` for keyboard/a11y use                                   |


### 2. Service Performs Direct DOM Manipulation

**Severity:** CRITICAL
**Impact:** Breaks Angular patterns, hard to test, SSR-incompatible

**File:** `src/app/services/drawer.service.ts`

The service directly reads and writes DOM properties:

```typescript
// Line 81: Direct style mutation
drawer.style.transform = isVertical(direction) ? `translateY(${height}px)` : ...;

// Line 102: Disabling transitions
drawer.style.transition = 'none';

// Line 362: Global document query from service
const wrapper = document.querySelector('[data-vaul-drawer-wrapper]');

// Line 480: window.getSelection() in service
const highlightedText = window.getSelection()?.toString();

// Line 656: window.getComputedStyle in service
const style = window.getComputedStyle(element);
```

**Also in other services:**

- `prevent-scroll.service.ts`: `document.documentElement.style`, `document.body.style`, `window.scrollTo`
- `position-fixed.service.ts`: `document.body.style`, `window.scrollTo`, `MutationObserver`
- `scale-background.service.ts`: `document.body.style.backgroundColor`

**Fix:** Move DOM reads/writes to directives or components using `Renderer2` and `ElementRef`. Services should manage state only.

---

### 3. Type Safety Violations

**Severity:** HIGH
**Impact:** Runtime errors, poor DX, silent failures

#### 3.1 `@ts-ignore` usage (3 occurrences)

| File                         | Line | Context                                         |
| ---------------------------- | ---- | ----------------------------------------------- |
| `services/drawer.service.ts` | 658  | `style.webkitTransform \|\| style.mozTransform` |
| `services/helpers.ts`        | 62   | Same vendor-prefix transform access             |
| `services/helpers.ts`        | 96   | `fn(...args)` in generic `chain()`              |

**Fix:**

```typescript
interface VendorCSSStyleDeclaration extends CSSStyleDeclaration {
  webkitTransform?: string;
  mozTransform?: string;
}
const style = window.getComputedStyle(element) as VendorCSSStyleDeclaration;
const transform = style.transform || style.webkitTransform || style.mozTransform;
```

#### 3.2 `any` type usage

| File                        | Line(s)          | Usage                                     |
| --------------------------- | ---------------- | ----------------------------------------- |
| `types.ts`                  | 10               | `AnyFunction = (...args: any) => any`     |
| `helpers.ts`                | 30-31            | `(el.style as any)[key]` (×4 occurrences) |
| `helpers.ts`                | 48               | `(el.style as any)[prop]`                 |
| `prevent-scroll.service.ts` | 244-247          | `element.style[style as any]` (×3)        |
| `drawer.service.spec.ts`    | 49, 67, 79, etc. | `as any` for mocks (×12)                  |

**Fix for `helpers.ts`:**

```typescript
export function set(el: Element | HTMLElement | null | undefined, styles: Record<string, string>, ignoreCache = false) {
  if (!el || !(el instanceof HTMLElement)) return;
  const originalStyles: Record<string, string> = {};
  for (const [key, value] of Object.entries(styles)) {
    if (key.startsWith('--')) {
      el.style.setProperty(key, value);
    } else {
      originalStyles[key] = el.style.getPropertyValue(key);
      el.style.setProperty(key, value);
    }
  }
  if (!ignoreCache) cache.set(el, originalStyles);
}
```

#### 3.3 Loose `SnapPoint` type

**File:** `types.ts` (Line 8)

```typescript
type SnapPoint = number | string; // "string" is too broad
```

**Fix:**

```typescript
type SnapPointPixels = `${number}px`;
type SnapPoint = number | SnapPointPixels;
```

---

## 🟠 High Priority Issues

### 4. Legacy `@ViewChild` Decorator (2 remaining)

**Severity:** HIGH
**Impact:** Inconsistent with the rest of the codebase that uses `viewChild()`

| File                   | Line | Current                                                               |
| ---------------------- | ---- | --------------------------------------------------------------------- |
| `handle.component.ts`  | 66   | `@ViewChild('handleRef') handleRef!: ElementRef<HTMLDivElement>`      |
| `overlay.component.ts` | 70   | `@ViewChild('overlayRef') overlayRef!: ElementRef<HTMLButtonElement>` |

`DrawerComponent` already uses `viewChild()` (line 122). These two should be migrated to match.

**Fix:**

```typescript
readonly handleRef = viewChild.required<ElementRef<HTMLDivElement>>('handleRef');
```

---

### 5. Dead/Unused `Subject` Cleanup Pattern

**Severity:** HIGH
**Impact:** Confusing code, false sense of cleanup

| File                   | Issue                                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `handle.component.ts`  | `destroy$` Subject created (line 58), completed in `ngOnDestroy` (line 109-111), but **nothing subscribes with `takeUntil(destroy$)`** |
| `overlay.component.ts` | Same: `destroy$` created (line 65), completed (lines 78-81), **never used**                                                            |

Both implement `OnDestroy` solely for this dead pattern.

**Fix:** Remove `destroy$`, `OnDestroy`, and the `ngOnDestroy` methods entirely — or replace with `DestroyRef` if needed in the future.

---

### 6. Incomplete Lifecycle Cleanup

**Severity:** HIGH
**Impact:** Memory leaks

#### 6.1 Missing `visualViewport` event listener cleanup

**File:** `drawer.component.ts` (Line 303)

```typescript
window.visualViewport.addEventListener('resize', this.onVisualViewportChange.bind(this));
// ❌ Never removed — leaks on component destruction
```

**Fix:** Store the bound handler and remove in `ngOnDestroy` or use `DestroyRef`.

#### 6.2 Services implement `ngOnDestroy` without `implements OnDestroy`

| File                          | Has `ngOnDestroy` | Has `implements OnDestroy` |
| ----------------------------- | ----------------- | -------------------------- |
| `drawer.service.ts`           | ✅ (line 675)     | ❌                         |
| `prevent-scroll.service.ts`   | ✅ (line 96)      | ❌                         |
| `position-fixed.service.ts`   | ✅ (line 137)     | ❌                         |
| `scale-background.service.ts` | ✅ (line 23)      | ❌                         |

While Angular calls `ngOnDestroy` regardless, the missing interface is a correctness/readability concern. Also: root-provided services are only destroyed when the injector is torn down (app shutdown), so these cleanup methods rarely fire in practice.

#### 6.3 `afterNextRender` does not return cleanup

**File:** `drawer.component.ts` (Lines 154-233)

The `afterNextRender` block sets up a `combineLatest` subscription and iOS scroll prevention, but the overall block does not return a cleanup function. The inner `subscribe` returns a cleanup function only for the scaling branch, but the outer `afterNextRender` itself does not propagate it.

---

### 7. Accessibility Gaps Remaining

**Severity:** HIGH

While several a11y issues were fixed, these remain:

| Issue                        | Status                  | Detail                                                                                                                                                                                       |
| ---------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focus trap                   | ❌ Missing              | No focus trap inside the drawer when open. Tab can escape to background content.                                                                                                             |
| Handle `aria-hidden="true"`  | ⚠️ Correct but limiting | The handle is decorative (pointer-only). Keyboard users have no drag equivalent via the handle itself. `goToAdjacentSnap` partially compensates.                                             |
| `aria-labelledby` on dialog  | ❌ Missing              | Dialog has `aria-label="Drawer panel"` but no `aria-labelledby` pointing to a visible heading. The heading inside (`<h2>Drawer Example</h2>`) is in projected content, not connected via ID. |
| Color contrast               | ⚠️ Unchecked            | `#666` text on white background (4.48:1) passes AA for normal text but fails AAA. Some button styles may not meet contrast requirements.                                                     |
| Live region for snap changes | ❌ Missing              | When snap point changes, no `aria-live` announcement is made.                                                                                                                                |
| Screen reader flow           | ⚠️ Partial              | Overlay button has `aria-label="Close drawer overlay"` but when drawer is closed, `aria-hidden="true"` is set — good.                                                                        |

---

### 8. Duplicate Code

**Severity:** MEDIUM
**Impact:** Maintenance burden, inconsistency risk

| Duplicate               | Location 1                        | Location 2                       |
| ----------------------- | --------------------------------- | -------------------------------- |
| `getTranslate()`        | `drawer.service.ts:652` (private) | `helpers.ts:56` (exported)       |
| `getScale()`            | `drawer.service.ts:576`           | `scale-background.service.ts:19` |
| `isInput()`             | `helpers.ts:103`                  | `prevent-scroll.service.ts:122`  |
| `nonTextInputTypes` set | `helpers.ts:9`                    | `prevent-scroll.service.ts:10`   |
| `chain()` utility       | `helpers.ts:92`                   | `prevent-scroll.service.ts:263`  |

**Fix:** Consolidate into `helpers.ts` and import from there.

---

## 🟡 Medium Priority Issues

### 9. Template-Driven Form in Controls

**Severity:** MEDIUM
**File:** `controls.component.ts` (Line 86)

```html
<input [(ngModel)]="newPointValue" ... />
```

Uses `FormsModule` with `ngModel`. The project rules require reactive forms.

**Fix:** Replace with `FormControl` from `ReactiveFormsModule`.

---

### 10. Inconsistent Component Selectors

**Severity:** MEDIUM

| Component                | Selector             |
| ------------------------ | -------------------- |
| `DrawerComponent`        | `vaul-drawer`        |
| `OverlayComponent`       | `vaul-overlay`       |
| `HandleComponent`        | `vaul-handle`        |
| `ControlsComponent`      | `app-controls`       |
| `ControlCenterComponent` | `app-control-center` |

Library components use `vaul-` prefix; demo/host components use `app-`. This is acceptable if the library boundary is clear, but currently all live in `src/app/` with no separation.

---

### 11. `DrawerComponent` Mixed Concerns

**Severity:** MEDIUM
**File:** `drawer.component.ts` (407 lines)

The component handles:

- Pointer event routing
- Visual viewport keyboard adjustments
- iOS scroll prevention coordination
- Scale background animation
- Direction-based transform calculation
- Drag delta threshold logic

Some of this belongs in the service layer or in dedicated directives.

---

### 12. Unused Imports and Dead Code

**Severity:** LOW

| File                              | Issue                                                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `scale-background.service.ts`     | Imports `inject`, `combineLatest`, `takeUntil`, `chain`, `DrawerService`, `assignStyle`, `BORDER_RADIUS`, `TRANSITIONS` — **none used** |
| `drawer.component.ts:222-223`     | Dead `preventScrollCount` logic: always increments to 1, the `if (preventScrollCount === 1)` always runs                                |
| `app.config.ts` / `app.routes.ts` | Defined but not used in `main.ts` bootstrap                                                                                             |
| `drawer.service.ts:20`            | Comment `// Excerpt from: class DrawerService` — leftover                                                                               |
| `drawer.service.ts:65-72`         | `drawerTransform$` observable — defined but never subscribed                                                                            |

---

## 📊 Code Metrics

### Current State

| Metric                       | Value                                                                               | Target | Status |
| ---------------------------- | ----------------------------------------------------------------------------------- | ------ | ------ |
| **Total Source Files**       | 18                                                                                  | —      | —      |
| **Standalone Components**    | 6/6 (100%)                                                                          | 100%   | ✅     |
| **No `standalone: true`**    | 6/6 (100%)                                                                          | 100%   | ✅     |
| **OnPush Components**        | 6/6 (100%)                                                                          | 100%   | ✅     |
| **Components using Signals** | 6/6 (100%)                                                                          | 100%   | ✅     |
| **`inject()` usage**         | 4/6 components                                                                      | 100%   | ⚠️     |
| **`@ViewChild` remaining**   | 2                                                                                   | 0      | ❌     |
| **`@ts-ignore` count**       | 3                                                                                   | 0      | ❌     |
| **`as any` count**           | ~20                                                                                 | 0      | ❌     |
| **Service LoC (largest)**    | 693                                                                                 | <200   | ❌     |
| **Component LoC (largest)**  | 407                                                                                 | <200   | ⚠️     |
| **Spec files**               | 5                                                                                   | 10+    | ❌     |
| **Missing specs**            | handle, overlay, prevent-scroll, position-fixed, scale-background, helpers, browser | —      | ❌     |
| **E2E tests**                | 1 file                                                                              | —      | ⚠️     |
| **Estimated test coverage**  | ~35%                                                                                | >80%   | ❌     |
| **Accessibility score**      | ~50%                                                                                | >90%   | ❌     |

### Architecture Health

```
Component Design:     ██████████████░░░░░░  6/10
Service Architecture: ██████░░░░░░░░░░░░░░  3/10
Accessibility:       ██████████░░░░░░░░░░  5/10
Type Safety:         ████████░░░░░░░░░░░░  4/10
Testing:            ██████████░░░░░░░░░░  5/10
Build Config:       ██████████████░░░░░░  7/10
──────────────────────────────────────────
Overall Score:       █████████████████░░░  52/100
```

---

## 📋 File-by-File Summary

### Components

| File                          | Lines |                            Signals                             | OnPush | `inject()` |  `@ViewChild`   |         Dead code         | Tests |
| ----------------------------- | ----: | :------------------------------------------------------------: | :----: | :--------: | :-------------: | :-----------------------: | :---: |
| `app.component.ts`            |   243 |               ✅ `signal`, `effect`, `toSignal`                |   ✅   |     ✅     |        —        |             —             |  ❌   |
| `drawer.component.ts`         |   407 | ✅ `input`, `output`, `model`, `signal`, `viewChild`, `effect` |   ✅   |     ✅     |        —        | Dead `preventScrollCount` |  ✅   |
| `handle.component.ts`         |   113 |                           ✅ `input`                           |   ✅   |     ✅     | ❌ `@ViewChild` |      Dead `destroy$`      |  ❌   |
| `overlay.component.ts`        |    93 |                           ✅ `input`                           |   ✅   |     ✅     | ❌ `@ViewChild` |      Dead `destroy$`      |  ❌   |
| `controls.component.ts`       |   339 |                 ✅ `input`, `output`, `signal`                 |   ✅   | — (no DI)  |        —        |             —             |  ✅   |
| `control-center.component.ts` |    91 |                      ✅ `input`, `output`                      |   ✅   | — (no DI)  |        —        |             —             |  ✅   |

### Services

| File                          | Lines |     `inject()`      | `providedIn: 'root'` | DOM manipulation | Dead `destroy$` | `ngOnDestroy` w/o interface | Tests |
| ----------------------------- | ----: | :-----------------: | :------------------: | :--------------: | :-------------: | :-------------------------: | :---: |
| `drawer.service.ts`           |   693 |     ❌ (no DI)      |          ✅          |     ✅ Heavy     |     ✅ Used     |             ✅              |  ✅   |
| `prevent-scroll.service.ts`   |   271 |         ✅          |          ✅          |     ✅ Heavy     |     ✅ Used     |             ✅              |  ❌   |
| `position-fixed.service.ts`   |   141 |         ✅          |          ✅          |     ✅ Heavy     |     ✅ Used     |             ✅              |  ❌   |
| `scale-background.service.ts` |    31 | ❌ (unused imports) |          ✅          |     Minimal      |     ✅ Used     |             ✅              |  ❌   |

### Utilities

| File           | Lines | `@ts-ignore` |    `any` usage    |                    Duplicated logic                     |
| -------------- | ----: | :----------: | :---------------: | :-----------------------------------------------------: |
| `helpers.ts`   |   113 |      2       |         6         | `getTranslate`, `isInput`, `nonTextInputTypes`, `chain` |
| `types.ts`     |    10 |      —       | 1 (`AnyFunction`) |                            —                            |
| `constants.ts` |    15 |      —       |         —         |                            —                            |
| `browser.ts`   |    36 |      —       |         —         |                            —                            |

---

## 🎯 Improvement Roadmap

### Phase 1: Quick Wins (1–2 days)

| #   | Task                                                                 | Est.   | Files |
| --- | -------------------------------------------------------------------- | ------ | ----- |
| 1   | Replace `@ViewChild` with `viewChild()` in handle + overlay          | 15 min | 2     |
| 2   | Remove dead `destroy$` + `OnDestroy` from handle + overlay           | 10 min | 2     |
| 3   | Remove all `@ts-ignore` — properly type vendor CSS                   | 20 min | 2     |
| 4   | Fix `visualViewport` listener leak (store + remove in `ngOnDestroy`) | 10 min | 1     |
| 5   | Remove dead `preventScrollCount` logic in drawer component           | 5 min  | 1     |
| 6   | Clean up unused imports in `scale-background.service.ts`             | 5 min  | 1     |
| 7   | Add `implements OnDestroy` to all services that have `ngOnDestroy`   | 5 min  | 4     |
| 8   | Replace `ngModel` with reactive `FormControl` in controls            | 15 min | 1     |
| 9   | Tighten `SnapPoint` type from `string` to `` `${number}px` ``        | 10 min | 1     |
| 10  | Consolidate duplicate `getTranslate`, `isInput`, `chain`             | 20 min | 3     |

### Phase 2: Architecture (1–2 weeks)

| #   | Task                                                                    | Est.   | Impact |
| --- | ----------------------------------------------------------------------- | ------ | ------ |
| 11  | Split `DrawerService` into state/drag/snap/dom services                 | 2 days | HIGH   |
| 12  | Move DOM manipulation from services to directives                       | 2 days | HIGH   |
| 13  | Extract viewport/keyboard handling from `DrawerComponent`               | 1 day  | MEDIUM |
| 14  | Convert remaining `BehaviorSubject`s to signals where appropriate       | 1 day  | MEDIUM |
| 15  | Remove `document` / `window` direct access; inject via `DOCUMENT` token | 1 day  | MEDIUM |

### Phase 3: Accessibility (3–5 days)

| #   | Task                                                         | Est.    | WCAG  |
| --- | ------------------------------------------------------------ | ------- | ----- |
| 16  | Implement focus trap (trap Tab/Shift+Tab inside open drawer) | 1 day   | 2.4.3 |
| 17  | Connect dialog `aria-labelledby` to projected heading        | 0.5 day | 4.1.2 |
| 18  | Add `aria-live` region for snap point changes                | 0.5 day | 4.1.3 |
| 19  | Verify color contrast for all interactive elements           | 0.5 day | 1.4.3 |
| 20  | Test with VoiceOver and NVDA                                 | 1 day   | —     |

### Phase 4: Testing (1–2 weeks)

| #   | Task                                                        | Est.    |
| --- | ----------------------------------------------------------- | ------- |
| 21  | Add `handle.component.spec.ts`                              | 0.5 day |
| 22  | Add `overlay.component.spec.ts`                             | 0.5 day |
| 23  | Add `app.component.spec.ts`                                 | 0.5 day |
| 24  | Add `prevent-scroll.service.spec.ts`                        | 0.5 day |
| 25  | Add `position-fixed.service.spec.ts`                        | 0.5 day |
| 26  | Add `helpers.spec.ts` and `browser.spec.ts`                 | 0.5 day |
| 27  | Add a11y-specific tests (focus trap, keyboard nav, ARIA)    | 1 day   |
| 28  | Add drag interaction integration tests                      | 1 day   |
| 29  | Remove `as any` from existing test mocks — use proper types | 1 day   |
| 30  | Target: >80% coverage                                       | —       |

---

## 📚 What's Already Good

✅ **Modern Angular APIs:** `signal()`, `input()`, `output()`, `model()`, `computed()`, `viewChild()`, `effect()`, `toSignal()`
✅ **All components use `ChangeDetectionStrategy.OnPush`**
✅ **No `standalone: true` in decorators** (correct for Angular v20+)
✅ **No `@HostBinding` / `@HostListener`** — uses `host` object
✅ **No `*ngIf` / `*ngFor`** — uses `@if` / `@for` native control flow
✅ **No `ngClass` / `ngStyle`**
✅ **`inject()` used in most components**
✅ **`DestroyRef` used in `AppComponent` and `DrawerComponent`**
✅ **Strict TypeScript config** with template and injection parameter strictness
✅ **Vitest for unit tests** (modern, fast)
✅ **Playwright for E2E tests**
✅ **Escape key handling with proper cleanup**
✅ **Focus management on open/close** (effect-based)
✅ **Dismissible flag** controlling overlay click and Escape

---

**Report Generated By:** Claude Code
**Analysis Date:** March 28, 2026
**Angular Version:** 21.1.1
**Previous Analysis:** February 27, 2026 (Score: 42/100)
**Current Score:** 52/100 (+10 improvement)
**Recommendation:** Execute Phase 1 quick wins immediately, then prioritize Phase 2 service refactoring
