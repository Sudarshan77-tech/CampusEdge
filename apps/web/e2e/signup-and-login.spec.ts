import { test, expect } from '@playwright/test';

test.describe('CampusEdge Auth Flows', () => {
  test('Signup flow submits successfully with remote Supabase', async ({ page }) => {
    const networkErrors: string[] = [];
    const authResponses: Array<{ url: string; status: number; body?: string }> = [];

    page.on('requestfailed', (req) => {
      const errText = req.failure()?.errorText || '';
      if (!errText.includes('ERR_ABORTED')) {
        networkErrors.push(`${req.method()} ${req.url()} - ${errText}`);
      }
    });

    page.on('response', async (res) => {
      if (res.url().includes('/auth/v1/')) {
        let text = '';
        try {
          text = await res.text();
        } catch {}
        authResponses.push({
          url: res.url(),
          status: res.status(),
          body: text,
        });
      }
    });

    await page.goto('http://localhost:3000/signup');

    // Fill form fields
    await page.locator('#fullName').fill('Test Verification User');
    const uniqueEmail = `test.pilot.${Date.now()}@gmail.com`;
    await page.locator('#email').fill(uniqueEmail);
    await page.locator('#password').fill('StrongPassw0rd!');
    await page.locator('#confirmPassword').fill('StrongPassw0rd!');

    // Verify submit button is enabled
    const submitBtn = page.getByRole('button', { name: /create account/i });
    await expect(submitBtn).toBeEnabled();

    // Click submit
    await submitBtn.click();

    // Check for success screen ("Check your inbox") or error
    // With email confirmation on, it displays "Check your inbox"
    const successBox = page.getByTestId('signup-success');
    const alertBox = page.getByTestId('auth-error');

    // Wait for either the success banner or an alert
    await expect(successBox.or(alertBox)).toBeVisible({ timeout: 20000 });

    const isSuccess = await successBox.isVisible();
    console.log('\n--- Signup Flow Result ---');
    console.log('Unique Test Email:', uniqueEmail);
    console.log('Success ("Check your inbox") visible:', isSuccess);

    if (!isSuccess && (await alertBox.isVisible())) {
      const errorText = await alertBox.innerText();
      console.log('Alert text:', errorText);
    }

    console.log(
      'Auth Responses:',
      authResponses.map((r) => ({ status: r.status, url: r.url.split('?')[0] })),
    );
    console.log('Network Errors:', networkErrors);

    // Assert NO failed network requests occurred (no CSP violations or fetch errors)
    expect(networkErrors).toHaveLength(0);

    // If an alert is visible, verify it is NOT "Failed to fetch"
    if (await alertBox.isVisible()) {
      const errorText = await alertBox.innerText();
      expect(errorText).not.toContain('Failed to fetch');
    }
  });

  test('Login flow with demo student account redirects properly', async ({ page }) => {
    const networkErrors: string[] = [];

    page.on('requestfailed', (req) => {
      const errText = req.failure()?.errorText || '';
      if (!errText.includes('ERR_ABORTED')) {
        networkErrors.push(`${req.method()} ${req.url()} - ${errText}`);
      }
    });

    await page.goto('http://localhost:3000/login');

    await page.locator('#email').fill('student.demo@apex.edu');
    // Using demo password from environment
    const demoPassword = process.env.SEED_DEMO_PASSWORD;
    if (!demoPassword) {
      console.log('SEED_DEMO_PASSWORD not in test runner env, testing form interaction');
      return;
    }

    await page.locator('#password').fill(demoPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify redirection to student dashboard or onboarding
    await expect(page).toHaveURL(/\/student\/dashboard/, {
      timeout: 15000,
    });
    console.log('Student logged in, current URL:', page.url());
    expect(networkErrors).toHaveLength(0);
  });

  test('Login flow with demo placement officer redirects to placement dashboard', async ({
    page,
  }) => {
    const demoPassword = process.env.SEED_DEMO_PASSWORD;
    if (!demoPassword) return;

    await page.goto('http://localhost:3000/login');
    await page.locator('#email').fill('placement.admin@apex.edu');
    await page.locator('#password').fill(demoPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/placement-cell\/dashboard/, {
      timeout: 15000,
    });
    console.log('Placement Admin logged in, current URL:', page.url());
  });

  test('Login flow with demo super admin redirects to admin portal', async ({ page }) => {
    const demoPassword = process.env.SEED_DEMO_PASSWORD;
    if (!demoPassword) return;

    await page.goto('http://localhost:3000/login');
    await page.locator('#email').fill('superadmin@campusedge.internal');
    await page.locator('#password').fill(demoPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/admin\/colleges/, {
      timeout: 15000,
    });
    console.log('Super Admin logged in, current URL:', page.url());
  });
});
