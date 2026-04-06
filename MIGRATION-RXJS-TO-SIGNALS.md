# RxJS → Signals Migration Plan

**Angular version:** 21.1.x  
**RxJS version:** 7.8.x (remains a transitive dep; direct usage is the target)

The codebase has already been largely migrated to Angular Signals. This plan covers the **remaining RxJS surface and anti-patterns** to fully remove direct RxJS imports and align all code with Angular 21 signal best practices.

---

## Reactivity Priority Rule

Before proposing any reactive primitive, follow this decision order:

```
computed()  →  linkedSignal()  →  effect() / afterRenderEffect()  →  afterNextRender()
```

> **Critical rule from Angular docs:** Never use `effect()` to sync one piece of signal state to another. That is an anti-pattern that causes `ExpressionChangedAfterItHasBeenChecked` errors and infinite loops. Always use `computed()` or `linkedSignal()` for state derivation. Reserve `effect()` for true side effects (DOM manipulation, analytics, `localStorage`, external APIs).

---

## Current State Audit

| File | Issue | Kind | Severity |
|---|---|---|---|
| `drawer.component.ts` | `import { noop } from 'rxjs'` | Direct RxJS import | 🔴 |
| `drawer.component.ts` | `DestroyRef` injected but **never used** | Dead code | 🟡 |
| `drawer.component.ts` | Two `effect()` calls that sync input signals into service signals | Anti-pattern effect | 🔴 |
| `overlay.component.ts` | `AfterViewInit` + `ngAfterViewInit()` for one-time DOM registration | Lifecycle hook replaceable | 🟡 |
| `controls.component.ts` | `FormsModule` + `[(ngModel)]` (template-driven form) | Indirect RxJS dep | 🟡 |
| `controls.component.ts` | `newPointValue` is a plain mutable class property | Not a signal | 🟡 |
| `controls.component.ts` | `error` is a plain `signal()` that must be manually reset on every input | `linkedSignal()` opportunity | 🟡 |
| `app.component.ts` | `OnInit` + `ngOnInit()` for keyboard listener setup | Replaceable lifecycle hook | 🟡 |
| `drawer-state.service.ts` | `stateChange = signal<void>(undefined)` — never set or consumed | Vestigial (was a `Subject`) | 🟡 |
| `drawer-state.service.ts` | Redundant `get*()` methods that just call the signal | Dead surface area | 🟢 |
| `drawer-state.service.ts` | `hasBeenOpened` manually tracked in `setIsOpen()` | `linkedSignal()` opportunity | 🟡 |

---

## Task 1 — Remove the `noop` RxJS import from `DrawerComponent`

**File:** `src/app/drawer.component.ts`

### Problem
`noop` is imported from `rxjs` solely as a no-op fallback inside a `chain()` call:

```ts
import { noop } from 'rxjs';

// Used only here:
chain(
  setBackgroundColor && !noBodyStyles
    ? assignStyle(document.body, { background: 'black' })
    : noop,
  ...
);
```

`noop` is just `() => {}`. The `chain()` utility accepts `AnyFunction`, so a plain arrow function is a direct drop-in with zero behaviour change.

### Action
1. Remove `import { noop } from 'rxjs'`.
2. Replace `: noop` with `: () => {}`.
3. While here, remove `DestroyRef` from the `@angular/core` import and remove the unused `private readonly destroyRef$ = inject(DestroyRef)` field (it is injected but never referenced anywhere in the class body).

### Result
Zero direct RxJS imports remain in the project source tree.

---

## Task 2 — Eliminate anti-pattern `effect()` calls that sync inputs to service state in `DrawerComponent`

**File:** `src/app/drawer.component.ts`

### Problem
Two `effect()` calls in the constructor propagate component input signals into the singleton `DrawerStateService`:

```ts
// ❌ Anti-pattern: effect() used to sync signal state to signal state
effect(() => {
  this.drawerService.setIsOpen(this.open());
});

effect(() => {
  this.drawerService.setDirection(this.direction());
  this.drawerService.setScaleBackground(this.shouldScaleBackground());
  this.drawerService.setModal(this.modal());
  this.drawerService.setNested(this.nested());
  this.drawerService.setSnapPoints(this.snapPoints());
  this.drawerService.setActiveSnapPoint(this.activeSnapPoint());
  this.drawerService.setFadeFromIndex(this.fadeFromIndex());
  this.drawerService.setSnapToSequentialPoint(this.snapToSequentialPoint());
});
```

This is the canonical anti-pattern: `effect()` used to keep two signals in sync.

### Root Cause
`DrawerStateService` is a **`providedIn: 'root'` singleton** holding state that is actually owned by the `DrawerComponent` instance. The component cannot pass its input signals as sources to a `linkedSignal()` in the service at service-construction time, so it resorts to `effect()` to bridge them.

### Action — Scope the service to the component

Change the service scope from `providedIn: 'root'` to being provided by `DrawerComponent` itself. This ties the service lifetime to the component instance and allows state to be derived at construction time.

**Step 1:** Remove `providedIn: 'root'` from `DrawerStateService` (and downstream services `DrawerDragService`, `DrawerSnapService`, `DrawerService`).

**Step 2:** Add `providers` to `DrawerComponent`'s decorator:

```ts
@Component({
  selector: 'vaul-drawer',
  providers: [DrawerStateService, DrawerDomService, DrawerSnapService, DrawerDragService, DrawerService],
  ...
})
```

**Step 3:** Convert `DrawerStateService` signals that mirror inputs into `linkedSignal()` driven by a source provided by the component. Because the service is now scoped to the component, the component can pass signals as `linkedSignal` sources directly in its constructor:

```ts
// In DrawerComponent constructor, after services are scoped:
this.drawerService.state.isOpen = linkedSignal(() => this.open());
this.drawerService.state.direction = linkedSignal(() => this.direction());
// etc.
```

Or, more cleanly, have the service expose an `init()` method that accepts the signal sources:

```ts
// DrawerStateService
init(sources: {
  open: Signal<boolean>;
  direction: Signal<DrawerDirectionType>;
  // ...
}) {
  this.isOpen = linkedSignal(() => sources.open());
  this.direction = linkedSignal(() => sources.direction());
  // ...
}
```

Called once from `DrawerComponent`'s constructor before any effects run.

**Step 4:** Remove the two anti-pattern `effect()` blocks from `DrawerComponent`.

> ⚠️ **Note:** This task has the largest blast radius — it touches all sub-services, mocks, and specs. Tackle it in isolation with a dedicated branch. After this task the redundant `set*()` methods in `DrawerStateService` (Task 6) become even easier to remove since the component never calls them via effect anymore.

---

## Task 3 — Replace `AfterViewInit` with `afterNextRender()` in `OverlayComponent`

**File:** `src/app/overlay.component.ts`

### Problem
The overlay DOM element is registered with the service inside `ngAfterViewInit`:

```ts
export class OverlayComponent implements AfterViewInit {
  overlayRef = viewChild<ElementRef<HTMLButtonElement>>('overlayRef');

  ngAfterViewInit() {
    const overlayRef = this.overlayRef();
    if (!overlayRef) return;
    this.drawerService.setOverlayRef(overlayRef.nativeElement);
  }
}
```

### Why not `effect()`?
The overlay `<button>` is always present in the template (no `@if`), so this registration happens exactly once. `effect()` would be wrong here — it creates ongoing reactive tracking for what is a one-time setup, and it runs **before** Angular updates the DOM, so the element may not yet be available.

### Why `afterNextRender()` instead of `effect()`
`afterNextRender()` fires once, after the first render, when the DOM element is guaranteed to exist. It is the idiomatic replacement for `ngAfterViewInit` for one-time post-render side effects.

### Action
1. Remove `AfterViewInit` from the `@angular/core` import and `implements AfterViewInit`.
2. Remove `ngAfterViewInit()`.
3. Add a constructor with `afterNextRender()`:

```ts
constructor() {
  afterNextRender(() => {
    const overlayRef = this.overlayRef();
    if (!overlayRef) return;
    this.drawerService.setOverlayRef(overlayRef.nativeElement);
  });
}
```

> If the overlay button were ever conditionally rendered via `@if`, switch to `afterRenderEffect()` so registration re-fires when the element is recreated.

---

## Task 4 — Convert `ControlsComponent` to use signals and `linkedSignal` for error state

**File:** `src/app/controls.component.ts`

### Problem A — Template-driven form
The snap-point input uses `FormsModule` + `[(ngModel)]`:

```ts
import { FormsModule } from '@angular/forms';
newPointValue: string | undefined = undefined; // plain mutable property
```
```html
<input [(ngModel)]="newPointValue" ... />
```

`FormsModule` is RxJS-backed and is the only reason this component pulls in `@angular/forms`.

### Problem B — `error` signal is manually reset

```ts
error = signal<string | null>(null);

addSnapPoint() {
  // ... validation ...
  this.error.set('Invalid number: ...');  // set on failure
  // ...
  this.error.set(null);  // must be manually cleared on success
}
```

The error must be cleared explicitly after every successful submission **and** ideally as soon as the user starts typing a new value. This is precisely the `linkedSignal()` use case: state that is derived (resets to `null` whenever the input changes) but can still be manually overridden (set to an error message on validation failure).

### Action

**1. Remove `FormsModule`** from imports and its import statement.

**2. Convert `newPointValue` to a signal:**

```ts
newPointValue = signal<string>('');
```

**3. Replace `[(ngModel)]` with value binding + input event:**

```html
<input
  type="text"
  id="snap-point-input"
  [value]="newPointValue()"
  (input)="newPointValue.set($any($event.target).value)"
  (keyup.enter)="addSnapPoint()"
  [class.invalid]="error()"
  [attr.aria-describedby]="error() ? 'snap-input-error' : null"
/>
```

**4. Convert `error` to a `linkedSignal` that auto-resets whenever the user types:**

```ts
// ✅ Resets to null automatically whenever newPointValue changes.
// Can still be manually set to an error string on validation failure.
error = linkedSignal<string | null>({
  source: this.newPointValue,
  computation: () => null,
});
```

**5. Simplify `addSnapPoint()`** — remove the explicit `this.error.set(null)` at the end (the `linkedSignal` handles it):

```ts
addSnapPoint() {
  const value = this.newPointValue().trim();
  if (!value) {
    this.error.set('Enter a valid snap point');
    return;
  }
  // ... validation ...
  this.snapPointsChange.emit(updated);
  this.newPointValue.set('');
  // ← no manual error.set(null) needed; linkedSignal resets it when newPointValue changes
}
```

---

## Task 5 — Replace `ngOnInit` keyboard listener with `afterNextRender()` in `AppComponent`

**File:** `src/app/app.component.ts`

### Problem
A global `keydown` listener is set up in `ngOnInit` with `DestroyRef` for cleanup:

```ts
export class AppComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const onKeyDown = (event: Event) => { ... };
    this.document.addEventListener('keydown', onKeyDown, true);
    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('keydown', onKeyDown, true);
    });
  }
}
```

This is a genuine DOM side effect (not state sync), so `effect()` would be wrong. `afterNextRender()` is the correct replacement: it fires once after the first render and accepts a cleanup function that runs on destroy.

### Action
1. Remove `OnInit` from the import and `implements OnInit`.
2. Remove `ngOnInit()`.
3. Remove `DestroyRef` import and injection.
4. Move the listener setup into `afterNextRender()` in the constructor, returning the cleanup as the callback's return value:

```ts
constructor() {
  afterNextRender(() => {
    const onKeyDown = (event: Event) => {
      const e = event as KeyboardEvent;
      if (e.key !== 'Escape' || !this.isOpen() || !this.dismissible()) return;
      e.preventDefault();
      e.stopPropagation();
      this.drawerService.setIsOpen(false);
    };
    this.document.addEventListener('keydown', onKeyDown, true);
    return () => this.document.removeEventListener('keydown', onKeyDown, true);
  });
}
```

---

## Task 6 — Replace `hasBeenOpened` manual tracking with `linkedSignal`

**File:** `src/app/services/drawer-state.service.ts`

### Problem
`hasBeenOpened` is manually set inside `setIsOpen()`:

```ts
setIsOpen(isOpen: boolean): void {
  if (isOpen === this.isOpen()) return;
  this.isOpen.set(isOpen);
  if (isOpen) this.hasBeenOpened.set(true); // ← manual state derivation
}
```

This is hidden state derivation disguised as a setter. `linkedSignal()` makes the relationship explicit and removes the imperative dependency on `setIsOpen` being the sole mutation path.

### Action
Replace `hasBeenOpened` with a `linkedSignal` derived from `isOpen`:

```ts
// Once true, stays true — even if isOpen goes back to false.
readonly hasBeenOpened = linkedSignal<boolean, boolean>({
  source: this.isOpen,
  computation: (isOpen, previous) => isOpen || (previous?.value ?? false),
});
```

Remove the `if (isOpen) this.hasBeenOpened.set(true)` line from `setIsOpen()`.

---

## Task 7 — Remove the vestigial `stateChange` signal

**Files:** `drawer-state.service.ts`, `drawer.service.ts`, `__mocks__/*.ts`, `drawer-state.service.spec.ts`

### Problem
`stateChange = signal<void>(undefined)` was previously an RxJS `Subject` used to broadcast generic state changes. With individual signals, every consumer subscribes directly to the signal it cares about. `stateChange` is:

- **Never updated** (`.set()` / `.update()` is never called).
- **Never consumed** (no `effect()`, template binding, or `computed()` reads it).
- Tested only for existence, which provides no real value.

### Action
1. Remove `readonly stateChange = signal<void>(undefined)` from `DrawerStateService`.
2. Remove `readonly stateChange = this.state.stateChange` from `DrawerService`.
3. Remove `stateChange` from all `__mocks__/*.ts` files.
4. Remove the existence test from `drawer-state.service.spec.ts`.

---

## Task 8 — Remove redundant getter methods from `DrawerStateService`

**File:** `src/app/services/drawer-state.service.ts`

### Problem
The service exposes its state as public `readonly` signals **and** as `get*()` methods that simply invoke those signals:

```ts
readonly shouldScaleBackground = signal<boolean>(false);

getShouldScaleBackground(): boolean {
  return this.shouldScaleBackground(); // identical to the signal
}
```

No internal or external call site uses the `get*()` methods (confirmed by grep). They double the public surface area and create two ways to read the same data.

### Action
Remove all `get*()` methods: `getShouldScaleBackground`, `getBackgroundColorOnScale`, `getNoBodyStyles`, `getNested`, `getModal`, `getHasBeenOpened`, `getPreventScrollRestoration`.

---

## Execution Order

```
Task 1  ← independent, do first (unblocks zero-rxjs-imports claim)
Task 2  ← largest blast radius; do in a dedicated branch
Task 3  ← independent
Task 4  ← independent
Task 5  ← independent
Task 6  ← depends on Task 2 being done first (or done alongside it)
Task 7  ← independent
Task 8  ← independent; easiest last
```

Run after every task:

```bash
ng build && ng test
```

---

## Verification Checklist

- [ ] `grep -r "from 'rxjs'" src/` returns zero results
- [ ] No `effect()` call contains only `.set()` / `.update()` on a signal (state-sync anti-pattern absent)
- [ ] `ng build` passes with no errors
- [ ] All Vitest specs pass (`ng test`)
- [ ] All Playwright E2E tests pass (`npm run e2e`)
- [ ] No `AfterViewInit`, `OnInit` lifecycle hooks remain in refactored components
- [ ] `stateChange` symbol is absent from all non-spec source files
- [ ] `FormsModule` is absent from `controls.component.ts`
- [ ] Snap-point add / remove / keyboard E2E tests still pass after Task 4

---

## Out of Scope

The following are **intentionally not changed** by this plan:

- **`effect()` in `DrawerService` constructor** — these sync open/close state to DOM `style` properties, which is a legitimate DOM-manipulation side effect. They are valid uses of `effect()`.
- **`effect()` in `DrawerDragService` constructor** — disables CSS transitions while dragging by writing to `element.style`. Valid DOM side effect.
- **`effect()` in `PreventScrollService` constructor** — manages scroll-lock styles on `<body>`. Valid DOM side effect.
- **`activeSnapPointChange` emit effect in `DrawerComponent`** — emitting an `OutputEmitterRef` is a side effect, not state sync. Valid `effect()` usage.
- **Zone.js** — the project uses `provideZoneChangeDetection`. Migrating to zoneless is a separate initiative.
- **`DrawerStateService` setter methods** (`setIsOpen`, `setDirection`, etc.) — retain for now; they provide a stable mutation API. After Task 2 reduces their call sites they can be revisited.
