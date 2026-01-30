import { test, expect } from '@playwright/test'

test.describe('API Endpoints', () => {
  test('GET /api/tasks should return tasks', async ({ request }) => {
    const response = await request.get('/api/tasks')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('tasks')
    expect(Array.isArray(data.tasks)).toBeTruthy()
  })

  test('GET /api/projects should return projects', async ({ request }) => {
    const response = await request.get('/api/projects')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('projects')
    expect(Array.isArray(data.projects)).toBeTruthy()
  })

  test('GET /api/labels should return labels', async ({ request }) => {
    const response = await request.get('/api/labels')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('labels')
    expect(Array.isArray(data.labels)).toBeTruthy()
  })

  test('GET /api/docs should return documents', async ({ request }) => {
    const response = await request.get('/api/docs')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('documents')
    expect(Array.isArray(data.documents)).toBeTruthy()
  })

  test('GET /api/logs should return logs', async ({ request }) => {
    const response = await request.get('/api/logs')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('logs')
    expect(Array.isArray(data.logs)).toBeTruthy()
  })

  test('GET /api/logs/analytics should return analytics', async ({ request }) => {
    const response = await request.get('/api/logs/analytics')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('summary')
    expect(data).toHaveProperty('distributions')
  })

  test('POST /api/logs should create a log entry', async ({ request }) => {
    const response = await request.post('/api/logs', {
      data: {
        type: 'system_event',
        actor: 'playwright-test',
        title: 'E2E Test Log Entry',
        description: 'Created by Playwright test',
        status: 'completed',
        tags: ['test', 'e2e']
      }
    })
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('id')
    expect(data.title).toBe('E2E Test Log Entry')
  })

  test('GET /api/tasks/stats should return stats', async ({ request }) => {
    const response = await request.get('/api/tasks/stats')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('completedThisWeek')
    expect(data).toHaveProperty('overdueCount')
  })

  test('GET /api/notify should return notification summary', async ({ request }) => {
    const response = await request.get('/api/notify?type=summary')
    expect(response.ok()).toBeTruthy()
  })
})
