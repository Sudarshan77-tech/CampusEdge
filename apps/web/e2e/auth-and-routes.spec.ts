import { test, expect } from '@playwright/test';

test.describe('Public Routes & Accessibility', () => {
  test('Home page renders with Phase 1 branding and legal links', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CampusEdge/i);
    await expect(page.locator('h1')).toContainText(
      'Targeted preparation tailored to your campus hiring history',
    );
    await expect(page.getByText('Phase 1', { exact: true })).toBeVisible();
    await expect(page.locator('text=Privacy Policy (DPDP)')).toBeVisible();
    await expect(page.locator('text=Terms of Service')).toBeVisible();
  });

  test('Public routes are accessible without authentication', async ({ page }) => {
    const publicRoutes = [
      '/login',
      '/signup',
      '/forgot-password',
      '/privacy',
      '/terms',
      '/grievance',
      '/status',
    ];

    for (const route of publicRoutes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      expect(page.url()).toContain(route);
    }
  });

  test('Legal pages prominently show DRAFT disclaimer', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('text=LEGAL DISCLAIMER:')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Privacy Policy');

    await page.goto('/terms');
    await expect(page.locator('text=LEGAL DISCLAIMER:')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Terms of Service');

    await page.goto('/grievance');
    await expect(page.locator('text=LEGAL DISCLAIMER:')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Grievance Redressal');
  });
});

test.describe('Authentication Validation', () => {
  test('Signup validates password complexity criteria', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('#fullName', 'Test Student');
    await page.fill('#email', 'test.student@apex.edu');
    await page.fill('#password', 'simple');
    await page.fill('#confirmPassword', 'simple');

    // Submit button should be disabled because password requirements are not met
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // Fill valid strong password
    await page.fill('#password', 'ValidPass123!');
    await page.fill('#confirmPassword', 'ValidPass123!');

    // Submit button should now be enabled
    await expect(submitBtn).toBeEnabled();
  });

  test('Protected routes redirect unauthenticated users to login', async ({ page }) => {
    const protectedRoutes = [
      '/student/dashboard',
      '/student/profile',
      '/placement-cell/dashboard',
      '/admin/colleges',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`/login\\?redirectTo=${encodeURIComponent(route)}`));
    }
  });
});
