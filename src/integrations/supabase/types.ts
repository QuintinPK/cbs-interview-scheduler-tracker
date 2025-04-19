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
          id: string
          island: Database["public"]["Enums"]["island"]
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          excluded_islands?: string[] | null
          id?: string
          island: Database["public"]["Enums"]["island"]
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          excluded_islands?: string[] | null
          id?: string
          island?: Database["public"]["Enums"]["island"]
          name?: string
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
