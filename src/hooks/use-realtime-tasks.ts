import { useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Task = Database['public']['Tables']['tasks']['Row']

interface RealtimeTasksOptions {
  onTaskCreated?: (task: Task) => void
  onTaskUpdated?: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
}

export function useRealtimeTasks({
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
}: RealtimeTasksOptions) {
  const { toast } = useToast()

  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on<Task>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Task created:', payload.new)
          if (onTaskCreated) {
            onTaskCreated(payload.new)
          }
          toast({
            title: 'Task Created',
            description: `${payload.new.title} has been created`,
          })
        }
      )
      .on<Task>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Task updated:', payload.new)
          if (onTaskUpdated) {
            onTaskUpdated(payload.new)
          }
        }
      )
      .on<Task>(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Task deleted:', payload.old.id)
          if (onTaskDeleted) {
            if (payload.old.id) onTaskDeleted(payload.old.id)
          }
          toast({
            title: 'Task Deleted',
            description: `Task has been removed`,
            variant: 'destructive',
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onTaskCreated, onTaskUpdated, onTaskDeleted, toast])
}

// Hook for realtime comments
export function useRealtimeComments(taskId: string, onCommentAdded?: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          console.log('Comment added:', payload)
          if (onCommentAdded) {
            onCommentAdded()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [taskId, onCommentAdded])
}

// Hook for realtime notifications
export function useRealtimeNotifications(
  userId: string,
  onNotification?: (notification: any) => void
) {
  const { toast } = useToast()

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New notification:', payload)
          if (onNotification) {
            onNotification(payload.new)
          }
          toast({
            title: payload.new.title,
            description: payload.new.message,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, onNotification, toast])
}
