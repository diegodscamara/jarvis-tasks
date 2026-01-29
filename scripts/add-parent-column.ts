import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')
const db = new Database(dbPath)

console.log('Adding parent_id column to tasks table...')

// Add parent_id column if it doesn't exist
try {
  db.exec(`
    ALTER TABLE tasks ADD COLUMN parent_id TEXT REFERENCES tasks(id) ON DELETE SET NULL;
  `)
  console.log('✅ Added parent_id column')
} catch (e: any) {
  if (e.message.includes('duplicate column name')) {
    console.log('ℹ️ parent_id column already exists')
  } else {
    throw e
  }
}

// Create index for faster sub-issue queries
try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
  `)
  console.log('✅ Created index on parent_id')
} catch (e) {
  console.error('Warning:', e)
}

db.close()
console.log('Done!')
