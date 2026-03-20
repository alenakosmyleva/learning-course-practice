import { test } from '@playwright/test';

test('Demo: role-based access, add user, and reassign role', async ({ page }) => {
  // --- 1. Open the prototype on the Dashboard ---
  await page.goto('/');
  await page.waitForTimeout(2000);

  // --- 2. Navigate to Users page to show the baseline (Admin view) ---
  await page.click('a[routerLink="/list"]');
  await page.waitForTimeout(2000);

  // --- 3. Switch to a Viewer user — Carol White ---
  await page.locator('nav select[aria-label="Current user"]').selectOption('3');
  await page.waitForTimeout(2000);

  // The Actions column and Edit/Delete buttons should now be hidden

  // --- 4. Switch back to Admin — Alice Johnson ---
  await page.locator('nav select[aria-label="Current user"]').selectOption('1');
  await page.waitForTimeout(2000);

  // The Actions column with Edit/Delete buttons should now be visible again

  // --- 5. Navigate to Add User (Onboarding wizard) ---
  await page.click('a[routerLink="/onboarding"]');
  await page.waitForTimeout(1500);

  // Step 1: Fill in personal information
  await page.fill('input[placeholder="Enter full name"]', 'Test User');
  await page.waitForTimeout(800);
  await page.fill('input[placeholder="Enter email address"]', 'test@example.com');
  await page.waitForTimeout(1000);

  // Click Next to go to Step 2
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(1500);

  // Step 2: Select role — Admin
  await page.locator('.step-content select').selectOption('Admin');
  await page.waitForTimeout(1000);

  // Click Next to go to Step 3
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(2000);

  // Step 3: Review — show the summary, then create the user
  await page.click('button:has-text("Create User")');
  await page.waitForTimeout(2000);

  // After creation, we are automatically redirected to the Users list
  // The new "Test User" should be visible in the table

  // --- 6. Go to Settings to reassign the new user's role ---
  await page.click('a[routerLink="/settings"]');
  await page.waitForTimeout(2000);

  // Hover over the Test User row to reveal the role selector
  const testUserRow = page.locator('tr', { hasText: 'Test User' });
  await testUserRow.hover();
  await page.waitForTimeout(1000);

  // Change role from Admin to Viewer
  await testUserRow.locator('select').selectOption('Viewer');
  await page.waitForTimeout(1000);

  // Move mouse away to confirm the change
  await page.locator('h2').hover();
  await page.waitForTimeout(2000);

  // --- 7. Go back to Users list to confirm the role was changed ---
  await page.click('a[routerLink="/list"]');
  await page.waitForTimeout(2000);
});
