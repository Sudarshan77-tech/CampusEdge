import { test, expect } from '@playwright/test';

test.describe('Signup Page Hydration & Attribute Verification', () => {
  test('clean browser context hydrates without React hydration warnings or fdprocessedid', async ({
    page,
    request,
  }) => {
    const consoleWarnings: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // 1. Fetch raw Server-Side Rendered (SSR) HTML
    const ssrResponse = await request.get('/signup');
    expect(ssrResponse.status()).toBe(200);
    const ssrHtml = await ssrResponse.text();

    // Verify SSR HTML does not contain fdprocessedid
    expect(ssrHtml).not.toContain('fdprocessedid');

    // 2. Navigate to /signup in clean Playwright Chromium context
    await page.goto('/signup', { waitUntil: 'networkidle' });

    // 3. Inspect attributes of all form inputs in hydrated DOM
    const inputIds = ['fullName', 'email', 'password', 'confirmPassword'];
    for (const id of inputIds) {
      const input = page.locator(`#${id}`);
      await expect(input).toBeVisible();

      // Check whether fdprocessedid exists on the hydrated DOM element
      const fdprocessedid = await input.getAttribute('fdprocessedid');
      expect(fdprocessedid).toBeNull();
    }

    // Check submit button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    const btnFdprocessedid = await submitBtn.getAttribute('fdprocessedid');
    expect(btnFdprocessedid).toBeNull();

    // 4. Verify no React hydration mismatch warnings were logged
    const hydrationWarnings = consoleWarnings.filter(
      (w) =>
        w.toLowerCase().includes('hydration') ||
        w.toLowerCase().includes('did not match') ||
        w.toLowerCase().includes('server rendered html'),
    );
    const hydrationErrors = consoleErrors.filter(
      (e) =>
        e.toLowerCase().includes('hydration') ||
        e.toLowerCase().includes('did not match') ||
        e.toLowerCase().includes('server rendered html'),
    );

    expect(hydrationWarnings).toHaveLength(0);
    expect(hydrationErrors).toHaveLength(0);
  });

  test('form interaction and controlled inputs remain fully functional', async ({ page }) => {
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
    page.on('console', (msg) => console.log(`CONSOLE [${msg.type()}]:`, msg.text()));

    await page.goto('/signup', { waitUntil: 'networkidle' });

    await page.fill('#fullName', 'Jane Doe');
    await page.fill('#email', 'jane.doe@apex.edu');
    await page.fill('#password', 'Weak');
    await page.fill('#confirmPassword', 'Weak');

    // Verify password checklist updates reactively
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // Fill valid password meeting complexity requirements (10+ chars, upper, lower, digit, matching)
    await page.fill('#password', 'SecurePass2026!');
    await page.fill('#confirmPassword', 'SecurePass2026!');

    await expect(submitBtn).toBeEnabled();
  });
});
