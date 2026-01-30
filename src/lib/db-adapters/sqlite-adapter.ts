import * as db from '@/db/queries'
import { DatabaseAdapter } from '../db-adapter'
import { Project, Label, TaskWithRelations, Comment } from '@/db/queries'

export class SQLiteAdapter implements DatabaseAdapter {
  // Projects
  async getAllProjects(): Promise<Project[]> {
    return db.getAllProjects()
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    return db.getProjectById(id)
  }

  async createProject(project: Omit<Project, 'created_at' | 'updated_at'>): Promise<Project> {
    return db.createProject(project)
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    return db.updateProject(id, updates)
  }

  async deleteProject(id: string): Promise<boolean> {
    return db.deleteProject(id)
  }

  // Labels
  async getAllLabels(): Promise<Label[]> {
    return db.getAllLabels()
  }

  async getLabelById(id: string): Promise<Label | undefined> {
    return db.getLabelById(id)
  }

  async createLabel(label: Omit<Label, 'created_at'>): Promise<Label> {
    return db.createLabel(label)
  }

  async updateLabel(id: string, updates: Partial<Label>): Promise<Label | undefined> {
    return db.updateLabel(id, updates)
  }

  async deleteLabel(id: string): Promise<boolean> {
    return db.deleteLabel(id)
  }

  // Tasks
  async getAllTasks(): Promise<TaskWithRelations[]> {
    return db.getAllTasks()
  }

  async getTaskById(id: string): Promise<TaskWithRelations | undefined> {
    return db.getTaskById(id)
  }

  async createTask(task: Parameters<typeof db.createTask>[0]): Promise<TaskWithRelations> {
    return db.createTask(task)
  }

  async updateTask(id: string, updates: Partial<TaskWithRelations>): Promise<TaskWithRelations | undefined> {
    return db.updateTask(id, updates)
  }

  async deleteTask(id: string): Promise<boolean> {
    return db.deleteTask(id)
  }

  // Comments
  async getCommentsForTask(taskId: string): Promise<Comment[]> {
    return db.getCommentsForTask(taskId)
  }

  async createComment(comment: Omit<Comment, 'created_at'>): Promise<Comment> {
    return db.createComment(comment)
  }

  async deleteComment(id: string): Promise<boolean> {
    return db.deleteComment(id)
  }

  // Utility
  async close(): Promise<void> {
    // SQLite connections are closed in each function
    return Promise.resolve()
  }
}