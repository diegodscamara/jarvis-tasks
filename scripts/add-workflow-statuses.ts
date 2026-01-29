import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')
const db = new Database(dbPath)

console.log('Updating tasks table to support new workflow statuses...')

// SQLite doesn't support ALTER TABLE to modify CHECK constraints
// We need to recreate the table

db.exec(`
  -- Create new table with updated constraint
  CREATE TABLE tasks_new (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog', 'planning', 'todo', 'in_progress', 'review', 'done')),
    assignee TEXT NOT NULL DEFAULT 'jarvis',
    project_id TEXT REFERENCES projects(id),
    due_date TEXT,
    estimate REAL,
    parent_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    recurrence_type TEXT CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_end_date TEXT,
    time_spent INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Copy data
  INSERT INTO tasks_new SELECT 
    id, title, description, priority, status, assignee, project_id, due_date, estimate,
    parent_id, recurrence_type, recurrence_interval, recurrence_end_date, time_spent,
    created_at, updated_at
  FROM tasks;

  -- Drop old table
  DROP TABLE tasks;

  -- Rename new table
  ALTER TABLE tasks_new RENAME TO tasks;
`)

console.log('✅ Updated status constraint to include: backlog, planning, todo, in_progress, review, done')

db.close()
console.log('Done!')
