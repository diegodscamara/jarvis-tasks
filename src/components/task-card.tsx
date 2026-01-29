'use client'

import { CalendarIcon, ClockIcon, StatusIcon } from '@/components/icons'
import { Card, CardContent } from '@/components/ui/card'
import { AGENTS, COLUMNS, PRIORITY_COLORS } from '@/lib/constants'
import type { Label, Project, Task } from '@/types'

interface TaskCardProps {
  task: Task
  project?: Project
  labels: Label[]
  onDragStart: () => void
  onClick: () => void
  variant?: 'card' | 'list'
  compact?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
}

export function TaskCard({
  task,
  project,
  labels,
  onDragStart,
  onClick,
  variant = 'card',
  compact = false,
  isSelected = false,
  onToggleSelect,
}: TaskCardProps) {
  const agent = AGENTS.find((a) => a.id === task.assignee)
  const statusInfo = COLUMNS.find((c) => c.id === task.status)

  if (variant === 'list') {
    return (
      <div
        className={`flex items-center gap-4 px-3 py-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors ${isSelected ? 'bg-primary/10' : ''}`}
        draggable
        onDragStart={onDragStart}
        onClick={onClick}
      >
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              onToggleSelect()
            }}
            onClick={(e) => e.stopPropagation()}
            className="rounded flex-shrink-0"
          />
        )}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
        />

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-medium text-sm truncate">{task.title}</span>
          {labels.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="px-1.5 py-0.5 rounded text-[10px] flex-shrink-0"
              style={{ backgroundColor: `${label.color}30`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
          {labels.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{labels.length - 2}</span>
          )}
        </div>

        <div className="w-24 text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
          <StatusIcon status={task.status} size={12} />
          <span>{statusInfo?.title}</span>
        </div>

        <div className="w-32 flex-shrink-0">
          {project ? (
            <span
              className="px-2 py-0.5 rounded text-xs"
              style={{ backgroundColor: `${project.color}20`, color: project.color }}
            >
              {project.name}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>

        <div className="w-28 text-xs text-muted-foreground truncate flex-shrink-0">
          {agent?.name || task.assignee}
        </div>

        <div className="w-24 text-xs text-muted-foreground text-right flex-shrink-0">
          {new Date(task.updatedAt).toLocaleDateString()}
        </div>
      </div>
    )
  }

  return (
    <Card
      className={`cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <CardContent className={`relative ${compact ? 'p-2' : 'p-3'}`}>
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              onToggleSelect()
            }}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 rounded z-10"
          />
        )}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
        />
        <div className="pl-2">
          <div className="flex flex-wrap gap-1 mb-1.5">
            {project && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: `${project.color}20`, color: project.color }}
              >
                {project.name}
              </span>
            )}
            {labels.map((label) => (
              <span
                key={label.id}
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: `${label.color}30`, color: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
          <div className={`font-medium mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>{task.title}</div>
          {!compact && task.description && (
            <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="px-2 py-0.5 rounded bg-muted">{agent?.name || task.assignee}</span>
            {task.dueDate && (
              <span
                className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                  new Date(task.dueDate) < new Date() ? 'bg-red-500/20 text-red-400' : 'bg-muted'
                }`}
              >
                <CalendarIcon size={10} />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.estimate && (
              <span className="px-2 py-0.5 rounded bg-muted flex items-center gap-1">
                <ClockIcon size={10} />
                {task.estimate}h
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
