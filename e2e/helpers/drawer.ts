import { Page } from '@playwright/test';

export function drawerLocators(page: Page) {
  return {
    drawer:          page.locator('vaul-drawer .vaul-drawer'),
    trigger:         page.locator('#drawer-open-close-trigger'),
    overlay:         page.locator('#drawer-overlay-backdrop'),
    nextSnap:        page.locator('#drawer-next-snap'),
    prevSnap:        page.locator('#drawer-prev-snap'),
    innerClose:      page.locator('#drawer-inner-close'),
    dismissibleOn:   page.locator('#dismissible-on-btn'),
    dismissibleOff:  page.locator('#dismissible-off-btn'),
    directionLeft:   page.locator('#direction-left-btn'),
    directionRight:  page.locator('#direction-right-btn'),
    directionTop:    page.locator('#direction-top-btn'),
    directionBottom: page.locator('#direction-bottom-btn'),
    snapInput:       page.locator('#snap-point-input'),
    snapAddBtn:      page.locator('#snap-point-add-btn'),
    snapRemoveBtn:   (value: string) =>
      page.locator(`button[aria-label="Remove snap point ${value}"]`),
  };
}

/** JS-click an element by id — bypasses Playwright's viewport visibility check. */
export async function jsClick(page: Page, id: string): Promise<void> {
  await page.evaluate(
    (elId) => (document.getElementById(elId) as HTMLElement).click(),
    id,
  );
}
