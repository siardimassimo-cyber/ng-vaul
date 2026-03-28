import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        pw = await async_api.async_playwright().start()
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )
        context = await browser.new_context()
        context.set_default_timeout(5000)
        page = await context.new_page()

        await page.goto("http://localhost:4200", wait_until="commit", timeout=10000)

        drawer = page.locator('vaul-drawer .vaul-drawer')
        trigger = page.locator('#drawer-open-close-trigger')
        snap_input = page.locator('#snap-point-input')
        add_btn = page.locator('#snap-point-add-btn')

        # Remove default snap points (buttons are outside the drawer — always accessible)
        for value in ['0.4', '0.8', '1']:
            remove_btn = page.locator(f'button[aria-label="Remove snap point {value}"]')
            await remove_btn.click()
            await page.wait_for_timeout(200)

        # Add snap points in unsorted order — the service should reject/ignore them
        for value in ['1', '0.4', '0.8']:
            await snap_input.fill(value)
            await add_btn.click()
            await page.wait_for_timeout(200)

        # Even with unsorted snap points the drawer should still open
        await trigger.click()
        await expect(drawer).to_have_attribute('data-state', 'open', timeout=5000)

        await page.keyboard.press('Escape')
        await expect(drawer).to_have_attribute('data-state', 'closed', timeout=5000)

        await asyncio.sleep(2)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
