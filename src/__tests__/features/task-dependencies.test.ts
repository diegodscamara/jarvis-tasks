import { describe, expect, it, beforeEach } from '@jest/globals'

describe('Task Dependencies - TDD', () => {
  describe('Dependency Management', () => {
    it('should create task with dependencies', () => {
      // Arrange
      interface Task {
        id: string
        title: string
        status: string
        dependsOn?: string[]
        blockedBy?: string[]
      }

      const createTaskWithDependencies = (
        task: Omit<Task, 'blockedBy'>,
        allTasks: Task[]
      ): Task => {
        const blockedBy = task.dependsOn || []
        
        // Also update the tasks that this task depends on
        blockedBy.forEach(depId => {
          const depTask = allTasks.find(t => t.id === depId)
          if (depTask && !depTask.blockedBy) {
            depTask.blockedBy = []
          }
          if (depTask && depTask.blockedBy && !depTask.blockedBy.includes(task.id)) {
            depTask.blockedBy.push(task.id)
          }
        })
        
        return { ...task, blockedBy }
      }

      const existingTasks: Task[] = [
        { id: 'task-1', title: 'Design API', status: 'done' },
        { id: 'task-2', title: 'Write tests', status: 'in_progress' },
      ]

      // Act
      const newTask = createTaskWithDependencies(
        {
          id: 'task-3',
          title: 'Implement feature',
          status: 'todo',
          dependsOn: ['task-1', 'task-2'],
        },
        existingTasks
      )

      // Assert
      expect(newTask.dependsOn).toEqual(['task-1', 'task-2'])
      expect(existingTasks[0].blockedBy).toContain('task-3')
      expect(existingTasks[1].blockedBy).toContain('task-3')
    })

    it('should prevent status change when dependencies are not complete', () => {
      // Arrange
      const tasks = [
        { id: 'task-1', title: 'Backend API', status: 'in_progress' },
        { id: 'task-2', title: 'Frontend UI', status: 'todo', dependsOn: ['task-1'] },
      ]

      const canChangeStatus = (
        taskId: string,
        newStatus: string,
        allTasks: typeof tasks
      ): { allowed: boolean; reason?: string } => {
        const task = allTasks.find(t => t.id === taskId)
        if (!task) return { allowed: false, reason: 'Task not found' }

        // Can always move backwards
        if (['todo', 'backlog'].includes(newStatus)) {
          return { allowed: true }
        }

        // Check dependencies for forward movement
        if (task.dependsOn && task.dependsOn.length > 0) {
          const incompleteDeps = task.dependsOn.filter(depId => {
            const dep = allTasks.find(t => t.id === depId)
            return dep && dep.status !== 'done'
          })

          if (incompleteDeps.length > 0) {
            return {
              allowed: false,
              reason: `Blocked by incomplete dependencies: ${incompleteDeps.join(', ')}`,
            }
          }
        }

        return { allowed: true }
      }

      // Act
      const result = canChangeStatus('task-2', 'in_progress', tasks)

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Blocked by incomplete dependencies')
      expect(result.reason).toContain('task-1')
    })

    it('should allow status change when all dependencies are complete', () => {
      // Arrange
      const tasks = [
        { id: 'task-1', title: 'Backend API', status: 'done' },
        { id: 'task-2', title: 'Frontend UI', status: 'todo', dependsOn: ['task-1'] },
      ]

      const canChangeStatus = (
        taskId: string,
        newStatus: string,
        allTasks: typeof tasks
      ): { allowed: boolean } => {
        const task = allTasks.find(t => t.id === taskId)
        if (!task) return { allowed: false }

        if (task.dependsOn && task.dependsOn.length > 0) {
          const allDepsComplete = task.dependsOn.every(depId => {
            const dep = allTasks.find(t => t.id === depId)
            return dep && dep.status === 'done'
          })

          return { allowed: allDepsComplete }
        }

        return { allowed: true }
      }

      // Act
      const result = canChangeStatus('task-2', 'in_progress', tasks)

      // Assert
      expect(result.allowed).toBe(true)
    })

    it('should detect circular dependencies', () => {
      // Arrange
      interface ValidationResult {
        valid: boolean
        error?: string
        cycle?: string[]
      }

      const validateDependencies = (
        taskId: string,
        newDependencies: string[],
        allTasks: Array<{ id: string; dependsOn?: string[] }>
      ): ValidationResult => {
        // Build dependency graph
        const visited = new Set<string>()
        const recursionStack = new Set<string>()
        
        const hasCycle = (id: string, path: string[] = []): string[] | null => {
          if (recursionStack.has(id)) {
            const cycleStart = path.indexOf(id)
            return path.slice(cycleStart).concat(id)
          }
          
          if (visited.has(id)) return null
          
          visited.add(id)
          recursionStack.add(id)
          path.push(id)
          
          const task = id === taskId 
            ? { id: taskId, dependsOn: newDependencies }
            : allTasks.find(t => t.id === id)
            
          if (task?.dependsOn) {
            for (const depId of task.dependsOn) {
              const cycle = hasCycle(depId, [...path])
              if (cycle) return cycle
            }
          }
          
          recursionStack.delete(id)
          return null
        }
        
        const cycle = hasCycle(taskId)
        
        if (cycle) {
          return {
            valid: false,
            error: 'Circular dependency detected',
            cycle,
          }
        }
        
        return { valid: true }
      }

      const tasks = [
        { id: 'task-1', dependsOn: ['task-2'] },
        { id: 'task-2', dependsOn: ['task-3'] },
        { id: 'task-3', dependsOn: [] },
      ]

      // Act - Try to create circular dependency
      const result = validateDependencies('task-3', ['task-1'], tasks)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Circular dependency detected')
      expect(result.cycle).toEqual(['task-1', 'task-2', 'task-3', 'task-1'])
    })
  })

  describe('Dependency Visualization', () => {
    it('should calculate dependency chain depth', () => {
      // Arrange
      const tasks = [
        { id: 'task-1', title: 'Root task', dependsOn: [] },
        { id: 'task-2', title: 'Level 1', dependsOn: ['task-1'] },
        { id: 'task-3', title: 'Level 2', dependsOn: ['task-2'] },
        { id: 'task-4', title: 'Also Level 1', dependsOn: ['task-1'] },
      ]

      const calculateDepth = (
        taskId: string,
        allTasks: typeof tasks,
        memo: Map<string, number> = new Map()
      ): number => {
        if (memo.has(taskId)) return memo.get(taskId)!
        
        const task = allTasks.find(t => t.id === taskId)
        if (!task || !task.dependsOn || task.dependsOn.length === 0) {
          memo.set(taskId, 0)
          return 0
        }
        
        const maxDepth = Math.max(
          ...task.dependsOn.map(depId => calculateDepth(depId, allTasks, memo))
        )
        
        const depth = maxDepth + 1
        memo.set(taskId, depth)
        return depth
      }

      // Act
      const depth1 = calculateDepth('task-1', tasks)
      const depth2 = calculateDepth('task-2', tasks)
      const depth3 = calculateDepth('task-3', tasks)
      const depth4 = calculateDepth('task-4', tasks)

      // Assert
      expect(depth1).toBe(0)
      expect(depth2).toBe(1)
      expect(depth3).toBe(2)
      expect(depth4).toBe(1)
    })

    it('should get all blocking and blocked tasks', () => {
      // Arrange
      const tasks = [
        { id: 'task-1', title: 'Design', status: 'done', blockedBy: ['task-2', 'task-3'] },
        { id: 'task-2', title: 'Implementation', status: 'todo', dependsOn: ['task-1'] },
        { id: 'task-3', title: 'Tests', status: 'todo', dependsOn: ['task-1'] },
        { id: 'task-4', title: 'Deployment', status: 'todo', dependsOn: ['task-2', 'task-3'] },
      ]

      const getTaskRelations = (taskId: string, allTasks: typeof tasks) => {
        const task = allTasks.find(t => t.id === taskId)
        if (!task) return { blocking: [], blockedBy: [] }

        // Tasks this task is blocking (tasks that depend on this)
        const blocking = task.blockedBy || []
        
        // Tasks blocking this task (dependencies)
        const blockedBy = task.dependsOn || []

        return { blocking, blockedBy }
      }

      // Act
      const relations1 = getTaskRelations('task-1', tasks)
      const relations2 = getTaskRelations('task-2', tasks)
      const relations4 = getTaskRelations('task-4', tasks)

      // Assert
      expect(relations1.blocking).toEqual(['task-2', 'task-3'])
      expect(relations1.blockedBy).toEqual([])
      
      expect(relations2.blocking).toEqual([])
      expect(relations2.blockedBy).toEqual(['task-1'])
      
      expect(relations4.blockedBy).toEqual(['task-2', 'task-3'])
    })
  })
})