import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const demoPassword = process.env.SEED_DEMO_PASSWORD || '';

test.describe('CampusEdge Comprehensive Sitemap Smoke Tests', () => {
  test.setTimeout(90000);

  test.beforeAll(() => {
    expect(demoPassword, 'SEED_DEMO_PASSWORD must be configured').toBeTruthy();
  });

  test.describe('Student Role Routes', () => {
    const studentRoutes = [
      '/student/dashboard',
      '/student/profile',
      '/student/drives',
      '/student/experiences',
      '/student/notices',
      '/student/companies',
    ];

    test('Authenticate and smoke test all Student routes', async ({ page }) => {
      const consoleErrors: string[] = [];
      const failedRequests: Array<{ url: string; status: number }> = [];

      page.on('console', (msg) => {
        const text = msg.text();
        if (
          msg.type() === 'error' ||
          text.includes('Failed to fetch') ||
          text.includes('CORS') ||
          text.includes('Content Security Policy') ||
          text.includes('TypeError')
        ) {
          consoleErrors.push(text);
        }
      });

      page.on('response', (res) => {
        if (
          res.status() >= 500 ||
          (res.status() === 404 && res.url().includes('_next/static/chunks'))
        ) {
          failedRequests.push({ url: res.url(), status: res.status() });
        }
      });

      // 1. Login as Student
      await page.goto('/login');
      await page.locator('#email').fill('student.demo@apex.edu');
      await page.locator('#password').fill(demoPassword);
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 15000 });

      // 2. Capture desktop and mobile screenshots of /student/dashboard
      const resultsDir = path.resolve(__dirname, '../test-results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      // Desktop screenshot (1440x900)
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.screenshot({
        path: path.join(resultsDir, 'student-dashboard-desktop.png'),
        fullPage: true,
      });

      // Mobile screenshot (360x800)
      await page.setViewportSize({ width: 360, height: 800 });
      await page.screenshot({
        path: path.join(resultsDir, 'student-dashboard-mobile.png'),
        fullPage: true,
      });

      // Restore desktop size
      await page.setViewportSize({ width: 1440, height: 900 });

      // 3. Visit every student route
      for (const route of studentRoutes) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');

        expect(page.url()).toContain(route);

        await expect(page.locator('h1').first()).toBeVisible();
        const content = page.locator('main, [class*="container"], [role="main"]').first();
        await expect(content).toBeVisible();
        const contentText = await content.innerText();
        expect(contentText.trim().length).toBeGreaterThan(10);

        const fatalErrors = consoleErrors.filter(
          (err) =>
            err.includes('Failed to fetch') ||
            err.includes('CORS') ||
            err.includes('Content Security Policy') ||
            err.includes('ChunkLoadError') ||
            err.includes('Loading chunk'),
        );
        expect(fatalErrors).toEqual([]);
      }

      expect(failedRequests).toEqual([]);
    });
  });

  test.describe('Placement Cell Role Routes', () => {
    const placementRoutes = [
      '/placement-cell/dashboard',
      '/placement-cell/drives',
      '/placement-cell/students',
      '/placement-cell/companies',
      '/placement-cell/experiences',
      '/placement-cell/notices',
      '/placement-cell/seasons',
      '/placement-cell/settings',
      '/placement-cell/audit',
      '/placement-cell/intelligence',
      '/placement-cell/import',
    ];

    test('Authenticate and smoke test all Placement Cell routes', async ({ page }) => {
      const consoleErrors: string[] = [];
      const failedRequests: Array<{ url: string; status: number }> = [];

      page.on('console', (msg) => {
        const text = msg.text();
        if (
          msg.type() === 'error' ||
          text.includes('Failed to fetch') ||
          text.includes('CORS') ||
          text.includes('Content Security Policy') ||
          text.includes('TypeError')
        ) {
          consoleErrors.push(text);
        }
      });

      page.on('response', (res) => {
        if (
          res.status() >= 500 ||
          (res.status() === 404 && res.url().includes('_next/static/chunks'))
        ) {
          failedRequests.push({ url: res.url(), status: res.status() });
        }
      });

      // 1. Login as Placement Admin
      await page.goto('/login');
      await page.locator('#email').fill('placement.admin@apex.edu');
      await page.locator('#password').fill(demoPassword);
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/placement-cell\/dashboard/, { timeout: 15000 });

      // 2. Visit every placement-cell route
      for (const route of placementRoutes) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');

        expect(page.url()).toContain(route);

        await expect(page.locator('h1').first()).toBeVisible();
        const content = page.locator('main, [class*="container"], [role="main"]').first();
        await expect(content).toBeVisible();
        const contentText = await content.innerText();
        expect(contentText.trim().length).toBeGreaterThan(10);

        const fatalErrors = consoleErrors.filter(
          (err) =>
            err.includes('Failed to fetch') ||
            err.includes('CORS') ||
            err.includes('Content Security Policy') ||
            err.includes('ChunkLoadError') ||
            err.includes('Loading chunk'),
        );
        expect(fatalErrors).toEqual([]);
      }

      expect(failedRequests).toEqual([]);
    });
  });

  test.describe('Super Admin Role Routes', () => {
    const adminRoutes = [
      '/admin/colleges',
      '/admin/users',
      '/admin/companies',
      '/admin/experiences',
      '/admin/topics',
      '/admin/audit',
    ];

    test('Authenticate and smoke test all Super Admin routes', async ({ page }) => {
      const consoleErrors: string[] = [];
      const failedRequests: Array<{ url: string; status: number }> = [];

      page.on('console', (msg) => {
        const text = msg.text();
        if (
          msg.type() === 'error' ||
          text.includes('Failed to fetch') ||
          text.includes('CORS') ||
          text.includes('Content Security Policy') ||
          text.includes('TypeError')
        ) {
          consoleErrors.push(text);
        }
      });

      page.on('response', (res) => {
        if (
          res.status() >= 500 ||
          (res.status() === 404 && res.url().includes('_next/static/chunks'))
        ) {
          failedRequests.push({ url: res.url(), status: res.status() });
        }
      });

      // 1. Login as Super Admin
      await page.goto('/login');
      await page.locator('#email').fill('superadmin@campusedge.internal');
      await page.locator('#password').fill(demoPassword);
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/admin\//, { timeout: 15000 });

      // 2. Visit every admin route
      for (const route of adminRoutes) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');

        expect(page.url()).toContain(route);

        await expect(page.locator('h1').first()).toBeVisible();
        const content = page.locator('main, [class*="container"], [role="main"]').first();
        await expect(content).toBeVisible();
        const contentText = await content.innerText();
        expect(contentText.trim().length).toBeGreaterThan(10);

        const fatalErrors = consoleErrors.filter(
          (err) =>
            err.includes('Failed to fetch') ||
            err.includes('CORS') ||
            err.includes('Content Security Policy') ||
            err.includes('ChunkLoadError') ||
            err.includes('Loading chunk'),
        );
        expect(fatalErrors).toEqual([]);
      }

      expect(failedRequests).toEqual([]);
    });
  });
});
