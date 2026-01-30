import { ACCENT_COLORS } from '@/lib/constants'
import type { Agent, Priority, Settings } from '@/types'

export const STORAGE_KEY = 'jarvis-tasks-settings'

export const DEFAULT_SETTINGS: Settings = {
  defaultAssignee: 'jarvis',
  showCompletedTasks: true,
  compactView: false,
  theme: 'linear-purple',
  accentColor: '#5E6AD2',
  fontSize: 'medium',
  defaultView: 'board',
  viewDensity: 'comfortable',
  defaultPriority: 'medium',
  defaultProject: null,
  autoSave: true,
  autoSaveInterval: 10,
  dateFormat: 'relative',
  timeFormat: '12h',
  weekStartsOn: 1,
  notificationsEnabled: true,
  soundEffects: false,
  soundVolume: 50,
  keyboardShortcuts: true,
  taskAssigned: true,
  taskDueSoon: true,
  taskOverdue: true,
  taskComment: true,
  taskCompleted: false,
  dailySummary: false,
  dailySummaryTime: '09:00',
  telegramEnabled: false,
  telegramChannelId: '',
  desktopNotifications: false,
  githubEnabled: false,
  githubRepository: '',
  webhooksEnabled: false,
}

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  const flat = toApiShape(settings)
  fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flat),
  }).catch(() => {})
}

function toApiShape(s: Settings): Record<string, unknown> {
  return {
    theme: s.theme,
    accentColor: s.accentColor,
    fontSize: s.fontSize,
    compactMode: s.compactView,
    showCompletedTasks: s.showCompletedTasks,
    defaultView: s.defaultView,
    notificationsEnabled: s.notificationsEnabled,
    soundEffects: s.soundEffects,
    keyboardShortcuts: s.keyboardShortcuts,
    autoSave: s.autoSave,
    dateFormat: s.dateFormat,
    weekStartsOn: s.weekStartsOn,
    defaultProject: s.defaultProject,
    defaultPriority: s.defaultPriority,
    defaultAssignee: s.defaultAssignee,
  }
}

export const THEME_OPTIONS: { value: Settings['theme']; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'linear-purple', label: 'Linear Purple' },
  { value: 'linear-blue', label: 'Linear Blue' },
]

export const FONT_SIZE_OPTIONS: { value: NonNullable<Settings['fontSize']>; label: string }[] = [
  { value: 'small', label: 'Small (12px)' },
  { value: 'medium', label: 'Medium (14px)' },
  { value: 'large', label: 'Large (16px)' },
  { value: 'xlarge', label: 'Extra Large (18px)' },
]

export const DEFAULT_VIEW_OPTIONS: {
  value: NonNullable<Settings['defaultView']>
  label: string
}[] = [
  { value: 'board', label: 'Board (Kanban)' },
  { value: 'list', label: 'List' },
  { value: 'calendar', label: 'Calendar' },
]

export const VIEW_DENSITY_OPTIONS: {
  value: NonNullable<Settings['viewDensity']>
  label: string
}[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'spacious', label: 'Spacious' },
]

export const DATE_FORMAT_OPTIONS: {
  value: NonNullable<Settings['dateFormat']>
  label: string
}[] = [
  { value: 'relative', label: 'Relative (e.g. 2 days ago)' },
  { value: 'absolute', label: 'Absolute (e.g. Jan 28, 2026)' },
  { value: 'iso', label: 'ISO 8601 (2026-01-28)' },
]

export const TIME_FORMAT_OPTIONS: {
  value: NonNullable<Settings['timeFormat']>
  label: string
}[] = [
  { value: '12h', label: '12-hour (AM/PM)' },
  { value: '24h', label: '24-hour' },
]

export const WEEK_STARTS_OPTIONS: {
  value: NonNullable<Settings['weekStartsOn']>
  label: string
}[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
]

export const AUTO_SAVE_INTERVAL_OPTIONS: {
  value: NonNullable<Settings['autoSaveInterval']>
  label: string
}[] = [
  { value: 5, label: '5 seconds' },
  { value: 10, label: '10 seconds' },
  { value: 30, label: '30 seconds' },
]

export { ACCENT_COLORS }

export const AGENT_OPTIONS: { value: Agent; label: string }[] = [
  { value: 'jarvis', label: 'Jarvis (Claude)' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'copilot', label: 'Copilot' },
  { value: 'claude', label: 'Claude Direct' },
  { value: 'diego', label: 'Diego' },
]

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]
