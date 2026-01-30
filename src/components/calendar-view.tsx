'use client'

import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PRIORITY_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Project, Task } from '@/types'

interface CalendarViewProps {
  tasks: Task[]
  projects: Project[]
  onTaskClick: (task: Task) => void
  onDateClick?: (date: Date) => void
  onTaskReschedule?: (task: Task, newDate: Date) => void
}

type ViewMode = 'month' | 'week'

export function CalendarView({
  tasks,
  projects,
  onTaskClick,
  onDateClick,
  onTaskReschedule,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null)

  const goToPrevious = useCallback(() => {
    setCurrentDate((prev) => (viewMode === 'month' ? subMonths(prev, 1) : addWeeks(prev, -1)))
  }, [viewMode])

  const goToNext = useCallback(() => {
    setCurrentDate((prev) => (viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1)))
  }, [viewMode])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  // Get tasks for a specific date
  const getTasksForDate = useCallback(
    (date: Date) => {
      return tasks.filter((task) => {
        if (!task.dueDate) return false
        return isSameDay(new Date(task.dueDate), date)
      })
    },
    [tasks]
  )

  // Generate calendar days
  const calendarDays = useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    }

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days: Date[] = []
    let day = calendarStart
    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentDate, viewMode])

  const getProject = useCallback(
    (projectId?: string) => projects.find((p) => p.id === projectId),
    [projects]
  )

  // Drag handlers
  const handleDragStart = useCallback((task: Task) => {
    setDraggedTask(task)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault()
    setDragOverDate(date)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null)
  }, [])

  const handleDrop = useCallback(
    (date: Date) => {
      if (draggedTask && onTaskReschedule) {
        const currentDueDate = draggedTask.dueDate ? new Date(draggedTask.dueDate) : null
        if (!currentDueDate || !isSameDay(currentDueDate, date)) {
          onTaskReschedule(draggedTask, date)
        }
      }
      setDraggedTask(null)
      setDragOverDate(null)
    },
    [draggedTask, onTaskReschedule]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null)
    setDragOverDate(null)
  }, [])

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={goToPrevious}>
              ←
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNext}>
              →
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onTaskReschedule && (
            <span className="text-xs text-muted-foreground">Drag tasks to reschedule</span>
          )}
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div
          className={cn('grid grid-cols-7 gap-1', viewMode === 'week' ? 'h-[calc(100%-40px)]' : '')}
        >
          {calendarDays.map((day) => {
            const dayTasks = getTasksForDate(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDragOver = dragOverDate && isSameDay(dragOverDate, day)

            return (
              <Card
                key={day.toISOString()}
                className={cn(
                  'min-h-[100px] cursor-pointer transition-all hover:bg-accent/50',
                  viewMode === 'week' && 'min-h-[300px]',
                  !isCurrentMonth && 'opacity-40',
                  isToday && 'ring-2 ring-primary',
                  isDragOver && 'ring-2 ring-blue-500 bg-blue-500/10'
                )}
                onClick={() => onDateClick?.(day)}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(day)}
              >
                <CardContent className="p-2">
                  <div className={cn('text-sm font-medium mb-1', isToday && 'text-primary')}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[80px]">
                    {dayTasks.slice(0, viewMode === 'week' ? 10 : 3).map((task) => {
                      const project = getProject(task.projectId)
                      const isDragging = draggedTask?.id === task.id
                      return (
                        <div
                          key={task.id}
                          draggable={!!onTaskReschedule}
                          onDragStart={() => handleDragStart(task)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer hover:bg-accent truncate transition-opacity',
                            isDragging && 'opacity-50',
                            onTaskReschedule && 'cursor-grab active:cursor-grabbing'
                          )}
                          style={{
                            borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onTaskClick(task)
                          }}
                          title={`${task.title}${project ? ` - ${project.name}` : ''}`}
                        >
                          {project && (
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: project.color }}
                            />
                          )}
                          <span className="truncate">{task.title}</span>
                        </div>
                      )
                    })}
                    {dayTasks.length > (viewMode === 'week' ? 10 : 3) && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayTasks.length - (viewMode === 'week' ? 10 : 3)} more
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-4 border-t border-border text-xs text-muted-foreground">
        <span>Priority:</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: PRIORITY_COLORS.high }} />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: PRIORITY_COLORS.medium }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: PRIORITY_COLORS.low }} />
          <span>Low</span>
        </div>
      </div>
    </div>
  )
}
