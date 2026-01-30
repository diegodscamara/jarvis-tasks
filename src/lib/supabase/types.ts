export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: 'attachments_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      comments: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      labels: {
        Row: {
          color: string
          created_at: string
          group: string | null
          id: string
          name: string
        }
        Insert: {
          color: string
          created_at?: string
          group?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          group?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          read: boolean
          task_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean
          task_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean
          task_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          lead: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          lead?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          lead?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_dependencies: {
        Row: {
          created_at: string
          depends_on_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          depends_on_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          depends_on_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_dependencies_depends_on_id_fkey'
            columns: ['depends_on_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_dependencies_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      task_labels: {
        Row: {
          label_id: string
          task_id: string
        }
        Insert: {
          label_id: string
          task_id: string
        }
        Update: {
          label_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_labels_label_id_fkey'
            columns: ['label_id']
            isOneToOne: false
            referencedRelation: 'labels'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_labels_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      task_links: {
        Row: {
          id: string
          task_id: string
          url: string
          title: string | null
          type: string
          icon: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          url: string
          title?: string | null
          type?: string
          icon?: string | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          url?: string
          title?: string | null
          type?: string
          icon?: string | null
          position?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_links_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string
          created_at: string
          description: string
          due_date: string | null
          estimate: number | null
          id: string
          parent_id: string | null
          priority: string
          project_id: string | null
          recurrence_interval: number | null
          recurrence_type: string | null
          status: string
          time_spent: number | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string
          created_at?: string
          description?: string
          due_date?: string | null
          estimate?: number | null
          id?: string
          parent_id?: string | null
          priority?: string
          project_id?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          status?: string
          time_spent?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string
          created_at?: string
          description?: string
          due_date?: string | null
          estimate?: number | null
          id?: string
          parent_id?: string | null
          priority?: string
          project_id?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          status?: string
          time_spent?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          preferences: Json | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          preferences?: Json | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          preferences?: Json | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          title: string
          content: string
          category: string
          tags: string[] | null
          source: string
          visibility: string
          created_at: string
          updated_at: string
          created_by: string
          memory_path: string | null
          version: number
        }
        Insert: {
          id?: string
          title: string
          content: string
          category?: string
          tags?: string[] | null
          source?: string
          visibility?: string
          created_at?: string
          updated_at?: string
          created_by?: string
          memory_path?: string | null
          version?: number
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: string
          tags?: string[] | null
          source?: string
          visibility?: string
          created_at?: string
          updated_at?: string
          created_by?: string
          memory_path?: string | null
          version?: number
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          id: string
          document_id: string
          content: string
          version: number
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          document_id: string
          content: string
          version: number
          created_at?: string
          created_by?: string
        }
        Update: {
          id?: string
          document_id?: string
          content?: string
          version?: number
          created_at?: string
          created_by?: string
        }
        Relationships: [
          {
            foreignKeyName: 'document_versions_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
        ]
      }
      logs: {
        Row: {
          id: string
          type: string
          actor: string
          title: string
          description: string | null
          context: Json | null
          session_id: string | null
          duration_ms: number | null
          status: string
          created_at: string
          related_type: string | null
          related_id: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          type: string
          actor: string
          title: string
          description?: string | null
          context?: Json | null
          session_id?: string | null
          duration_ms?: number | null
          status?: string
          created_at?: string
          related_type?: string | null
          related_id?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          type?: string
          actor?: string
          title?: string
          description?: string | null
          context?: Json | null
          session_id?: string | null
          duration_ms?: number | null
          status?: string
          created_at?: string
          related_type?: string | null
          related_id?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      log_sessions: {
        Row: {
          id: string
          type: string
          title: string
          description: string | null
          metadata: Json | null
          started_at: string
          completed_at: string | null
          status: string
          parent_session_id: string | null
        }
        Insert: {
          id?: string
          type: string
          title: string
          description?: string | null
          metadata?: Json | null
          started_at?: string
          completed_at?: string | null
          status?: string
          parent_session_id?: string | null
        }
        Update: {
          id?: string
          type?: string
          title?: string
          description?: string | null
          metadata?: Json | null
          started_at?: string
          completed_at?: string | null
          status?: string
          parent_session_id?: string | null
        }
        Relationships: []
      }
      task_templates: {
        Row: {
          id: string
          name: string
          description: string
          priority: string
          assignee: string
          project_id: string | null
          estimate: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          priority?: string
          assignee?: string
          project_id?: string | null
          estimate?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          priority?: string
          assignee?: string
          project_id?: string | null
          estimate?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_templates_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
