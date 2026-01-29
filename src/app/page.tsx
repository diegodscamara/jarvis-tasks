'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AddIcon,
  AllIssuesIcon,
  AnalyticsIcon,
  BacklogIcon,
  BoardIcon,
  CheckIcon,
  CloseIcon,
  DoneIcon,
  FlashLightIcon,
  InProgressIcon,
  KeyboardIcon,
  ListIcon,
  MoonIcon,
  NotificationIcon,
  PlanningIcon,
  ReviewIcon,
  SearchIcon,
  SettingsIcon,
  TodoIcon,
} from '@/components/icons'
import { CommandPalette } from '@/components/command-palette'
import { ThemeToggle } from '@/components/theme-toggle'
import { ShortcutRow } from '@/components/shortcut-row'
import { TaskCard } from '@/components/task-card'
import { TaskForm } from '@/components/task-form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Switch } from '@/components/ui/switch'
import { Toggle } from '@/components/ui/toggle'
import { ACCENT_COLORS, AGENTS, COLUMNS, DEFAULT_SETTINGS, STORAGE_KEYS } from '@/lib/constants'
import type {
  Agent,
  Analytics,
  Label,
  Notification,
  Project,
  Settings,
  Status,
  Task,
} from '@/types'

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
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
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.settings)
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error('Failed to parse settings', e)
      }
    }
  }, [])

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(updated))
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      if (e.key === 'Escape') {
        setShowModal(false)
        setShowShortcuts(false)
        setShowSearch(false)
        setSearchQuery('')
        setEditingTask(null)
        return
      }

      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowSearch(true)
        return
      }

      if (e.key === '?' && e.shiftKey) {
        e.preventDefault()
        setShowShortcuts((prev) => !prev)
        return
      }

      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setEditingTask({ status: 'todo', assignee: settings.defaultAssignee } as Task)
        setShowModal(true)
        return
      }

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

      if (e.key === 'a' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setActiveView('all')
        setActiveProject(null)
        setActiveLabel(null)
      }
    },
    [settings.defaultAssignee]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    }
  }, [])

  // Bulk selection helpers
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const selectAllTasks = () => {
    setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)))
  }

  const clearSelection = () => {
    setSelectedTaskIds(new Set())
  }

  const bulkUpdateStatus = async (status: Status) => {
    const promises = Array.from(selectedTaskIds).map(id =>
      fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
    )
    await Promise.all(promises)
    fetchTasks()
    clearSelection()
  }

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedTaskIds.size} tasks?`)) return
    const promises = Array.from(selectedTaskIds).map(id =>
      fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    )
    await Promise.all(promises)
    fetchTasks()
    clearSelection()
  }

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (e) {
      console.error('Failed to fetch tasks', e)
    }
  }, [])

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (e) {
      console.error('Failed to fetch projects', e)
    }
  }, [])

  const fetchLabels = useCallback(async () => {
    try {
      const res = await fetch('/api/labels')
      const data = await res.json()
      setLabels(data.labels || [])
    } catch (e) {
      console.error('Failed to fetch labels', e)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchProjects()
    fetchLabels()
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchLabels, fetchNotifications, fetchProjects, fetchTasks])

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      fetchNotifications()
    } catch (e) {
      console.error('Failed to mark notifications as read', e)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch (e) {
      console.error('Failed to fetch analytics', e)
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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.id.toLowerCase().includes(query)
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }
    if (activeProject) {
      filtered = filtered.filter((t) => t.projectId === activeProject)
    }
    if (activeLabel) {
      filtered = filtered.filter((t) => t.labelIds?.includes(activeLabel))
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
    tasks.filter((t) => t.projectId === projectId).length

  const getLabelTaskCount = (labelId: string) =>
    tasks.filter((t) => t.labelIds?.includes(labelId)).length

  const labelGroups = labels.reduce(
    (acc, label) => {
      const group = label.group || 'Other'
      if (!acc[group]) acc[group] = []
      acc[group].push(label)
      return acc
    },
    {} as Record<string, Label[]>
  )

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'backlog':
        return <BacklogIcon size={14} />
      case 'planning':
        return <PlanningIcon size={14} />
      case 'todo':
        return <TodoIcon size={14} />
      case 'in_progress':
        return <InProgressIcon size={14} />
      case 'review':
        return <ReviewIcon size={14} />
      case 'done':
        return <DoneIcon size={14} />
    }
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon" className="border-r border-border">
        <SidebarHeader className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FlashLightIcon size={20} className="text-primary" />
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
                  onClick={() => {
                    setActiveView('all')
                    setActiveProject(null)
                    setActiveLabel(null)
                  }}
                >
                  <AllIssuesIcon size={14} />
                  <span>All Issues</span>
                  <span className="ml-auto text-xs text-muted-foreground">{tasks.length}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === 'in_progress' && !activeProject && !activeLabel}
                  onClick={() => {
                    setActiveView('in_progress')
                    setActiveProject(null)
                    setActiveLabel(null)
                  }}
                >
                  <InProgressIcon size={14} />
                  <span>Active</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {tasks.filter((t) => t.status === 'in_progress').length}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === 'backlog' && !activeProject && !activeLabel}
                  onClick={() => {
                    setActiveView('backlog')
                    setActiveProject(null)
                    setActiveLabel(null)
                  }}
                >
                  <BacklogIcon size={14} />
                  <span>Backlog</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {tasks.filter((t) => t.status === 'backlog').length}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarMenu>
              {projects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton
                    isActive={activeProject === project.id}
                    onClick={() => {
                      setActiveProject(project.id)
                      setActiveView('all')
                      setActiveLabel(null)
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: project.color }}
                    />
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
                  {groupLabels.map((label) => (
                    <SidebarMenuItem key={label.id}>
                      <SidebarMenuButton
                        isActive={activeLabel === label.id}
                        onClick={() => {
                          setActiveLabel(label.id)
                          setActiveView('all')
                          setActiveProject(null)
                        }}
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
              {COLUMNS.map((col) => (
                <SidebarMenuItem key={col.id}>
                  <SidebarMenuButton
                    isActive={activeView === col.id && !activeProject && !activeLabel}
                    onClick={() => {
                      setActiveView(col.id)
                      setActiveProject(null)
                      setActiveLabel(null)
                    }}
                  >
                    {getStatusIcon(col.id)}
                    <span>{col.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {tasks.filter((t) => t.status === col.id).length}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchAnalytics()
              setShowAnalytics(true)
            }}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <AnalyticsIcon size={14} />
            <span>Analytics</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <SettingsIcon size={14} />
            <span>Settings</span>
          </Button>
          <div className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            Built with <FlashLightIcon size={10} /> by Jarvis
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        {/* Bulk Actions Bar */}
        {selectedTaskIds.size > 0 && (
          <div className="flex items-center justify-between p-2 md:p-3 border-b border-border bg-primary/10">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTaskIds.size === filteredTasks.length}
                onCheckedChange={(checked) => checked ? selectAllTasks() : clearSelection()}
              />
              <span className="text-sm font-medium">{selectedTaskIds.size} selected</span>
              <Button variant="link" size="sm" onClick={clearSelection} className="text-xs h-auto p-0">
                Clear
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(value) => {
                  if (value) {
                    bulkUpdateStatus(value as Status)
                  }
                }}
              >
                <SelectTrigger className="w-[120px] h-7 text-xs">
                  <SelectValue placeholder="Move to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="destructive" size="sm" onClick={bulkDelete} className="h-7 text-xs">
                Delete
              </Button>
            </div>
          </div>
        )}

        <header className="flex items-center justify-between p-2 md:p-4 border-b border-border bg-background">
          <div className="flex items-center gap-2 md:gap-4">
            <SidebarTrigger />
            <h1 className="text-base md:text-lg font-semibold truncate max-w-[150px] md:max-w-none">
              {activeLabel
                ? labels.find((l) => l.id === activeLabel)?.name || 'Label'
                : activeProject
                  ? projects.find((p) => p.id === activeProject)?.name || 'Project'
                  : activeView === 'all'
                    ? 'All Issues'
                    : COLUMNS.find((c) => c.id === activeView)?.title || 'Tasks'}
            </h1>
            {activeProject && (
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: projects.find((p) => p.id === activeProject)?.color }}
              />
            )}
            {activeLabel && (
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: labels.find((l) => l.id === activeLabel)?.color }}
              />
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden md:block">
              {showSearch ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-48"
                    autoFocus
                    onBlur={() => {
                      if (!searchQuery) setShowSearch(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowSearch(false)
                        setSearchQuery('')
                      }
                    }}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setSearchQuery('')
                        setShowSearch(false)
                      }}
                    >
                      <CloseIcon size={14} />
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(true)}
                  className="text-xs text-muted-foreground"
                  title="Search (press /)"
                >
                  <SearchIcon size={14} /> <Kbd>/</Kbd>
                </Button>
              )}
            </div>
            <div className="hidden md:flex items-center bg-muted rounded-md p-0.5">
              <Toggle
                size="sm"
                pressed={viewMode === 'board'}
                onPressedChange={() => setViewMode('board')}
                title="Board view"
                className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                <BoardIcon size={14} /> Board
              </Toggle>
              <Toggle
                size="sm"
                pressed={viewMode === 'list'}
                onPressedChange={() => setViewMode('list')}
                title="List view"
                className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                <ListIcon size={14} /> List
              </Toggle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcuts(true)}
              className="hidden md:flex text-xs text-muted-foreground"
              title="Keyboard shortcuts"
            >
              <Kbd>?</Kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="relative"
              title="Notifications"
            >
              <NotificationIcon size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[10px] font-medium flex items-center justify-center text-primary-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>System Online</span>
            </div>
            <span className="hidden md:inline text-sm text-muted-foreground">
              {filteredTasks.length} tasks
            </span>
            <span className="md:hidden text-xs text-muted-foreground">{filteredTasks.length}</span>
            <Button
              size="sm"
              onClick={() => {
                setEditingTask({
                  status: 'todo',
                  assignee: settings.defaultAssignee,
                  projectId: activeProject || undefined,
                  labelIds: activeLabel ? [activeLabel] : undefined,
                } as Task)
                setShowModal(true)
              }}
            >
              <AddIcon size={14} className="mr-1" />
              New Task
            </Button>
          </div>
        </header>

        {viewMode === 'board' && !activeProject && !activeLabel && activeView === 'all' ? (
          <div className="flex flex-col md:flex-row gap-4 p-4 overflow-x-auto flex-1">
            {COLUMNS.map((column) => (
              <div
                key={column.id}
                className="flex-1 min-w-full md:min-w-[280px] flex flex-col gap-3 p-3 rounded-lg bg-muted/30"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(column.id)}
                    <span className="font-medium text-sm">{column.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {getTasksByStatus(column.id).length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {getTasksByStatus(column.id).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      project={projects.find((p) => p.id === task.projectId)}
                      labels={labels.filter((l) => task.labelIds?.includes(l.id))}
                      onDragStart={() => handleDragStart(task)}
                      onClick={() => {
                        setEditingTask(task)
                        setShowModal(true)
                      }}
                      compact={settings.compactView}
                      isSelected={selectedTaskIds.has(task.id)}
                      onToggleSelect={() => toggleTaskSelection(task.id)}
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
                      labelIds: activeLabel ? [activeLabel] : undefined,
                    } as Task)
                    setShowModal(true)
                  }}
                >
                  <AddIcon size={14} className="mr-1" />
                  Add Task
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col p-4">
            <div className="flex items-center gap-4 px-3 py-2 text-xs text-muted-foreground font-medium border-b border-border mb-2">
              <div className="w-8"></div>
              <div className="flex-1">Title</div>
              <div className="w-24">Status</div>
              <div className="w-32">Project</div>
              <div className="w-28">Assignee</div>
              <div className="w-24 text-right">Updated</div>
            </div>
            <div className="flex flex-col gap-1">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  project={projects.find((p) => p.id === task.projectId)}
                  labels={labels.filter((l) => task.labelIds?.includes(l.id))}
                  onDragStart={() => handleDragStart(task)}
                  onClick={() => {
                    setEditingTask(task)
                    setShowModal(true)
                  }}
                  variant="list"
                  compact={settings.compactView}
                  isSelected={selectedTaskIds.has(task.id)}
                  onToggleSelect={() => toggleTaskSelection(task.id)}
                />
              ))}
            </div>
            {filteredTasks.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No tasks in this view</div>
            )}
          </div>
        )}
      </SidebarInset>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingTask?.id ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <DialogPanel className="max-h-[calc(90vh-120px)]">
            <TaskForm
              task={editingTask}
              projects={projects}
              labels={labels}
              onSave={saveTask}
              onDelete={editingTask?.id ? () => deleteTask(editingTask.id) : undefined}
              onClose={() => {
                setShowModal(false)
                setEditingTask(null)
              }}
            />
          </DialogPanel>
        </DialogContent>
      </Dialog>

      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyboardIcon size={18} />
              Keyboard Shortcuts
            </DialogTitle>
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
              Press <Kbd>?</Kbd> anytime to toggle this help
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AnalyticsIcon size={18} />
              Analytics Dashboard
            </DialogTitle>
          </DialogHeader>
          {analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="text-2xl font-bold">{analytics.overview.total}</div>
                  <div className="text-xs text-muted-foreground">Total Tasks</div>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-500">
                    {analytics.overview.completionRate}%
                  </div>
                  <div className="text-xs text-muted-foreground">Completion Rate</div>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-500">
                    {analytics.overview.recentlyCompleted}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed (7 days)</div>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-2xl font-bold text-red-500">
                    {analytics.overview.overdue}
                  </div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Status Breakdown</h3>
                <div className="space-y-2">
                  {COLUMNS.map((column) => {
                    const count = analytics.status[column.id] || 0
                    const percentage =
                      analytics.overview.total > 0
                        ? Math.round((count / analytics.overview.total) * 100)
                        : 0
                    return (
                      <div key={column.id} className="flex items-center gap-3">
                        <span className="text-sm w-32 flex items-center gap-2">
                          {getStatusIcon(column.id)}
                          {column.title}
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Priority Breakdown</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span className="text-sm">High: {analytics.priority.high}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                    <span className="text-sm">Medium: {analytics.priority.medium}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                    <span className="text-sm">Low: {analytics.priority.low}</span>
                  </div>
                </div>
              </div>

              {analytics.projects.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">By Project</h3>
                  <div className="space-y-2">
                    {analytics.projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <span>{project.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckIcon size={12} /> {project.done}
                          </span>
                          <span className="flex items-center gap-1">
                            <InProgressIcon size={12} /> {project.inProgress}
                          </span>
                          <span>Total: {project.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analytics.labels.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Top Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {analytics.labels.slice(0, 8).map((label) => (
                      <span
                        key={label.id}
                        className="px-2 py-1 rounded text-xs"
                        style={{ backgroundColor: `${label.color}30`, color: label.color }}
                      >
                        {label.name}: {label.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <NotificationIcon size={18} />
                Notifications
              </span>
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
                <NotificationIcon size={24} className="mx-auto mb-2" />
                <div>No notifications</div>
                <div className="text-xs mt-1">Comments and updates will appear here</div>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg text-sm cursor-pointer transition-colors ${
                    notif.isRead
                      ? 'bg-muted/50 hover:bg-muted'
                      : 'bg-primary/10 border border-primary/20 hover:bg-primary/20'
                  }`}
                  onClick={() => {
                    const task = tasks.find((t) => t.id === notif.taskId)
                    if (task) {
                      setEditingTask(task)
                      setShowModal(true)
                      setShowNotifications(false)
                    }
                  }}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span
                      className={
                        notif.isRead ? 'text-muted-foreground' : 'text-primary font-medium'
                      }
                    >
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

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SettingsIcon size={18} />
              Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Assignee</label>
              <Select
                value={settings.defaultAssignee}
                onValueChange={(v) => updateSettings({ defaultAssignee: v as Agent })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGENTS.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Switch
                checked={settings.showCompletedTasks}
                onCheckedChange={(checked) => updateSettings({ showCompletedTasks: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Compact View</label>
                <p className="text-xs text-muted-foreground">
                  Show smaller task cards with less detail
                </p>
              </div>
              <Switch
                checked={settings.compactView}
                onCheckedChange={(checked) => updateSettings({ compactView: checked })}
              />
            </div>

            <div className="pt-4 border-t border-border">
              <div>
                <label className="text-sm font-medium">Accent Color</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Customize the primary accent color
                </p>
                <div className="flex gap-2 flex-wrap">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        updateSettings({ accentColor: color.value })
                        document.documentElement.style.setProperty('--accent-color', color.value)
                      }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        settings.accentColor === color.value 
                          ? 'border-white scale-110' 
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Theme</label>
                  <p className="text-xs text-muted-foreground">
                    Dark theme optimized for reduced eye strain
                  </p>
                </div>
                <span className="px-2 py-1 rounded bg-muted text-xs flex items-center gap-1">
                  <MoonIcon size={12} /> Dark
                </span>
              </div>
            </div>

            <div className="pt-4 text-xs text-muted-foreground text-center border-t border-border">
              Settings are saved automatically
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Palette - Cmd+K */}
      <CommandPalette
        tasks={tasks}
        projects={projects}
        labels={labels}
        onCreateTask={() => {
          setEditingTask(null)
          setShowModal(true)
        }}
        onSelectTask={(task) => {
          const fullTask = tasks.find(t => t.id === task.id)
          if (fullTask) {
            setEditingTask(fullTask)
            setShowModal(true)
          }
        }}
        onFilterByProject={(projectId) => {
          setActiveProject(projectId)
        }}
        onFilterByLabel={(labelId) => {
          setActiveLabel(labelId)
        }}
      />
    </SidebarProvider>
  )
}

