import { test, expect } from '@playwright/test';
import { drawerLocators, jsClick } from './helpers/drawer';

test.describe('Open / Close', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // TC001
  test('open via trigger and close via inner close control', async ({ page }) => {
    const { drawer, trigger } = drawerLocators(page);

    await expect(drawer).toHaveAttribute('data-state', 'closed');

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await page.waitForTimeout(600);
    await jsClick(page, 'drawer-inner-close');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  // TC002
  test('close via Escape key', async ({ page }) => {
    const { drawer, trigger } = drawerLocators(page);

    await trigger.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  // TC003
  test('Escape while already closed is a no-op', async ({ page }) => {
    const { drawer } = drawerLocators(page);

    await expect(drawer).toHaveAttribute('data-state', 'closed');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });
});
