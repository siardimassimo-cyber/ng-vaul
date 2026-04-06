import { test, expect } from '@playwright/test';
import { drawerLocators, jsClick } from './helpers/drawer';

test.describe('Dismissible', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // TC010
  test('Escape does NOT dismiss when dismissible is off', async ({ page }) => {
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

  // TC011
  test('Escape DOES dismiss when dismissible is on', async ({ page }) => {
    const { drawer, trigger, dismissibleOn } = drawerLocators(page);

    await dismissibleOn.click();
    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  // TC012
  test('overlay click does not dismiss when dismissible is off', async ({ page }) => {
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
