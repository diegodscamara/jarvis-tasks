'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar'

type Priority = 'high' | 'medium' | 'low'
type Status = 'backlog' | 'todo' | 'in_progress' | 'done'
type Agent = 'jarvis' | 'gemini' | 'copilot' | 'claude' | 'diego'

interface Comment {
  id: string
  text: string
  content?: string  // alias for text (API uses content)
  author: string
  createdAt: string
  isRead?: boolean
}

interface Project {
  id: string
  name: string
  description: string
  icon: string
  color: string
  lead: string
}

interface Label {
  id: string
  name: string
  color: string
  group?: string
}

interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  assignee: Agent
  projectId?: string
  labelIds?: string[]
  dueDate?: string
  estimate?: number // in hours
  parentId?: string // for sub-issues
  createdAt: string
  updatedAt: string
  comments?: Comment[]
}

const columns: { id: Status; title: string; icon: string }[] = [
  { id: 'backlog', title: 'Backlog', icon: '📋' },
  { id: 'todo', title: 'To Do', icon: '📝' },
  { id: 'in_progress', title: 'In Progress', icon: '🔄' },
  { id: 'done', title: 'Done', icon: '✅' },
]

const agents: { id: Agent; name: string; color: string }[] = [
  { id: 'jarvis', name: 'Jarvis (Claude)', color: '#00d4ff' },
  { id: 'gemini', name: 'Gemini', color: '#4285f4' },
  { id: 'copilot', name: 'Copilot', color: '#6e40c9' },
  { id: 'claude', name: 'Claude Direct', color: '#cc785c' },
  { id: 'diego', name: 'Diego', color: '#2ed573' },
]

const priorityColors: Record<Priority, string> = {
  high: '#F59E0B',
  medium: '#5E6AD2',
  low: '#6B6B6B',
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [activeView, setActiveView] = useState<'all' | Status>('all')
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [notifications, setNotifications] = useState<{id: string; type: string; taskId: string; taskTitle: string; message: string; author: string; createdAt: string; isRead: boolean}[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  
  // Settings state (persisted to localStorage)
  const [settings, setSettings] = useState({
    defaultAssignee: 'jarvis' as Agent,
    showCompletedTasks: true,
    compactView: false,
    theme: 'dark' as 'dark' | 'light',
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('jarvis-tasks-settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error('Failed to parse settings', e)
      }
    }
  }, [])

  // Save settings to localStorage when changed
  const updateSettings = (newSettings: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem('jarvis-tasks-settings', JSON.stringify(updated))
  }

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement) {
      return
    }

    // Escape - close modals and search
    if (e.key === 'Escape') {
      setShowModal(false)
      setShowShortcuts(false)
      setShowSearch(false)
      setSearchQuery('')
      setEditingTask(null)
      return
    }

    // / - open search
    if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      setShowSearch(true)
      return
    }

    // ? - show shortcuts help
    if (e.key === '?' && e.shiftKey) {
      e.preventDefault()
      setShowShortcuts(prev => !prev)
      return
    }

    // c - create new task
    if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      setEditingTask({ status: 'todo', assignee: settings.defaultAssignee } as Task)
      setShowModal(true)
      return
    }

    // b - toggle sidebar (handled by shadcn)
    // 1-4 - switch to status view
    if (e.key === '1') {
      e.preventDefault()
      setActiveView('backlog')
      setActiveProject(null)
      setActiveLabel(null)
    }
    if (e.key === '2') {
      e.preventDefault()
      setActiveView('todo')
      setActiveProject(null)
      setActiveLabel(null)
    }
    if (e.key === '3') {
      e.preventDefault()
      setActiveView('in_progress')
      setActiveProject(null)
      setActiveLabel(null)
    }
    if (e.key === '4') {
      e.preventDefault()
      setActiveView('done')
      setActiveProject(null)
      setActiveLabel(null)
    }

    // a - show all issues
    if (e.key === 'a' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      setActiveView('all')
      setActiveProject(null)
      setActiveLabel(null)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    fetchTasks()
    fetchProjects()
    fetchLabels()
    fetchNotifications()
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    }
  }

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      })
      fetchNotifications()
    } catch (e) {
      console.error('Failed to mark notifications as read', e)
    }
  }

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (e) {
      console.error('Failed to fetch tasks', e)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (e) {
      console.error('Failed to fetch projects', e)
    }
  }

  const fetchLabels = async () => {
    try {
      const res = await fetch('/api/labels')
      const data = await res.json()
      setLabels(data.labels || [])
    } catch (e) {
      console.error('Failed to fetch labels', e)
    }
  }

  const saveTask = async (task: Partial<Task>) => {
    const method = task.id ? 'PUT' : 'POST'
    await fetch('/api/tasks', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    })
    await fetchTasks()
    setShowModal(false)
    setEditingTask(null)
  }

  const deleteTask = async (id: string) => {
    await fetch('/api/tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await fetchTasks()
    setShowModal(false)
    setEditingTask(null)
  }

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (status: Status) => {
    if (draggedTask && draggedTask.status !== status) {
      await saveTask({ ...draggedTask, status })
    }
    setDraggedTask(null)
  }

  const getFilteredTasks = (statusFilter?: Status) => {
    let filtered = tasks
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query)
      )
    }
    
    if (statusFilter) {
      filtered = filtered.filter(t => t.status === statusFilter)
    }
    if (activeProject) {
      filtered = filtered.filter(t => t.projectId === activeProject)
    }
    if (activeLabel) {
      filtered = filtered.filter(t => t.labelIds?.includes(activeLabel))
    }
    
    return filtered
  }

  const getTasksByStatus = (status: Status) => getFilteredTasks(status)

  const filteredTasks = (() => {
    if (activeView === 'all') {
      return getFilteredTasks()
    }
    return getFilteredTasks(activeView)
  })()

  const getProjectTaskCount = (projectId: string) => 
    tasks.filter(t => t.projectId === projectId).length

  const getLabelTaskCount = (labelId: string) =>
    tasks.filter(t => t.labelIds?.includes(labelId)).length

  // Group labels by their group property
  const labelGroups = labels.reduce((acc, label) => {
    const group = label.group || 'Other'
    if (!acc[group]) acc[group] = []
    acc[group].push(label)
    return acc
  }, {} as Record<string, Label[]>)

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-border">
        <SidebarHeader className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="font-semibold text-foreground">Jarvis Tasks</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupLabel>Views</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeView === 'all' && !activeProject && !activeLabel}
                  onClick={() => { setActiveView('all'); setActiveProject(null); setActiveLabel(null) }}
                >
                  <span>📊</span>
                  <span>All Issues</span>
                  <span className="ml-auto text-xs text-muted-foreground">{tasks.length}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === 'in_progress' && !activeProject && !activeLabel}
                  onClick={() => { setActiveView('in_progress'); setActiveProject(null); setActiveLabel(null) }}
                >
                  <span>🔄</span>
                  <span>Active</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {tasks.filter(t => t.status === 'in_progress').length}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === 'backlog' && !activeProject && !activeLabel}
                  onClick={() => { setActiveView('backlog'); setActiveProject(null); setActiveLabel(null) }}
                >
                  <span>📋</span>
                  <span>Backlog</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {tasks.filter(t => t.status === 'backlog').length}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarMenu>
              {projects.map(project => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton
                    isActive={activeProject === project.id}
                    onClick={() => { setActiveProject(project.id); setActiveView('all'); setActiveLabel(null) }}
                  >
                    <span>{project.icon}</span>
                    <span>{project.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {getProjectTaskCount(project.id)}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Labels</SidebarGroupLabel>
            <SidebarMenu>
              {Object.entries(labelGroups).map(([group, groupLabels]) => (
                <div key={group}>
                  <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                    {group}
                  </div>
                  {groupLabels.map(label => (
                    <SidebarMenuItem key={label.id}>
                      <SidebarMenuButton
                        isActive={activeLabel === label.id}
                        onClick={() => { setActiveLabel(label.id); setActiveView('all'); setActiveProject(null) }}
                      >
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: label.color }}
                        />
                        <span>{label.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {getLabelTaskCount(label.id)}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Status</SidebarGroupLabel>
            <SidebarMenu>
              {columns.map(col => (
                <SidebarMenuItem key={col.id}>
                  <SidebarMenuButton
                    isActive={activeView === col.id && !activeProject && !activeLabel}
                    onClick={() => { setActiveView(col.id); setActiveProject(null); setActiveLabel(null) }}
                  >
                    <span>{col.icon}</span>
                    <span>{col.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {tasks.filter(t => t.status === col.id).length}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-3 border-t border-border">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
          <div className="text-xs text-muted-foreground text-center mt-2">
            Built with ⚡ by Jarvis
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-2 md:p-4 border-b border-border bg-background">
          <div className="flex items-center gap-2 md:gap-4">
            <SidebarTrigger />
            <h1 className="text-base md:text-lg font-semibold truncate max-w-[150px] md:max-w-none">
              {activeLabel
                ? labels.find(l => l.id === activeLabel)?.name || 'Label'
                : activeProject 
                  ? projects.find(p => p.id === activeProject)?.name || 'Project'
                  : activeView === 'all' 
                    ? 'All Issues' 
                    : columns.find(c => c.id === activeView)?.title || 'Tasks'}
            </h1>
            {activeProject && (
              <span className="text-sm text-muted-foreground">
                {projects.find(p => p.id === activeProject)?.icon}
              </span>
            )}
            {activeLabel && (
              <span 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: labels.find(l => l.id === activeLabel)?.color }}
              />
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              {showSearch ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-48 px-3 py-1 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                    onBlur={() => {
                      if (!searchQuery) setShowSearch(false)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Escape') {
                        setShowSearch(false)
                        setSearchQuery('')
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setShowSearch(false) }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Search (press /)"
                >
                  🔍 <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">/</kbd>
                </button>
              )}
            </div>
            {/* View Toggle - Hidden on mobile */}
            <div className="hidden md:flex items-center bg-muted rounded-md p-0.5">
              <button
                onClick={() => setViewMode('board')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  viewMode === 'board' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Board view"
              >
                📋 Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="List view"
              >
                📝 List
              </button>
            </div>
            <button
              onClick={() => setShowShortcuts(true)}
              className="hidden md:block text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Keyboard shortcuts"
            >
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">?</kbd>
            </button>
            {/* Notifications Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-1.5 rounded hover:bg-muted transition-colors"
              title="Notifications"
            >
              <span>🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[10px] font-medium flex items-center justify-center text-primary-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>System Online</span>
            </div>
            <span className="hidden md:inline text-sm text-muted-foreground">{filteredTasks.length} tasks</span>
            <span className="md:hidden text-xs text-muted-foreground">{filteredTasks.length}</span>
            <Button 
              size="sm"
              onClick={() => { 
                setEditingTask({ 
                  status: 'todo',
                  assignee: settings.defaultAssignee,
                  projectId: activeProject || undefined,
                  labelIds: activeLabel ? [activeLabel] : undefined
                } as Task)
                setShowModal(true) 
              }}
            >
              + New Task
            </Button>
          </div>
        </header>

        {/* Board View (Kanban) */}
        {viewMode === 'board' && !activeProject && !activeLabel && activeView === 'all' ? (
          <div className="flex flex-col md:flex-row gap-4 p-4 overflow-x-auto flex-1">
            {columns.map(column => (
              <div 
                key={column.id} 
                className="flex-1 min-w-full md:min-w-[280px] flex flex-col gap-3 p-3 rounded-lg bg-muted/30"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span>{column.icon}</span>
                    <span className="font-medium text-sm">{column.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {getTasksByStatus(column.id).length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {getTasksByStatus(column.id).map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      project={projects.find(p => p.id === task.projectId)}
                      labels={labels.filter(l => task.labelIds?.includes(l.id))}
                      onDragStart={() => handleDragStart(task)}
                      onClick={() => { setEditingTask(task); setShowModal(true) }}
                      compact={settings.compactView}
                    />
                  ))}
                </div>

                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full border border-dashed border-border text-muted-foreground hover:text-foreground"
                  onClick={() => { 
                    setEditingTask({ 
                      status: column.id,
                      assignee: settings.defaultAssignee,
                      projectId: activeProject || undefined,
                      labelIds: activeLabel ? [activeLabel] : undefined
                    } as Task)
                    setShowModal(true) 
                  }}
                >
                  + Add Task
                </Button>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="flex flex-col p-4">
            {/* List Header */}
            <div className="flex items-center gap-4 px-3 py-2 text-xs text-muted-foreground font-medium border-b border-border mb-2">
              <div className="w-8"></div>
              <div className="flex-1">Title</div>
              <div className="w-24">Status</div>
              <div className="w-32">Project</div>
              <div className="w-28">Assignee</div>
              <div className="w-24 text-right">Updated</div>
            </div>
            {/* List Items */}
            <div className="flex flex-col gap-1">
              {filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  project={projects.find(p => p.id === task.projectId)}
                  labels={labels.filter(l => task.labelIds?.includes(l.id))}
                  onDragStart={() => handleDragStart(task)}
                  onClick={() => { setEditingTask(task); setShowModal(true) }}
                  variant="list"
                  compact={settings.compactView}
                />
              ))}
            </div>
            {filteredTasks.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No tasks in this view
              </div>
            )}
          </div>
        )}
      </SidebarInset>

      {/* Task Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask?.id ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            projects={projects}
            labels={labels}
            onSave={saveTask}
            onDelete={editingTask?.id ? () => deleteTask(editingTask.id) : undefined}
            onClose={() => { setShowModal(false); setEditingTask(null) }}
          />
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Help */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>⌨️ Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Navigation</h3>
              <div className="space-y-1">
                <ShortcutRow keys={['a']} description="All Issues" />
                <ShortcutRow keys={['1']} description="Backlog" />
                <ShortcutRow keys={['2']} description="To Do" />
                <ShortcutRow keys={['3']} description="In Progress" />
                <ShortcutRow keys={['4']} description="Done" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Actions</h3>
              <div className="space-y-1">
                <ShortcutRow keys={['c']} description="Create new task" />
                <ShortcutRow keys={['Esc']} description="Close dialog" />
                <ShortcutRow keys={['/']} description="Search tasks" />
                <ShortcutRow keys={['?']} description="Show this help" />
              </div>
            </div>
            <div className="pt-2 text-xs text-muted-foreground text-center border-t border-border">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">?</kbd> anytime to toggle this help
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>🔔 Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="text-xs text-primary hover:underline font-normal"
                >
                  Mark all as read
                </button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-2xl mb-2">🔔</div>
                <div>No notifications</div>
                <div className="text-xs mt-1">Comments and updates will appear here</div>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg text-sm cursor-pointer transition-colors ${
                    notif.isRead 
                      ? 'bg-muted/50 hover:bg-muted' 
                      : 'bg-primary/10 border border-primary/20 hover:bg-primary/20'
                  }`}
                  onClick={() => {
                    // Find and open the task
                    const task = tasks.find(t => t.id === notif.taskId)
                    if (task) {
                      setEditingTask(task)
                      setShowModal(true)
                      setShowNotifications(false)
                    }
                  }}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={notif.isRead ? 'text-muted-foreground' : 'text-primary font-medium'}>
                      {notif.author} commented
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="font-medium mb-1">{notif.taskTitle}</div>
                  <div className="text-muted-foreground line-clamp-2">{notif.message}</div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>⚙️ Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Assignee</label>
              <select 
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                value={settings.defaultAssignee}
                onChange={e => updateSettings({ defaultAssignee: e.target.value as Agent })}
              >
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                New tasks will be assigned to this agent by default
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Show Completed Tasks</label>
                <p className="text-xs text-muted-foreground">
                  Display tasks marked as done in the board view
                </p>
              </div>
              <button
                onClick={() => updateSettings({ showCompletedTasks: !settings.showCompletedTasks })}
                className={`w-11 h-6 rounded-full transition-colors ${
                  settings.showCompletedTasks ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span 
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.showCompletedTasks ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Compact View</label>
                <p className="text-xs text-muted-foreground">
                  Show smaller task cards with less detail
                </p>
              </div>
              <button
                onClick={() => updateSettings({ compactView: !settings.compactView })}
                className={`w-11 h-6 rounded-full transition-colors ${
                  settings.compactView ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span 
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.compactView ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Theme</label>
                  <p className="text-xs text-muted-foreground">
                    Dark theme optimized for reduced eye strain
                  </p>
                </div>
                <span className="px-2 py-1 rounded bg-muted text-xs">
                  🌙 Dark
                </span>
              </div>
            </div>

            <div className="pt-4 text-xs text-muted-foreground text-center border-t border-border">
              Settings are saved automatically
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd 
            key={i}
            className="px-2 py-0.5 rounded bg-muted text-xs font-mono"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  )
}

function TaskCard({ 
  task, 
  project,
  labels,
  onDragStart, 
  onClick,
  variant = 'card',
  compact = false
}: { 
  task: Task
  project?: Project
  labels: Label[]
  onDragStart: () => void
  onClick: () => void
  variant?: 'card' | 'list'
  compact?: boolean
}) {
  const agent = agents.find(a => a.id === task.assignee)
  const statusInfo = columns.find(c => c.id === task.status)
  
  if (variant === 'list') {
    return (
      <div 
        className="flex items-center gap-4 px-3 py-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
        draggable
        onDragStart={onDragStart}
        onClick={onClick}
      >
        {/* Priority Indicator */}
        <div 
          className="w-2 h-2 rounded-full flex-shrink-0" 
          style={{ backgroundColor: priorityColors[task.priority] }}
        />
        
        {/* Title & Labels */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-medium text-sm truncate">{task.title}</span>
          {labels.slice(0, 2).map(label => (
            <span 
              key={label.id}
              className="px-1.5 py-0.5 rounded text-[10px] flex-shrink-0"
              style={{ backgroundColor: label.color + '30', color: label.color }}
            >
              {label.name}
            </span>
          ))}
          {labels.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{labels.length - 2}</span>
          )}
        </div>
        
        {/* Status */}
        <div className="w-24 text-xs text-muted-foreground flex-shrink-0">
          {statusInfo?.icon} {statusInfo?.title}
        </div>
        
        {/* Project */}
        <div className="w-32 flex-shrink-0">
          {project ? (
            <span 
              className="px-2 py-0.5 rounded text-xs"
              style={{ backgroundColor: project.color + '20', color: project.color }}
            >
              {project.icon} {project.name}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>
        
        {/* Assignee */}
        <div className="w-28 text-xs text-muted-foreground truncate flex-shrink-0">
          {agent?.name || task.assignee}
        </div>
        
        {/* Date */}
        <div className="w-24 text-xs text-muted-foreground text-right flex-shrink-0">
          {new Date(task.updatedAt).toLocaleDateString()}
        </div>
      </div>
    )
  }

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-all"
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <CardContent className="p-3 relative">
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" 
          style={{ backgroundColor: priorityColors[task.priority] }}
        />
        <div className="pl-2">
          <div className="flex flex-wrap gap-1 mb-1.5">
            {project && (
              <span 
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: project.color + '20', color: project.color }}
              >
                {project.icon} {project.name}
              </span>
            )}
            {labels.map(label => (
              <span 
                key={label.id}
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: label.color + '30', color: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
          <div className="font-medium text-sm mb-1">{task.title}</div>
          {task.description && (
            <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="px-2 py-0.5 rounded bg-muted">
              {agent?.name || task.assignee}
            </span>
            {task.dueDate && (
              <span className={`px-2 py-0.5 rounded ${
                new Date(task.dueDate) < new Date() ? 'bg-red-500/20 text-red-400' : 'bg-muted'
              }`}>
                📅 {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.estimate && (
              <span className="px-2 py-0.5 rounded bg-muted">
                ⏱️ {task.estimate}h
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TaskForm({ 
  task, 
  projects,
  labels,
  onSave, 
  onDelete,
  onClose 
}: { 
  task: Task | null
  projects: Project[]
  labels: Label[]
  onSave: (task: Partial<Task>) => void
  onDelete?: () => void
  onClose: () => void 
}) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium')
  const [assignee, setAssignee] = useState<Agent>(task?.assignee || 'jarvis')
  const [status, setStatus] = useState<Status>(task?.status || 'todo')
  const [projectId, setProjectId] = useState<string>(task?.projectId || '')
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(task?.labelIds || [])
  const [dueDate, setDueDate] = useState<string>(task?.dueDate || '')
  const [estimate, setEstimate] = useState<string>(task?.estimate?.toString() || '')
  const [comments, setComments] = useState<Comment[]>(task?.comments || [])
  const [newComment, setNewComment] = useState('')

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: task?.id,
      title,
      description,
      priority,
      assignee,
      status,
      projectId: projectId || undefined,
      labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      dueDate: dueDate || undefined,
      estimate: estimate ? parseFloat(estimate) : undefined,
      comments,
    })
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !task?.id) return

    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      author: 'diego',
      createdAt: new Date().toISOString()
    }

    await fetch(`/api/tasks/${task.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment)
    })

    setComments([...comments, comment])
    setNewComment('')
  }

  // Group labels by their group property
  const labelGroups = labels.reduce((acc, label) => {
    const group = label.group || 'Other'
    if (!acc[group]) acc[group] = []
    acc[group].push(label)
    return acc
  }, {} as Record<string, Label[]>)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Task title..."
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Task description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Project</label>
          <select 
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            value={projectId} 
            onChange={e => setProjectId(e.target.value)}
          >
            <option value="">No Project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.icon} {project.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <select 
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            value={priority} 
            onChange={e => setPriority(e.target.value as Priority)}
          >
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Labels</label>
        <div className="flex flex-wrap gap-2 p-2 border border-input rounded-md bg-background min-h-[40px]">
          {Object.entries(labelGroups).map(([group, groupLabels]) => (
            <div key={group} className="flex flex-wrap gap-1">
              {groupLabels.map(label => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    selectedLabelIds.includes(label.id)
                      ? 'ring-2 ring-offset-1 ring-offset-background'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ 
                    backgroundColor: label.color + '30', 
                    color: label.color
                  }}
                >
                  {label.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Assignee</label>
          <select 
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            value={assignee} 
            onChange={e => setAssignee(e.target.value as Agent)}
          >
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select 
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            value={status} 
            onChange={e => setStatus(e.target.value as Status)}
          >
            {columns.map(col => (
              <option key={col.id} value={col.id}>{col.icon} {col.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">📅 Due Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">⏱️ Estimate (hours)</label>
          <input
            type="number"
            min="0"
            step="0.5"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            value={estimate}
            onChange={e => setEstimate(e.target.value)}
            placeholder="e.g. 2"
          />
        </div>
      </div>
      
      {task?.id && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">💬 Comments</h3>
            <span className="text-xs text-muted-foreground">{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="max-h-[200px] overflow-y-auto space-y-2">
            {comments.map(comment => {
              const isJarvis = comment.author === 'jarvis' || comment.author === 'Jarvis'
              const commentText = comment.text || comment.content || ''
              return (
                <div 
                  key={comment.id} 
                  className={`p-3 rounded-lg text-sm ${
                    isJarvis 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      {isJarvis && <span>⚡</span>}
                      <span className={isJarvis ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        {comment.author}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{commentText}</div>
                </div>
              )
            })}
            {comments.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-6 bg-muted/30 rounded-lg">
                <div className="mb-1">💬</div>
                <div>No comments yet</div>
                <div className="text-xs mt-1">Add a comment or Jarvis will respond here</div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddComment())}
            />
            <Button 
              type="button" 
              size="sm"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Send
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {task?.id ? 'Update' : 'Create'}
        </Button>
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
