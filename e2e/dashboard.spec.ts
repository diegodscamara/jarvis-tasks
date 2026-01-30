import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the dashboard', async ({ page }) => {
    // Check main sidebar sections are present
    await expect(page.getByText('Views')).toBeVisible()
    await expect(page.getByText('Projects')).toBeVisible()
    await expect(page.getByText('Labels')).toBeVisible()
    await expect(page.getByText('Status')).toBeVisible()
    // System section in sidebar (use exact match to avoid "System Online")
    await expect(page.getByText('System', { exact: true })).toBeVisible()
  })

  test('should show task counts in sidebar', async ({ page }) => {
    // All Issues should show a count
    await expect(page.getByRole('button', { name: /All Issues/i })).toBeVisible()
  })

  test('should navigate to docs page', async ({ page }) => {
    await page.getByRole('link', { name: 'Docs' }).click()
    await expect(page).toHaveURL('/docs')
    await expect(page.getByRole('heading', { name: 'Docs' })).toBeVisible()
  })

  test('should navigate to logs page', async ({ page }) => {
    await page.getByRole('link', { name: 'Activity Logs' }).click()
    await expect(page).toHaveURL('/logs')
    await expect(page.getByRole('heading', { name: 'Activity Logs' })).toBeVisible()
  })

  test('should open command palette with Cmd+K', async ({ page }) => {
    await page.keyboard.press('Meta+k')
    await expect(page.getByPlaceholder('Search tasks, projects')).toBeVisible()
  })

  test('should filter tasks by status', async ({ page }) => {
    // Click on a status filter
    await page.getByRole('button', { name: /Backlog/i }).first().click()
    // The view should update (we just verify no errors)
    await expect(page.getByText('Views')).toBeVisible()
  })
})

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should open new task dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'New Task' }).click()
    await expect(page.getByPlaceholder('Task title')).toBeVisible()
  })

  test('should create a new task', async ({ page }) => {
    const taskTitle = `Test Task ${Date.now()}`
    
    await page.getByRole('button', { name: 'New Task' }).click()
    await page.getByPlaceholder('Task title').fill(taskTitle)
    await page.getByRole('button', { name: 'Create' }).click()
    
    // Task should appear in the list
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 })
  })
})
