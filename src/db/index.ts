import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// Database file location
const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')

// Create database connection
const sqlite = new Database(dbPath)

// Enable WAL mode for better concurrent performance
sqlite.pragma('journal_mode = WAL')

// Create Drizzle instance
export const db = drizzle(sqlite, { schema })

// Export schema for convenience
export * from './schema'
