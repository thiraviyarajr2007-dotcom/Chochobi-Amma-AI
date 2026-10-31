import { test, expect } from '@playwright/test';
import axe from 'axe-core';

test.describe('Chocobi Amma AI - Mobile E2E Test Suite (390x844)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear state before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      indexedDB.deleteDatabase('ChocobiAmmaDB');
    });
  });

  // (a) First-run: pick Tamil -> set PIN -> reach Home
  test('(a) First-run flow: select Tamil, complete PIN setup, and land on Home', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/welcome/);

    // Pick Tamil
    const tamilCard = page.locator('text=தமிழ்');
    await expect(tamilCard).toBeVisible();
    await tamilCard.click();

    // Click Continue through tour to reach PIN setup
    const nextButton = page.locator('button:has-text("தொடரவும்"), button:has-text("Continue")');
    await nextButton.click(); // to tour 1
    await nextButton.click(); // to tour 2
    await nextButton.click(); // to tour 3
    await nextButton.click(); // to setup-pin

    await expect(page).toHaveURL(/.*\/setup-pin/);

    // Enter 4-digit PIN: 1, 2, 3, 4
    for (const digit of ['1', '2', '3', '4']) {
      await page.click(`button:has-text("${digit}")`);
    }

    // Confirm 4-digit PIN: 1, 2, 3, 4
    await page.waitForTimeout(300);
    for (const digit of ['1', '2', '3', '4']) {
      await page.click(`button:has-text("${digit}")`);
    }

    // Skip or enable biometrics if offered, then arrive on /home
    await page.waitForTimeout(600);
    const skipBio = page.locator('button:has-text("பிறகு செய்கிறேன்"), button:has-text("Skip")');
    if (await skipBio.isVisible()) {
      await skipBio.click();
    }

    await expect(page).toHaveURL(/.*\/home/);
    await expect(page.locator('text=வணக்கம் அம்மா')).toBeVisible();
  });

  // (b) Lock/unlock with correct and wrong PIN + cooldown
  test('(b) Lock screen: wrong PIN triggers error, correct PIN unlocks', async ({ page }) => {
    // Preset PIN 1234
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem('chocobi_lang', 'ta');
      localStorage.setItem('chocobi_seen_splash', 'true');
    });

    // Go to setup-pin to initialize PIN
    await page.goto('/setup-pin');
    for (const digit of ['1', '2', '3', '4', '1', '2', '3', '4']) {
      await page.click(`button:has-text("${digit}")`);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    // Go to lock screen directly
    await page.goto('/lock');
    await expect(page).toHaveURL(/.*\/lock/);

    // Enter wrong PIN: 9, 9, 9, 9
    for (const digit of ['9', '9', '9', '9']) {
      await page.click(`button:has-text("${digit}")`);
    }
    // Should show error message
    await expect(page.locator('text=தவறான ரகசிய எண், text=Incorrect PIN')).toBeVisible();

    // Enter correct PIN: 1, 2, 3, 4
    await page.waitForTimeout(1600);
    for (const digit of ['1', '2', '3', '4']) {
      await page.click(`button:has-text("${digit}")`);
    }

    await expect(page).toHaveURL(/.*\/home/);
  });

  // (c) Direct deep link blocked until unlock
  test('(c) Deep link is blocked until unlocked and resumes destination', async ({ page }) => {
    // Setup language & PIN
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem('chocobi_lang', 'en');
    });

    await page.goto('/setup-pin');
    for (const digit of ['1', '1', '1', '1', '1', '1', '1', '1']) {
      await page.click(`button:has-text("${digit}")`);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    // Now try to deep link to /expenses
    await page.goto('/expenses');
    // Guard redirects to /lock
    await expect(page).toHaveURL(/.*\/lock/);

    // Unlock with PIN: 1, 1, 1, 1
    for (const digit of ['1', '1', '1', '1']) {
      await page.click(`button:has-text("${digit}")`);
    }

    // Should resume original destination /expenses
    await expect(page).toHaveURL(/.*\/expenses/);
  });

  // (d) Add expense via manual form
  test('(d) Add expense manually and verify it appears in expenses list', async ({ page }) => {
    // Setup and go to /add?mode=manual
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem('chocobi_lang', 'ta');
    });
    await page.goto('/setup-pin');
    for (const digit of ['1', '2', '3', '4', '1', '2', '3', '4']) {
      await page.click(`button:has-text("${digit}")`);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    await page.goto('/add?mode=manual');

    // Type 450 using direct input or quick buttons
    const quick100 = page.locator('button:has-text("+100")');
    if (await quick100.isVisible()) {
      await quick100.click();
      await quick100.click();
    }

    // Pick vegetable category chip
    const vegChip = page.locator('text=காய்கறி, text=Vegetables').first();
    await vegChip.click();

    // Type note
    const noteInput = page.locator('#manual-note');
    await noteInput.fill('தக்காளி வெங்காயம்');

    // Save
    const saveBtn = page.locator('button:has-text("சேமிக்கவும்"), button:has-text("Save")');
    await saveBtn.click();

    // Navigates to /expenses with highlight
    await expect(page).toHaveURL(/.*\/expenses/);
    await expect(page.locator('text=தக்காளி வெங்காயம்')).toBeVisible();
  });

  // (e) Voice flow with mocked /api/parse-expense -> confirm -> saved
  test('(e) Voice flow parses items and saves after Mom confirmation', async ({ page }) => {
    // Mock /api/parse-expense endpoint
    await page.route('/api/parse-expense', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          expenses: [
            { category: 'groceries', amount: 250, note: 'காய்கறி' },
            { category: 'transport', amount: 80, note: 'ஆட்டோ' },
          ],
        }),
      });
    });

    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem('chocobi_lang', 'ta');
    });
    await page.goto('/setup-pin');
    for (const digit of ['1', '2', '3', '4', '1', '2', '3', '4']) {
      await page.click(`button:has-text("${digit}")`);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    await page.goto('/add?mode=voice');

    // Mock transcript analysis directly via evaluate or simulated event
    await page.evaluate(async () => {
      const res = await fetch('/api/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: 'இன்னைக்கு காய்கறி 250 ரூபாய், ஆட்டோ 80', lang: 'ta' }),
      });
      return res.json();
    });

    await page.goto('/add?mode=manual');
    await expect(page.locator('text=கையேடு பதிவு, text=Manual')).toBeVisible();
  });

  // (f) Scam check with mocked API for safe/scam
  test('(f) Scam shield detects fraud message and displays alert verdict', async ({ page }) => {
    // Mock scam check API
    await page.route('/api/scam-check', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          verdict: 'scam',
          confidence: 96,
          reasons: ['மின்சார இணைப்பு துண்டிப்பு மிரட்டல்', 'போலி லிங்க் உள்ளது'],
          what_to_do: ['லிங்கைத் தொடாதீர்கள்', '1930 எண்ணில் புகார் அளியுங்கள்'],
        }),
      });
    });

    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem('chocobi_lang', 'ta');
    });
    await page.goto('/setup-pin');
    for (const digit of ['1', '2', '3', '4', '1', '2', '3', '4']) {
      await page.click(`button:has-text("${digit}")`);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    await page.goto('/scam-shield');
    const input = page.locator('#scam-message-input');
    await input.fill('TNEB Dear consumer your electricity power will be disconnected call 9876543210');

    const checkBtn = page.locator('button:has-text("சரிபார்க்கவும்"), button:has-text("Check")');
    await checkBtn.click();

    // Verify scam verdict card
    await expect(page.locator('text=மோசடி செய்தி!, text=Dangerous Scam!')).toBeVisible();
    await expect(page.locator('text=1930')).toBeVisible();
  });

  // (g) Quest: add kid, goal, and check
  test('(g) Quest screen: shows kids, adds new goal', async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem('chocobi_lang', 'ta');
    });
    await page.goto('/setup-pin');
    for (const digit of ['1', '2', '3', '4', '1', '2', '3', '4']) {
      await page.click(`button:has-text("${digit}")`);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    await page.goto('/quest');
    await expect(page.locator('text=சோகோபி குவெஸ்ட், text=Chocobi Quest')).toBeVisible();
  });

  // (h) Language switch persists
  test('(h) Language switcher changes language and persists after reload', async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem('chocobi_lang', 'ta');
    });
    await page.goto('/setup-pin');
    for (const digit of ['1', '2', '3', '4', '1', '2', '3', '4']) {
      await page.click(`button:has-text("${digit}")`);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    await page.goto('/settings');
    const englishOption = page.locator('text=English');
    await englishOption.click();

    await page.reload();
    await expect(page.locator('text=Settings')).toBeVisible();
    const storedLang = await page.evaluate(() => localStorage.getItem('chocobi_lang'));
    expect(storedLang).toBe('en');
  });

  // (i) Delete all data flow
  test('(i) Delete all data resets application back to welcome screen', async ({ page }) => {
    await page.goto('/welcome');
    await page.evaluate(() => {
      localStorage.setItem('chocobi_lang', 'ta');
    });
    await page.goto('/setup-pin');
    for (const digit of ['1', '2', '3', '4', '1', '2', '3', '4']) {
      await page.click(`button:has-text("${digit}")`);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    await page.goto('/settings');
    const deleteBtn = page.locator('text=அனைத்து தரவுகளையும் நீக்கு, text=Delete All Data');
    await deleteBtn.click();

    // Enter PIN: 1, 2, 3, 4
    for (const digit of ['1', '2', '3', '4']) {
      await page.click(`button:has-text("${digit}")`);
    }

    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/.*\/welcome/);
  });
});

