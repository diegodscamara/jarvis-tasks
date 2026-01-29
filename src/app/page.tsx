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
  author: string
  createdAt: string
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

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement) {
      return
    }

    // Escape - close modals
    if (e.key === 'Escape') {
      setShowModal(false)
      setShowShortcuts(false)
      setEditingTask(null)
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
      setEditingTask({ status: 'todo' } as Task)
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
  }, [])

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
          <div className="text-xs text-muted-foreground text-center">
            Built with ⚡ by Jarvis
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-background">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowShortcuts(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Keyboard shortcuts"
            >
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">?</kbd>
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>System Online</span>
            </div>
            <span className="text-sm text-muted-foreground">{filteredTasks.length} tasks</span>
            <Button 
              size="sm"
              onClick={() => { 
                setEditingTask({ 
                  status: 'todo',
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

        {/* Board View */}
        {!activeProject && !activeLabel && activeView === 'all' ? (
          <div className="flex gap-4 p-4 overflow-x-auto flex-1">
            {columns.map(column => (
              <div 
                key={column.id} 
                className="flex-1 min-w-[280px] flex flex-col gap-3 p-3 rounded-lg bg-muted/30"
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
          /* List View for filtered status, project, or label */
          <div className="flex flex-col gap-2 p-4">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                project={projects.find(p => p.id === task.projectId)}
                labels={labels.filter(l => task.labelIds?.includes(l.id))}
                onDragStart={() => handleDragStart(task)}
                onClick={() => { setEditingTask(task); setShowModal(true) }}
                variant="list"
              />
            ))}
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
                <ShortcutRow keys={['?']} description="Show this help" />
              </div>
            </div>
            <div className="pt-2 text-xs text-muted-foreground text-center border-t border-border">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">?</kbd> anytime to toggle this help
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
  variant = 'card'
}: { 
  task: Task
  project?: Project
  labels: Label[]
  onDragStart: () => void
  onClick: () => void
  variant?: 'card' | 'list'
}) {
  const agent = agents.find(a => a.id === task.assignee)
  
  if (variant === 'list') {
    return (
      <Card 
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        draggable
        onDragStart={onDragStart}
        onClick={onClick}
      >
        <CardContent className="p-3 flex items-center gap-4">
          <div 
            className="w-1 h-8 rounded-full" 
            style={{ backgroundColor: priorityColors[task.priority] }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm truncate">{task.title}</span>
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
            {task.description && (
              <div className="text-xs text-muted-foreground truncate">{task.description}</div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {project && (
              <span 
                className="px-2 py-0.5 rounded"
                style={{ backgroundColor: project.color + '20', color: project.color }}
              >
                {project.icon} {project.name}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-muted">{agent?.name || task.assignee}</span>
            <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
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
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="px-2 py-0.5 rounded bg-muted">
              {agent?.name || task.assignee}
            </span>
            <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
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
      
      {task?.id && (
        <div className="space-y-3 pt-4 border-t border-border">
          <h3 className="text-sm font-medium">Comments</h3>
          <div className="max-h-[150px] overflow-y-auto space-y-2">
            {comments.map(comment => (
              <div key={comment.id} className="p-2 rounded bg-muted text-sm">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span className="text-primary">{comment.author}</span>
                  <span>{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <div>{comment.text}</div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-4">
                No comments yet
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
              Add
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
