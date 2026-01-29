import Database from 'better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')

// Ensure data directory exists
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)

// Enable WAL mode
db.pragma('journal_mode = WAL')

console.log('🚀 Setting up database...')

// Create tables
db.exec(`
  -- Projects table
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '📁',
    color TEXT NOT NULL DEFAULT '#6366f1',
    description TEXT,
    lead TEXT NOT NULL DEFAULT 'jarvis',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Labels table
  CREATE TABLE IF NOT EXISTS labels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    "group" TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Tasks table
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in_progress', 'done')),
    assignee TEXT NOT NULL DEFAULT 'jarvis',
    project_id TEXT REFERENCES projects(id),
    due_date TEXT,
    estimate REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Task Labels junction table
  CREATE TABLE IF NOT EXISTS task_labels (
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
  );

  -- Comments table
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
  CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
`)

console.log('✅ Tables created!')

// Check if we need to seed
const existingTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }

if (existingTasks.count === 0) {
  console.log('📦 Seeding from JSON files...')
  
  // Seed projects
  const projectsPath = path.join(dataDir, 'projects.json')
  if (fs.existsSync(projectsPath)) {
    const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'))
    const insertProject = db.prepare(`
      INSERT OR IGNORE INTO projects (id, name, icon, color, description, lead, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const project of projectsData.projects || []) {
      insertProject.run(
        project.id,
        project.name,
        project.icon || '📁',
        project.color || '#6366f1',
        project.description || null,
        project.lead || 'jarvis',
        new Date().toISOString(),
        new Date().toISOString()
      )
    }
    console.log(`  ✓ Imported ${projectsData.projects?.length || 0} projects`)
  }

  // Seed labels
  const labelsPath = path.join(dataDir, 'labels.json')
  if (fs.existsSync(labelsPath)) {
    const labelsData = JSON.parse(fs.readFileSync(labelsPath, 'utf-8'))
    const insertLabel = db.prepare(`
      INSERT OR IGNORE INTO labels (id, name, color, "group", created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    for (const label of labelsData.labels || []) {
      insertLabel.run(
        label.id,
        label.name,
        label.color,
        label.group || null,
        new Date().toISOString()
      )
    }
    console.log(`  ✓ Imported ${labelsData.labels?.length || 0} labels`)
  }

  // Seed tasks
  const tasksPath = path.join(dataDir, 'tasks.json')
  if (fs.existsSync(tasksPath)) {
    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'))
    const insertTask = db.prepare(`
      INSERT OR IGNORE INTO tasks (id, title, description, priority, status, assignee, project_id, due_date, estimate, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const insertTaskLabel = db.prepare(`
      INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)
    `)
    const insertComment = db.prepare(`
      INSERT OR IGNORE INTO comments (id, task_id, author, content, created_at) VALUES (?, ?, ?, ?, ?)
    `)

    for (const task of tasksData.tasks || []) {
      insertTask.run(
        task.id,
        task.title,
        task.description || '',
        task.priority || 'medium',
        task.status || 'todo',
        task.assignee || 'jarvis',
        task.projectId || null,
        task.dueDate || null,
        task.estimate || null,
        task.createdAt || new Date().toISOString(),
        task.updatedAt || new Date().toISOString()
      )

      // Insert task labels
      if (task.labelIds && task.labelIds.length > 0) {
        for (const labelId of task.labelIds) {
          insertTaskLabel.run(task.id, labelId)
        }
      }

      // Insert comments
      if (task.comments && task.comments.length > 0) {
        for (const comment of task.comments) {
          insertComment.run(
            comment.id || `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            task.id,
            comment.author,
            comment.content,
            comment.createdAt || new Date().toISOString()
          )
        }
      }
    }
    console.log(`  ✓ Imported ${tasksData.tasks?.length || 0} tasks`)
  }

  console.log('✅ Seeding complete!')
} else {
  console.log(`ℹ️ Database already has ${existingTasks.count} tasks, skipping seed`)
}

// Verify
const counts = {
  projects: (db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count,
  labels: (db.prepare('SELECT COUNT(*) as count FROM labels').get() as { count: number }).count,
  tasks: (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }).count,
  comments: (db.prepare('SELECT COUNT(*) as count FROM comments').get() as { count: number }).count,
}

console.log('\n📊 Database stats:')
console.log(`  Projects: ${counts.projects}`)
console.log(`  Labels: ${counts.labels}`)
console.log(`  Tasks: ${counts.tasks}`)
console.log(`  Comments: ${counts.comments}`)

db.close()
console.log('\n🎉 Database setup complete!')
