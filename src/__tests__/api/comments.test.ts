import { describe, expect, it, beforeEach, jest } from '@jest/globals'

// Mock the database queries
jest.mock('@/db/queries', () => ({
  createComment: jest.fn(),
  getCommentsForTask: jest.fn(),
  getTaskById: jest.fn(),
}))

// Mock Next.js response
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
  NextRequest: jest.fn(),
}))

// Mock file system operations for Vercel environment
jest.mock('node:fs', () => ({
  existsSync: jest.fn(() => false), // Simulate Vercel read-only filesystem
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(() => {
    throw new Error('EROFS: read-only file system')
  }),
}))

import * as db from '@/db/queries'
import { POST as createComment } from '@/app/api/tasks/[id]/comments/route'

describe('Comment Persistence on Vercel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should persist comments even on read-only file system', async () => {
    // Arrange
    const taskId = 'task-123'
    const mockComment = {
      id: 'comment-456',
      task_id: taskId,
      author: 'diego',
      content: 'This is a test comment',
      created_at: new Date().toISOString(),
    }
    
    const mockTask = {
      id: taskId,
      title: 'Test Task',
      status: 'todo',
    }

    // Mock database responses
    ;(db.getTaskById as jest.Mock).mockReturnValue(mockTask)
    ;(db.createComment as jest.Mock).mockReturnValue(mockComment)

    // Create mock request
    const mockRequest = {
      json: async () => ({
        author: 'diego',
        content: 'This is a test comment',
      }),
    } as any

    const mockParams = Promise.resolve({ id: taskId })

    // Act
    const response = await createComment(mockRequest, { params: mockParams })
    const data = await response.json()

    // Assert
    expect(db.createComment).toHaveBeenCalledWith({
      id: expect.stringContaining('comment-'),
      task_id: taskId,
      author: 'diego',
      content: 'This is a test comment',
    })
    
    expect(data).toMatchObject({
      author: 'diego',
      content: 'This is a test comment',
    })
    
    // Verify no file system write was attempted for comment storage
    const fs = await import('node:fs')
    expect(fs.writeFileSync).not.toHaveBeenCalledWith(
      expect.stringContaining('comments'),
      expect.any(String)
    )
  })

  it('should handle database persistence failure gracefully', async () => {
    // Arrange
    const taskId = 'task-123'
    ;(db.createComment as jest.Mock).mockImplementation(() => {
      throw new Error('Database connection failed')
    })

    const mockRequest = {
      json: async () => ({
        author: 'diego',
        content: 'This comment will fail',
      }),
    } as any

    const mockParams = Promise.resolve({ id: taskId })

    // Act
    const response = await createComment(mockRequest, { params: mockParams })

    // Assert
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to create comment')
  })

  it('should retrieve comments from persistent storage', async () => {
    // Arrange
    const taskId = 'task-123'
    const mockComments = [
      {
        id: 'comment-1',
        task_id: taskId,
        author: 'jarvis',
        content: 'Working on it',
        created_at: '2026-01-30T08:00:00.000Z',
      },
      {
        id: 'comment-2',
        task_id: taskId,
        author: 'diego',
        content: 'Thanks!',
        created_at: '2026-01-30T08:01:00.000Z',
      },
    ]

    ;(db.getCommentsForTask as jest.Mock).mockReturnValue(mockComments)

    // Act - simulate GET request
    const { GET: getComments } = await import('@/app/api/tasks/[id]/comments/route')
    const mockRequest = {} as any
    const mockParams = Promise.resolve({ id: taskId })
    
    const response = await getComments(mockRequest, { params: mockParams })
    const data = await response.json()

    // Assert
    expect(db.getCommentsForTask).toHaveBeenCalledWith(taskId)
    expect(data.comments).toHaveLength(2)
    expect(data.comments[0]).toMatchObject({
      author: 'jarvis',
      content: 'Working on it',
    })
  })
})