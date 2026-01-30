'use client'

import { useEffect, useState } from 'react'
import {
  CalendarIcon,
  ClockIcon,
  CommentIcon,
  FlashLightIcon,
  RecurrenceIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/rich-text-editor'
import { LinkItem } from '@/components/link-item'
import { AGENTS, COLUMNS } from '@/lib/constants'
import type {
  Agent,
  Comment,
  Label,
  Priority,
  Project,
  RecurrenceType,
  Status,
  Task,
} from '@/types'

interface TaskFormProps {
  task: Task | null
  projects: Project[]
  labels: Label[]
  onSave: (task: Partial<Task>) => void
  onDelete?: () => void
  onClose: () => void
}

export function TaskForm({ task, projects, labels, onSave, onDelete, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium')
  const [assignee, setAssignee] = useState<Agent>(task?.assignee || 'jarvis')
  const [status, setStatus] = useState<Status>(task?.status || 'todo')
  const [projectId, setProjectId] = useState<string>(task?.projectId || '')
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(task?.labelIds || [])
  const [dueDate, setDueDate] = useState<string>(task?.dueDate || '')
  const [estimate, setEstimate] = useState<string>(task?.estimate?.toString() || '')
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    task?.recurrenceType || 'none'
  )
  const [timeSpent, setTimeSpent] = useState<string>(task?.timeSpent?.toString() || '0')
  const [comments, setComments] = useState<Comment[]>(task?.comments || [])
  const [newComment, setNewComment] = useState('')
  const [links, setLinks] = useState<{ id: string; url: string; title: string | null; type: string; icon: string }[]>([])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [showAddLink, setShowAddLink] = useState(false)

  // Fetch links when task changes
  useEffect(() => {
    if (task?.id) {
      fetch(`/api/tasks/${task.id}/links`)
        .then(res => res.json())
        .then(data => setLinks(data.links || []))
        .catch(console.error)
    }
  }, [task?.id])

  const handleAddLink = async () => {
    if (!newLinkUrl.trim() || !task?.id) return
    try {
      const res = await fetch(`/api/tasks/${task.id}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newLinkUrl.trim() })
      })
      const link = await res.json()
      setLinks(prev => [...prev, link])
      setNewLinkUrl('')
      setShowAddLink(false)
    } catch (e) {
      console.error('Failed to add link', e)
    }
  }

  const handleRemoveLink = async (linkId: string) => {
    if (!task?.id) return
    try {
      await fetch(`/api/tasks/${task.id}/links?linkId=${linkId}`, { method: 'DELETE' })
      setLinks(prev => prev.filter(l => l.id !== linkId))
    } catch (e) {
      console.error('Failed to remove link', e)
    }
  }

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
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
      recurrenceType: recurrenceType !== 'none' ? recurrenceType : undefined,
      timeSpent: timeSpent ? parseInt(timeSpent, 10) : undefined,
      comments,
    })
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !task?.id) return

    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      author: 'diego',
      createdAt: new Date().toISOString(),
    }

    await fetch(`/api/tasks/${task.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    })

    setComments([...comments, comment])
    setNewComment('')
  }

  const labelGroups = labels.reduce(
    (acc, label) => {
      const group = label.group || 'Other'
      if (!acc[group]) acc[group] = []
      acc[group].push(label)
      return acc
    },
    {} as Record<string, Label[]>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <RichTextEditor
          content={description}
          onChange={setDescription}
          placeholder="Task description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Project</label>
          <Select value={projectId} onValueChange={(value) => setProjectId(value ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="No Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Project</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Labels</label>
        <div className="flex flex-wrap gap-2 p-2 border border-input rounded-md bg-background min-h-[40px]">
          {Object.entries(labelGroups).map(([group, groupLabels]) => (
            <div key={group} className="flex flex-wrap gap-1">
              {groupLabels.map((label) => (
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
                    backgroundColor: `${label.color}30`,
                    color: label.color,
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
          <Select value={assignee} onValueChange={(v) => setAssignee(v as Agent)}>
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
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLUMNS.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1">
            <CalendarIcon size={14} />
            Due Date
          </label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1">
            <ClockIcon size={14} />
            Estimate (hours)
          </label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={estimate}
            onChange={(e) => setEstimate(e.target.value)}
            placeholder="e.g. 2"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          <RecurrenceIcon size={14} />
          Recurrence
        </label>
        <Select
          value={recurrenceType}
          onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No recurrence</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        {recurrenceType !== 'none' && (
          <p className="text-xs text-muted-foreground">
            Task will auto-recreate when marked as done
          </p>
        )}
      </div>

      {task?.id && (
        <div className="space-y-2 pt-4 border-t border-border">
          <label className="text-sm font-medium flex items-center gap-1">
            <ClockIcon size={14} />
            Time Spent
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              className="w-20"
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
            />
            <span className="text-sm text-muted-foreground">minutes</span>
            <span className="text-xs text-muted-foreground ml-auto">
              ({Math.floor(parseInt(timeSpent || '0', 10) / 60)}h{' '}
              {parseInt(timeSpent || '0', 10) % 60}m)
            </span>
          </div>
        </div>
      )}

      {task?.id && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">🔗 Links & Resources</h3>
            <button 
              type="button"
              onClick={() => setShowAddLink(!showAddLink)}
              className="text-xs text-primary hover:underline"
            >
              + Add
            </button>
          </div>
          {showAddLink && (
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Paste URL..."
                className="flex-1"
                value={newLinkUrl}
                onChange={e => setNewLinkUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
              />
              <Button type="button" size="sm" onClick={handleAddLink}>Add</Button>
            </div>
          )}
          {links.length > 0 ? (
            <div className="space-y-1">
              {links.map(link => (
                <LinkItem key={link.id} link={link} onRemove={handleRemoveLink} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No links attached</p>
          )}
        </div>
      )}

      {task?.id && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <CommentIcon size={14} />
              Comments
            </h3>
            <span className="text-xs text-muted-foreground">
              {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="max-h-[200px] overflow-y-auto space-y-2">
            {comments.map((comment) => {
              const isJarvis = comment.author === 'jarvis' || comment.author === 'Jarvis'
              const commentText = comment.text || comment.content || ''
              return (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg text-sm ${
                    isJarvis ? 'bg-primary/10 border border-primary/20' : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      {isJarvis && <FlashLightIcon size={12} />}
                      <span
                        className={isJarvis ? 'text-primary font-medium' : 'text-muted-foreground'}
                      >
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
                <CommentIcon className="mx-auto mb-1" size={20} />
                <div>No comments yet</div>
                <div className="text-xs mt-1">Add a comment or Jarvis will respond here</div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComment())}
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

      <div className="flex items-center gap-2 pt-5 mt-2 border-t border-border">
        <Button type="submit" className="flex-1">
          {task?.id ? 'Update Task' : 'Create Task'}
        </Button>
        {onDelete && (
          <Button type="button" variant="destructive-outline" onClick={onDelete}>
            Delete
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
