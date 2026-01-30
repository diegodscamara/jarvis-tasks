import { test, expect } from '@playwright/test'

test.describe('Logs Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/logs')
  })

  test('should load the logs page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Activity Logs' })).toBeVisible()
  })

  test('should show live indicator', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Live/i })).toBeVisible()
  })

  test('should show analytics summary', async ({ page }) => {
    await expect(page.getByText('Total Logs')).toBeVisible()
    await expect(page.getByText('Today')).toBeVisible()
    await expect(page.getByText('This Week')).toBeVisible()
    await expect(page.getByText('Error Rate')).toBeVisible()
  })

  test('should show type filter', async ({ page }) => {
    // Find the type filter combobox
    const typeFilter = page.getByRole('combobox').first()
    await expect(typeFilter).toBeVisible()
  })

  test('should show status filter', async ({ page }) => {
    // Find the status filter combobox
    const filters = page.getByRole('combobox')
    await expect(filters.nth(1)).toBeVisible()
  })

  test('should toggle live updates', async ({ page }) => {
    const liveButton = page.getByRole('button', { name: /Live/i })
    await liveButton.click()
    // Should toggle to paused
    await expect(page.getByRole('button', { name: /Paused/i })).toBeVisible()
    
    // Toggle back
    await page.getByRole('button', { name: /Paused/i }).click()
    await expect(page.getByRole('button', { name: /Live/i })).toBeVisible()
  })

  test('should display log entries', async ({ page }) => {
    // Wait for logs to load
    await page.waitForTimeout(1000)
    // Check if there are log entries or empty state
    const hasLogs = await page.getByText('Docs & Logs Pages Deployed').isVisible().catch(() => false)
    const hasEmptyState = await page.getByText('No logs found').isVisible().catch(() => false)
    
    expect(hasLogs || hasEmptyState).toBeTruthy()
  })
})
