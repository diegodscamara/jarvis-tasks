export type Priority = 'high' | 'medium' | 'low'
export type Status = 'backlog' | 'planning' | 'todo' | 'in_progress' | 'review' | 'done'
export type Agent = 'jarvis' | 'gemini' | 'copilot' | 'claude' | 'diego'
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Comment {
  id: string
  text: string
  content?: string
  author: string
  createdAt: string
  isRead?: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  icon: string
  color: string
  lead: string
}

export interface Label {
  id: string
  name: string
  color: string
  group?: string
}

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  assignee: Agent
  projectId?: string
  labelIds?: string[]
  dueDate?: string
  estimate?: number
  parentId?: string
  recurrenceType?: RecurrenceType
  recurrenceInterval?: number
  timeSpent?: number
  createdAt: string
  updatedAt: string
  comments?: Comment[]
  dependsOn?: string[] // Task IDs this task depends on
  blockedBy?: string[] // Task IDs that depend on this task
}

export interface Notification {
  id: string
  type: string
  taskId: string
  taskTitle: string
  message: string
  author: string
  createdAt: string
  isRead: boolean
}

export interface Analytics {
  overview: {
    total: number
    completionRate: number
    recentlyCompleted: number
    overdue: number
  }
  status: Record<Status, number>
  priority: Record<Priority, number>
  projects: Array<{
    id: string
    name: string
    icon: string
    total: number
    done: number
    inProgress: number
  }>
  labels: Array<{
    id: string
    name: string
    color: string
    count: number
  }>
}

export interface Settings {
  defaultAssignee: Agent
  showCompletedTasks: boolean
  compactView: boolean
  theme: 'dark' | 'light'
  accentColor: string
}

export interface Column {
  id: Status
  title: string
}

export interface AgentInfo {
  id: Agent
  name: string
  color: string
}
