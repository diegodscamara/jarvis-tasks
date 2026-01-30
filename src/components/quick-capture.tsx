'use client'

import { useState, useEffect, useCallback, KeyboardEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Clock, Zap, ArrowRight, Tag } from 'lucide-react'
import { AGENTS, COLUMNS } from '@/lib/constants'
import type { Priority, Status, Agent } from '@/types'

interface QuickCaptureProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated?: (task: Partial<any>) => void
}

export function QuickCapture({ isOpen, onClose, onTaskCreated }: QuickCaptureProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assignee, setAssignee] = useState<Agent>('jarvis')
  const [dueDate, setDueDate] = useState('')
  const [projectId, setProjectId] = useState('')

  // Global keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleGlobalShortcut = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open quick capture
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // This would be handled by parent component to open dialog
      }
    }

    document.addEventListener('keydown', handleGlobalShortcut)
    
    return () => {
      document.removeEventListener('keydown', handleGlobalShortcut)
    }
  }, [])

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return

    onTaskCreated?.({
      title,
      description,
      priority,
      assignee,
      projectId,
      dueDate,
    })

    // Reset form
    setTitle('')
    setDescription('')
    setPriority('medium')
    setAssignee('jarvis')
    setDueDate('')
    onClose()
  }, [title, description, priority, assignee, dueDate, projectId, onTaskCreated, onClose])

  const shortcuts = [
    { key: 'N', label: 'Next input', icon: ArrowRight },
    { key: 'D', label: 'Set due date', icon: Clock },
    { key: 'P', label: 'Set priority', icon: Zap },
    { key: 'A', label: 'Set assignee', icon: '👤' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Quick Capture
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {/* Title input - always focused */}
          <Input
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              } else if (e.key === 'n' || e.key === 'N') {
                // Navigate to next input (if we had multiple)
              }
            }}
            autoFocus
            className="text-lg"
          />

          {/* Description - optional */}
          {title && (
            <Input
              placeholder="Add details (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              className="text-sm"
            />
          )}

          {/* Quick Actions Row */}
          {title && (
            <div className="flex items-center gap-2">
              {/* Due Date */}
              <div className="flex-1">
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Priority */}
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {p === 'high' && '🔴 High'}
                      {p === 'medium' && '🟡 Medium'}
                      {p === 'low' && '🟢 Low'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status hints */}
          {title && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex gap-2">
                <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> to save</span>
              </div>
              <div className="font-medium">
                {title.length}/50
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">{shortcut.key}</kbd>
                  <span>{shortcut.label}</span>
                  {shortcut.icon && typeof shortcut.icon === 'string' 
                    ? shortcut.icon
                    : <shortcut.icon className="h-3 w-3" />
                  }
                </div>
              ))}
            </div>
            
            <Button onClick={handleSubmit} disabled={!title.trim()}>
              <ArrowRight className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
