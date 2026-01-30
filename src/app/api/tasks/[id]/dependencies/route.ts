import { type NextRequest, NextResponse } from 'next/server'
import { getTaskById } from '@/lib/supabase/queries'
import {
  addTaskDependency,
  getTaskDependencies,
  getTaskDependents,
  removeTaskDependency,
  validateDependency,
} from '@/lib/supabase/task-dependencies'

// GET /api/tasks/[id]/dependencies - Get task dependencies and dependents
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params

  try {
    // Get the task to ensure it exists
    const task = await getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Get dependencies (tasks this task depends on)
    const dependsOn = await getTaskDependencies(taskId)

    // Get dependents (tasks that depend on this task)
    const blockedBy = await getTaskDependents(taskId)

    return NextResponse.json({
      taskId,
      dependsOn,
      blockedBy,
      count: {
        dependencies: dependsOn.length,
        dependents: blockedBy.length,
      },
    })
  } catch (error) {
    console.error('Error fetching dependencies:', error)
    return NextResponse.json({ error: 'Failed to fetch dependencies' }, { status: 500 })
  }
}

// POST /api/tasks/[id]/dependencies - Add a dependency
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params

  try {
    const body = await request.json()
    const { dependsOnId } = body

    if (!dependsOnId) {
      return NextResponse.json({ error: 'dependsOnId is required' }, { status: 400 })
    }

    // Validate that both tasks exist
    const task = await getTaskById(taskId)
    const dependsOnTask = await getTaskById(dependsOnId)

    if (!task || !dependsOnTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Validate that this won't create a circular dependency
    const validation = await validateDependency(taskId, dependsOnId)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error,
          cycle: validation.cycle,
        },
        { status: 400 }
      )
    }

    // Add the dependency
    await addTaskDependency(taskId, dependsOnId)

    // Return updated dependencies
    const dependsOn = await getTaskDependencies(taskId)
    const blockedBy = await getTaskDependents(taskId)

    return NextResponse.json({
      taskId,
      dependsOnId,
      dependsOn,
      blockedBy,
      message: 'Dependency added successfully',
    })
  } catch (error) {
    console.error('Error adding dependency:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to add dependency',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id]/dependencies - Remove a dependency
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params

  try {
    const { searchParams } = new URL(request.url)
    const dependsOnId = searchParams.get('dependsOnId')

    if (!dependsOnId) {
      return NextResponse.json({ error: 'dependsOnId is required' }, { status: 400 })
    }
    // Remove the dependency
    await removeTaskDependency(taskId, dependsOnId)

    // Return updated dependencies
    const dependsOn = await getTaskDependencies(taskId)
    const blockedBy = await getTaskDependents(taskId)

    return NextResponse.json({
      taskId,
      dependsOnId,
      dependsOn,
      blockedBy,
      message: 'Dependency removed successfully',
    })
  } catch (error) {
    console.error('Error removing dependency:', error)
    return NextResponse.json({ error: 'Failed to remove dependency' }, { status: 500 })
  }
}
