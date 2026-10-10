import { test, expect } from '@playwright/test';

function redactSecrets(str: string): string {
  // Redact JWTs and keys
  return str
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]')
    .replace(/sb_publishable_[a-zA-Z0-9_-]+/g, '[REDACTED_PUBLISHABLE_KEY]')
    .replace(/sb_secret_[a-zA-Z0-9_-]+/g, '[REDACTED_SECRET_KEY]')
    .replace(/apikey=[a-zA-Z0-9_.-]+/g, 'apikey=[REDACTED]');
}

test('Capture real failure on /signup submission', async ({ page }) => {
  const consoleMessages: Array<{ type: string; text: string }> = [];
  const failedRequests: Array<{ url: string; method: string; failure: string | null }> = [];
  const allRequests: Array<{ url: string; method: string; status?: number }> = [];

  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: redactSecrets(msg.text()),
    });
  });

  page.on('pageerror', (err) => {
    consoleMessages.push({
      type: 'pageerror',
      text: redactSecrets(err.message),
    });
  });

  page.on('requestfailed', (request) => {
    failedRequests.push({
      url: redactSecrets(request.url()),
      method: request.method(),
      failure: request.failure()?.errorText || 'Unknown failure',
    });
  });

  page.on('response', (response) => {
    allRequests.push({
      url: redactSecrets(response.url()),
      method: response.request().method(),
      status: response.status(),
    });
  });

  console.log('\n--- Navigating to http://localhost:3000/signup ---');
  await page.goto('http://localhost:3000/signup', { waitUntil: 'networkidle' });

  console.log('--- Filling signup form ---');
  await page.fill('#fullName', 'Sudhrshan Dighe');
  await page.fill('#email', 'sudhrshandighe@gmail.com');
  await page.fill('#password', 'SecurePassword123!');
  await page.fill('#confirmPassword', 'SecurePassword123!');

  const submitBtn = page.locator('button[type="submit"]');
  await expect(submitBtn).toBeEnabled();

  console.log('--- Clicking Create Account button ---');
  await submitBtn.click();

  // Wait a short moment for async auth call to complete or fail
  await page.waitForTimeout(4000);

  const errorBox = page.locator('[role="alert"]');
  const hasError = await errorBox.isVisible().catch(() => false);
  let errorText = '';
  if (hasError) {
    errorText = (await errorBox.innerText()).trim();
  }

  console.log('\n=== REPRODUCTION REPORT ===');
  console.log('Error Box Visible:', hasError);
  console.log('Error Box Text:', errorText);

  console.log('\n--- Failed Requests (' + failedRequests.length + ') ---');
  for (const fr of failedRequests) {
    console.log(`FAILED: [${fr.method}] ${fr.url} -> Reason: ${fr.failure}`);
  }

  console.log('\n--- Console Messages (' + consoleMessages.length + ') ---');
  for (const cm of consoleMessages) {
    console.log(`[${cm.type}] ${cm.text}`);
  }

  console.log('\n--- All Network Responses (' + allRequests.length + ') ---');
  for (const req of allRequests) {
    console.log(`[${req.method}] ${req.url} -> Status: ${req.status}`);
  }
  console.log('===========================\n');
});
