'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Project, Task } from '@/types'

interface DependencyPickerProps {
  currentTaskId?: string
  selectedDependencies: string[]
  availableTasks: Task[]
  projects: Project[]
  onAdd: (taskId: string) => void
  onRemove: (taskId: string) => void
}

export function DependencyPicker({
  currentTaskId,
  selectedDependencies,
  availableTasks,
  projects,
  onAdd,
  onRemove,
}: DependencyPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Filter out current task and already selected dependencies
  const filteredTasks = availableTasks.filter((task) => {
    if (task.id === currentTaskId) return false
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterProject && task.projectId !== filterProject) return false
    if (filterStatus && task.status !== filterStatus) return false
    return true
  })

  // Get selected task details
  const selectedTasks = availableTasks.filter((task) => selectedDependencies.includes(task.id))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Dependencies</label>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger>
            <Button type="button" variant="outline" size="sm">
              Add Dependency
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Dependencies</DialogTitle>
              <DialogDescription>
                Choose tasks that must be completed before this task can begin.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={filterProject}
                  onValueChange={(value) => setFilterProject(value ?? '')}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value ?? '')}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All status</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="backlog">Backlog</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-1">
                {filteredTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No tasks found</p>
                ) : (
                  filteredTasks.map((task) => {
                    const project = projects.find((p) => p.id === task.projectId)
                    const isSelected = selectedDependencies.includes(task.id)

                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted border-border'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            onRemove(task.id)
                          } else {
                            onAdd(task.id)
                          }
                          setIsOpen(false)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{task.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {project && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${project.color}20`,
                                    color: project.color,
                                  }}
                                >
                                  {project.name}
                                </span>
                              )}
                              <span
                                className={`text-xs ${
                                  task.status === 'done'
                                    ? 'text-green-600'
                                    : task.status === 'in_progress'
                                      ? 'text-blue-600'
                                      : 'text-muted-foreground'
                                }`}
                              >
                                {task.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                          {isSelected && <span className="text-primary">✓</span>}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedTasks.length > 0 ? (
        <div className="space-y-1">
          {selectedTasks.map((task) => {
            const project = projects.find((p) => p.id === task.projectId)

            return (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 rounded bg-muted/50"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm truncate">{task.title}</span>
                  {project && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        backgroundColor: `${project.color}20`,
                        color: project.color,
                      }}
                    >
                      {project.name}
                    </span>
                  )}
                  <Badge
                    variant={task.status === 'done' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {task.status}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(task.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No dependencies selected</p>
      )}
    </div>
  )
}
