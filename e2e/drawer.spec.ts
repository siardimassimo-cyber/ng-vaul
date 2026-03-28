import { test, expect } from '@playwright/test';

test.describe('Drawer E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open and close the drawer via the trigger button', async ({ page }) => {
    const trigger = page.locator('.trigger-button');
    const drawerDiv = page.locator('vaul-drawer .vaul-drawer');

    // Initial state: closed
    await expect(drawerDiv).toHaveAttribute('data-state', 'closed');

    // Open drawer
    await trigger.click();
    await expect(drawerDiv).toHaveAttribute('data-state', 'open');
    await expect(page.locator('h2')).toContainText('Drawer Example');

    // Close drawer
    await trigger.click();
    await expect(drawerDiv).toHaveAttribute('data-state', 'closed');
  });

  test('should close the drawer when clicking the overlay', async ({ page }) => {
    const trigger = page.locator('.trigger-button');
    const drawerDiv = page.locator('vaul-drawer .vaul-drawer');
    const overlay = page.locator('vaul-overlay');

    // Open drawer
    await trigger.click();
    await expect(drawerDiv).toHaveAttribute('data-state', 'open');

    // Click overlay to close (top left corner typically works)
    await page.mouse.click(10, 10);
    await expect(drawerDiv).toHaveAttribute('data-state', 'closed');
  });

  test('should change drawer direction', async ({ page }) => {
    const drawerDiv = page.locator('vaul-drawer .vaul-drawer');

    // Check initial direction (Bottom)
    await expect(drawerDiv).toHaveAttribute('data-vaul-drawer-direction', 'bottom');

    // find direction buttons in app-controls
    const leftBtn = page.getByRole('button', { name: 'Left' });
    await leftBtn.click();
    await expect(drawerDiv).toHaveAttribute('data-vaul-drawer-direction', 'left');

    const topBtn = page.getByRole('button', { name: 'Top' });
    await topBtn.click();
    await expect(drawerDiv).toHaveAttribute('data-vaul-drawer-direction', 'top');

    const rightBtn = page.getByRole('button', { name: 'Right' });
    await rightBtn.click();
    await expect(drawerDiv).toHaveAttribute('data-vaul-drawer-direction', 'right');
  });

  test('should snap to points when dragging', async ({ page }) => {
    const trigger = page.locator('.trigger-button');
    const drawerDiv = page.locator('vaul-drawer .vaul-drawer');

    await trigger.click();
    await expect(drawerDiv).toHaveAttribute('data-state', 'open');

    // Wait for animation
    await page.waitForTimeout(500);

    const box = await drawerDiv.boundingBox();
    if (!box) throw new Error('Drawer box not found');

    // Drag from the handle
    const handle = page.locator('vaul-handle');
    const handleBox = await handle.boundingBox();
    if (!handleBox) throw new Error('Handle box not found');

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 50, { steps: 10 }); // Drag down 50px
    await page.mouse.up();

    // Verify it's still open (snapped to a point, not closed)
    await expect(drawerDiv).toHaveAttribute('data-state', 'open');
  });
});
