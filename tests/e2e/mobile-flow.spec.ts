import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 812 };

test.describe('Mobile Flow', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('chat interface renders without horizontal scroll at 375px', async ({ page }) => {
    await page.goto('/');

    // Accept RGPD consent if present
    const consentButton = page.locator('[data-testid="consent-accept"]');
    if (await consentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await consentButton.click();
    }

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });

  test('suggested prompts are visible and tappable', async ({ page }) => {
    await page.goto('/');

    // Accept consent if present
    const consentButton = page.locator('[data-testid="consent-accept"]');
    if (await consentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await consentButton.click();
    }

    // Verify at least one prompt button exists and is visible
    const promptButtons = page.locator('button:has-text("kinesitherapeute")');
    await expect(promptButtons.first()).toBeVisible();

    // Verify tap target meets Apple HIG minimum (44px)
    const box = await promptButtons.first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('consent banner fits mobile viewport without horizontal scroll', async ({ page }) => {
    await page.goto('/');

    // Check consent dialog is visible on fresh load
    const banner = page.locator('[role="dialog"]');
    if (await banner.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(banner).toBeVisible();

      // Verify no horizontal overflow while banner is displayed
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(375);
    }
  });

  test('prospect URL banner does not overflow at 375px', async ({ page }) => {
    await page.goto('/');

    // Accept consent if present
    const consentButton = page.locator('[data-testid="consent-accept"]');
    if (await consentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await consentButton.click();
    }

    // The prospect URL banner appears after a conversation produces a prospectId.
    // Verify no horizontal overflow in the initial state (banner may or may not be present).
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);

    // If the URL banner element exists, verify it doesn't cause overflow
    const urlBanner = page.locator('.bg-\\[\\#A4CE4E\\]\\/10');
    if (await urlBanner.isVisible({ timeout: 1000 }).catch(() => false)) {
      const bannerBox = await urlBanner.boundingBox();
      expect(bannerBox).not.toBeNull();
      expect(bannerBox!.width).toBeLessThanOrEqual(375);
    }
  });

  test('message input is usable at 375px with adequate tap target', async ({ page }) => {
    await page.goto('/');

    // Accept consent if present
    const consentButton = page.locator('[data-testid="consent-accept"]');
    if (await consentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await consentButton.click();
    }

    // Verify input field is visible
    const input = page.locator('input[placeholder*="Decrivez"]');
    await expect(input).toBeVisible();

    // Verify submit button exists and meets 44px minimum tap target
    const submitButton = page.locator('button[aria-label="Envoyer"]');
    await expect(submitButton).toBeVisible();
    const box = await submitButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
