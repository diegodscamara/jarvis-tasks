import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')
const db = new Database(dbPath)

console.log('Updating task_links table to support more link types...')

// SQLite doesn't support modifying CHECK constraints, but we can work around it
// by removing and recreating the table (preserving data)

db.exec(`
  -- Create new table with updated constraint
  CREATE TABLE IF NOT EXISTS task_links_new (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    type TEXT DEFAULT 'link' CHECK (type IN ('link', 'notion', 'google-doc', 'figma', 'github', 'github-pr', 'github-issue', 'linear', 'slack', 'confluence')),
    icon TEXT,
    position INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Copy existing data
  INSERT OR IGNORE INTO task_links_new SELECT * FROM task_links;

  -- Drop old table
  DROP TABLE IF EXISTS task_links;

  -- Rename new table
  ALTER TABLE task_links_new RENAME TO task_links;

  -- Recreate index
  CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON task_links(task_id);
`)

console.log('✅ Updated task_links with new types: github-pr, github-issue')
db.close()
console.log('Done!')
