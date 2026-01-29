import Database from 'better-sqlite3'
import path from 'path'

// Types
export interface Project {
  id: string
  name: string
  icon: string
  color: string
  description: string | null
  lead: string
  created_at: string
  updated_at: string
}

export interface Label {
  id: string
  name: string
  color: string
  group: string | null
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'backlog' | 'todo' | 'in_progress' | 'done'
  assignee: string
  project_id: string | null
  due_date: string | null
  estimate: number | null
  parent_id: string | null
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  recurrence_interval: number | null
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  task_id: string
  author: string
  content: string
  created_at: string
}

// Database connection
function getDb() {
  const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  return db
}

// Projects
export function getAllProjects(): Project[] {
  const db = getDb()
  const projects = db.prepare('SELECT * FROM projects ORDER BY name').all() as Project[]
  db.close()
  return projects
}

export function getProjectById(id: string): Project | undefined {
  const db = getDb()
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined
  db.close()
  return project
}

export function createProject(project: Omit<Project, 'created_at' | 'updated_at'>): Project {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO projects (id, name, icon, color, description, lead, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(project.id, project.name, project.icon, project.color, project.description, project.lead, now, now)
  const newProject = getProjectById(project.id)!
  db.close()
  return newProject
}

export function updateProject(id: string, updates: Partial<Project>): Project | undefined {
  const db = getDb()
  const existing = getProjectById(id)
  if (!existing) return undefined
  
  const now = new Date().toISOString()
  db.prepare(`
    UPDATE projects SET name = ?, icon = ?, color = ?, description = ?, lead = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updates.name ?? existing.name,
    updates.icon ?? existing.icon,
    updates.color ?? existing.color,
    updates.description ?? existing.description,
    updates.lead ?? existing.lead,
    now,
    id
  )
  db.close()
  return getProjectById(id)
}

export function deleteProject(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  db.close()
  return result.changes > 0
}

// Labels
export function getAllLabels(): Label[] {
  const db = getDb()
  const labels = db.prepare('SELECT * FROM labels ORDER BY "group", name').all() as Label[]
  db.close()
  return labels
}

export function getLabelById(id: string): Label | undefined {
  const db = getDb()
  const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as Label | undefined
  db.close()
  return label
}

export function createLabel(label: Omit<Label, 'created_at'>): Label {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO labels (id, name, color, "group", created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(label.id, label.name, label.color, label.group, now)
  const newLabel = getLabelById(label.id)!
  db.close()
  return newLabel
}

export function updateLabel(id: string, updates: Partial<Label>): Label | undefined {
  const db = getDb()
  const existing = getLabelById(id)
  if (!existing) return undefined
  
  db.prepare(`
    UPDATE labels SET name = ?, color = ?, "group" = ?
    WHERE id = ?
  `).run(
    updates.name ?? existing.name,
    updates.color ?? existing.color,
    updates.group ?? existing.group,
    id
  )
  db.close()
  return getLabelById(id)
}

export function deleteLabel(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM labels WHERE id = ?').run(id)
  db.close()
  return result.changes > 0
}

// Tasks
export interface TaskWithRelations extends Task {
  labelIds?: string[]
  comments?: Comment[]
  projectId?: string | null
  parentId?: string | null
  recurrenceType?: string | null
}

export function getAllTasks(): TaskWithRelations[] {
  const db = getDb()
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC').all() as Task[]
  
  // Get labels for each task
  const taskLabelsStmt = db.prepare('SELECT label_id FROM task_labels WHERE task_id = ?')
  const commentsStmt = db.prepare('SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC')
  
  const tasksWithRelations = tasks.map(task => {
    const labelIds = (taskLabelsStmt.all(task.id) as { label_id: string }[]).map(r => r.label_id)
    const comments = commentsStmt.all(task.id) as Comment[]
    return {
      ...task,
      projectId: task.project_id,
      parentId: task.parent_id,
      recurrenceType: task.recurrence_type,
      labelIds,
      comments: comments.length > 0 ? comments : undefined,
    }
  })
  
  db.close()
  return tasksWithRelations
}

export function getTaskById(id: string): TaskWithRelations | undefined {
  const db = getDb()
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined
  if (!task) {
    db.close()
    return undefined
  }
  
  const labelIds = (db.prepare('SELECT label_id FROM task_labels WHERE task_id = ?').all(id) as { label_id: string }[]).map(r => r.label_id)
  const comments = db.prepare('SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC').all(id) as Comment[]
  
  db.close()
  return {
    ...task,
    projectId: task.project_id,
    parentId: task.parent_id,
    recurrenceType: task.recurrence_type,
    labelIds,
    comments: comments.length > 0 ? comments : undefined,
  }
}

export function createTask(task: {
  id: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'backlog' | 'todo' | 'in_progress' | 'done'
  assignee?: string
  projectId?: string
  labelIds?: string[]
  dueDate?: string
  estimate?: number
  parentId?: string
  recurrenceType?: string
}): TaskWithRelations {
  const db = getDb()
  const now = new Date().toISOString()
  
  db.prepare(`
    INSERT INTO tasks (id, title, description, priority, status, assignee, project_id, due_date, estimate, parent_id, recurrence_type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    task.id,
    task.title,
    task.description || '',
    task.priority || 'medium',
    task.status || 'todo',
    task.assignee || 'jarvis',
    task.projectId || null,
    task.dueDate || null,
    task.estimate || null,
    task.parentId || null,
    task.recurrenceType || null,
    now,
    now
  )
  
  // Insert labels
  if (task.labelIds && task.labelIds.length > 0) {
    const insertLabel = db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)')
    for (const labelId of task.labelIds) {
      insertLabel.run(task.id, labelId)
    }
  }
  
  db.close()
  return getTaskById(task.id)!
}

export function updateTask(id: string, updates: Partial<{
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'backlog' | 'todo' | 'in_progress' | 'done'
  assignee: string
  projectId: string | null
  labelIds: string[]
  dueDate: string | null
  estimate: number | null
  parentId: string | null
}>): TaskWithRelations | undefined {
  const db = getDb()
  const existing = getTaskById(id)
  if (!existing) return undefined
  
  const now = new Date().toISOString()
  
  db.prepare(`
    UPDATE tasks SET
      title = ?,
      description = ?,
      priority = ?,
      status = ?,
      assignee = ?,
      project_id = ?,
      due_date = ?,
      estimate = ?,
      parent_id = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    updates.title ?? existing.title,
    updates.description ?? existing.description,
    updates.priority ?? existing.priority,
    updates.status ?? existing.status,
    updates.assignee ?? existing.assignee,
    updates.projectId !== undefined ? updates.projectId : existing.project_id,
    updates.dueDate !== undefined ? updates.dueDate : existing.due_date,
    updates.estimate !== undefined ? updates.estimate : existing.estimate,
    updates.parentId !== undefined ? updates.parentId : existing.parent_id,
    now,
    id
  )
  
  // Update labels if provided
  if (updates.labelIds !== undefined) {
    db.prepare('DELETE FROM task_labels WHERE task_id = ?').run(id)
    if (updates.labelIds.length > 0) {
      const insertLabel = db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)')
      for (const labelId of updates.labelIds) {
        insertLabel.run(id, labelId)
      }
    }
  }
  
  db.close()
  return getTaskById(id)
}

export function deleteTask(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
  db.close()
  return result.changes > 0
}

// Comments
export function getCommentsForTask(taskId: string): Comment[] {
  const db = getDb()
  const comments = db.prepare('SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC').all(taskId) as Comment[]
  db.close()
  return comments
}

export function createComment(comment: Omit<Comment, 'created_at'>): Comment {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO comments (id, task_id, author, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(comment.id, comment.task_id, comment.author, comment.content, now)
  const newComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(comment.id) as Comment
  db.close()
  return newComment
}

export function deleteComment(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM comments WHERE id = ?').run(id)
  db.close()
  return result.changes > 0
}
