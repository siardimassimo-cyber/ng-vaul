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
        off_btn = page.locator('#dismissible-off-btn')
        overlay = page.locator('#drawer-overlay-backdrop')

        # Turn dismissible off
        await off_btn.click()

        await trigger.click()
        await expect(drawer).to_have_attribute('data-state', 'open', timeout=5000)

        # Click the overlay — should NOT dismiss the drawer when dismissible is off
        await overlay.click(force=True)
        await page.wait_for_timeout(500)
        await expect(drawer).to_have_attribute('data-state', 'open', timeout=5000)

        # Clean up: close via inner close (JS click to bypass viewport)
        await page.evaluate("document.getElementById('drawer-inner-close').click()")
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
