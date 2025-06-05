export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      island: "Bonaire" | "Saba" | "Sint Eustatius"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      island: ["Bonaire", "Saba", "Sint Eustatius"],
    },
  },
} as const
