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
        top_btn = page.locator('#direction-top-btn')

        # Default direction is bottom
        await expect(drawer).to_have_attribute('data-vaul-drawer-direction', 'bottom', timeout=5000)

        # Change to top — button is outside the drawer, always accessible
        await top_btn.click()
        await expect(drawer).to_have_attribute('data-vaul-drawer-direction', 'top', timeout=5000)

        await trigger.click()
        await expect(drawer).to_have_attribute('data-state', 'open', timeout=5000)
        await expect(drawer).to_have_attribute('data-vaul-drawer-direction', 'top', timeout=3000)

        await page.wait_for_timeout(600)
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
