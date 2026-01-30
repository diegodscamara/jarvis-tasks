import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('Jarvis Tasks E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
    // Wait for app to load
    await page.waitForLoadState('networkidle')
  })

  test('Task Management Flow', async ({ page }) => {
    // Create a new task
    await page.click('[data-testid="add-task-button"]')
    await page.fill('[data-testid="task-title-input"]', 'E2E Test Task')
    await page.selectOption('[data-testid="task-priority-select"]', 'medium')
    await page.click('[data-testid="save-task-button"]')
    
    // Verify task was created
    await expect(page.locator('.task-card').first()).toContainText('E2E Test Task')
    
    // Update task status
    await page.click('.task-card:has-text("E2E Test Task")')
    await page.click('[data-testid="move-to-in-progress"]')
    
    // Verify status changed
    await expect(page.locator('.task-card:has-text("E2E Test Task")'))
      .toContainText('in_progress')
  })

  test('Task Dependencies', async ({ page }) => {
    // Create two related tasks
    await test.step('Create parent task', async () => {
      await page.click('[data-testid="add-task-button"]')
      await page.fill('[data-testid="task-title-input"]', 'Parent Task')
      await page.click('[data-testid="save-task-button"]')
    })
    
    await test.step('Create dependent task', async () => {
      await page.click('[data-testid="add-task-button"]')
      await page.fill('[data-testid="task-title-input"]', 'Dependent Task')
      await page.click('[data-testid="save-task-button"]')
    })
    
    await test.step('Add dependency', async () => {
      // Open dependent task
      await page.click('.task-card:has-text("Dependent Task")')
      
      // Add dependency
      await page.click('[data-testid="dependencies-button"]')
      await page.click('.task-option:has-text("Parent Task")')
      await page.click('[data-testid="add-dependency-button"]')
      
      // Verify dependency indicator appears
      await expect(page.locator('.task-card:has-text("Dependent Task")'))
        .toContainText('🔒')
    })
  })

  test('Smart Search', async ({ page }) => {
    // Perform search with operators
    await page.fill('[data-testid="search-input"]', 'priority:high status:todo')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // Verify filtered results
    await expect(page.locator('.task-card').first())
      .toContainText('high')
    
    // Clear search
    await page.click('[data-testid="clear-search"]')
    
    // Verify all tasks shown
    const taskCount = await page.locator('.task-card').count()
    expect(taskCount).toBeGreaterThan(0)
  })

  test('AI Assistant Commands', async ({ page }) => {
    await test.step('Open AI assistant', async () => {
      await page.click('[data-testid="ai-assistant-button"]')
      await expect(page.locator('[data-testid="ai-assistant-dialog"]')).toBeVisible()
    })
    
    await test.step('Create task via natural language', async () => {
      await page.fill('[data-testid="ai-input"]', 'Create a high priority task for code review tomorrow')
      await page.click('[data-testid="ai-send-button"]')
      
      // Verify task creation
      await expect(page.locator('.task-card').first())
        .toContainText('code review')
    })
    
    await test.step('Query tasks with AI', async () => {
      await page.click('[data-testid="ai-assistant-button"]')
      await page.fill('[data-testid="ai-input"]', 'Show me all done tasks')
      await page.click('[data-testid="ai-send-button"]')
      
      // Verify task list updated
      const doneTasks = await page.locator('.task-card').filter({ hasText: 'done' }).count()
      expect(doneTasks).toBeGreaterThan(0)
    })
  })

  test('Time Tracking', async ({ page }) => {
    // Create task with estimate
    await page.click('[data-testid="add-task-button"]')
    await page.fill('[data-testid="task-title-input"]', 'Time Tracking Test')
    await page.fill('[data-testid="task-estimate-hours"]', '2')
    await page.click('[data-testid="save-task-button"]')
    
    // Start timer
    await page.click('.task-card:has-text("Time Tracking Test")')
    await page.click('[data-testid="start-timer-button"]')
    
    // Wait a moment
    await page.waitForTimeout(61000) // 1 minute
    
    // Pause timer
    await page.click('[data-testid="pause-timer-button"]')
    
    // Verify time was tracked
    await page.click('.task-card:has-text("Time Tracking Test")')
    await expect(page.locator('[data-testid="time-display"]')).toContainText(/1h \d{1,2}m/)
  })

  test('Task Form Validation', async ({ page }) => {
    // Test title required
    await page.click('[data-testid="add-task-button"]')
    await page.fill('[data-testid="task-title-input"]', '')
    await page.click('[data-testid="save-task-button"]')
    
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('title is required')
    
    // Test invalid date
    await page.fill('[data-testid="task-title-input"]', 'Test Task')
    await page.fill('[data-testid="task-due-date"]', 'invalid-date')
    await page.click('[data-testid="save-task-button"]')
    
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Invalid date')
  })

  test('Keyboard Shortcuts', async ({ page }) => {
    // Test slash to focus search
    await page.keyboard.press('/')
    await expect(page.locator('[data-testid="search-input"]:focus')).toBeVisible()
    
    // Test question for shortcuts
    await page.keyboard.press('?')
    await expect(page.locator('[data-testid="shortcuts-dialog"]')).toBeVisible()
    
    // Escape to close dialogs
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="shortcuts-dialog"]')).not.toBeVisible()
  })

  test('Project Management', async ({ page }) => {
    // Create project
    await page.click('[data-testid="projects-button"]')
    await page.click('[data-testid="add-project-button"]')
    await page.fill('[data-testid="project-name-input"]', 'E2E Test Project')
    await page.fill('[data-testid="project-color-input"]', '#3b82f6')
    await page.click('[data-testid="save-project-button"]')
    
    // Filter by project
    await page.click('[data-testid="project-filter"]:has-text("E2E Test Project")')
    
    // Verify filtered tasks
    await expect(page.locator('.task-card').first())
      .toHaveAttribute('data-project-id', 'E2E Test Project')
  })

  test('Label Management', async ({ page }) => {
    // Create label
    await page.click('[data-testid="labels-button"]')
    await page.click('[data-testid="add-label-button"]')
    await page.fill('[data-testid="label-name-input"]', 'e2e-test')
    await page.fill('[data-testid="label-color-input"]', '#ff0000')
    await page.click('[data-testid="save-label-button"]')
    
    // Filter by label
    await page.click('[data-testid="label-filter"]:has-text("e2e-test")')
    
    // Verify filtered tasks
    const filteredTasks = await page.locator('.task-card').filter({ hasText: 'e2e-test' }).count()
    expect(filteredTasks).toBeGreaterThan(0)
  })

  test('Task Comments', async ({ page }) => {
    // Add comment to task
    await page.click('.task-card:has-text("Test Task")')
    await page.fill('[data-testid="comment-input"]', 'E2E Comment')
    await page.click('[data-testid="add-comment-button"]')
    
    // Verify comment appears
    await expect(page.locator('[data-testid="comment-text"]').last())
      .toContainText('E2E Comment')
    
    // Verify author
    await expect(page.locator('[data-testid="comment-author"]').last())
      .toContainText('jarvis')
  })

  test('Authentication Flow', async ({ page, context }) => {
    // Login with GitHub
    await page.click('[data-testid="login-button"]')
    await page.click('[data-testid="github-login"]')
    
    // Handle GitHub OAuth redirect (would need test account)
    // For E2E, verify login button disappears
    await expect(page.locator('[data-testid="login-button"]')).not.toBeVisible()
    
    // Verify user menu appears
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('Responsive Design', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify mobile menu exists
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Test sidebar toggle
    await page.click('[data-testid="sidebar-toggle"]')
    await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible()
    
    // Return to desktop view
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible()
  })

  test('Performance - Large Dataset', async ({ page }) => {
    // Create multiple tasks quickly
    const tasksToCreate = 20
    
    for (let i = 0; i < tasksToCreate; i++) {
      await page.click('[data-testid="quick-add-button"]')
      await page.fill('[data-testid="quick-task-input"]', `Performance Test Task ${i}`)
      await page.press('Enter')
    }
    
    // Verify all tasks exist
    const taskCount = await page.locator('.task-card').count()
    expect(taskCount).toBeGreaterThanOrEqual(tasksToCreate)
  })
})
