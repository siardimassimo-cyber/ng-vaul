# ng-vaule — Product Requirements Document

> Date: 2026-03-22 | Status: Draft

---

## 1. Product Overview & Goals

### What is ng-vaule?

**ng-vaule** is an Angular component library that ports the popular React [Vaul](https://github.com/emilkowalski/vaul) drawer into the Angular ecosystem. It provides a gesture-driven, accessible drawer/modal component designed for modern web applications, with a strong focus on mobile and tablet experiences.

### Why it exists

The React ecosystem has Vaul; Angular developers lack an equivalent. ng-vaule fills this gap with idiomatic Angular patterns: standalone components, signals-based state, `OnPush` change detection, and WCAG AA accessibility.

### Goals

| #   | Goal                                                   | Success Metric                          |
| --- | ------------------------------------------------------ | --------------------------------------- |
| G1  | Drop-in drawer component usable in any Angular 17+ app | Works without NgModule setup            |
| G2  | Smooth drag-to-dismiss & snap-point gesture support    | 60 fps on mid-range mobile devices      |
| G3  | Full WCAG AA accessibility                             | Zero AXE violations in automated checks |
| G4  | Support all four directions (bottom, top, left, right) | All directions pass E2E tests           |
| G5  | Support multiple simultaneous drawers (nested)         | Nested drawer demo works correctly      |
| G6  | Zero runtime `any`/`@ts-ignore` in production code     | TypeScript strict mode, no suppressions |

### Non-Goals (v1)

- Server-side rendering (SSR) support
- Vue/React wrappers
- Imperative `DrawerService.open()` API (declarative `[open]` binding is sufficient)
- Animation theming engine (CSS custom properties are sufficient)

---

## 2. Core Features & Acceptance Criteria

### F1 — Drawer Component (`vaul-drawer`)

The primary container that slides into view from any edge of the viewport.

| AC    | Criterion                                                                                                             |
| ----- | --------------------------------------------------------------------------------------------------------------------- |
| F1.1  | Renders as an accessible `role="dialog"` with `aria-modal="true"` and a descriptive `aria-label` or `aria-labelledby` |
| F1.2  | Accepts `open` (boolean signal/input) and emits `openChange` when state changes                                       |
| F1.3  | Supports `direction` values: `bottom` (default), `top`, `left`, `right`                                               |
| F1.4  | Closes on Escape key press when `dismissible` is `true`                                                               |
| F1.5  | Returns focus to the trigger element on close                                                                         |
| F1.6  | Traps focus within the open drawer                                                                                    |
| F1.7  | Renders backdrop overlay when `modal` is `true`                                                                       |
| F1.8  | Scales the background element when `shouldScaleBackground` is `true`                                                  |
| F1.9  | Supports `nested` mode for drawers inside drawers                                                                     |
| F1.10 | Does not close on overlay click when `dismissible` is `false`                                                         |

### F2 — Snap Points

Snap points let the drawer rest at predefined positions rather than fully open or fully closed.

| AC   | Criterion                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| F2.1 | Accepts `snapPoints` as an array of numbers (0–1 fraction of viewport) or CSS pixel strings (e.g. `"400px"`) |
| F2.2 | Emits `activeSnapPointChange` when the active snap point changes                                             |
| F2.3 | Snaps to the nearest point on drag release (respects velocity)                                               |
| F2.4 | `snapToSequentialPoint` mode forces stepping one snap point at a time                                        |
| F2.5 | `fadeFromIndex` controls which snap points fade the overlay                                                  |
| F2.6 | Initial position matches the first snap point when provided                                                  |

### F3 — Drag Handle (`vaul-handle`)

A visible grab region that affords drag interaction.

| AC   | Criterion                                                                   |
| ---- | --------------------------------------------------------------------------- |
| F3.1 | Renders a visually identifiable 32×4 px pill by default                     |
| F3.2 | Has `role="presentation"` and is hidden from screen readers when `disabled` |
| F3.3 | Pointer events initiate drag on the parent drawer                           |
| F3.4 | Works for all four `direction` orientations (rotates cursor affordance)     |

### F4 — Overlay (`vaul-overlay`)

The semi-transparent backdrop shown behind an open drawer.

| AC   | Criterion                                                           |
| ---- | ------------------------------------------------------------------- |
| F4.1 | Fades in/out on drawer open/close                                   |
| F4.2 | Clicking the overlay closes the drawer when `dismissible` is `true` |
| F4.3 | Has `aria-hidden="true"` so screen readers skip it                  |
| F4.4 | Opacity scales proportionally during drag                           |

### F5 — Animations & Performance

| AC   | Criterion                                                                      |
| ---- | ------------------------------------------------------------------------------ |
| F5.1 | Open/close uses CSS transforms (not `top`/`left`) for GPU-composited animation |
| F5.2 | Spring animation on release (configurable damping/stiffness)                   |
| F5.3 | Respects `prefers-reduced-motion` — switches to instant show/hide              |
| F5.4 | Prevents body scroll while drawer is open                                      |

### F6 — Developer API

| AC   | Criterion                                                |
| ---- | -------------------------------------------------------- |
| F6.1 | All public inputs have JSDoc comments                    |
| F6.2 | The library exports a single barrel `index.ts`           |
| F6.3 | No peer dependency beyond `@angular/core` ≥ 17           |
| F6.4 | Works with `ChangeDetectionStrategy.OnPush` in host apps |

---

## 3. User Flows & Validation Rules

### UF1 — Basic Open/Close

```
User taps trigger button
  → [open] input set to true
  → Drawer animates in from configured direction
  → Overlay appears (if modal=true)
  → Focus moves to first focusable element inside drawer

User taps overlay OR presses Escape
  → [openChange] emits false
  → Drawer animates out
  → Overlay fades
  → Focus returns to trigger button
```

**Validation rules:**

- `open` must be a boolean; non-boolean values are treated as falsy.
- If no focusable element exists inside the drawer, focus falls back to the drawer root (`tabindex="-1"`).

### UF2 — Drag to Dismiss

```
User places finger/pointer on handle or drawer body
  → isDragging = true
  → Drawer follows pointer position (clamped to valid range)

User releases pointer
  IF velocity > threshold OR drag distance > 50% of drawer size
    → Drawer closes (openChange emits false)
  ELSE
    → Drawer snaps back to open position
```

**Validation rules:**

- Velocity threshold: `VELOCITY_THRESHOLD = 0.4` (px/ms).
- Drag is cancelled if initiated on an interactive element (input, button, select, textarea, `[contenteditable]`).
- Drag on a scrollable child only starts when the child is scrolled to its boundary.

### UF3 — Snap Point Navigation

```
User drags drawer partially
  → Nearest snap point is calculated in real time
  → On release, drawer snaps to nearest point (or next sequential point)

activeSnapPoint updates
  → Overlay opacity interpolates between snapPoints[fadeFromIndex] and full opacity
```

**Validation rules:**

- Snap points must be in ascending order (0 → 1).
- A snap point of `1` means fully open; `0` means closed.
- Pixel snap points (`"400px"`) are converted to fractions at runtime based on viewport size; they must be re-calculated on `window.resize`.
- If `snapPoints` array is empty, snap-point logic is skipped entirely.

### UF4 — Nested Drawers

```
Parent drawer is open
  → User triggers child drawer (nested=true on child)
  → Child drawer opens inside parent
  → Pointer/keyboard events are scoped to child
  → Closing child returns control to parent
```

**Validation rules:**

- The parent drawer must NOT close when the child's overlay is tapped.
- Only one `nested` drawer can be open at a time within a parent.

### UF5 — Keyboard Navigation

| Key                         | Behaviour                                              |
| --------------------------- | ------------------------------------------------------ |
| `Escape`                    | Close drawer (if `dismissible=true`)                   |
| `Tab`                       | Cycle through focusable elements inside drawer (wraps) |
| `Shift+Tab`                 | Cycle backwards                                        |
| `Enter` / `Space` on handle | Toggle open/close                                      |

---

## 4. Technical Context

### Stack

| Layer        | Choice                                           | Notes                                                    |
| ------------ | ------------------------------------------------ | -------------------------------------------------------- |
| Framework    | Angular 21+                                      | Standalone components, no NgModule                       |
| Language     | TypeScript 5.x, strict mode                      | No `any`, no `@ts-ignore` in production                  |
| State        | Angular Signals (`signal`, `computed`, `effect`) | **Migration required** — currently RxJS BehaviorSubjects |
| Tests (unit) | Vitest                                           | `vitest.config.ts` present                               |
| Tests (E2E)  | Playwright                                       | `e2e/drawer.spec.ts`, `playwright.config.ts`             |
| Build        | Angular CLI + esbuild                            | `angular.json`                                           |
| Styling      | Component-scoped CSS                             | No utility framework                                     |

### Architecture

```
AppComponent (demo shell)
├── ControlCenterComponent       # Demo trigger + wrapper
│   └── ControlsComponent        # Direction / snap-point picker
└── DrawerComponent (vaul-drawer)
    ├── OverlayComponent (vaul-overlay)
    └── HandleComponent (vaul-handle)

Services (all providedIn: 'root')
├── DrawerService                # Core drag logic + state ⚠️ needs refactor
├── PreventScrollService         # Body scroll lock
├── PositionFixedService         # Handle position:fixed elements during open
└── ScaleBackgroundService       # Background scale animation
```

### Known Technical Debt (ordered by priority)

| Priority    | Issue                                                                                       | Location                                         | Recommended Fix                                              |
| ----------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| 🔴 Critical | `DrawerService` is `providedIn: 'root'` but stores per-instance state → only 1 drawer works | `drawer.service.ts`                              | Change to component-level provider or inject via token       |
| 🔴 Critical | 20+ `BehaviorSubject`s instead of Angular Signals                                           | `drawer.service.ts`                              | Migrate to `signal()` / `computed()`                         |
| 🔴 Critical | Direct DOM manipulation in services (`element.style.xxx`)                                   | `drawer.service.ts`, `position-fixed.service.ts` | Use `Renderer2` or CSS custom properties                     |
| 🟠 High     | `@ts-ignore` and untyped `any` in several files                                             | Multiple                                         | Remove, fix types                                            |
| 🟠 High     | `MutationObserver` in `PositionFixedService` never disconnected                             | `position-fixed.service.ts`                      | Disconnect in `DestroyRef` / `OnDestroy`                     |
| 🟠 High     | Duplicate `isInput()` defined in helpers AND prevent-scroll                                 | `helpers.ts`, `prevent-scroll.service.ts`        | Keep single canonical version in `helpers.ts`                |
| 🟠 High     | Missing ARIA: no `aria-label`, no focus trap, no `aria-modal`                               | `drawer.component.ts`                            | Add focus-trap directive + ARIA attributes                   |
| 🟡 Medium   | Typo: `initialDrawerHeightorWidth`                                                          | `drawer.component.ts:123`                        | Rename to `initialDrawerHeightOrWidth`                       |
| 🟡 Medium   | Inconsistent selectors: `vaul-*` vs `app-*`                                                 | Controls components                              | Rename demo components to `app-*`; keep `vaul-*` for library |
| 🟡 Medium   | No `overlay.component.spec.ts` or `handle.component.spec.ts`                                | —                                                | Add missing unit tests                                       |
| 🟡 Medium   | `SnapPoint = number \| string` is too permissive                                            | `types.ts`                                       | Use `number \| \`${number}px\`` template literal type        |

### File Map

```
src/app/
├── app.component.ts              # Root demo shell
├── app.config.ts                 # provideRouter, provideHttpClient
├── app.routes.ts                 # Empty (library has no routes)
├── types.ts                      # DrawerDirectionType, SnapPoint
├── drawer.component.ts           # <vaul-drawer>
├── overlay.component.ts          # <vaul-overlay>
├── handle.component.ts           # <vaul-handle>
├── controls.component.ts         # Demo direction/snap picker
├── control-center.component.ts   # Demo wrapper
└── services/
    ├── drawer.service.ts         # 672-line core service ⚠️
    ├── prevent-scroll.service.ts
    ├── position-fixed.service.ts
    ├── scale-background.service.ts
    ├── helpers.ts                # Utility functions
    ├── constants.ts              # Numeric thresholds
    └── browser.ts                # isIOS, isMobileFirefox

e2e/
└── drawer.spec.ts                # Playwright E2E
```

### Constants Reference

```typescript
VELOCITY_THRESHOLD = 0.4; // px/ms — minimum velocity to dismiss
CLOSE_THRESHOLD = 0.25; // fraction of size — drag distance to dismiss
SCROLL_LOCK_TIMEOUT = 100; // ms — debounce for scroll lock
DRAG_CLASS = 'vaul-dragging'; // CSS class added during drag
TRANSITIONS_PROPERTY = '--vaul-transitions';
WINDOW_TOP_OFFSET = 26; // px — gap at top when fully open (bottom drawer)
BORDER_RADIUS_PROPERTY = '--vaul-border-radius';
```
