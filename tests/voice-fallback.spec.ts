import { test, expect } from '@playwright/test';

test.describe('Voice Expense & Fallback Recorder (390x844)', () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

  test('Voice screen displays status chip, allows manual mode toggle to Cloud, and shows voice components', async ({
    page,
  }) => {
    // 1. First-run onboarding flow
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('chocobi_lang', 'ta');
    });

    await page.goto('/setup-pin');

    // First PIN: 1, 2, 3, 4
    for (const digit of ['1', '2', '3', '4']) {
      await page.click(`button:has-text("${digit}")`);
      await page.waitForTimeout(60);
    }
    // PinPad clears internal buffer after 600ms
    await page.waitForTimeout(750);

    // Confirm PIN: 1, 2, 3, 4
    for (const digit of ['1', '2', '3', '4']) {
      await page.click(`button:has-text("${digit}")`);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(750);

    // Skip biometrics if offered
    const skipBio = page.locator('button:has-text("பிறகு செய்கிறேன்"), button:has-text("Skip")');
    if (await skipBio.isVisible()) {
      await skipBio.click();
      await page.waitForTimeout(500);
    }

    // 2. Navigate to /add?mode=voice
    await page.goto('/add?mode=voice');
    await page.waitForTimeout(500);

    // If redirected to /lock, enter PIN to unlock
    if (page.url().includes('/lock')) {
      for (const digit of ['1', '2', '3', '4']) {
        await page.click(`button:has-text("${digit}")`);
        await page.waitForTimeout(60);
      }
      await page.waitForTimeout(700);
    }

    await expect(page).toHaveURL(/.*\/add\?mode=voice/);

    // Verify Mascot is visible
    const mascot = page.locator('svg').first();
    await expect(mascot).toBeVisible();

    // Verify 3 tabs are present (Voice, Manual, Scan)
    await expect(page.locator('button:has-text("குரல் வழி")')).toBeVisible();
    await expect(page.locator('button:has-text("நேரடி பதிவு")')).toBeVisible();
    await expect(page.locator('button:has-text("பில் ஸ்கேன்")')).toBeVisible();

    // Verify status chip exists (matches either Browser or Cloud indicator)
    const statusChip = page.getByText(/குரல்:|Voice:/).first();
    await expect(statusChip).toBeVisible();

    // If in Browser mode, toggle button allows switching to Cloud recorder mode
    const toggleToCloud = page.locator('button:has-text("ரெக்கார்டர்"), button:has-text("recorder")');
    if (await toggleToCloud.isVisible()) {
      await toggleToCloud.click();
      await page.waitForTimeout(300);
      // Now it should show Cloud mode
      await expect(page.getByText('கிளவுட்').or(page.getByText('Cloud'))).toBeVisible();
    }

    // Verify "How to speak" example prompt card is present
    await expect(page.locator('text=எப்படிப் பேசுவது')).toBeVisible();
  });
});
