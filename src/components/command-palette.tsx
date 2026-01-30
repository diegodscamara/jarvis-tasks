'use client'

import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface Task {
  id: string
  title: string
  status: string
  projectId?: string
}

interface Project {
  id: string
  name: string
  icon: string
}

interface Label {
  id: string
  name: string
  color: string
}

interface CommandPaletteProps {
  tasks: Task[]
  projects: Project[]
  labels: Label[]
  onCreateTask: () => void
  onSelectTask: (task: Task) => void
  onFilterByProject: (projectId: string) => void
  onFilterByLabel: (labelId: string) => void
}

export function CommandPalette({
  tasks,
  projects,
  labels,
  onCreateTask,
  onSelectTask,
  onFilterByProject,
  onFilterByLabel,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false)
    callback()
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command Dialog */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
        <Command className="rounded-lg border border-border bg-popover shadow-2xl overflow-hidden">
          <Command.Input
            placeholder="Search tasks, projects, or type a command..."
            className="w-full px-4 py-3 text-sm bg-transparent border-b border-border outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group
              heading="Actions"
              className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <Command.Item
                onSelect={() => handleSelect(onCreateTask)}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded cursor-pointer aria-selected:bg-accent"
              >
                <span>➕</span>
                <span>Create new task</span>
                <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">N</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect(() => router.push('/login'))}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded cursor-pointer aria-selected:bg-accent"
              >
                <span>🔐</span>
                <span>Sign in / Sign out</span>
              </Command.Item>
            </Command.Group>

            {/* Tasks */}
            {tasks.length > 0 && (
              <Command.Group
                heading="Tasks"
                className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {tasks.slice(0, 10).map((task) => (
                  <Command.Item
                    key={task.id}
                    value={task.title}
                    onSelect={() => handleSelect(() => onSelectTask(task))}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded cursor-pointer aria-selected:bg-accent"
                  >
                    <span className="text-muted-foreground">
                      {task.status === 'done' ? '✅' : task.status === 'in_progress' ? '🔄' : '📝'}
                    </span>
                    <span className="truncate">{task.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <Command.Group
                heading="Projects"
                className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {projects.map((project) => (
                  <Command.Item
                    key={project.id}
                    value={project.name}
                    onSelect={() => handleSelect(() => onFilterByProject(project.id))}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded cursor-pointer aria-selected:bg-accent"
                  >
                    <span>{project.icon}</span>
                    <span>{project.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Labels */}
            {labels.length > 0 && (
              <Command.Group
                heading="Labels"
                className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {labels.slice(0, 5).map((label) => (
                  <Command.Item
                    key={label.id}
                    value={label.name}
                    onSelect={() => handleSelect(() => onFilterByLabel(label.id))}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded cursor-pointer aria-selected:bg-accent"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span>{label.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
        </Command>
      </div>
    </div>
  )
}
