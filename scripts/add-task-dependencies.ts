import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')
const db = new Database(dbPath)

console.log('Adding task dependencies table...')

// Create task_dependencies junction table
db.exec(`
  CREATE TABLE IF NOT EXISTS task_dependencies (
    task_id TEXT NOT NULL,
    depends_on_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (task_id, depends_on_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_id) REFERENCES tasks(id) ON DELETE CASCADE
  )
`)

// Create indexes for performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id 
  ON task_dependencies(task_id);
  
  CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on_id 
  ON task_dependencies(depends_on_id);
`)

console.log('✅ Task dependencies table created successfully!')

// Add some example dependencies
const tasks = db.prepare('SELECT id FROM tasks LIMIT 5').all() as { id: string }[]

if (tasks.length >= 2) {
  try {
    // Create a simple dependency chain
    db.prepare(`
      INSERT OR IGNORE INTO task_dependencies (task_id, depends_on_id, created_at)
      VALUES (?, ?, datetime('now'))
    `).run(tasks[1].id, tasks[0].id)
    
    console.log(`✅ Created example dependency: ${tasks[1].id} depends on ${tasks[0].id}`)
  } catch (e) {
    console.log('Example dependencies already exist or could not be created')
  }
}

db.close()

console.log('Migration complete!')