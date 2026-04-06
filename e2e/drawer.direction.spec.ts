import { test, expect } from '@playwright/test';
import { drawerLocators, jsClick } from './helpers/drawer';

test.describe('Direction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // TC007
  test('opens and closes from the selected direction', async ({ page }) => {
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

  // TC008
  test('changing direction updates next-open behavior', async ({ page }) => {
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

  // TC009
  test('default direction is bottom when none is passed', async ({ page }) => {
    const { drawer, trigger } = drawerLocators(page);

    await expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'bottom');

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');
    await expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'bottom');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });
});
