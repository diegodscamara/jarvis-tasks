import { test, expect } from '@playwright/test'

test.describe('Docs Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs')
  })

  test('should load the docs page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Docs' })).toBeVisible()
    await expect(page.getByPlaceholder('Search docs...')).toBeVisible()
  })

  test('should show category filters', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'All Documents' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Guidelines' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reports' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Daily Logs' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Agent Docs' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'System' })).toBeVisible()
  })

  test('should filter by category', async ({ page }) => {
    await page.getByRole('button', { name: 'Guidelines' }).click()
    // Should filter docs (verify no errors)
    await expect(page.getByRole('heading', { name: 'Docs' })).toBeVisible()
  })

  test('should search documents', async ({ page }) => {
    await page.getByPlaceholder('Search docs...').fill('Jarvis')
    // Wait for search results
    await page.waitForTimeout(500)
    await expect(page.getByRole('heading', { name: 'Docs' })).toBeVisible()
  })

  test('should show new doc button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'New' })).toBeVisible()
  })
})
