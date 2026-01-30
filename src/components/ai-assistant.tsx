'use client'

import { Loader2, Mic, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Task } from '@/types'

interface AIAssistantProps {
  onTaskCreated?: (task: Task) => void
  onTasksQueried?: (tasks: Task[]) => void
}

export function AIAssistant({ onTaskCreated, onTasksQueried }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<{
    message: string
    task?: Task
    tasks?: Task[]
    suggestions?: {
      breakdown?: Array<{ title: string; description?: string }>
      similar?: Task[]
      dependencies?: string[]
    }
  } | null>(null)
  const [isListening, setIsListening] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    setResponse(null)

    try {
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      const data = await res.json()

      if (data.success) {
        setResponse(data)

        // Call callbacks if provided
        if (data.action === 'created' && data.task && onTaskCreated) {
          onTaskCreated(data.task)
        } else if (data.action === 'queried' && data.tasks && onTasksQueried) {
          onTasksQueried(data.tasks)
        }

        // Clear input on successful task creation
        if (data.action === 'created') {
          setInput('')
        }
      } else {
        setResponse({
          message: data.error || 'Failed to process command',
        })
      }
    } catch (error) {
      setResponse({
        message: 'Error: Failed to connect to AI assistant',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser')
      return
    }

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
      alert('Error occurred in speech recognition')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <Button variant="outline" size="icon" className="relative">
          <Sparkles className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Task Assistant</DialogTitle>
          <DialogDescription>
            Use natural language to create, update, or query tasks. Try "Create a high priority task
            to review PRs tomorrow at 2pm".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="What would you like to do?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || isListening}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleVoiceInput}
              disabled={isLoading || isListening}
            >
              <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse text-red-500' : ''}`} />
            </Button>
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>

        {response && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <p className="text-sm mb-4">{response.message}</p>

              {response.suggestions?.breakdown && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">Suggested Subtasks:</h4>
                  <ul className="space-y-1">
                    {response.suggestions.breakdown.map((subtask, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        • {subtask.title}
                        {subtask.description && (
                          <span className="block pl-3 text-xs">{subtask.description}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {response.suggestions?.similar && response.suggestions.similar.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">Similar Completed Tasks:</h4>
                  <ul className="space-y-1">
                    {response.suggestions.similar.map((task) => (
                      <li key={task.id} className="text-sm text-muted-foreground">
                        • {task.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {response.task && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{response.task.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Priority: {response.task.priority} | Status: {response.task.status}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Example commands:</p>
          <ul className="space-y-0.5">
            <li>• "Create a task to review PRs tomorrow"</li>
            <li>• "Mark task-123 as done"</li>
            <li>• "Show me all high priority tasks"</li>
            <li>• "Add a bug fix task for the login issue"</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
