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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      challenge_tasks: {
        Row: {
          challenge_id: string
          emoji: string | null
          id: string
          name: string
          sort_order: number | null
          xp_reward: number | null
        }
        Insert: {
          challenge_id: string
          emoji?: string | null
          id?: string
          name: string
          sort_order?: number | null
          xp_reward?: number | null
        }
        Update: {
          challenge_id?: string
          emoji?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_tasks_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_days: number | null
          emoji: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          long_desc: string | null
          title: string
          total_xp: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days?: number | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          long_desc?: string | null
          title: string
          total_xp?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days?: number | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          long_desc?: string | null
          title?: string
          total_xp?: number | null
        }
        Relationships: []
      }
      streak_log: {
        Row: {
          id: string
          streak_date: string | null
          user_id: string
        }
        Insert: {
          id?: string
          streak_date?: string | null
          user_id: string
        }
        Update: {
          id?: string
          streak_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streak_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["whop_user_id"]
          },
          {
            foreignKeyName: "streak_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["whop_user_id"]
          },
        ]
      }
      task_completions: {
        Row: {
          completed_date: string | null
          created_at: string | null
          id: string
          task_id: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          id?: string
          task_id: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          id?: string
          task_id?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "challenge_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["whop_user_id"]
          },
          {
            foreignKeyName: "task_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["whop_user_id"]
          },
        ]
      }
      todos: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          text: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          text: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["whop_user_id"]
          },
          {
            foreignKeyName: "todos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["whop_user_id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["whop_user_id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["whop_user_id"]
          },
        ]
      }
      xp_events: {
        Row: {
          id: string
          user_id: string
          source: string
          reference_id: string
          reference_date: string
          xp_amount: number
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          source: string
          reference_id: string
          reference_date?: string
          xp_amount?: number
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          source?: string
          reference_id?: string
          reference_date?: string
          xp_amount?: number
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["whop_user_id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          id: string
          user_id: string
          program_id: string
          program_title: string
          session_id: string
          session_name: string
          completed_at: string | null
          completed_date: string
          total_volume: number | null
          improved_sets: number | null
          xp_earned: number | null
        }
        Insert: {
          id?: string
          user_id: string
          program_id: string
          program_title: string
          session_id: string
          session_name: string
          completed_at?: string | null
          completed_date?: string
          total_volume?: number | null
          improved_sets?: number | null
          xp_earned?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          program_id?: string
          program_title?: string
          session_id?: string
          session_name?: string
          completed_at?: string | null
          completed_date?: string
          total_volume?: number | null
          improved_sets?: number | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["whop_user_id"]
          },
        ]
      }
      workout_set_logs: {
        Row: {
          id: string
          workout_log_id: string
          exercise_id: string
          exercise_name: string
          set_number: number
          load: number | null
          reps: number | null
          rpe: number | null
          set_type: string | null
          is_pr: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          workout_log_id: string
          exercise_id: string
          exercise_name: string
          set_number: number
          load?: number | null
          reps?: number | null
          rpe?: number | null
          set_type?: string | null
          is_pr?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          workout_log_id?: string
          exercise_id?: string
          exercise_name?: string
          set_number?: number
          load?: number | null
          reps?: number | null
          rpe?: number | null
          set_type?: string | null
          is_pr?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_set_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      steps_daily_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          baseline: number | null
          goal: number | null
          done: number | null
          milestones_awarded: Json | null
          goal_hit: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          log_date?: string
          baseline?: number | null
          goal?: number | null
          done?: number | null
          milestones_awarded?: Json | null
          goal_hit?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          baseline?: number | null
          goal?: number | null
          done?: number | null
          milestones_awarded?: Json | null
          goal_hit?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "steps_daily_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["whop_user_id"]
          },
        ]
      }
      nutrition_daily_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          calorie_goal: number | null
          protein_goal: number | null
          carbs_goal: number | null
          fats_goal: number | null
          water_goal_l: number | null
          water_in_l: number | null
          protein_goal_hit: boolean | null
          calories_on_target: boolean | null
          hydration_goal_hit: boolean | null
          meal_rewards_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          log_date?: string
          calorie_goal?: number | null
          protein_goal?: number | null
          carbs_goal?: number | null
          fats_goal?: number | null
          water_goal_l?: number | null
          water_in_l?: number | null
          protein_goal_hit?: boolean | null
          calories_on_target?: boolean | null
          hydration_goal_hit?: boolean | null
          meal_rewards_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          calorie_goal?: number | null
          protein_goal?: number | null
          carbs_goal?: number | null
          fats_goal?: number | null
          water_goal_l?: number | null
          water_in_l?: number | null
          protein_goal_hit?: boolean | null
          calories_on_target?: boolean | null
          hydration_goal_hit?: boolean | null
          meal_rewards_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_daily_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["whop_user_id"]
          },
        ]
      }
      nutrition_meals: {
        Row: {
          id: string
          daily_log_id: string
          user_id: string
          meal_type: string
          name: string
          calories: number | null
          protein: number | null
          carbs: number | null
          fats: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          daily_log_id: string
          user_id: string
          meal_type: string
          name: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fats?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          daily_log_id?: string
          user_id?: string
          meal_type?: string
          name?: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fats?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_meals_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "nutrition_daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_meal_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          slot: string
          calories: number | null
          protein: number | null
          carbs: number | null
          fats: number | null
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slot?: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fats?: number | null
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slot?: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fats?: number | null
          sort_order?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      nutrition_daily_checks: {
        Row: {
          id: string
          user_id: string
          template_id: string
          date: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id: string
          date: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string
          date?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_daily_checks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "nutrition_meal_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      breathwork_sessions: {
        Row: {
          id: string
          user_id: string
          preset_id: string | null
          inhale: number
          hold_sec: number
          exhale: number
          cycles: number
          xp_earned: number | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          preset_id?: string | null
          inhale: number
          hold_sec: number
          exhale: number
          cycles: number
          xp_earned?: number | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          preset_id?: string | null
          inhale?: number
          hold_sec?: number
          exhale?: number
          cycles?: number
          xp_earned?: number | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "breathwork_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["whop_user_id"]
          },
        ]
      }
      freestyle_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freestyle_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["whop_user_id"]
          },
        ]
      }
      freestyle_template_exercises: {
        Row: {
          id: string
          template_id: string
          exercise_id: string
          sets: number | null
          reps: number | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          template_id: string
          exercise_id: string
          sets?: number | null
          reps?: number | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          template_id?: string
          exercise_id?: string
          sets?: number | null
          reps?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "freestyle_template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "freestyle_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          last_task_at: string | null
          locale: string | null
          streak_days: number | null
          total_xp: number | null
          updated_at: string | null
          whop_user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          last_task_at?: string | null
          locale?: string | null
          streak_days?: number | null
          total_xp?: number | null
          updated_at?: string | null
          whop_user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          last_task_at?: string | null
          locale?: string | null
          streak_days?: number | null
          total_xp?: number | null
          updated_at?: string | null
          whop_user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          position: number | null
          streak_days: number | null
          total_xp: number | null
          whop_user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      refresh_leaderboard: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
