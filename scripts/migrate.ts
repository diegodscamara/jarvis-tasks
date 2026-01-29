import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '../src/db/schema'
import * as fs from 'fs'
import * as path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')
const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
const db = drizzle(sqlite, { schema })

async function runMigration() {
  console.log('🚀 Running migrations...')
  
  // Run Drizzle migrations
  migrate(db, { migrationsFolder: './drizzle' })
  console.log('✅ Migrations complete!')

  // Check if we need to seed from JSON files
  const existingTasks = db.select().from(schema.tasks).all()
  
  if (existingTasks.length === 0) {
    console.log('📦 Seeding from JSON files...')
    await seedFromJson()
    console.log('✅ Seeding complete!')
  } else {
    console.log(`ℹ️ Database already has ${existingTasks.length} tasks, skipping seed`)
  }
}

async function seedFromJson() {
  const dataDir = path.join(process.cwd(), 'data')
  
  // Seed projects
  const projectsPath = path.join(dataDir, 'projects.json')
  if (fs.existsSync(projectsPath)) {
    const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'))
    for (const project of projectsData.projects || []) {
      db.insert(schema.projects).values({
        id: project.id,
        name: project.name,
        icon: project.icon || '📁',
        color: project.color || '#6366f1',
        description: project.description || null,
        lead: project.lead || 'jarvis',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run()
    }
    console.log(`  ✓ Imported ${projectsData.projects?.length || 0} projects`)
  }

  // Seed labels
  const labelsPath = path.join(dataDir, 'labels.json')
  if (fs.existsSync(labelsPath)) {
    const labelsData = JSON.parse(fs.readFileSync(labelsPath, 'utf-8'))
    for (const label of labelsData.labels || []) {
      db.insert(schema.labels).values({
        id: label.id,
        name: label.name,
        color: label.color,
        group: label.group || null,
        createdAt: new Date().toISOString(),
      }).run()
    }
    console.log(`  ✓ Imported ${labelsData.labels?.length || 0} labels`)
  }

  // Seed tasks
  const tasksPath = path.join(dataDir, 'tasks.json')
  if (fs.existsSync(tasksPath)) {
    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'))
    for (const task of tasksData.tasks || []) {
      // Insert task
      db.insert(schema.tasks).values({
        id: task.id,
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        assignee: task.assignee || 'jarvis',
        projectId: task.projectId || null,
        dueDate: task.dueDate || null,
        estimate: task.estimate || null,
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: task.updatedAt || new Date().toISOString(),
      }).run()

      // Insert task labels
      if (task.labelIds && task.labelIds.length > 0) {
        for (const labelId of task.labelIds) {
          db.insert(schema.taskLabels).values({
            taskId: task.id,
            labelId: labelId,
          }).run()
        }
      }

      // Insert comments
      if (task.comments && task.comments.length > 0) {
        for (const comment of task.comments) {
          db.insert(schema.comments).values({
            id: comment.id || `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            taskId: task.id,
            author: comment.author,
            content: comment.content,
            createdAt: comment.createdAt || new Date().toISOString(),
          }).run()
        }
      }
    }
    console.log(`  ✓ Imported ${tasksData.tasks?.length || 0} tasks`)
  }
}

runMigration().catch(console.error)
