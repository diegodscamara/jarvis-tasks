import { parseNaturalLanguage, generateSuggestions, processAICommand } from '@/lib/ai-assistant'
import { Task } from '@/types'

describe('AI Assistant Integration', () => {
  describe('Natural Language Parsing', () => {
    it('should parse simple task creation', () => {
      const input = "Create a task to review PRs tomorrow at 2pm"
      const result = parseNaturalLanguage(input)
      
      expect(result.action).toBe('create')
      expect(result.task?.title).toBe('Review PRs')
      expect(result.task?.dueDate).toBeDefined()
      const dueDate = result.task?.dueDate
      expect(dueDate).toBeDefined()
      if (dueDate) {
        expect(new Date(dueDate).getHours()).toBe(14)
      }
    })
    
    it('should extract priority from natural language', () => {
      const input = "High priority: Fix authentication bug"
      const result = parseNaturalLanguage(input)
      
      expect(result.action).toBe('create')
      expect(result.task?.title).toBe('Fix authentication bug')
      expect(result.task?.priority).toBe('high')
    })
    
    it('should parse task updates', () => {
      const input = "Mark task-123 as done"
      const result = parseNaturalLanguage(input)
      
      expect(result.action).toBe('update')
      expect(result.taskId).toBe('task-123')
      expect(result.updates?.status).toBe('done')
    })
    
    it('should handle complex queries', () => {
      const input = "Show me all high priority tasks assigned to jarvis due this week"
      const result = parseNaturalLanguage(input)
      
      expect(result.action).toBe('query')
      expect(result.filters?.priority).toBe('high')
      expect(result.filters?.assignee).toBe('jarvis')
      expect(result.filters?.dueRange).toBe('this_week')
    })
  })
  
  describe('AI Suggestions', () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Implement user authentication',
        description: 'Add login and signup functionality',
        priority: 'high',
        status: 'done',
        assignee: 'jarvis',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Setup database',
        description: 'Configure PostgreSQL',
        priority: 'high',
        status: 'done',
        assignee: 'jarvis',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ]
    
    it('should suggest task breakdown for complex tasks', () => {
      const newTask = {
        title: 'Build complete e-commerce platform',
        description: 'Create a full-featured online store'
      }
      
      const suggestions = generateSuggestions(newTask, mockTasks)
      
      expect(suggestions.breakdown).toBeDefined()
      expect(suggestions.breakdown!.length).toBeGreaterThan(3)
      expect(suggestions.breakdown).toContainEqual(
        expect.objectContaining({ title: expect.stringContaining('product catalog') })
      )
    })
    
    it('should recommend similar completed tasks', () => {
      const newTask = {
        title: 'Add OAuth authentication',
        description: 'Integrate with Google OAuth'
      }
      
      const suggestions = generateSuggestions(newTask, mockTasks)
      
      expect(suggestions.similar).toBeDefined()
      expect(suggestions.similar).toContainEqual(
        expect.objectContaining({ id: '1' })
      )
    })
    
    it('should suggest dependencies based on task content', () => {
      const newTask = {
        title: 'Deploy to production',
        description: 'Deploy the application to AWS'
      }
      
      const existingTasks = [
        ...mockTasks,
        {
          id: '3',
          title: 'Write deployment scripts',
          description: '',
          status: 'todo' as const,
          priority: 'medium' as const,
          assignee: 'jarvis' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]
      
      const suggestions = generateSuggestions(newTask, existingTasks)
      
      expect(suggestions.dependencies).toBeDefined()
      expect(suggestions.dependencies).toContain('3')
    })
  })
  
  describe('Clawdbot Integration', () => {
    it('should process webhook commands', async () => {
      const webhookPayload = {
        message: '/task create Review pull requests',
        userId: 'diego',
        channel: 'telegram'
      }
      
      const result = await processAICommand(webhookPayload)
      
      expect(result.success).toBe(true)
      expect(result.action).toBe('created')
      expect(result.task?.title).toBe('Review pull requests')
    })
    
    it('should handle voice command transcription', async () => {
      const voiceCommand = {
        message: 'Hey Jarvis, add a task to check emails tomorrow morning',
        userId: 'diego',
        channel: 'voice',
        metadata: { confidence: 0.95 }
      }
      
      const result = await processAICommand(voiceCommand)
      
      expect(result.success).toBe(true)
      expect(result.task?.title).toContain('check emails')
      expect(result.task?.dueDate).toBeDefined()
    })
  })
})