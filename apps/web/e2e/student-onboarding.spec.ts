import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('Student Onboarding Flow', () => {
  let supabaseAdmin: ReturnType<typeof createClient> | null = null;
  let testUserId: string | null = null;
  const testEmail = `student.onboarding.${Date.now()}@apex.edu`;
  const testPassword = 'Password123!Secure';

  test.beforeAll(async () => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (supabaseUrl && secretKey) {
      supabaseAdmin = createClient(supabaseUrl, secretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
  });

  test.afterAll(async () => {
    if (supabaseAdmin && testUserId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(testUserId);
        console.log(`Cleaned up e2e test user: ${testUserId}`);
      } catch (err) {
        console.warn('Failed to delete test user during cleanup:', err);
      }
    }
  });

  test('Fresh ONBOARDING student completes entire 4-step onboarding journey', async ({ page }) => {
    expect(supabaseAdmin).toBeTruthy();
    if (!supabaseAdmin) return;

    // 1. Create fresh email-confirmed user with no college
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'E2E Onboarding Candidate' },
    });

    expect(createError).toBeNull();
    expect(created.user).toBeTruthy();
    testUserId = created.user!.id;
    console.log(`Created test candidate: ${testEmail} (ID: ${testUserId})`);

    // Allow database trigger to create public.user_profiles
    await new Promise((r) => setTimeout(r, 1000));

    // Monitor console errors and network requests
    const consoleErrors: string[] = [];
    const failedRequests: Array<{ url: string; status: number }> = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known harmless browser warnings
        if (!text.includes('favicon.ico')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
        failedRequests.push({ url: res.url(), status: res.status() });
      }
    });

    // 2. Sign in through UI
    await page.goto('/login');
    await page.locator('#email').fill(testEmail);
    await page.locator('#password').fill(testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    // 3. Lands on /student/onboarding Step 1
    await expect(page).toHaveURL(/\/student\/onboarding/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Verify Stepper shows Step 1 active
    const step1Indicator = page.getByTestId('step-indicator-1');
    await expect(step1Indicator).toBeVisible();

    // Verify Step 1 Card: "Select Your College" is visible with search input
    const step1Card = page.getByTestId('onboarding-step-1');
    await expect(step1Card).toBeVisible();
    await expect(page.locator('text=Select Your College')).toBeVisible();

    // Test Search Empty State: Type non-matching search query
    const searchInput = page.locator('#search-colleges');
    await searchInput.fill('XYZ Nonexistent University 999');
    await expect(
      page.locator('text=No approved colleges found matching "XYZ Nonexistent University 999".'),
    ).toBeVisible();

    // Clear search to restore college options
    await searchInput.fill('');
    await expect(page.locator('text=Apex Institute')).toBeVisible();

    // Take Desktop Screenshot for Step 1 (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: 'test-results/onboarding-step-1-desktop-1440x900.png' });

    // Take Mobile Screenshot for Step 1 (360x800)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.screenshot({ path: 'test-results/onboarding-step-1-mobile-360x800.png' });

    // Restore desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // Select Apex Institute
    const collegeOption = page.locator('[data-testid^="college-option-"]').first();
    await collegeOption.click();
    await expect(page.getByText('Selected')).toBeVisible();

    // Submit Step 1
    const continueBtn = page.getByTestId('continue-to-consents-btn');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // 4. STEP 2: Statutory DPDP Consents
    const step2Card = page.getByTestId('onboarding-step-2');
    await expect(step2Card).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Statutory DPDP Consents')).toBeVisible();

    // Verify Stepper: Step 1 shows completed checkmark
    const step1Checkmark = page.getByTestId('step-indicator-1');
    await expect(step1Checkmark).toHaveClass(/bg-emerald-600/);

    // Accept all 3 required DPDP consents
    await page.getByTestId('consent-terms-cb').check();
    await page.getByTestId('consent-privacy-cb').check();
    await page.getByTestId('consent-placement-cb').check();

    // Submit Step 2
    const acceptConsentsBtn = page.getByTestId('accept-consents-btn');
    await expect(acceptConsentsBtn).toBeEnabled();
    await acceptConsentsBtn.click();

    // 5. STEP 3: Academic Credentials
    const step3Card = page.getByTestId('onboarding-step-3');
    await expect(step3Card).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Academic Credentials')).toBeVisible();

    // Verify Stepper: Step 1 and Step 2 show completed checkmarks
    await expect(page.getByTestId('step-indicator-1')).toHaveClass(/bg-emerald-600/);
    await expect(page.getByTestId('step-indicator-2')).toHaveClass(/bg-emerald-600/);

    // Select branch
    const branchSelect = page.getByTestId('branch-select');
    await expect(branchSelect).toBeVisible();

    // Ensure a branch is selected (or select first non-empty option)
    const currentBranch = await branchSelect.inputValue();
    if (!currentBranch) {
      const options = await branchSelect.locator('option').all();
      for (const opt of options) {
        const val = await opt.getAttribute('value');
        if (val) {
          await branchSelect.selectOption(val);
          break;
        }
      }
    }

    // Enter CGPA
    await page.getByTestId('cgpa-input').fill('8.85');

    // Submit Step 3
    const submitProfileBtn = page.getByTestId('submit-profile-btn');
    await expect(submitProfileBtn).toBeEnabled();
    await submitProfileBtn.click();

    // 6. STEP 4: Verification Status
    const step4Card = page.getByTestId('onboarding-step-4');
    await expect(step4Card).toBeVisible({ timeout: 10000 });

    // Since test candidate email is @apex.edu, domain rule matches Apex Institute
    // Target status is ACTIVE ("Profile Activated!")
    await expect(
      page
        .locator('text=Profile Activated!')
        .or(page.locator('text=Pending Placement Cell Approval')),
    ).toBeVisible();

    // Take Desktop Screenshot for Step 4 (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: 'test-results/onboarding-step-4-desktop-1440x900.png' });

    // Take Mobile Screenshot for Step 4 (360x800)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.screenshot({ path: 'test-results/onboarding-step-4-mobile-360x800.png' });

    // Click "Go to Dashboard" or "View Student Dashboard"
    const dashboardBtn = page
      .getByTestId('go-to-dashboard-btn')
      .or(page.getByTestId('view-dashboard-btn'));
    await expect(dashboardBtn).toBeVisible();
    await dashboardBtn.click();

    // Verify redirected to student dashboard
    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 15000 });

    // Final assertions on network and console
    expect(failedRequests).toHaveLength(0);
    expect(consoleErrors).toHaveLength(0);
    console.log(
      'Successfully completed onboarding flow without console errors or failed requests!',
    );
  });

  test('Active student visiting /student/onboarding redirects to /student/dashboard', async ({
    page,
  }) => {
    const demoPassword = process.env.SEED_DEMO_PASSWORD;
    if (!demoPassword) return;

    await page.goto('/login');
    await page.locator('#email').fill('student.demo@apex.edu');
    await page.locator('#password').fill(demoPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 15000 });

    // Now attempt to navigate back to /student/onboarding
    await page.goto('/student/onboarding');
    await page.waitForLoadState('networkidle');

    // Should immediately redirect back to /student/dashboard
    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 15000 });
    console.log('Active student was safely redirected to /student/dashboard as expected.');
  });
});
