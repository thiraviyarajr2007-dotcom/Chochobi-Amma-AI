import { test, expect } from '@playwright/test';
import axe from 'axe-core';

test.describe('Accessibility Audits (WCAG AA Compliance)', () => {
  const routesToAudit = [
    '/welcome',
    '/design',
    '/lock',
  ];

  for (const route of routesToAudit) {
    test(`Route ${route} should pass axe accessibility checks with 0 critical violations`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Inject and run axe-core
      const results = await page.evaluate(async () => {
        // @ts-ignore
        if (typeof axe === 'undefined') {
          // If axe not in window, evaluate script source
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js';
          document.head.appendChild(script);
          await new Promise((resolve) => (script.onload = resolve));
        }
        // @ts-ignore
        return await axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa'],
          },
        });
      });

      const criticalViolations = results.violations.filter(
        (v: any) => v.impact === 'critical'
      );

      expect(criticalViolations).toEqual([]);
    });
  }
});

