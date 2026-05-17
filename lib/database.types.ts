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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cases: {
        Row: {
          ai_summary: string | null
          analyst_1y_price_target: number | null
          brand_summary: string | null
          brand_type: string | null
          business_model_explanation: string | null
          business_model_outlook: string | null
          catalyst_1: string | null
          catalyst_2: string | null
          catalyst_3: string | null
          catalyst_4: string | null
          catalysts: string[] | null
          company_fundamentals: string | null
          company_name: string | null
          competitive_advantage: string | null
          competitive_advantage_defined: string | null
          confidence_score: number | null
          conviction_score: number | null
          country_of_incorporation: string | null
          created_at: string
          current_pe: number | null
          current_phase: string | null
          current_price_at_case: number | null
          current_vs_historical_multiples: string | null
          date_of_case: string | null
          direction: string | null
          earnings_quality: string | null
          entry_price_target: number | null
          eps: string | null
          esg_governance_explanation: string | null
          esg_governance_quality_score: number | null
          ev_ebitda: number | null
          event_classification: string | null
          event_details: string | null
          event_summary: string | null
          event_type: string | null
          execute: boolean | null
          expected_holding_period_months: number | null
          forward_pe: number | null
          fundamental_score: number | null
          id: string
          impact_of_news: string | null
          industry: string | null
          initial_market_assessment: string | null
          key_products_services: string | null
          layered_fcf_ttm: string | null
          leverage: number | null
          market_position: string | null
          net_debt_ebitda: string | null
          operating_margin: string | null
          overall_chart_assessment: string | null
          primary_trend: string | null
          prior_valuation_assessment: string | null
          rematch: boolean | null
          risk_1: string | null
          risk_2: string | null
          risk_3: string | null
          risk_4: string | null
          risk_reward_ratio: number | null
          risks: string[] | null
          sector: string | null
          status: string | null
          stop_loss: number | null
          take_profit: number | null
          technical_score: number | null
          ticker: string | null
          top_3_competitors: string | null
          total_score: number | null
          trading_id: string
          tradingview_ta_score: string | null
          trigger_score: number | null
          updated_at: string
          valuation_metrics_peers: string | null
          valuation_score: number | null
          week_52_high: number | null
          week_52_low: number | null
          why_not_executed: string | null
          why_not_rematch: string | null
        }
        Insert: {
          ai_summary?: string | null
          analyst_1y_price_target?: number | null
          brand_summary?: string | null
          brand_type?: string | null
          business_model_explanation?: string | null
          business_model_outlook?: string | null
          catalyst_1?: string | null
          catalyst_2?: string | null
          catalyst_3?: string | null
          catalyst_4?: string | null
          catalysts?: string[] | null
          company_fundamentals?: string | null
          company_name?: string | null
          competitive_advantage?: string | null
          competitive_advantage_defined?: string | null
          confidence_score?: number | null
          conviction_score?: number | null
          country_of_incorporation?: string | null
          created_at?: string
          current_pe?: number | null
          current_phase?: string | null
          current_price_at_case?: number | null
          current_vs_historical_multiples?: string | null
          date_of_case?: string | null
          direction?: string | null
          earnings_quality?: string | null
          entry_price_target?: number | null
          eps?: string | null
          esg_governance_explanation?: string | null
          esg_governance_quality_score?: number | null
          ev_ebitda?: number | null
          event_classification?: string | null
          event_details?: string | null
          event_summary?: string | null
          event_type?: string | null
          execute?: boolean | null
          expected_holding_period_months?: number | null
          forward_pe?: number | null
          fundamental_score?: number | null
          id?: string
          impact_of_news?: string | null
          industry?: string | null
          initial_market_assessment?: string | null
          key_products_services?: string | null
          layered_fcf_ttm?: string | null
          leverage?: number | null
          market_position?: string | null
          net_debt_ebitda?: string | null
          operating_margin?: string | null
          overall_chart_assessment?: string | null
          primary_trend?: string | null
          prior_valuation_assessment?: string | null
          rematch?: boolean | null
          risk_1?: string | null
          risk_2?: string | null
          risk_3?: string | null
          risk_4?: string | null
          risk_reward_ratio?: number | null
          risks?: string[] | null
          sector?: string | null
          status?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          technical_score?: number | null
          ticker?: string | null
          top_3_competitors?: string | null
          total_score?: number | null
          trading_id: string
          tradingview_ta_score?: string | null
          trigger_score?: number | null
          updated_at?: string
          valuation_metrics_peers?: string | null
          valuation_score?: number | null
          week_52_high?: number | null
          week_52_low?: number | null
          why_not_executed?: string | null
          why_not_rematch?: string | null
        }
        Update: {
          ai_summary?: string | null
          analyst_1y_price_target?: number | null
          brand_summary?: string | null
          brand_type?: string | null
          business_model_explanation?: string | null
          business_model_outlook?: string | null
          catalyst_1?: string | null
          catalyst_2?: string | null
          catalyst_3?: string | null
          catalyst_4?: string | null
          catalysts?: string[] | null
          company_fundamentals?: string | null
          company_name?: string | null
          competitive_advantage?: string | null
          competitive_advantage_defined?: string | null
          confidence_score?: number | null
          conviction_score?: number | null
          country_of_incorporation?: string | null
          created_at?: string
          current_pe?: number | null
          current_phase?: string | null
          current_price_at_case?: number | null
          current_vs_historical_multiples?: string | null
          date_of_case?: string | null
          direction?: string | null
          earnings_quality?: string | null
          entry_price_target?: number | null
          eps?: string | null
          esg_governance_explanation?: string | null
          esg_governance_quality_score?: number | null
          ev_ebitda?: number | null
          event_classification?: string | null
          event_details?: string | null
          event_summary?: string | null
          event_type?: string | null
          execute?: boolean | null
          expected_holding_period_months?: number | null
          forward_pe?: number | null
          fundamental_score?: number | null
          id?: string
          impact_of_news?: string | null
          industry?: string | null
          initial_market_assessment?: string | null
          key_products_services?: string | null
          layered_fcf_ttm?: string | null
          leverage?: number | null
          market_position?: string | null
          net_debt_ebitda?: string | null
          operating_margin?: string | null
          overall_chart_assessment?: string | null
          primary_trend?: string | null
          prior_valuation_assessment?: string | null
          rematch?: boolean | null
          risk_1?: string | null
          risk_2?: string | null
          risk_3?: string | null
          risk_4?: string | null
          risk_reward_ratio?: number | null
          risks?: string[] | null
          sector?: string | null
          status?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          technical_score?: number | null
          ticker?: string | null
          top_3_competitors?: string | null
          total_score?: number | null
          trading_id?: string
          tradingview_ta_score?: string | null
          trigger_score?: number | null
          updated_at?: string
          valuation_metrics_peers?: string | null
          valuation_score?: number | null
          week_52_high?: number | null
          week_52_low?: number | null
          why_not_executed?: string | null
          why_not_rematch?: string | null
        }
        Relationships: []
      }
      closed_trades: {
        Row: {
          entry_date: string | null
          entry_price: number | null
          exit_date: string | null
          exit_price: number | null
          holding_period_days: number | null
          id: string
          last_synced_at: string | null
          position_size: number | null
          realized_pnl: number | null
          realized_pnl_pct: number | null
          symbol: string
          trading_id: string | null
        }
        Insert: {
          entry_date?: string | null
          entry_price?: number | null
          exit_date?: string | null
          exit_price?: number | null
          holding_period_days?: number | null
          id?: string
          last_synced_at?: string | null
          position_size?: number | null
          realized_pnl?: number | null
          realized_pnl_pct?: number | null
          symbol: string
          trading_id?: string | null
        }
        Update: {
          entry_date?: string | null
          entry_price?: number | null
          exit_date?: string | null
          exit_price?: number | null
          holding_period_days?: number | null
          id?: string
          last_synced_at?: string | null
          position_size?: number | null
          realized_pnl?: number | null
          realized_pnl_pct?: number | null
          symbol?: string
          trading_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "closed_trades_trading_id_fkey"
            columns: ["trading_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["trading_id"]
          },
        ]
      }
      commentary: {
        Row: {
          content: string
          created_at: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      journal: {
        Row: {
          created_at: string
          entry_date: string | null
          entry_type: string | null
          id: string
          notes: string | null
          post_trade_reflection: string | null
          trading_id: string | null
        }
        Insert: {
          created_at?: string
          entry_date?: string | null
          entry_type?: string | null
          id?: string
          notes?: string | null
          post_trade_reflection?: string | null
          trading_id?: string | null
        }
        Update: {
          created_at?: string
          entry_date?: string | null
          entry_type?: string | null
          id?: string
          notes?: string | null
          post_trade_reflection?: string | null
          trading_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_trading_id_fkey"
            columns: ["trading_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["trading_id"]
          },
        ]
      }
      open_positions: {
        Row: {
          current_price: number | null
          entry_date_actual: string | null
          entry_price_actual: number | null
          id: string
          last_synced_at: string | null
          pct_of_nav: number | null
          position_size_actual: number | null
          symbol: string
          trading_id: string | null
          unrealized_pnl: number | null
          unrealized_pnl_pct: number | null
        }
        Insert: {
          current_price?: number | null
          entry_date_actual?: string | null
          entry_price_actual?: number | null
          id?: string
          last_synced_at?: string | null
          pct_of_nav?: number | null
          position_size_actual?: number | null
          symbol: string
          trading_id?: string | null
          unrealized_pnl?: number | null
          unrealized_pnl_pct?: number | null
        }
        Update: {
          current_price?: number | null
          entry_date_actual?: string | null
          entry_price_actual?: number | null
          id?: string
          last_synced_at?: string | null
          pct_of_nav?: number | null
          position_size_actual?: number | null
          symbol?: string
          trading_id?: string | null
          unrealized_pnl?: number | null
          unrealized_pnl_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "open_positions_trading_id_fkey"
            columns: ["trading_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["trading_id"]
          },
        ]
      }
      portfolio_snapshots: {
        Row: {
          benchmark_value: number | null
          created_at: string
          daily_twr: number | null
          deposits_withdrawals: number | null
          id: string
          snapshot_date: string
          total_nav: number | null
          total_realized_pnl: number | null
          total_unrealized_pnl: number | null
        }
        Insert: {
          benchmark_value?: number | null
          created_at?: string
          daily_twr?: number | null
          deposits_withdrawals?: number | null
          id?: string
          snapshot_date: string
          total_nav?: number | null
          total_realized_pnl?: number | null
          total_unrealized_pnl?: number | null
        }
        Update: {
          benchmark_value?: number | null
          created_at?: string
          daily_twr?: number | null
          deposits_withdrawals?: number | null
          id?: string
          snapshot_date?: string
          total_nav?: number | null
          total_realized_pnl?: number | null
          total_unrealized_pnl?: number | null
        }
        Relationships: []
      }
      risk_free_rates: {
        Row: {
          date: string
          rate: number
          source: string
          updated_at: string
        }
        Insert: {
          date: string
          rate: number
          source?: string
          updated_at?: string
        }
        Update: {
          date?: string
          rate?: number
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      stock_prices: {
        Row: {
          close: number
          created_at: string
          date: string
          id: string
          symbol: string
        }
        Insert: {
          close: number
          created_at?: string
          date: string
          id?: string
          symbol: string
        }
        Update: {
          close?: number
          created_at?: string
          date?: string
          id?: string
          symbol?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
