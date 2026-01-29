import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')
const db = new Database(dbPath)

console.log('Creating templates table...')

db.exec(`
  CREATE TABLE IF NOT EXISTS task_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT DEFAULT 'medium',
    assignee TEXT DEFAULT 'jarvis',
    project_id TEXT REFERENCES projects(id),
    estimate REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

console.log('✅ Created task_templates table')
db.close()
console.log('Done!')
