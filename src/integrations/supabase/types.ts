export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      data_explorer_reports: {
        Row: {
          chart_type: string
          created_at: string | null
          data_source: string
          favorite: boolean | null
          id: string
          name: string
          query_config: Json
          updated_at: string | null
        }
        Insert: {
          chart_type: string
          created_at?: string | null
          data_source: string
          favorite?: boolean | null
          id?: string
          name: string
          query_config: Json
          updated_at?: string | null
        }
        Update: {
          chart_type?: string
          created_at?: string | null
          data_source?: string
          favorite?: boolean | null
          id?: string
          name?: string
          query_config?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      evaluation_tags: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      evaluation_tags_junction: {
        Row: {
          evaluation_id: string
          tag_id: string
        }
        Insert: {
          evaluation_id: string
          tag_id: string
        }
        Update: {
          evaluation_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_tags_junction_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "interviewer_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_tags_junction_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "evaluation_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      interviewer_evaluations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          interviewer_id: string
          project_id: string | null
          rating: number
          remarks: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          interviewer_id: string
          project_id?: string | null
          rating: number
          remarks?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          interviewer_id?: string
          project_id?: string | null
          rating?: number
          remarks?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviewer_evaluations_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "interviewers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviewer_evaluations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviewer_evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interviewer_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          interviewer_id: string
          project_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          interviewer_id: string
          project_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          interviewer_id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviewer_notes_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "interviewers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviewer_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      interviewers: {
        Row: {
          code: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          island: string | null
          last_name: string
          phone: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          island?: string | null
          last_name: string
          phone?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          island?: string | null
          last_name?: string
          phone?: string | null
        }
        Relationships: []
      }
      interviews: {
        Row: {
          candidate_name: string
          created_at: string
          end_address: string | null
          end_latitude: number | null
          end_longitude: number | null
          end_time: string | null
          id: string
          is_active: boolean
          project_id: string | null
          result: string | null
          session_id: string
          start_address: string | null
          start_latitude: number | null
          start_longitude: number | null
          start_time: string
        }
        Insert: {
          candidate_name?: string
          created_at?: string
          end_address?: string | null
          end_latitude?: number | null
          end_longitude?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          project_id?: string | null
          result?: string | null
          session_id: string
          start_address?: string | null
          start_latitude?: number | null
          start_longitude?: number | null
          start_time?: string
        }
        Update: {
          candidate_name?: string
          created_at?: string
          end_address?: string | null
          end_latitude?: number | null
          end_longitude?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          project_id?: string | null
          result?: string | null
          session_id?: string
          start_address?: string | null
          start_latitude?: number | null
          start_longitude?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      project_interviewers: {
        Row: {
          created_at: string
          id: string
          interviewer_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interviewer_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interviewer_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_interviewers_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "interviewers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_interviewers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          end_date: string
          excluded_islands: string[] | null
          hourly_rate: number | null
          id: string
          island: Database["public"]["Enums"]["island"]
          name: string
          non_response_rate: number | null
          response_rate: number | null
          show_response_rates: boolean | null
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          excluded_islands?: string[] | null
          hourly_rate?: number | null
          id?: string
          island: Database["public"]["Enums"]["island"]
          name: string
          non_response_rate?: number | null
          response_rate?: number | null
          show_response_rates?: boolean | null
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          excluded_islands?: string[] | null
          hourly_rate?: number | null
          id?: string
          island?: Database["public"]["Enums"]["island"]
          name?: string
          non_response_rate?: number | null
          response_rate?: number | null
          show_response_rates?: boolean | null
          start_date?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string
          end_time: string
          id: string
          interviewer_id: string
          notes: string | null
          project_id: string | null
          start_time: string
          status: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          interviewer_id: string
          notes?: string | null
          project_id?: string | null
          start_time: string
          status?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          interviewer_id?: string
          notes?: string | null
          project_id?: string | null
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "interviewers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          end_address: string | null
          end_latitude: number | null
          end_longitude: number | null
          end_time: string | null
          id: string
          interviewer_id: string
          is_active: boolean
          is_unusual_reviewed: boolean | null
          project_id: string | null
          start_address: string | null
          start_latitude: number | null
          start_longitude: number | null
          start_time: string
        }
        Insert: {
          created_at?: string
          end_address?: string | null
          end_latitude?: number | null
          end_longitude?: number | null
          end_time?: string | null
          id?: string
          interviewer_id: string
          is_active?: boolean
          is_unusual_reviewed?: boolean | null
          project_id?: string | null
          start_address?: string | null
          start_latitude?: number | null
          start_longitude?: number | null
          start_time?: string
        }
        Update: {
          created_at?: string
          end_address?: string | null
          end_latitude?: number | null
          end_longitude?: number | null
          end_time?: string | null
          id?: string
          interviewer_id?: string
          is_active?: boolean
          is_unusual_reviewed?: boolean | null
          project_id?: string | null
          start_address?: string | null
          start_latitude?: number | null
          start_longitude?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "interviewers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_interviewers_sessions_data: {
        Args: {
          p_columns: string[]
          p_filters: Json
          p_rows: string[]
          p_values: string[]
        }
        Returns: Json
      }
      get_interviews_results_data: {
        Args: {
          p_columns: string[]
          p_filters: Json
          p_rows: string[]
          p_values: string[]
        }
        Returns: Json
      }
      get_projects_interviewers_data: {
        Args: {
          p_columns: string[]
          p_filters: Json
          p_rows: string[]
          p_values: string[]
        }
        Returns: Json
      }
      get_sessions_duration_data: {
        Args: {
          p_columns: string[]
          p_filters: Json
          p_rows: string[]
          p_values: string[]
        }
        Returns: Json
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["app_role"]
          user_uuid: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "interviewer"
      island: "Bonaire" | "Saba" | "Sint Eustatius"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "interviewer"],
      island: ["Bonaire", "Saba", "Sint Eustatius"],
    },
  },
} as const
