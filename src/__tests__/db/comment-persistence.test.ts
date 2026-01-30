import { describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

describe('Comment Persistence - SQLite on Read-Only Filesystem', () => {
  const TEST_DB_PATH = path.join(process.cwd(), 'test-db.sqlite')
  let db: Database.Database | null = null

  beforeEach(() => {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  afterEach(() => {
    if (db) {
      db.close()
      db = null
    }
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  it('should fail to create SQLite database on read-only filesystem', () => {
    // Simulate Vercel's read-only filesystem
    const originalWriteFileSync = fs.writeFileSync
    const originalOpenSync = fs.openSync
    
    // Mock filesystem to be read-only
    fs.writeFileSync = jest.fn(() => {
      throw new Error('EROFS: read-only file system')
    })
    
    fs.openSync = jest.fn(() => {
      throw new Error('EROFS: read-only file system')
    })

    // This should throw an error on Vercel
    expect(() => {
      db = new Database(TEST_DB_PATH)
    }).toThrow()

    // Restore original functions
    fs.writeFileSync = originalWriteFileSync
    fs.openSync = originalOpenSync
  })

  it('should work with in-memory database as alternative', () => {
    // In-memory database works even on read-only filesystem
    db = new Database(':memory:')
    
    // Create tables
    db.exec(`
      CREATE TABLE comments (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)

    // Insert a comment
    const stmt = db.prepare(`
      INSERT INTO comments (id, task_id, author, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      'comment-1',
      'task-123',
      'diego',
      'Test comment',
      new Date().toISOString()
    )

    // Retrieve the comment
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get('comment-1') as any

    expect(comment).toBeDefined()
    expect(comment.author).toBe('diego')
    expect(comment.content).toBe('Test comment')
  })

  it('should demonstrate the persistence problem with in-memory DB', () => {
    // Create first connection
    const db1 = new Database(':memory:')
    db1.exec(`
      CREATE TABLE comments (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL
      )
    `)
    db1.prepare('INSERT INTO comments (id, content) VALUES (?, ?)').run('1', 'Comment 1')
    db1.close()

    // Create second connection (simulating new serverless function)
    const db2 = new Database(':memory:')
    
    // This will fail because the table doesn't exist in the new connection
    expect(() => {
      db2.prepare('SELECT * FROM comments').all()
    }).toThrow('no such table: comments')
    
    db2.close()
  })
})

describe('Comment Persistence - Cloud Database Solution', () => {
  it('should validate cloud database approach', () => {
    // This test validates that we need a cloud database
    // Real implementation would use Vercel Postgres, Supabase, etc.
    
    interface CloudComment {
      id: string
      task_id: string
      author: string
      content: string
      created_at: Date
    }

    // Mock cloud database client
    class MockCloudDatabase {
      private comments: Map<string, CloudComment> = new Map()

      async createComment(comment: Omit<CloudComment, 'created_at'>): Promise<CloudComment> {
        const newComment: CloudComment = {
          ...comment,
          created_at: new Date(),
        }
        this.comments.set(comment.id, newComment)
        return newComment
      }

      async getCommentsForTask(taskId: string): Promise<CloudComment[]> {
        return Array.from(this.comments.values())
          .filter(c => c.task_id === taskId)
          .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
      }
    }

    // Test the cloud database approach
    const cloudDb = new MockCloudDatabase()
    
    // Simulate multiple serverless function invocations
    const testComment = async () => {
      const comment = await cloudDb.createComment({
        id: 'comment-1',
        task_id: 'task-123',
        author: 'diego',
        content: 'This persists across functions!',
      })
      
      expect(comment.id).toBe('comment-1')
      
      // Different "serverless function" can still retrieve it
      const comments = await cloudDb.getCommentsForTask('task-123')
      expect(comments).toHaveLength(1)
      expect(comments[0].content).toBe('This persists across functions!')
    }

    return testComment()
  })
})