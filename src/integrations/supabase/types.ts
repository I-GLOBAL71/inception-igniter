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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      economic_config: {
        Row: {
          base_return_rate: number
          created_at: string
          id: string
          jackpot_share_percentage: number
          jackpot_trigger_rate: number
          max_win_multiplier: number
          platform_share_percentage: number
          player_share_percentage: number
          updated_at: string
        }
        Insert: {
          base_return_rate?: number
          created_at?: string
          id?: string
          jackpot_share_percentage?: number
          jackpot_trigger_rate?: number
          max_win_multiplier?: number
          platform_share_percentage?: number
          player_share_percentage?: number
          updated_at?: string
        }
        Update: {
          base_return_rate?: number
          created_at?: string
          id?: string
          jackpot_share_percentage?: number
          jackpot_trigger_rate?: number
          max_win_multiplier?: number
          platform_share_percentage?: number
          player_share_percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      game_batches: {
        Row: {
          actual_jackpot_contribution: number
          actual_platform_revenue: number
          actual_player_payout: number
          batch_name: string
          created_at: string
          games_played: number
          id: string
          is_active: boolean
          jackpot_contribution_target: number
          platform_revenue_target: number
          player_payout_target: number
          total_games: number
          total_investment: number
        }
        Insert: {
          actual_jackpot_contribution?: number
          actual_platform_revenue?: number
          actual_player_payout?: number
          batch_name: string
          created_at?: string
          games_played?: number
          id?: string
          is_active?: boolean
          jackpot_contribution_target: number
          platform_revenue_target: number
          player_payout_target: number
          total_games: number
          total_investment: number
        }
        Update: {
          actual_jackpot_contribution?: number
          actual_platform_revenue?: number
          actual_player_payout?: number
          batch_name?: string
          created_at?: string
          games_played?: number
          id?: string
          is_active?: boolean
          jackpot_contribution_target?: number
          platform_revenue_target?: number
          player_payout_target?: number
          total_games?: number
          total_investment?: number
        }
        Relationships: []
      }
      jackpot_pool: {
        Row: {
          current_amount: number
          id: string
          last_win_amount: number | null
          last_win_date: string | null
          last_winner_id: string | null
          total_contributions: number
          total_payouts: number
          updated_at: string
        }
        Insert: {
          current_amount?: number
          id?: string
          last_win_amount?: number | null
          last_win_date?: string | null
          last_winner_id?: string | null
          total_contributions?: number
          total_payouts?: number
          updated_at?: string
        }
        Update: {
          current_amount?: number
          id?: string
          last_win_amount?: number | null
          last_win_date?: string | null
          last_winner_id?: string | null
          total_contributions?: number
          total_payouts?: number
          updated_at?: string
        }
        Relationships: []
      }
      pre_generated_games: {
        Row: {
          actual_payout: number | null
          actual_score: number | null
          batch_id: string
          bet_amount: number
          expected_payout: number
          game_index: number
          id: string
          is_played: boolean
          max_achievable_score: number
          played_at: string | null
          result_type: Database["public"]["Enums"]["game_result_type"]
          skill_requirement: number
          win_multiplier: number | null
        }
        Insert: {
          actual_payout?: number | null
          actual_score?: number | null
          batch_id: string
          bet_amount: number
          expected_payout: number
          game_index: number
          id?: string
          is_played?: boolean
          max_achievable_score: number
          played_at?: string | null
          result_type: Database["public"]["Enums"]["game_result_type"]
          skill_requirement?: number
          win_multiplier?: number | null
        }
        Update: {
          actual_payout?: number | null
          actual_score?: number | null
          batch_id?: string
          bet_amount?: number
          expected_payout?: number
          game_index?: number
          id?: string
          is_played?: boolean
          max_achievable_score?: number
          played_at?: string | null
          result_type?: Database["public"]["Enums"]["game_result_type"]
          skill_requirement?: number
          win_multiplier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_generated_games_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "game_batches"
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
      game_result_type: "win" | "loss" | "jackpot"
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
      game_result_type: ["win", "loss", "jackpot"],
    },
  },
} as const
