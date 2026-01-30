export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          icon: string
          color: string
          description: string | null
          lead: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string
          color?: string
          description?: string | null
          lead?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          color?: string
          description?: string | null
          lead?: string
          created_at?: string
          updated_at?: string
        }
      }
      labels: {
        Row: {
          id: string
          name: string
          color: string
          group: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          group?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          group?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          priority: 'low' | 'medium' | 'high'
          status: 'backlog' | 'todo' | 'in_progress' | 'done'
          assignee: string
          project_id: string | null
          due_date: string | null
          estimate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          priority?: 'low' | 'medium' | 'high'
          status?: 'backlog' | 'todo' | 'in_progress' | 'done'
          assignee?: string
          project_id?: string | null
          due_date?: string | null
          estimate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          priority?: 'low' | 'medium' | 'high'
          status?: 'backlog' | 'todo' | 'in_progress' | 'done'
          assignee?: string
          project_id?: string | null
          due_date?: string | null
          estimate?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      task_labels: {
        Row: {
          task_id: string
          label_id: string
        }
        Insert: {
          task_id: string
          label_id: string
        }
        Update: {
          task_id?: string
          label_id?: string
        }
      }
      comments: {
        Row: {
          id: string
          task_id: string
          author: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          author: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          author?: string
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
