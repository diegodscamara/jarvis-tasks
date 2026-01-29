import type { AgentInfo, Column, Priority } from '@/types'

export const COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'planning', title: 'Planning' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
]

export const AGENTS: AgentInfo[] = [
  { id: 'jarvis', name: 'Jarvis (Claude)', color: '#00d4ff' },
  { id: 'gemini', name: 'Gemini', color: '#4285f4' },
  { id: 'copilot', name: 'Copilot', color: '#6e40c9' },
  { id: 'claude', name: 'Claude Direct', color: '#cc785c' },
  { id: 'diego', name: 'Diego', color: '#2ed573' },
]

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#F59E0B',
  medium: '#5E6AD2',
  low: '#6B6B6B',
}

export const ACCENT_COLORS = [
  { name: 'Blue', value: '#5E6AD2' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Red', value: '#EF4444' },
]

export const DEFAULT_SETTINGS = {
  defaultAssignee: 'jarvis' as const,
  showCompletedTasks: true,
  compactView: false,
  theme: 'dark' as const,
  accentColor: '#5E6AD2',
}

export const STORAGE_KEYS = {
  settings: 'jarvis-tasks-settings',
}
