import { type NextRequest, NextResponse } from 'next/server'
import { processAICommand } from '@/lib/ai-assistant'
import * as db from '@/db/queries'
import crypto from 'crypto'

// Webhook secret for verification (should be in environment variables)
const WEBHOOK_SECRET = process.env.CLAWDBOT_WEBHOOK_SECRET || 'your-webhook-secret'

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-clawdbot-signature')
    
    // Verify webhook signature if provided
    if (signature && process.env.NODE_ENV === 'production') {
      const isValid = verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }
    
    // Parse the webhook payload
    const payload = JSON.parse(rawBody)
    const {
      message,
      userId,
      channel,
      messageId,
      timestamp,
      metadata,
    } = payload
    
    // Log webhook receipt
    console.log(`[Clawdbot Webhook] Received from ${channel}/${userId}: ${message}`)
    
    // Process the command
    const result = await processAICommand({
      message,
      userId,
      channel,
      metadata,
    })
    
    // Format response for Clawdbot
    let responseMessage = ''
    
    if (!result.success) {
      responseMessage = `❌ Error: ${result.error || 'Could not process command'}`
    } else {
      switch (result.action) {
        case 'created':
          if (result.task) {
            // Ensure status is valid
            const validStatuses = ['backlog', 'todo', 'in_progress', 'done'] as const
            let status = result.task.status as typeof validStatuses[number]
            if (!validStatuses.includes(status)) {
              status = 'todo'
            }

            const task = await db.createTask({
              id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              title: result.task.title!,
              description: result.task.description || '',
              priority: result.task.priority || 'medium',
              status,
              assignee: result.task.assignee || userId || 'jarvis',
              projectId: result.task.projectId,
              dueDate: result.task.dueDate,
              estimate: result.task.estimate,
            })
            
            responseMessage = `✅ Created task: **${task.title}**
- ID: \`${task.id}\`
- Priority: ${task.priority}
- Status: ${task.status}
- Assignee: ${task.assignee}`
            
            if (task.dueDate) {
              responseMessage += `\n- Due: ${new Date(task.dueDate).toLocaleDateString()}`
            }
          }
          break
          
        case 'updated':
          responseMessage = `✅ ${result.message || 'Task updated successfully'}`
          break
          
        case 'queried':
          if (result.tasks) {
            const taskCount = result.tasks.length
            responseMessage = `📋 Found ${taskCount} task${taskCount !== 1 ? 's' : ''}`
            
            if (taskCount > 0) {
              responseMessage += '\n\n'
              result.tasks.slice(0, 5).forEach((task: any) => {
                responseMessage += `• **${task.title}** (\`${task.id}\`) - ${task.status}\n`
              })
              
              if (taskCount > 5) {
                responseMessage += `\n...and ${taskCount - 5} more`
              }
            }
          }
          break
          
        case 'deleted':
          responseMessage = `✅ ${result.message || 'Task deleted successfully'}`
          break
          
        default:
          responseMessage = result.message || 'Command processed'
      }
    }
    
    // Return response for Clawdbot
    return NextResponse.json({
      success: true,
      message: responseMessage,
      // Include task data if created/updated
      data: result.task ? {
        taskId: result.task.id,
        taskUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/task/${result.task.id}`,
      } : undefined,
      // Optional: trigger a notification
      notify: result.action === 'created',
    })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: '❌ Failed to process webhook',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}