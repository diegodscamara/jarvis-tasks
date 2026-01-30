export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
          status: 'backlog' | 'planning' | 'todo' | 'in_progress' | 'review' | 'done'
          assignee: string
          project_id: string | null
          due_date: string | null
          estimate: number | null
          parent_id: string | null
          recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_interval: number | null
          time_spent: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          priority?: 'low' | 'medium' | 'high'
          status?: 'backlog' | 'planning' | 'todo' | 'in_progress' | 'review' | 'done'
          assignee?: string
          project_id?: string | null
          due_date?: string | null
          estimate?: number | null
          parent_id?: string | null
          recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_interval?: number | null
          time_spent?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          priority?: 'low' | 'medium' | 'high'
          status?: 'backlog' | 'planning' | 'todo' | 'in_progress' | 'review' | 'done'
          assignee?: string
          project_id?: string | null
          due_date?: string | null
          estimate?: number | null
          parent_id?: string | null
          recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_interval?: number | null
          time_spent?: number | null
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
      task_dependencies: {
        Row: {
          task_id: string
          depends_on_id: string
          created_at: string
        }
        Insert: {
          task_id: string
          depends_on_id: string
          created_at?: string
        }
        Update: {
          task_id?: string
          depends_on_id?: string
          created_at?: string
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
      attachments: {
        Row: {
          id: string
          task_id: string
          file_name: string
          file_url: string
          file_size: number
          file_type: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          file_name: string
          file_url: string
          file_size: number
          file_type: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          file_name?: string
          file_url?: string
          file_size?: number
          file_type?: string
          uploaded_by?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          read: boolean
          task_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          read?: boolean
          task_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          read?: boolean
          task_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}