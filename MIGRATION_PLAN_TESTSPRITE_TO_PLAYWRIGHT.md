# Migration Plan: TestSprite Python Tests → Playwright TypeScript

## Overview

Convert 15 Python test cases from `testsprite_tests/` into idiomatic TypeScript Playwright tests living in `e2e/`. The project already has Playwright installed and configured (`playwright.config.ts`), and a skeleton `e2e/drawer.spec.ts` exists.

---

## Current State

| Item | Detail |
|---|---|
| Source folder | `testsprite_tests/*.py` |
| Runtime | Python `asyncio` + `playwright` async API |
| Browser launch | Manual (each test spins up its own browser) |
| Base URL | Hard-coded `http://localhost:4200` |
| Parallelism | None — `run-all.mjs` runs tests sequentially |
| Target folder | `e2e/` |
| Playwright config | `playwright.config.ts` — `baseURL: http://localhost:4200`, auto-starts `ng serve` |

---

## Test Inventory

| ID | Title | Category | Priority |
|---|---|---|---|
| TC001 | Open and close via trigger + inner close control | Open/Close | High |
| TC002 | Close with Escape key | Open/Close | High |
| TC003 | Escape while drawer already closed is a no-op | Open/Close | Medium |
| TC004 | Focus moves to inner close on open, returns to trigger on close | Focus Management | High |
| TC005 | Advance to next snap point and return to previous | Snap Points | High |
| TC006 | Prevent advancing past the last snap point | Snap Points | High |
| TC007 | Drawer opens/closes from the selected direction | Direction | High |
| TC008 | Changing direction updates next-open behavior | Direction | High |
| TC009 | Default direction is `bottom` when none is passed | Direction | Medium |
| TC010 | Escape does NOT dismiss when `dismissible` is off | Dismissible | High |
| TC011 | Escape DOES dismiss when `dismissible` is on | Dismissible | High |
| TC012 | Overlay click does not dismiss when `dismissible` is off | Dismissible | High |
| TC013 | Drawer uses snap points on open and navigates between them | Snap Points | High |
| TC014 | Empty snap-points array skips snap behavior | Snap Points | Medium |
| TC015 | Unsorted snap-points array skips snap behavior | Snap Points | Medium |

---

## Key Translation Patterns

### 1. Browser setup

**Python (manual per-test)**
```python
pw = await async_api.async_playwright().start()
browser = await pw.chromium.launch(headless=True, args=[...])
context = await browser.new_context()
context.set_default_timeout(5000)
page = await context.new_page()
await page.goto("http://localhost:4200", wait_until="commit", timeout=10000)
```

**TypeScript (Playwright test fixture)**
```typescript
// playwright.config.ts already sets baseURL and starts ng serve
test.use({ actionTimeout: 5000 });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});
```

---

### 2. Locators

| Python | TypeScript |
|---|---|
| `page.locator('vaul-drawer .vaul-drawer')` | `page.locator('vaul-drawer .vaul-drawer')` |
| `page.locator('#drawer-open-close-trigger')` | `page.locator('#drawer-open-close-trigger')` |
| `page.locator('#dismissible-off-btn')` | `page.locator('#dismissible-off-btn')` |
| `page.locator('#direction-left-btn')` | `page.locator('#direction-left-btn')` |
| `page.locator('#drawer-overlay-backdrop')` | `page.locator('#drawer-overlay-backdrop')` |
| `page.locator(f'button[aria-label="Remove snap point {v}"]')` | `page.locator(\`button[aria-label="Remove snap point ${v}"]\`)` |

---

### 3. Assertions

| Python | TypeScript |
|---|---|
| `await expect(el).to_have_attribute('data-state', 'closed')` | `await expect(el).toHaveAttribute('data-state', 'closed')` |
| `await expect(el).to_be_focused()` | `await expect(el).toBeFocused()` |

---

### 4. JS evaluation (bypass viewport check)

```python
await page.evaluate("document.getElementById('drawer-inner-close').click()")
```
```typescript
await page.evaluate(() => (document.getElementById('drawer-inner-close') as HTMLElement).click());
```

---

### 5. Waits

| Python | TypeScript |
|---|---|
| `await page.wait_for_timeout(600)` | `await page.waitForTimeout(600)` |
| `await asyncio.sleep(2)` | Remove — Playwright handles cleanup automatically |

---

## File Structure

```
e2e/
├── drawer.open-close.spec.ts   # TC001, TC002, TC003
├── drawer.focus.spec.ts        # TC004
├── drawer.snap-points.spec.ts  # TC005, TC006, TC013, TC014, TC015
├── drawer.direction.spec.ts    # TC007, TC008, TC009
├── drawer.dismissible.spec.ts  # TC010, TC011, TC012
└── helpers/
    └── drawer.ts               # shared locators & helpers
```

> The existing `e2e/drawer.spec.ts` should be superseded by the new files above (or merged into them).

---

## Shared Helper (`e2e/helpers/drawer.ts`)

Extract repeated locator setup into a helper so every test file stays DRY:

```typescript
import { Page } from '@playwright/test';

export function drawerLocators(page: Page) {
  return {
    drawer:   page.locator('vaul-drawer .vaul-drawer'),
    trigger:  page.locator('#drawer-open-close-trigger'),
    overlay:  page.locator('#drawer-overlay-backdrop'),
    nextSnap: page.locator('#drawer-next-snap'),
    prevSnap: page.locator('#drawer-prev-snap'),
    innerClose: page.locator('#drawer-inner-close'),
    dismissibleOn:  page.locator('#dismissible-on-btn'),
    dismissibleOff: page.locator('#dismissible-off-btn'),
    directionLeft:  page.locator('#direction-left-btn'),
    directionRight: page.locator('#direction-right-btn'),
    directionTop:   page.locator('#direction-top-btn'),
    directionBottom: page.locator('#direction-bottom-btn'),
    snapInput:  page.locator('#snap-point-input'),
    snapAddBtn: page.locator('#snap-point-add-btn'),
    snapRemoveBtn: (value: string) =>
      page.locator(`button[aria-label="Remove snap point ${value}"]`),
  };
}

/** JS-click an element that may be outside the visible viewport */
export async function jsClick(page: Page, id: string): Promise<void> {
  await page.evaluate(
    (elId) => (document.getElementById(elId) as HTMLElement).click(),
    id
  );
}
```

---

## Implementation Steps

### Step 1 — Tidy up Playwright config

Update `playwright.config.ts` to add a global `actionTimeout` so every test gets the same 5 s default the Python tests used:

```typescript
use: {
  baseURL: 'http://localhost:4200',
  actionTimeout: 5000,
  trace: 'on-first-retry',
},
```

---

### Step 2 — Create `e2e/helpers/drawer.ts`

Create the shared helper file described above.

---

### Step 3 — `e2e/drawer.open-close.spec.ts` (TC001–TC003)

```typescript
import { test, expect } from '@playwright/test';
import { drawerLocators, jsClick } from './helpers/drawer';

test.describe('Open / Close', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('TC001 – open via trigger and close via inner close control', async ({ page }) => {
    const { drawer, trigger } = drawerLocators(page);

    await expect(drawer).toHaveAttribute('data-state', 'closed');

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await page.waitForTimeout(600);
    await jsClick(page, 'drawer-inner-close');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  test('TC002 – close via Escape key', async ({ page }) => {
    const { drawer, trigger } = drawerLocators(page);

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  test('TC003 – Escape while already closed is a no-op', async ({ page }) => {
    const { drawer } = drawerLocators(page);

    await expect(drawer).toHaveAttribute('data-state', 'closed');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });
});
```

---

### Step 4 — `e2e/drawer.focus.spec.ts` (TC004)

```typescript
import { test, expect } from '@playwright/test';
import { drawerLocators, jsClick } from './helpers/drawer';

test.describe('Focus Management', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('TC004 – focus moves to inner close on open and returns to trigger on close', async ({ page }) => {
    const { drawer, trigger } = drawerLocators(page);

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');
    await page.waitForTimeout(600);

    await jsClick(page, 'drawer-inner-close');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
    await page.waitForTimeout(400);

    await expect(trigger).toBeFocused();
  });
});
```

---

### Step 5 — `e2e/drawer.snap-points.spec.ts` (TC005, TC006, TC013, TC014, TC015)

```typescript
import { test, expect } from '@playwright/test';
import { drawerLocators, jsClick } from './helpers/drawer';

test.describe('Snap Points', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('TC005 – advance to next snap point and return to previous', async ({ page }) => {
    const { drawer, trigger } = drawerLocators(page);

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');
    await page.waitForTimeout(600);

    await jsClick(page, 'drawer-next-snap');
    await page.waitForTimeout(400);
    await jsClick(page, 'drawer-prev-snap');
    await page.waitForTimeout(400);

    await expect(drawer).toHaveAttribute('data-state', 'open');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  test('TC006 – cannot advance past the last snap point', async ({ page }) => {
    const { drawer, trigger } = drawerLocators(page);

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');
    await page.waitForTimeout(600);

    for (let i = 0; i < 3; i++) {
      await jsClick(page, 'drawer-next-snap');
      await page.waitForTimeout(400);
    }

    await expect(drawer).toHaveAttribute('data-state', 'open');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  test('TC013 – uses configured snap points on open and navigates between them', async ({ page }) => {
    const { drawer, trigger } = drawerLocators(page);

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');
    await page.waitForTimeout(600);

    await jsClick(page, 'drawer-next-snap');
    await page.waitForTimeout(400);
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await jsClick(page, 'drawer-prev-snap');
    await page.waitForTimeout(400);
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  test('TC014 – empty snap-points array skips snap behavior', async ({ page }) => {
    const { drawer, trigger, snapRemoveBtn } = drawerLocators(page);

    for (const value of ['0.4', '0.8', '1']) {
      await snapRemoveBtn(value).click();
      await page.waitForTimeout(200);
    }

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  test('TC015 – unsorted snap-points array skips snap behavior', async ({ page }) => {
    const { drawer, trigger, snapInput, snapAddBtn, snapRemoveBtn } = drawerLocators(page);

    for (const value of ['0.4', '0.8', '1']) {
      await snapRemoveBtn(value).click();
      await page.waitForTimeout(200);
    }

    for (const value of ['1', '0.4', '0.8']) {
      await snapInput.fill(value);
      await snapAddBtn.click();
      await page.waitForTimeout(200);
    }

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });
});
```

---

### Step 6 — `e2e/drawer.direction.spec.ts` (TC007, TC008, TC009)

```typescript
import { test, expect } from '@playwright/test';
import { drawerLocators, jsClick } from './helpers/drawer';

test.describe('Direction', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('TC007 – opens and closes from the selected direction', async ({ page }) => {
    const { drawer, trigger, directionLeft } = drawerLocators(page);

    await directionLeft.click();
    await expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'left');

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');
    await expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'left');

    await page.waitForTimeout(600);
    await jsClick(page, 'drawer-inner-close');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  test('TC008 – changing direction updates next-open behavior', async ({ page }) => {
    const { drawer, trigger, directionTop } = drawerLocators(page);

    await expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'bottom');

    await directionTop.click();
    await expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'top');

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');
    await expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'top');

    await page.waitForTimeout(600);
    await jsClick(page, 'drawer-inner-close');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  test('TC009 – default direction is bottom when none is passed', async ({ page }) => {
    const { drawer, trigger } = drawerLocators(page);

    await expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'bottom');

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');
    await expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'bottom');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });
});
```

---

### Step 7 — `e2e/drawer.dismissible.spec.ts` (TC010, TC011, TC012)

```typescript
import { test, expect } from '@playwright/test';
import { drawerLocators, jsClick } from './helpers/drawer';

test.describe('Dismissible', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('TC010 – Escape does NOT dismiss when dismissible is off', async ({ page }) => {
    const { drawer, trigger, dismissibleOff } = drawerLocators(page);

    await dismissibleOff.click();
    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await jsClick(page, 'drawer-inner-close');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  test('TC011 – Escape DOES dismiss when dismissible is on', async ({ page }) => {
    const { drawer, trigger, dismissibleOn } = drawerLocators(page);

    await dismissibleOn.click();
    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  test('TC012 – overlay click does not dismiss when dismissible is off', async ({ page }) => {
    const { drawer, trigger, overlay, dismissibleOff } = drawerLocators(page);

    await dismissibleOff.click();
    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await overlay.click({ force: true });
    await page.waitForTimeout(500);
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await jsClick(page, 'drawer-inner-close');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });
});
```

---

### Step 8 — Update `playwright.config.ts`

Add `actionTimeout` and keep the rest unchanged:

```diff
  use: {
    baseURL: 'http://localhost:4200',
+   actionTimeout: 5000,
    trace: 'on-first-retry',
  },
```

---

### Step 9 — Update `package.json` scripts

Add convenience scripts:

```diff
  "e2e": "playwright test",
  "e2e:headed": "playwright test --headed",
+ "e2e:ui": "playwright test --ui",
+ "e2e:debug": "playwright test --debug",
```

---

### Step 10 — Remove/archive old Python tests

Once all TS tests are green, delete or archive the Python-based tests:

```bash
# Option A: delete
rm -rf testsprite_tests/

# Option B: keep as reference
mv testsprite_tests/ testsprite_tests_archived/
```

---

## How to Run Locally

```bash
# Start the dev server and run all e2e tests (headless)
pnpm e2e

# Run with browser visible
pnpm e2e:headed

# Open Playwright interactive UI
pnpm e2e:ui

# Run only one spec file
pnpm e2e -- e2e/drawer.open-close.spec.ts

# Run tests matching a title substring
pnpm e2e -- --grep "TC004"

# Debug a single test interactively
pnpm e2e:debug -- e2e/drawer.focus.spec.ts
```

---

## Checklist

- [ ] Step 1 — Update `playwright.config.ts` (`actionTimeout: 5000`)
- [ ] Step 2 — Create `e2e/helpers/drawer.ts`
- [ ] Step 3 — Create `e2e/drawer.open-close.spec.ts` (TC001–TC003)
- [ ] Step 4 — Create `e2e/drawer.focus.spec.ts` (TC004)
- [ ] Step 5 — Create `e2e/drawer.snap-points.spec.ts` (TC005, TC006, TC013–TC015)
- [ ] Step 6 — Create `e2e/drawer.direction.spec.ts` (TC007–TC009)
- [ ] Step 7 — Create `e2e/drawer.dismissible.spec.ts` (TC010–TC012)
- [ ] Step 8 — Update `package.json` scripts
- [ ] Step 9 — Run `pnpm e2e` and confirm all 15 tests pass
- [ ] Step 10 — Delete/archive `testsprite_tests/`
