import { test, expect } from '@playwright/test';
import { drawerLocators, jsClick } from './helpers/drawer';

test.describe('Snap Points', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // TC005
  test('advance to next snap point and return to previous', async ({ page }) => {
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

  // TC006
  test('cannot advance past the last snap point', async ({ page }) => {
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

  // TC013
  test('uses configured snap points on open and navigates between them', async ({ page }) => {
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

  // TC014
  test('empty snap-points array skips snap behavior', async ({ page }) => {
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

  // TC015
  test('unsorted snap-points array skips snap behavior', async ({ page }) => {
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
