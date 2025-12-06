import { test, expect } from '@playwright/test';

/**
 * Manual E2E Test: Overdue Items Persistence After Refresh
 *
 * This test runs in headed mode and allows you to manually sign in.
 * It then automates the rest of the test to verify the bug fix.
 *
 * Bug Fix Verification:
 * Previously, checkOverdueItems() was called on page load, moving unpaid items
 * with past due dates back to "Overdue", overriding user's manual categorization.
 * The fix removed this automatic call.
 *
 * Run with: npx playwright test tests/e2e/overdue-persistence-manual.spec.ts --headed
 */

test.describe('Overdue Items Persistence - Manual Auth', () => {
  test('verify overdue item stays in assigned column after refresh', async ({ page }) => {
    console.log('\n========================================');
    console.log('STARTING TEST: Overdue Items Persistence');
    console.log('========================================\n');

    // Step 1: Navigate to app
    console.log('Step 1: Navigating to application...');
    await page.goto('http://localhost:9002');
    await page.waitForLoadState('networkidle');

    // Step 2: Check for Sign In button
    console.log('Step 2: Checking authentication status...');
    const signInButton = page.locator('button:has-text("Sign In")');
    const isSignInVisible = await signInButton.isVisible().catch(() => false);

    if (isSignInVisible) {
      console.log('\n***************************************************');
      console.log('  MANUAL ACTION REQUIRED');
      console.log('  Please sign in to the application');
      console.log('  The test will wait for 30 seconds');
      console.log('***************************************************\n');

      // Wait for user to sign in manually
      await page.waitForTimeout(30000);

      console.log('Continuing with test...\n');
    } else {
      console.log('Already authenticated or no auth required\n');
    }

    // Step 3: Navigate to Cashflow tab
    console.log('Step 3: Navigating to Cashflow planner...');
    const cashflowTab = page.locator('button:has-text("Cashflow")').first();
    const isCashflowTabVisible = await cashflowTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (isCashflowTabVisible) {
      await cashflowTab.click();
      await page.waitForTimeout(1500);
      console.log('Clicked Cashflow tab\n');
    }

    // Step 4: Look for Overdue column
    console.log('Step 4: Locating Overdue column...');
    const overdueColumnSelector = 'div:has-text("Overdue")';
    await page.waitForSelector(overdueColumnSelector, { timeout: 10000 });
    console.log('Overdue column found\n');

    // Step 5: Check for existing overdue items
    console.log('Step 5: Checking for overdue items...');

    // Take screenshot for documentation
    await page.screenshot({ path: 'test-results/step5-initial-state.png', fullPage: true });

    // Look for items in the Overdue column
    // We'll use a more flexible selector
    const overdueItems = page.locator('div:has-text("Overdue")').locator('..').locator('[draggable="true"]');
    const overdueCount = await overdueItems.count();

    console.log(`Found ${overdueCount} overdue item(s)\n`);

    if (overdueCount === 0) {
      console.log('***************************************************');
      console.log('  NO OVERDUE ITEMS FOUND');
      console.log('  Please manually add an item with a past due date');
      console.log('  to the Overdue column, then rerun the test.');
      console.log('***************************************************\n');
      test.skip();
      return;
    }

    // Get the first overdue item's text for identification
    const firstOverdueItem = overdueItems.first();
    const itemText = await firstOverdueItem.textContent();
    const itemIdentifier = itemText?.substring(0, 50) || 'Unknown Item';

    console.log(`Selected item for testing: "${itemIdentifier}"\n`);

    // Step 6: Locate Week 1 column
    console.log('Step 6: Locating Week 1 column...');
    const week1Column = page.locator('div:has-text("Week 1")').first();
    await week1Column.waitFor({ timeout: 5000 });
    console.log('Week 1 column found\n');

    // Step 7: Drag item to Week 1
    console.log('Step 7: Dragging item from Overdue to Week 1...');
    await firstOverdueItem.hover();
    await page.waitForTimeout(500);

    await firstOverdueItem.dragTo(week1Column);
    await page.waitForTimeout(2000);

    // Take screenshot after drag
    await page.screenshot({ path: 'test-results/step7-after-drag.png', fullPage: true });
    console.log('Item dragged to Week 1\n');

    // Step 8: Verify item is in Week 1
    console.log('Step 8: Verifying item moved to Week 1...');
    const week1Items = page.locator('div:has-text("Week 1")').locator('..').locator('[draggable="true"]');
    const week1Text = await week1Items.allTextContents();

    const isInWeek1 = week1Text.some(text => text.includes(itemIdentifier.substring(0, 20)));

    if (isInWeek1) {
      console.log('VERIFIED: Item successfully moved to Week 1\n');
    } else {
      console.log('WARNING: Could not verify item in Week 1. May need manual verification.\n');
    }

    // Step 9: Refresh the page (CRITICAL TEST)
    console.log('Step 9: REFRESHING THE PAGE (Critical Test)...');
    console.log('This is where the bug would occur - the item would move back to Overdue\n');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Navigate back to Cashflow tab if needed
    const cashflowTabAfterRefresh = page.locator('button:has-text("Cashflow")').first();
    if (await cashflowTabAfterRefresh.isVisible({ timeout: 2000 })) {
      await cashflowTabAfterRefresh.click();
      await page.waitForTimeout(1500);
    }

    // Wait for data to load
    await page.waitForSelector('div:has-text("Week 1")', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Take screenshot after refresh
    await page.screenshot({ path: 'test-results/step9-after-refresh.png', fullPage: true });

    // Step 10: CRITICAL VERIFICATION
    console.log('Step 10: CRITICAL VERIFICATION - Checking if item stayed in Week 1...');

    const week1ItemsAfterRefresh = page.locator('div:has-text("Week 1")').locator('..').locator('[draggable="true"]');
    const week1TextAfterRefresh = await week1ItemsAfterRefresh.allTextContents();

    const isStillInWeek1 = week1TextAfterRefresh.some(text => text.includes(itemIdentifier.substring(0, 20)));

    // Also check if it's back in Overdue (the bug behavior)
    const overdueItemsAfterRefresh = page.locator('div:has-text("Overdue")').locator('..').locator('[draggable="true"]');
    const overdueTextAfterRefresh = await overdueItemsAfterRefresh.allTextContents();

    const isBackInOverdue = overdueTextAfterRefresh.some(text => text.includes(itemIdentifier.substring(0, 20)));

    // Report results
    console.log('\n========================================');
    console.log('TEST RESULTS');
    console.log('========================================\n');

    console.log(`Item Identifier: "${itemIdentifier}"`);
    console.log(`Still in Week 1 after refresh: ${isStillInWeek1 ? 'YES ✓' : 'NO ✗'}`);
    console.log(`Back in Overdue after refresh: ${isBackInOverdue ? 'YES ✗' : 'NO ✓'}`);

    if (isStillInWeek1 && !isBackInOverdue) {
      console.log('\n*** TEST PASSED ✓ ***');
      console.log('Bug Fix Verified: Overdue item stayed in Week 1 after page refresh.');
      console.log('The automatic checkOverdueItems() call on load is NOT running.\n');
    } else if (!isStillInWeek1 && isBackInOverdue) {
      console.log('\n*** TEST FAILED ✗ ***');
      console.log('BUG DETECTED: Item moved back to Overdue after refresh.');
      console.log('The automatic checkOverdueItems() call may still be running on load.\n');
      throw new Error('Bug still exists: Item moved back to Overdue after refresh');
    } else {
      console.log('\n*** TEST INCONCLUSIVE ? ***');
      console.log('Could not determine item location. Manual verification required.\n');
      console.log('Week 1 items after refresh:', week1TextAfterRefresh);
      console.log('Overdue items after refresh:', overdueTextAfterRefresh);
    }

    console.log('\nScreenshots saved to test-results/');
    console.log('- step5-initial-state.png');
    console.log('- step7-after-drag.png');
    console.log('- step9-after-refresh.png\n');

    console.log('========================================');
    console.log('TEST COMPLETE');
    console.log('========================================\n');

    // Assert for Playwright
    expect(isStillInWeek1).toBe(true);
    expect(isBackInOverdue).toBe(false);
  });
});
