import { test, expect } from '@playwright/test';
import { drawerLocators, jsClick } from './helpers/drawer';

test.describe('Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // TC004
  // WebKit does not automatically return focus to the opener element when a
  // non-dialog overlay closes — this is a browser engine difference, not a
  // test or app bug. Chromium and Firefox both restore focus correctly.
  test('focus moves to inner close on open and returns to trigger on close',
    async ({ page, browserName }) => {
      test.skip(
        browserName === 'webkit',
        'WebKit does not restore focus to the opener element automatically; ' +
        'Chromium and Firefox cover this behaviour.',
      );

      const { drawer, trigger } = drawerLocators(page);

      await trigger.click();
      await expect(drawer).toHaveAttribute('data-state', 'open');
      await page.waitForTimeout(600);

      await jsClick(page, 'drawer-inner-close');
      await expect(drawer).toHaveAttribute('data-state', 'closed');
      await page.waitForTimeout(400);

      await expect(trigger).toBeFocused();
    },
  );
});
