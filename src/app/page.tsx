'use client'

import { useState, useEffect } from 'react'

type Priority = 'high' | 'medium' | 'low'
type Status = 'backlog' | 'todo' | 'in_progress' | 'done'
type Agent = 'jarvis' | 'gemini' | 'copilot' | 'claude' | 'diego'

interface Comment {
  id: string
  text: string
  author: string
  createdAt: string
}

interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  assignee: Agent
  createdAt: string
  updatedAt: string
  comments?: Comment[]
}

const columns: { id: Status; title: string }[] = [
  { id: 'backlog', title: '📋 Backlog' },
  { id: 'todo', title: '📝 To Do' },
  { id: 'in_progress', title: '🔄 In Progress' },
  { id: 'done', title: '✅ Done' },
]

const agents: { id: Agent; name: string; color: string }[] = [
  { id: 'jarvis', name: 'Jarvis (Claude)', color: '#00d4ff' },
  { id: 'gemini', name: 'Gemini', color: '#4285f4' },
  { id: 'copilot', name: 'Copilot', color: '#6e40c9' },
  { id: 'claude', name: 'Claude Direct', color: '#cc785c' },
  { id: 'diego', name: 'Diego', color: '#2ed573' },
]

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  useEffect(() => {
    fetchTasks()
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

  const saveTask = async (task: Partial<Task>) => {
    const method = task.id ? 'PUT' : 'POST'
    const res = await fetch('/api/tasks', {
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

  const getTasksByStatus = (status: Status) => 
    tasks.filter(t => t.status === status)

  return (
    <div className="container">
      <header>
        <h1>⚡ Jarvis Task Manager</h1>
        <div className="status-bar">
          <div className="status-item">
            <span className="status-dot"></span>
            <span>System Online</span>
          </div>
          <div className="status-item">
            <span>{tasks.length} tasks</span>
          </div>
        </div>
      </header>

      <div className="board">
        {columns.map(column => (
          <div 
            key={column.id} 
            className="column"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <div className="column-header">
              <span className="column-title">{column.title}</span>
              <span className="column-count">{getTasksByStatus(column.id).length}</span>
            </div>

            {getTasksByStatus(column.id).map(task => (
              <div
                key={task.id}
                className={`task-card priority-${task.priority}`}
                draggable
                onDragStart={() => handleDragStart(task)}
                onClick={() => { setEditingTask(task); setShowModal(true) }}
              >
                <div className="task-title">{task.title}</div>
                {task.description && (
                  <div className="task-description">{task.description}</div>
                )}
                <div className="task-meta">
                  <span className="task-assignee">
                    {agents.find(a => a.id === task.assignee)?.name || task.assignee}
                  </span>
                  <span className="task-date">
                    {new Date(task.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}

            <button 
              className="add-task-btn"
              onClick={() => { 
                setEditingTask({ status: column.id } as Task)
                setShowModal(true) 
              }}
            >
              + Add Task
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          onSave={saveTask}
          onDelete={editingTask?.id ? () => deleteTask(editingTask.id) : undefined}
          onClose={() => { setShowModal(false); setEditingTask(null) }}
        />
      )}
    </div>
  )
}

function TaskModal({ 
  task, 
  onSave, 
  onDelete,
  onClose 
}: { 
  task: Task | null
  onSave: (task: Partial<Task>) => void
  onDelete?: () => void
  onClose: () => void 
}) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium')
  const [assignee, setAssignee] = useState<Agent>(task?.assignee || 'jarvis')
  const [status, setStatus] = useState<Status>(task?.status || 'todo')
  const [comments, setComments] = useState<Comment[]>(task?.comments || [])
  const [newComment, setNewComment] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: task?.id,
      title,
      description,
      priority,
      assignee,
      status,
      comments,
    })
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !task?.id) return

    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      author: 'diego', // Default to diego, could be dynamic later
      createdAt: new Date().toISOString()
    }

    // Add comment via API
    await fetch(`/api/tasks/${task.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment)
    })

    setComments([...comments, comment])
    setNewComment('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{task?.id ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title..."
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Task description..."
            />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value as Priority)}>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
          <div className="form-group">
            <label>Assignee</label>
            <select value={assignee} onChange={e => setAssignee(e.target.value as Agent)}>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as Status)}>
              {columns.map(col => (
                <option key={col.id} value={col.id}>{col.title}</option>
              ))}
            </select>
          </div>
          
          {task?.id && (
            <div className="comments-section">
              <h3>Comments</h3>
              <div className="comments-list">
                {comments.map(comment => (
                  <div key={comment.id} className="comment">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author}</span>
                      <span className="comment-date">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="comment-text">{comment.text}</div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="no-comments">No comments yet</div>
                )}
              </div>
              <div className="comment-input">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                />
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          )}
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {task?.id ? 'Update' : 'Create'}
            </button>
            {onDelete && (
              <button type="button" className="btn btn-secondary" onClick={onDelete}>
                Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
