import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

// Create OpenAPI registry
const registry = new OpenAPIRegistry()

// Common schemas
const TaskStatusSchema = z.enum(['backlog', 'planning', 'todo', 'in_progress', 'review', 'done'])
const TaskPrioritySchema = z.enum(['high', 'medium', 'low'])
const TaskAssigneeSchema = z.enum(['jarvis', 'gemini', 'copilot', 'claude', 'diego'])
const RecurrenceTypeSchema = z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly'])

const CommentSchema = z.object({
  id: z.string(),
  author: z.string(),
  content: z.string().optional(),
  text: z.string().optional(),
  createdAt: z.string(),
  isRead: z.boolean().optional(),
})

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  assignee: TaskAssigneeSchema,
  projectId: z.string().optional(),
  parentId: z.string().optional(),
  recurrenceType: RecurrenceTypeSchema.optional(),
  recurrenceInterval: z.number().optional(),
  timeSpent: z.number().optional(),
  labelIds: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  estimate: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  comments: z.array(CommentSchema).optional(),
  dependsOn: z.array(z.string()).optional(),
  blockedBy: z.array(z.string()).optional(),
})

export const openAPIDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Jarvis Tasks API',
    version: '1.0.0',
    description: 'A powerful task management API with AI assistant integration, time tracking, and advanced features.',
    contact: {
      name: 'API Support',
      url: 'https://github.com/diegodscamara/jarvis-tasks',
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  tags: [
    { name: 'tasks', description: 'Task management operations' },
    { name: 'ai', description: 'AI assistant operations' },
    { name: 'search', description: 'Search and filter operations' },
    { name: 'analytics', description: 'Analytics and metrics' },
    { name: 'auth', description: 'Authentication' },
    { name: 'projects', description: 'Project management' },
    { name: 'labels', description: 'Label management' },
  ],
  paths: {
    '/api/tasks': {
      get: {
        tags: ['tasks'],
        summary: 'Get all tasks',
        description: 'Retrieve all tasks with optional filtering',
        operationId: 'getTasks',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tasks: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Task' },
                    },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['tasks'],
        summary: 'Create a new task',
        description: 'Create a new task with the provided details',
        operationId: 'createTask',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'priority', 'status', 'assignee'],
                properties: {
                  id: { type: 'string', description: 'Optional custom ID' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { $ref: '#/components/schemas/Priority' },
                  status: { $ref: '#/components/schemas/Status' },
                  assignee: { $ref: '#/components/schemas/Assignee' },
                  projectId: { type: 'string' },
                  labelIds: { type: 'array', items: { type: 'string' } },
                  dueDate: { type: 'string', format: 'date-time' },
                  estimate: { type: 'number' },
                  parentId: { type: 'string' },
                  recurrenceType: { $ref: '#/components/schemas/RecurrenceType' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Task created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['tasks'],
        summary: 'Update a task',
        description: 'Update an existing task',
        operationId: 'updateTask',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { $ref: '#/components/schemas/Priority' },
                  status: { $ref: '#/components/schemas/Status' },
                  assignee: { $ref: '#/components/schemas/Assignee' },
                  projectId: { type: 'string' },
                  labelIds: { type: 'array', items: { type: 'string' } },
                  dueDate: { type: 'string', format: 'date-time' },
                  estimate: { type: 'number' },
                  timeSpent: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Task updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          '400': {
            description: 'Bad request - validation error or dependency conflict',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Task not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['tasks'],
        summary: 'Delete a task',
        description: 'Delete a task by ID',
        operationId: 'deleteTask',
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Task ID to delete',
          },
        ],
        responses: {
          '200': {
            description: 'Task deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Task not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/tasks/{id}/dependencies': {
      get: {
        tags: ['tasks'],
        summary: 'Get task dependencies',
        description: 'Get tasks that this task depends on and tasks that depend on this task',
        operationId: 'getTaskDependencies',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Task ID',
          },
        ],
        responses: {
          '200': {
            description: 'Dependencies retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    taskId: { type: 'string' },
                    dependsOn: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Task IDs this task depends on',
                    },
                    blockedBy: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Task IDs that depend on this task',
                    },
                    count: {
                      type: 'object',
                      properties: {
                        dependencies: { type: 'number' },
                        dependents: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['tasks'],
        summary: 'Add task dependency',
        description: 'Add a dependency to a task',
        operationId: 'addTaskDependency',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['dependsOnId'],
                properties: {
                  dependsOnId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Dependency added successfully',
          },
          '400': {
            description: 'Circular dependency detected',
          },
        },
      },
      delete: {
        tags: ['tasks'],
        summary: 'Remove task dependency',
        description: 'Remove a dependency from a task',
        operationId: 'removeTaskDependency',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'dependsOnId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Dependency removed successfully',
          },
          '404': {
            description: 'Dependency not found',
          },
        },
      },
    },
    '/api/ai/process': {
      post: {
        tags: ['ai'],
        summary: 'Process AI command',
        description: 'Process a natural language command using AI assistant',
        operationId: 'processAICommand',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', description: 'Natural language command' },
                  userId: { type: 'string', default: 'jarvis' },
                  channel: { type: 'string', default: 'web' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Command processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    action: { type: 'string', enum: ['created', 'updated', 'queried', 'deleted'] },
                    task: { $ref: '#/components/schemas/Task' },
                    tasks: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Task' },
                    },
                    suggestions: {
                      type: 'object',
                      properties: {
                        breakdown: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              title: { type: 'string' },
                              description: { type: 'string' },
                            },
                          },
                        },
                        similar: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Task' },
                        },
                        dependencies: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                      },
                    },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ['ai'],
        summary: 'Get AI suggestions for a task',
        description: 'Get AI-generated suggestions for a specific task',
        operationId: 'getAISuggestions',
        parameters: [
          {
            name: 'taskId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Suggestions generated successfully',
          },
        },
      },
    },
    '/api/search': {
      get: {
        tags: ['search'],
        summary: 'Search tasks',
        description: 'Search tasks with advanced query syntax',
        operationId: 'searchTasks',
        parameters: [
          {
            name: 'q',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search query (supports operators like status:done priority:high)',
          },
          {
            name: 'suggestions',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Return search suggestions instead of results',
          },
          {
            name: 'saved',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Return saved searches',
          },
        ],
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      type: 'object',
                      properties: {
                        query: { type: 'string' },
                        parsedQuery: { type: 'object' },
                        totalResults: { type: 'number' },
                        tasks: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Task' },
                        },
                      },
                    },
                    {
                      type: 'object',
                      properties: {
                        suggestions: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                      },
                    },
                    {
                      type: 'object',
                      properties: {
                        savedSearches: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              query: { type: 'object' },
                              createdAt: { type: 'string' },
                              usageCount: { type: 'number' },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['search'],
        summary: 'Save a search',
        description: 'Save a search query for later use',
        operationId: 'saveSearch',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'query'],
                properties: {
                  name: { type: 'string' },
                  query: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Search saved successfully',
          },
        },
      },
    },
    '/api/analytics': {
      get: {
        tags: ['analytics'],
        summary: 'Get task analytics',
        description: 'Get analytics overview including completion rates and status distribution',
        operationId: 'getAnalytics',
        responses: {
          '200': {
            description: 'Analytics data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    overview: {
                      type: 'object',
                      properties: {
                        total: { type: 'number' },
                        completionRate: { type: 'number' },
                        recentlyCompleted: { type: 'number' },
                        overdue: { type: 'number' },
                      },
                    },
                    status: {
                      type: 'object',
                      additionalProperties: { type: 'number' },
                    },
                    priority: {
                      type: 'object',
                      additionalProperties: { type: 'number' },
                    },
                    projects: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          icon: { type: 'string' },
                          total: { type: 'number' },
                          done: { type: 'number' },
                          inProgress: { type: 'number' },
                        },
                      },
                    },
                    labels: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          color: { type: 'string' },
                          count: { type: 'number' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Task: {
        type: 'object',
        required: ['id', 'title', 'description', 'priority', 'status', 'assignee', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { $ref: '#/components/schemas/Priority' },
          status: { $ref: '#/components/schemas/Status' },
          assignee: { $ref: '#/components/schemas/Assignee' },
          projectId: { type: 'string', nullable: true },
          parentId: { type: 'string', nullable: true },
          recurrenceType: { $ref: '#/components/schemas/RecurrenceType' },
          recurrenceInterval: { type: 'number', nullable: true },
          timeSpent: { type: 'number', nullable: true, description: 'Time spent in hours' },
          labelIds: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
          },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          estimate: { type: 'number', nullable: true, description: 'Estimate in hours' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          comments: {
            type: 'array',
            items: { $ref: '#/components/schemas/Comment' },
            nullable: true,
          },
          dependsOn: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
            description: 'Task IDs this task depends on',
          },
          blockedBy: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
            description: 'Task IDs that depend on this task',
          },
        },
      },
      Comment: {
        type: 'object',
        required: ['id', 'author', 'createdAt'],
        properties: {
          id: { type: 'string' },
          author: { type: 'string' },
          content: { type: 'string', nullable: true },
          text: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          isRead: { type: 'boolean', nullable: true },
        },
      },
      Status: {
        type: 'string',
        enum: ['backlog', 'planning', 'todo', 'in_progress', 'review', 'done'],
      },
      Priority: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
      },
      Assignee: {
        type: 'string',
        enum: ['jarvis', 'gemini', 'copilot', 'claude', 'diego'],
      },
      RecurrenceType: {
        type: 'string',
        enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string' },
          reason: { type: 'string', nullable: true },
          cycle: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
            description: 'Circular dependency path if detected',
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from NextAuth.js session',
      },
    },
  },
}