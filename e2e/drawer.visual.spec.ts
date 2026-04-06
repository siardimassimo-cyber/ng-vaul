import { expect, Page, test } from '@playwright/test';
import { drawerLocators, jsClick } from './helpers/drawer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Inject a style tag that eliminates every CSS transition and animation so
 * screenshots are taken against a fully-settled, deterministic DOM.
 */
async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition-duration: 0ms !important;
        transition-delay:    0ms !important;
        animation-duration:  0ms !important;
        animation-delay:     0ms !important;
      }
    `,
  });
}

/** Screenshot options shared by every call: also stops any in-flight CSS animations at capture time. */
const SNAP = { animations: 'disabled' } as const;

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await disableAnimations(page);
  });

  // ── Full-page snapshots ─────────────────────────────────────────────────

  test.describe('Full page', () => {
    test('idle — drawer closed, default controls', async ({ page }) => {
      await expect(page).toHaveScreenshot('page-idle.png', SNAP);
    });

    test('drawer open — bottom (default)', async ({ page }) => {
      const { drawer, trigger } = drawerLocators(page);
      await trigger.click();
      await expect(drawer).toHaveAttribute('data-state', 'open');
      await expect(page).toHaveScreenshot('page-open-bottom.png', SNAP);
    });

    test('drawer open — top', async ({ page }) => {
      const { drawer, trigger, directionTop } = drawerLocators(page);
      await directionTop.click();
      await trigger.click();
      await expect(drawer).toHaveAttribute('data-state', 'open');
      await expect(page).toHaveScreenshot('page-open-top.png', SNAP);
    });

    test('drawer open — left', async ({ page }) => {
      const { drawer, trigger, directionLeft } = drawerLocators(page);
      await directionLeft.click();
      await trigger.click();
      await expect(drawer).toHaveAttribute('data-state', 'open');
      await expect(page).toHaveScreenshot('page-open-left.png', SNAP);
    });

    test('drawer open — right', async ({ page }) => {
      const { drawer, trigger, directionRight } = drawerLocators(page);
      await directionRight.click();
      await trigger.click();
      await expect(drawer).toHaveAttribute('data-state', 'open');
      await expect(page).toHaveScreenshot('page-open-right.png', SNAP);
    });
  });

  // ── Snap point positions ────────────────────────────────────────────────

  test.describe('Snap points', () => {
    test('snap 40 % — initial open position', async ({ page }) => {
      const { drawer, trigger } = drawerLocators(page);
      await trigger.click();
      await expect(drawer).toHaveAttribute('data-state', 'open');
      await expect(page).toHaveScreenshot('snap-40pct.png', SNAP);
    });

    test('snap 80 % — after one next-snap click', async ({ page }) => {
      const { drawer, trigger } = drawerLocators(page);
      await trigger.click();
      await expect(drawer).toHaveAttribute('data-state', 'open');
      await jsClick(page, 'drawer-next-snap');
      // Small settle wait — with animations killed this is effectively instant,
      // but gives Angular one more change-detection cycle.
      await page.waitForTimeout(100);
      await expect(page).toHaveScreenshot('snap-80pct.png', SNAP);
    });

    test('snap 100 % — after two next-snap clicks', async ({ page }) => {
      const { drawer, trigger } = drawerLocators(page);
      await trigger.click();
      await expect(drawer).toHaveAttribute('data-state', 'open');
      await jsClick(page, 'drawer-next-snap');
      await page.waitForTimeout(100);
      await jsClick(page, 'drawer-next-snap');
      await page.waitForTimeout(100);
      await expect(page).toHaveScreenshot('snap-100pct.png', SNAP);
    });
  });

  // ── Component-level element snapshots ───────────────────────────────────

  test.describe('Components', () => {
    // Control card (the glassmorphism panel in the centre of the page)
    test('control card — default state', async ({ page }) => {
      const card = page.locator('.control-card');
      await expect(card).toHaveScreenshot('component-control-card-default.png', SNAP);
    });

    test('control card — direction left selected', async ({ page }) => {
      const { directionLeft } = drawerLocators(page);
      await directionLeft.click();
      const card = page.locator('.control-card');
      await expect(card).toHaveScreenshot('component-control-card-dir-left.png', SNAP);
    });

    test('control card — direction top selected', async ({ page }) => {
      const { directionTop } = drawerLocators(page);
      await directionTop.click();
      const card = page.locator('.control-card');
      await expect(card).toHaveScreenshot('component-control-card-dir-top.png', SNAP);
    });

    test('control card — direction right selected', async ({ page }) => {
      const { directionRight } = drawerLocators(page);
      await directionRight.click();
      const card = page.locator('.control-card');
      await expect(card).toHaveScreenshot('component-control-card-dir-right.png', SNAP);
    });

    test('control card — dismissible off', async ({ page }) => {
      const { dismissibleOff } = drawerLocators(page);
      await dismissibleOff.click();
      const card = page.locator('.control-card');
      await expect(card).toHaveScreenshot('component-control-card-dismissible-off.png', SNAP);
    });

    test('control card — dismissible on (explicit)', async ({ page }) => {
      // Turn off then back on to verify the active-state styling is correct.
      const { dismissibleOff, dismissibleOn } = drawerLocators(page);
      await dismissibleOff.click();
      await dismissibleOn.click();
      const card = page.locator('.control-card');
      await expect(card).toHaveScreenshot('component-control-card-dismissible-on.png', SNAP);
    });

    // Snap pills row
    test('snap points list — default three pills', async ({ page }) => {
      const list = page.locator('.snap-points-list');
      await expect(list).toHaveScreenshot('component-snap-list-default.png', SNAP);
    });

    test('snap points section — all pills removed', async ({ page }) => {
      const { snapRemoveBtn } = drawerLocators(page);
      for (const v of ['0.4', '0.8', '1']) {
        await snapRemoveBtn(v).click();
        await page.waitForTimeout(100);
      }
      // The list itself collapses to zero height when empty, so we screenshot
      // the enclosing control-section that also shows the "Add" input.
      const section = page.locator('.control-section').last();
      await expect(section).toHaveScreenshot('component-snap-section-empty.png', SNAP);
    });

    // Drawer panel (the sliding panel itself)
    test('drawer panel — bottom, snap 40 %', async ({ page }) => {
      const { drawer, trigger } = drawerLocators(page);
      await trigger.click();
      await expect(drawer).toHaveAttribute('data-state', 'open');
      await expect(drawer).toHaveScreenshot('component-drawer-panel-bottom.png', SNAP);
    });

    test('drawer panel — left direction', async ({ page }) => {
      const { drawer, trigger, directionLeft } = drawerLocators(page);
      await directionLeft.click();
      await trigger.click();
      await expect(drawer).toHaveAttribute('data-state', 'open');
      await expect(drawer).toHaveScreenshot('component-drawer-panel-left.png', SNAP);
    });

    // Overlay backdrop
    test('overlay — visible when drawer is open', async ({ page }) => {
      const { trigger } = drawerLocators(page);
      await trigger.click();
      const overlay = page.locator('#drawer-overlay-backdrop');
      await expect(overlay).toHaveAttribute('data-state', 'open');
      await expect(overlay).toHaveScreenshot('component-overlay.png', SNAP);
    });
  });
});
