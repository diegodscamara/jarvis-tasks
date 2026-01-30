#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import Database from 'better-sqlite3'
import path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Open SQLite database
const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

async function migrateProjects() {
  console.log('Migrating projects...')
  const projects = db.prepare('SELECT * FROM projects').all() as any[]
  
  if (projects.length > 0) {
    const { error } = await supabase
      .from('projects')
      .insert(projects.map(p => ({
        id: p.id,
        name: p.name,
        icon: p.icon,
        color: p.color,
        description: p.description,
        lead: p.lead,
        created_at: p.created_at,
        updated_at: p.updated_at,
      })))
    
    if (error) {
      console.error('Error migrating projects:', error)
      throw error
    }
  }
  
  console.log(`Migrated ${projects.length} projects`)
}

async function migrateLabels() {
  console.log('Migrating labels...')
  const labels = db.prepare('SELECT * FROM labels').all() as any[]
  
  if (labels.length > 0) {
    const { error } = await supabase
      .from('labels')
      .insert(labels.map(l => ({
        id: l.id,
        name: l.name,
        color: l.color,
        group: l.group,
        created_at: l.created_at,
      })))
    
    if (error) {
      console.error('Error migrating labels:', error)
      throw error
    }
  }
  
  console.log(`Migrated ${labels.length} labels`)
}

async function migrateTasks() {
  console.log('Migrating tasks...')
  const tasks = db.prepare('SELECT * FROM tasks').all() as any[]
  
  if (tasks.length > 0) {
    const { error } = await supabase
      .from('tasks')
      .insert(tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        assignee: t.assignee,
        project_id: t.project_id,
        due_date: t.due_date,
        estimate: t.estimate,
        parent_id: t.parent_id,
        recurrence_type: t.recurrence_type,
        recurrence_interval: t.recurrence_interval,
        time_spent: t.time_spent,
        created_at: t.created_at,
        updated_at: t.updated_at,
      })))
    
    if (error) {
      console.error('Error migrating tasks:', error)
      throw error
    }
  }
  
  console.log(`Migrated ${tasks.length} tasks`)
}

async function migrateTaskLabels() {
  console.log('Migrating task labels...')
  const taskLabels = db.prepare('SELECT * FROM task_labels').all() as any[]
  
  if (taskLabels.length > 0) {
    const { error } = await supabase
      .from('task_labels')
      .insert(taskLabels.map(tl => ({
        task_id: tl.task_id,
        label_id: tl.label_id,
      })))
    
    if (error) {
      console.error('Error migrating task labels:', error)
      throw error
    }
  }
  
  console.log(`Migrated ${taskLabels.length} task labels`)
}

async function migrateComments() {
  console.log('Migrating comments...')
  const comments = db.prepare('SELECT * FROM comments').all() as any[]
  
  if (comments.length > 0) {
    const { error } = await supabase
      .from('comments')
      .insert(comments.map(c => ({
        id: c.id,
        task_id: c.task_id,
        author: c.author,
        content: c.content,
        created_at: c.created_at,
      })))
    
    if (error) {
      console.error('Error migrating comments:', error)
      throw error
    }
  }
  
  console.log(`Migrated ${comments.length} comments`)
}

async function main() {
  try {
    console.log('Starting migration from SQLite to Supabase...')
    
    // Migrate in order due to foreign key constraints
    await migrateProjects()
    await migrateLabels()
    await migrateTasks()
    await migrateTaskLabels()
    await migrateComments()
    
    console.log('Migration completed successfully!')
    
    // Close SQLite connection
    db.close()
  } catch (error) {
    console.error('Migration failed:', error)
    db.close()
    process.exit(1)
  }
}

// Run migration
main()