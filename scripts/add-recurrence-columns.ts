import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')
const db = new Database(dbPath)

console.log('Adding recurrence columns to tasks table...')

// Add recurrence columns
const columns = [
  { name: 'recurrence_type', sql: "ALTER TABLE tasks ADD COLUMN recurrence_type TEXT CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly'));" },
  { name: 'recurrence_interval', sql: "ALTER TABLE tasks ADD COLUMN recurrence_interval INTEGER DEFAULT 1;" },
  { name: 'recurrence_end_date', sql: "ALTER TABLE tasks ADD COLUMN recurrence_end_date TEXT;" },
]

for (const col of columns) {
  try {
    db.exec(col.sql)
    console.log(`✅ Added ${col.name} column`)
  } catch (e: any) {
    if (e.message.includes('duplicate column name')) {
      console.log(`ℹ️ ${col.name} column already exists`)
    } else {
      console.error(`Error adding ${col.name}:`, e.message)
    }
  }
}

db.close()
console.log('Done!')
