import { type NextRequest, NextResponse } from 'next/server'
import { parseNaturalLanguage, generateSuggestions, processAICommand } from '@/lib/ai-assistant'
import * as db from '@/db/queries'
import { addTaskDependency, getTaskDependencies } from '@/lib/task-dependencies'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, userId = 'jarvis', channel = 'web' } = body
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }
    
    // Process the AI command
    const result = await processAICommand({
      message,
      userId,
      channel,
    })
    
    // If it's a create command and we have a task, actually create it
    if (result.success && result.action === 'created' && result.task) {
      const createdTask = db.createTask({
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: result.task.title!,
        description: result.task.description || '',
        priority: result.task.priority || 'medium',
        status: result.task.status || 'todo',
        assignee: result.task.assignee || 'jarvis',
        projectId: result.task.projectId,
        labelIds: result.task.labelIds,
        dueDate: result.task.dueDate,
        estimate: result.task.estimate,
      })
      
      // Add dependencies if suggested
      if (result.task.dependsOn && result.task.dependsOn.length > 0) {
        for (const depId of result.task.dependsOn) {
          try {
            await addTaskDependency(createdTask.id, depId)
          } catch (error) {
            console.error(`Failed to add dependency ${depId}:`, error)
          }
        }
      }
      
      // Generate AI suggestions for the new task
      const allTasks = db.getAllTasks()
      const suggestions = generateSuggestions(createdTask, allTasks)
      
      return NextResponse.json({
        success: true,
        action: 'created',
        task: {
          ...createdTask,
          dependsOn: getTaskDependencies(createdTask.id),
        },
        suggestions,
        message: result.message,
      })
    }
    
    // If it's an update command, process the update
    if (result.success && result.action === 'updated' && result.task?.id) {
      const updatedTask = db.updateTask(result.task.id, {
        title: result.task.title,
        description: result.task.description,
        priority: result.task.priority,
        status: result.task.status,
        assignee: result.task.assignee,
        dueDate: result.task.dueDate,
        estimate: result.task.estimate,
      })
      
      if (!updatedTask) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        action: 'updated',
        task: updatedTask,
        message: result.message,
      })
    }
    
    // If it's a query, perform the search
    if (result.success && result.action === 'queried') {
      const allTasks = db.getAllTasks()
      // Here you would apply filters from the parsed command
      // For now, returning all tasks
      
      return NextResponse.json({
        success: true,
        action: 'queried',
        tasks: allTasks,
        message: result.message,
      })
    }
    
    // Return the raw result for other cases
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error processing AI request:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process AI request',
      },
      { status: 500 }
    )
  }
}

// GET endpoint for AI suggestions on existing tasks
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')
  
  if (!taskId) {
    return NextResponse.json(
      { error: 'taskId is required' },
      { status: 400 }
    )
  }
  
  try {
    const task = db.getTaskById(taskId)
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }
    
    const allTasks = db.getAllTasks()
    const suggestions = generateSuggestions(task, allTasks)
    
    return NextResponse.json({
      taskId,
      suggestions,
    })
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}