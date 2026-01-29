import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')
const db = new Database(dbPath)

console.log('Adding time tracking column to tasks table...')

try {
  db.exec(`ALTER TABLE tasks ADD COLUMN time_spent INTEGER DEFAULT 0;`)
  console.log('✅ Added time_spent column (minutes)')
} catch (e: any) {
  if (e.message.includes('duplicate column name')) {
    console.log('ℹ️ time_spent column already exists')
  } else {
    console.error('Error:', e.message)
  }
}

db.close()
console.log('Done!')
