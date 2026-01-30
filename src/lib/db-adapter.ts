/**
 * Database Adapter Pattern
 * Allows switching between SQLite (local) and Supabase (production)
 * Solves the Vercel read-only filesystem issue
 */

import { Project, Label, Task, Comment, TaskWithRelations } from '@/db/queries'

export interface DatabaseAdapter {
  // Projects
  getAllProjects(): Promise<Project[]>
  getProjectById(id: string): Promise<Project | undefined>
  createProject(project: Omit<Project, 'created_at' | 'updated_at'>): Promise<Project>
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>
  deleteProject(id: string): Promise<boolean>

  // Labels
  getAllLabels(): Promise<Label[]>
  getLabelById(id: string): Promise<Label | undefined>
  createLabel(label: Omit<Label, 'created_at'>): Promise<Label>
  updateLabel(id: string, updates: Partial<Label>): Promise<Label | undefined>
  deleteLabel(id: string): Promise<boolean>

  // Tasks
  getAllTasks(): Promise<TaskWithRelations[]>
  getTaskById(id: string): Promise<TaskWithRelations | undefined>
  createTask(task: {
    id: string
    title: string
    description?: string
    priority?: 'low' | 'medium' | 'high'
    status?: 'backlog' | 'planning' | 'todo' | 'in_progress' | 'review' | 'done'
    assignee?: string
    projectId?: string
    labelIds?: string[]
    dueDate?: string
    estimate?: number
    parentId?: string
    recurrenceType?: string
  }): Promise<TaskWithRelations>
  updateTask(id: string, updates: Partial<TaskWithRelations>): Promise<TaskWithRelations | undefined>
  deleteTask(id: string): Promise<boolean>

  // Comments
  getCommentsForTask(taskId: string): Promise<Comment[]>
  createComment(comment: Omit<Comment, 'created_at'>): Promise<Comment>
  deleteComment(id: string): Promise<boolean>

  // Utility
  close(): Promise<void>
}

// Factory function to get the appropriate adapter
export function getDatabaseAdapter(): DatabaseAdapter {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  
  if (isProduction && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    // Use Supabase in production
    const { SupabaseAdapter } = require('./db-adapters/supabase-adapter')
    return new SupabaseAdapter()
  }
  
  // Use SQLite locally
  const { SQLiteAdapter } = require('./db-adapters/sqlite-adapter')
  return new SQLiteAdapter()
}