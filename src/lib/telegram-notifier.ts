interface TelegramNotification {
  type: 'task_created' | 'task_updated' | 'task_completed' | 'task_assigned' | 'due_reminder'
  taskId: string
  taskTitle: string
  taskStatus?: string
  assignee?: string
  dueDate?: string
  channel?: string
  timestamp?: string
}

export class TelegramNotifier {
  private channelId: string
  private botToken: string
  private enabled: boolean

  constructor() {
    this.channelId = process.env.TELEGRAM_CHANNEL_ID || ''
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || ''
    // Only enable if both environment variables are set
    this.enabled =
      !!this.channelId && !!this.botToken && process.env.TELEGRAM_NOTIFICATIONS_ENABLED === 'true'
  }

  async send(notification: TelegramNotification): Promise<boolean> {
    if (!this.enabled) {
      console.log('Telegram notifications disabled')
      return false
    }

    try {
      let messageText = ''

      switch (notification.type) {
        case 'task_created':
          messageText = this.formatTaskCreated(notification)
          break
        case 'task_updated':
          messageText = this.formatTaskUpdated(notification)
          break
        case 'task_completed':
          messageText = this.formatTaskCompleted(notification)
          break
        case 'due_reminder':
          messageText = this.formatDueReminder(notification)
          break
        default:
          messageText = this.formatGeneric(notification)
      }

      // Send message to Clawdbot which will relay to Telegram
      // Note: Direct Clawdbot tool access not available in server-side code
      // TODO: Implement direct Telegram API call or notification queue
      console.log('Would send Telegram notification:', messageText)

      return true
    } catch (error) {
      console.error('Failed to send Telegram notification:', error)
      return false
    }
  }

  private formatTaskCreated(notification: TelegramNotification): string {
    const priorityEmoji = this.getPriorityEmoji(notification)
    return `🆕 New Task Created!

${priorityEmoji} *${notification.taskTitle}*
👤 Assignee: ${notification.assignee || 'Unassigned'}
${notification.dueDate ? `📅 Due: ${new Date(notification.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}

[View in Jarvis Tasks](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'})`
  }

  private formatTaskUpdated(notification: TelegramNotification): string {
    const statusEmoji = this.getStatusEmoji(notification.taskStatus)
    return `📝 Task Updated!

${statusEmoji} *${notification.taskTitle}*
Status: ${notification.taskStatus?.replace(/_/g, ' ').toUpperCase()}

[View in Jarvis Tasks](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'})`
  }

  private formatTaskCompleted(notification: TelegramNotification): string {
    return `✅ Task Completed!

🎉 *${notification.taskTitle}*

Great work! Moving to next task.
${notification.dueDate ? `⏰ Was due: ${new Date(notification.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}

[View in Jarvis Tasks](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'})`
  }

  private formatDueReminder(notification: TelegramNotification): string {
    const daysUntilDue = notification.dueDate
      ? Math.ceil((new Date(notification.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0

    const urgency =
      daysUntilDue === 0
        ? '🚨 DUE TODAY'
        : daysUntilDue === 1
          ? '⚠️ DUE TOMORROW'
          : `📅 Due in ${daysUntilDue} days`

    return `⏰ Due Date Reminder!

${urgency}

*${notification.taskTitle}*

[View in Jarvis Tasks](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'})`
  }

  private formatGeneric(notification: TelegramNotification): string {
    return `📋 Jarvis Tasks Update

${notification.taskTitle}

[View Details](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'})`
  }

  private getPriorityEmoji(notification: TelegramNotification): string {
    const priority = notification.assignee // Using assignee as a proxy - actual priority check would need more context
      ? notification.assignee
      : 'medium'

    switch (priority) {
      case 'high':
        return '🔴'
      case 'medium':
        return '🟡'
      case 'low':
        return '🟢'
      default:
        return '⚪'
    }
  }

  private getStatusEmoji(status?: string): string {
    switch (status) {
      case 'done':
        return '✅'
      case 'in_progress':
        return '🔄'
      case 'review':
        return '👀'
      case 'todo':
        return '📋'
      case 'backlog':
        return '📥'
      default:
        return '⚪'
    }
  }
}

// Singleton instance
export const telegramNotifier = new TelegramNotifier()

// Helper function to trigger notifications from API routes
export async function notifyTaskEvent(
  type: TelegramNotification['type'],
  taskId: string,
  taskTitle: string,
  taskStatus?: string,
  assignee?: string,
  dueDate?: string,
  channel?: string
): Promise<boolean> {
  return telegramNotifier.send({
    type,
    taskId,
    taskTitle,
    taskStatus,
    assignee,
    dueDate,
    channel,
  })
}
