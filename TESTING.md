# 🧪 Testing Guide — Chocobi Amma AI

This document outlines the testing architecture, automated test suites, accessibility checks, and manual QA procedures for **Chocobi Amma AI (சோகோபி அம்மா AI)**.

---

## 📋 Test Suites Overview

| Suite | Runner | Target | Coverage / Focus | Command |
| :--- | :--- | :--- | :--- | :--- |
| **Unit & Integration** | Vitest | Node / Happy-DOM | Security PIN crypto, 60s auto-lock, escalating lockout, offline regex parser, budget analytics, i18n 100% key parity | `npm test` |
| **E2E Integration** | Playwright | Mobile Chromium (390x844) | 9 user flows: onboarding, lock/unlock, manual expense, voice parse, scam shield, quest, i18n, delete data | `npm run e2e` |
| **Accessibility (a11y)** | axe-core + Playwright | Mobile Viewport | WCAG 2.1 AA compliance, color contrast, tap targets ≥ 56px, aria-labels | `npx playwright test tests/accessibility.spec.ts` |
| **Lighthouse CI** | LHCI | Mobile Emulation | Performance ≥ 85, Accessibility ≥ 90, PWA installability | `npx lhci autorun` |
| **Type Check** | TypeScript | Strict | Zero compilation warnings or errors | `npm run typecheck` |

---

## 🚀 Running Tests Locally

### 1. Run Unit & Integration Tests (Vitest)
```bash
npm test
```
Runs 25+ unit and integration tests verifying:
- **Salted SHA-256 WebCrypto PIN verification**
- **Escalating cooldown lockout** (30s after 5 failed attempts)
- **Offline voice regex parsing** for Tamil, Tanglish, and English
- **Budget status calculators** (normal, caution at 80%, exceeded at 100%)
- **i18n dictionary parity**: checks that every single key in `ta.json` exists in `en.json` and vice-versa.

### 2. Run TypeScript Static Analysis
```bash
npm run typecheck
```
Ensures 100% clean TypeScript build with strict types.

### 3. Run Playwright Mobile E2E Tests
```bash
# Run headless
npm run e2e

# Run with interactive UI
npx playwright test --ui
```
Simulates a real mobile viewport (390px × 844px) matching standard Tamil mother smartphones. Tests:
1. `(a)` First-run: Language selection -> 4-digit PIN setup -> Biometric prompt -> Home screen
2. `(b)` App Lock: 5 incorrect PINs trigger cooldown timer, correct PIN immediately unlocks
3. `(c)` Deep link protection: direct navigation to `/expenses` is intercepted by `/lock`, unlocking resumes `/expenses`
4. `(d)` Manual expense entry: category selector, numeric input, note, save to IndexedDB
5. `(e)` Voice expense flow with mocked Gemini `/api/parse-expense` -> confirmation card -> save
6. `(f)` Scam Shield fraud detection with red/amber/green verdict and 1930 Cyber helpline card
7. `(g)` Chocobi Quest savings piggy bank, kids profile, chore approval
8. `(h)` Language switcher persistence in `localStorage`
9. `(i)` Delete all data factory reset flow

### 4. Run Axe-Core Accessibility Check
```bash
npx playwright test tests/accessibility.spec.ts
```
Verifies WCAG 2.1 AA compliance on all main screens.

---

## 📑 Manual Usability Checklist

For non tech-savvy Tamil mothers (ages 30–60), run through the 10 real-world scenarios detailed in [`tests/manual-checklist.md`](./tests/manual-checklist.md).

