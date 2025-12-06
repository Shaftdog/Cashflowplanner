import { test, expect } from '@playwright/test';
import { format, subDays } from 'date-fns';

/**
 * E2E Test: Overdue Items Persistence After Refresh
 *
 * Bug Fix Verification:
 * Previously, when the page loaded, `checkOverdueItems()` was called automatically
 * which moved all unpaid items with past due dates back to the "Overdue" category,
 * overriding user's manual categorization.
 *
 * The fix removed this automatic call so items stay where users place them.
 *
 * This test verifies that overdue items remain in their assigned column after page refresh.
 */

test.describe('Overdue Items Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the page to be ready
    await page.waitForLoadState('networkidle');

    // Click on the Cashflow tab to access the cashflow planner
    const cashflowTab = page.locator('button:has-text("Cashflow"), a:has-text("Cashflow")').first();
    await cashflowTab.waitFor({ timeout: 10000 });
    await cashflowTab.click();

    // Wait for the cashflow board to load
    await page.waitForTimeout(1000);
  });

  test('overdue item stays in assigned column after page refresh', async ({ page }) => {
    console.log('Step 1: Check if authentication is required');

    // Check if we need to login
    const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Sign in")');
    const isLoginVisible = await signInButton.isVisible().catch(() => false);

    if (isLoginVisible) {
      console.log('Authentication required - checking for test credentials or guest mode');

      // Try to find a guest/demo mode or skip if auth is required
      const guestButton = page.locator('button:has-text("Guest"), button:has-text("Demo"), button:has-text("Continue without")');
      const hasGuestMode = await guestButton.isVisible().catch(() => false);

      if (hasGuestMode) {
        await guestButton.click();
        await page.waitForLoadState('networkidle');
      } else {
        console.log('WARNING: Test requires authentication but no guest mode available');
        console.log('Skipping test - manual authentication required');
        test.skip();
        return;
      }
    }

    console.log('Step 2: Wait for the cashflow board to load');

    // Wait for category columns to be visible
    const overdueColumn = page.locator('[data-category-id="Overdue"], div:has-text("Overdue")').first();
    await overdueColumn.waitFor({ timeout: 10000 });

    console.log('Step 3: Check for existing overdue items or create a new one');

    // Look for existing overdue items
    const existingOverdueItems = page.locator('[data-category-id="Overdue"] [data-item-card]');
    const overdueItemCount = await existingOverdueItems.count();

    let testItemDescription = '';
    let testItemId = '';

    if (overdueItemCount > 0) {
      console.log(`Found ${overdueItemCount} existing overdue item(s)`);

      // Use the first overdue item
      const firstOverdueItem = existingOverdueItems.first();
      testItemDescription = await firstOverdueItem.locator('[data-item-description]').textContent() || 'Overdue Item';
      testItemId = await firstOverdueItem.getAttribute('data-item-id') || '';

      console.log(`Using existing overdue item: "${testItemDescription}"`);
    } else {
      console.log('No existing overdue items found. Creating a new item with past due date...');

      // Click "Add New Item" button
      const addButton = page.locator('button:has-text("Add New Item"), button:has-text("Add Item"), button[aria-label*="Add"]');
      await addButton.first().click();

      // Wait for the dialog to open
      await page.waitForSelector('dialog[open], [role="dialog"]', { timeout: 5000 });

      // Fill in the form with a past due date
      const yesterday = subDays(new Date(), 1);
      testItemDescription = `E2E Test Overdue Item - ${Date.now()}`;

      await page.locator('input[name="description"], input[placeholder*="description" i]').fill(testItemDescription);
      await page.locator('input[name="amount"], input[placeholder*="amount" i]').fill('100');

      // Set due date to yesterday
      const dueDateInput = page.locator('input[name="dueDate"], input[type="date"]');
      await dueDateInput.fill(format(yesterday, 'yyyy-MM-dd'));

      // Select category as "Overdue" or the default will be categorized by the app
      const categorySelect = page.locator('select[name="category"], [role="combobox"]');
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption('Overdue');
      }

      // Set priority
      const prioritySelect = page.locator('select[name="priority"]');
      if (await prioritySelect.isVisible()) {
        await prioritySelect.selectOption('high');
      }

      // Save the item
      await page.locator('button:has-text("Add"), button:has-text("Save"), button[type="submit"]').click();

      // Wait for dialog to close
      await page.waitForSelector('dialog[open], [role="dialog"]', { state: 'hidden', timeout: 5000 });

      // Wait for the item to appear in Overdue column
      await page.waitForTimeout(1000);

      // Find the newly created item
      const newItem = page.locator(`[data-item-card]:has-text("${testItemDescription}")`);
      await newItem.waitFor({ timeout: 5000 });
      testItemId = await newItem.getAttribute('data-item-id') || '';

      console.log(`Created new overdue item: "${testItemDescription}"`);
    }

    console.log('Step 4: Verify item is in Overdue column');

    const itemInOverdue = page.locator(`[data-category-id="Overdue"] [data-item-card]:has-text("${testItemDescription}")`);
    await expect(itemInOverdue).toBeVisible();

    console.log('Step 5: Drag item from Overdue to Week 1 column');

    // Find the target column (Week 1)
    const week1Column = page.locator('[data-category-id="Week 1"], div:has-text("Week 1")').first();
    await week1Column.waitFor({ timeout: 5000 });

    // Get the item to drag
    const itemToDrag = page.locator(`[data-item-card]:has-text("${testItemDescription}")`).first();

    // Perform drag and drop
    await itemToDrag.dragTo(week1Column);

    // Wait for the drag operation to complete
    await page.waitForTimeout(1000);

    console.log('Step 6: Verify item moved to Week 1 column');

    const itemInWeek1 = page.locator(`[data-category-id="Week 1"] [data-item-card]:has-text("${testItemDescription}")`);
    await expect(itemInWeek1).toBeVisible({ timeout: 5000 });

    // Verify item is no longer in Overdue
    const itemStillInOverdue = page.locator(`[data-category-id="Overdue"] [data-item-card]:has-text("${testItemDescription}")`);
    await expect(itemStillInOverdue).not.toBeVisible();

    console.log('Step 7: Refresh the page');

    await page.reload();
    await page.waitForLoadState('networkidle');

    // After refresh, navigate back to Cashflow tab
    const cashflowTabAfterRefresh = page.locator('button:has-text("Cashflow"), a:has-text("Cashflow")').first();
    if (await cashflowTabAfterRefresh.isVisible({ timeout: 2000 })) {
      await cashflowTabAfterRefresh.click();
      await page.waitForTimeout(1000);
    }

    // Wait for the board to reload
    await page.waitForSelector('[data-category-id="Week 1"], div:has-text("Week 1")', { timeout: 10000 });
    await page.waitForTimeout(2000); // Give time for data to load

    console.log('Step 8: CRITICAL - Verify item is STILL in Week 1 column (not moved back to Overdue)');

    const itemAfterRefresh = page.locator(`[data-category-id="Week 1"] [data-item-card]:has-text("${testItemDescription}")`);
    await expect(itemAfterRefresh).toBeVisible({ timeout: 5000 });

    // This is the key assertion - verify it's NOT in Overdue after refresh
    const itemBackInOverdue = page.locator(`[data-category-id="Overdue"] [data-item-card]:has-text("${testItemDescription}")`);
    await expect(itemBackInOverdue).not.toBeVisible();

    console.log('SUCCESS: Item remained in Week 1 after refresh - bug fix verified!');

    // Cleanup: Delete the test item if we created it
    if (testItemDescription.includes('E2E Test')) {
      console.log('Step 9: Cleanup - Deleting test item');

      const itemToDelete = page.locator(`[data-item-card]:has-text("${testItemDescription}")`).first();

      // Try to find and click delete button (might be in a menu or direct button)
      const deleteButton = itemToDelete.locator('button[aria-label*="Delete" i], button:has-text("Delete")');

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion if there's a confirmation dialog
        const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await page.waitForTimeout(500);
        console.log('Test item deleted successfully');
      }
    }
  });

  test('overdue item with drag to Week 2 also persists after refresh', async ({ page }) => {
    console.log('Additional test case: Testing with Week 2 column');

    // Check if we need to login
    const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Sign in")');
    const isLoginVisible = await signInButton.isVisible().catch(() => false);

    if (isLoginVisible) {
      const guestButton = page.locator('button:has-text("Guest"), button:has-text("Demo"), button:has-text("Continue without")');
      const hasGuestMode = await guestButton.isVisible().catch(() => false);

      if (hasGuestMode) {
        await guestButton.click();
        await page.waitForLoadState('networkidle');
      } else {
        test.skip();
        return;
      }
    }

    // Wait for board
    const overdueColumn = page.locator('[data-category-id="Overdue"]').first();
    await overdueColumn.waitFor({ timeout: 10000 });

    // Look for existing overdue items
    const existingOverdueItems = page.locator('[data-category-id="Overdue"] [data-item-card]');
    const overdueItemCount = await existingOverdueItems.count();

    if (overdueItemCount === 0) {
      console.log('No overdue items available for this test case. Skipping.');
      test.skip();
      return;
    }

    // Use the first overdue item
    const firstOverdueItem = existingOverdueItems.first();
    const testItemDescription = await firstOverdueItem.locator('[data-item-description]').textContent() || 'Overdue Item';

    console.log(`Using existing overdue item: "${testItemDescription}"`);

    // Drag to Week 2
    const week2Column = page.locator('[data-category-id="Week 2"]').first();
    await week2Column.waitFor({ timeout: 5000 });

    await firstOverdueItem.dragTo(week2Column);
    await page.waitForTimeout(1000);

    // Verify move
    const itemInWeek2 = page.locator(`[data-category-id="Week 2"] [data-item-card]:has-text("${testItemDescription}")`);
    await expect(itemInWeek2).toBeVisible({ timeout: 5000 });

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigate back to Cashflow tab after refresh
    const cashflowTabAfterRefresh = page.locator('button:has-text("Cashflow"), a:has-text("Cashflow")').first();
    if (await cashflowTabAfterRefresh.isVisible({ timeout: 2000 })) {
      await cashflowTabAfterRefresh.click();
      await page.waitForTimeout(1000);
    }

    await page.waitForSelector('[data-category-id="Week 2"], div:has-text("Week 2")', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Verify persistence
    const itemAfterRefresh = page.locator(`[data-category-id="Week 2"] [data-item-card]:has-text("${testItemDescription}")`);
    await expect(itemAfterRefresh).toBeVisible({ timeout: 5000 });

    const itemBackInOverdue = page.locator(`[data-category-id="Overdue"] [data-item-card]:has-text("${testItemDescription}")`);
    await expect(itemBackInOverdue).not.toBeVisible();

    console.log('SUCCESS: Item remained in Week 2 after refresh!');

    // Move item back to Overdue for cleanup
    await itemAfterRefresh.first().dragTo(overdueColumn);
    await page.waitForTimeout(500);
  });
});
