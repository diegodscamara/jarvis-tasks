import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')
const db = new Database(dbPath)

console.log('Creating links table...')

db.exec(`
  CREATE TABLE IF NOT EXISTS task_links (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    type TEXT DEFAULT 'link' CHECK (type IN ('link', 'notion', 'google-doc', 'figma', 'github', 'linear', 'slack', 'confluence')),
    icon TEXT,
    position INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON task_links(task_id);
`)

console.log('✅ Created task_links table')
db.close()
console.log('Done!')
