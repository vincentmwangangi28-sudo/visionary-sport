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
      accuracy_reports: {
        Row: {
          accuracy_percent: number | null
          by_confidence_range: Json | null
          by_league: Json | null
          by_sport: Json | null
          correct_predictions: number | null
          created_at: string | null
          id: string
          period_type: string
          report_date: string
          top_performing_leagues: string[] | null
          total_predictions: number | null
        }
        Insert: {
          accuracy_percent?: number | null
          by_confidence_range?: Json | null
          by_league?: Json | null
          by_sport?: Json | null
          correct_predictions?: number | null
          created_at?: string | null
          id?: string
          period_type: string
          report_date: string
          top_performing_leagues?: string[] | null
          total_predictions?: number | null
        }
        Update: {
          accuracy_percent?: number | null
          by_confidence_range?: Json | null
          by_league?: Json | null
          by_sport?: Json | null
          correct_predictions?: number | null
          created_at?: string | null
          id?: string
          period_type?: string
          report_date?: string
          top_performing_leagues?: string[] | null
          total_predictions?: number | null
        }
        Relationships: []
      }
      coin_packages: {
        Row: {
          bonus_coins: number | null
          coins: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          name: string
          price_kes: number
        }
        Insert: {
          bonus_coins?: number | null
          coins: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name: string
          price_kes: number
        }
        Update: {
          bonus_coins?: number | null
          coins?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name?: string
          price_kes?: number
        }
        Relationships: []
      }
      contest_entries: {
        Row: {
          contest_id: string
          created_at: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          id?: string
          score?: number
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_entries_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contests: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          entry_fee: number
          id: string
          name: string
          prize_pool: number
          start_date: string
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          entry_fee?: number
          id?: string
          name: string
          prize_pool?: number
          start_date: string
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          entry_fee?: number
          id?: string
          name?: string
          prize_pool?: number
          start_date?: string
          status?: string | null
        }
        Relationships: []
      }
      dns_audit_log: {
        Row: {
          action: string
          changed_at: string | null
          comment: string | null
          id: number
          priority: number | null
          record_name: string | null
          record_type: string | null
          record_value: string | null
          ttl: number | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          comment?: string | null
          id?: number
          priority?: number | null
          record_name?: string | null
          record_type?: string | null
          record_value?: string | null
          ttl?: number | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          comment?: string | null
          id?: number
          priority?: number | null
          record_name?: string | null
          record_type?: string | null
          record_value?: string | null
          ttl?: number | null
        }
        Relationships: []
      }
      dns_records: {
        Row: {
          comment: string | null
          id: number
          name: string
          priority: number | null
          ttl: number | null
          type: string
          value: string
        }
        Insert: {
          comment?: string | null
          id?: number
          name: string
          priority?: number | null
          ttl?: number | null
          type: string
          value: string
        }
        Update: {
          comment?: string | null
          id?: number
          name?: string
          priority?: number | null
          ttl?: number | null
          type?: string
          value?: string
        }
        Relationships: []
      }
      edge_function_stats: {
        Row: {
          function_name: string
          id: number
          invocations: number | null
          last_updated: string | null
          status: string
          success_rate: number | null
        }
        Insert: {
          function_name: string
          id?: number
          invocations?: number | null
          last_updated?: string | null
          status: string
          success_rate?: number | null
        }
        Update: {
          function_name?: string
          id?: number
          invocations?: number | null
          last_updated?: string | null
          status?: string
          success_rate?: number | null
        }
        Relationships: []
      }
      email_subscriptions: {
        Row: {
          created_at: string | null
          email: string
          frequency: string
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expert_analysis: {
        Row: {
          betting_tips: string[] | null
          created_at: string
          form_analysis: string | null
          head_to_head: Json | null
          id: string
          injury_report: Json | null
          key_stats: Json | null
          match_id: string
          prediction_id: string | null
        }
        Insert: {
          betting_tips?: string[] | null
          created_at?: string
          form_analysis?: string | null
          head_to_head?: Json | null
          id?: string
          injury_report?: Json | null
          key_stats?: Json | null
          match_id: string
          prediction_id?: string | null
        }
        Update: {
          betting_tips?: string[] | null
          created_at?: string
          form_analysis?: string | null
          head_to_head?: Json | null
          id?: string
          injury_report?: Json | null
          key_stats?: Json | null
          match_id?: string
          prediction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_analysis_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      games_news: {
        Row: {
          author: string | null
          category: string | null
          content: string
          created_at: string | null
          id: number
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          id?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          id?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      games_news_archive: {
        Row: {
          archived_at: string | null
          author: string | null
          category: string | null
          content: string | null
          created_at: string | null
          id: number
          title: string | null
        }
        Insert: {
          archived_at?: string | null
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: number
          title?: string | null
        }
        Update: {
          archived_at?: string | null
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: number
          title?: string | null
        }
        Relationships: []
      }
      match_chat_messages: {
        Row: {
          created_at: string
          id: string
          match_id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      match_faqs: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          match_id: string
          question: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          match_id: string
          question: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          match_id?: string
          question?: string
        }
        Relationships: []
      }
      match_verifications: {
        Row: {
          actual_result: string | null
          away_score: number | null
          home_score: number | null
          id: string
          is_correct: boolean | null
          match_id: string
          prediction_id: string
          source: string | null
          verified_at: string | null
        }
        Insert: {
          actual_result?: string | null
          away_score?: number | null
          home_score?: number | null
          id?: string
          is_correct?: boolean | null
          match_id: string
          prediction_id: string
          source?: string | null
          verified_at?: string | null
        }
        Update: {
          actual_result?: string | null
          away_score?: number | null
          home_score?: number | null
          id?: string
          is_correct?: boolean | null
          match_id?: string
          prediction_id?: string
          source?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_verifications_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: true
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          author: string | null
          category: string
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          is_published: boolean | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author?: string | null
          category?: string
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author?: string | null
          category?: string
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      platform_accuracy: {
        Row: {
          accuracy_percent: number | null
          by_league: Json | null
          correct_predictions: number | null
          created_at: string | null
          date: string
          id: string
          total_predictions: number | null
        }
        Insert: {
          accuracy_percent?: number | null
          by_league?: Json | null
          correct_predictions?: number | null
          created_at?: string | null
          date: string
          id?: string
          total_predictions?: number | null
        }
        Update: {
          accuracy_percent?: number | null
          by_league?: Json | null
          correct_predictions?: number | null
          created_at?: string | null
          date?: string
          id?: string
          total_predictions?: number | null
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          match_id: string | null
          options: Json
          question: string
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          match_id?: string | null
          options?: Json
          question: string
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          match_id?: string | null
          options?: Json
          question?: string
        }
        Relationships: []
      }
      prediction_bundles: {
        Row: {
          created_at: string
          discount_percent: number | null
          id: string
          is_active: boolean | null
          name: string
          predictions_count: number
          price_kes: number
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          predictions_count: number
          price_kes: number
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          predictions_count?: number
          price_kes?: number
        }
        Relationships: []
      }
      prediction_cards: {
        Row: {
          created_at: string | null
          id: string
          prediction_id: string | null
          public_url: string | null
          storage_path: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          prediction_id?: string | null
          public_url?: string | null
          storage_path: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          prediction_id?: string | null
          public_url?: string | null
          storage_path?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prediction_cards_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_insurance: {
        Row: {
          created_at: string
          id: string
          insurance_cost: number
          prediction_id: string
          refund_percent: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insurance_cost: number
          prediction_id: string
          refund_percent?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insurance_cost?: number
          prediction_id?: string
          refund_percent?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_insurance_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_markets: {
        Row: {
          confidence: number
          created_at: string
          id: string
          is_premium: boolean
          market_key: string
          market_label: string
          market_value: string
          match_id: string
          prediction_id: string
          reasoning: string | null
          updated_at: string
        }
        Insert: {
          confidence: number
          created_at?: string
          id?: string
          is_premium?: boolean
          market_key: string
          market_label: string
          market_value: string
          match_id: string
          prediction_id: string
          reasoning?: string | null
          updated_at?: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          is_premium?: boolean
          market_key?: string
          market_label?: string
          market_value?: string
          match_id?: string
          prediction_id?: string
          reasoning?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          ai_model: string | null
          away_team: string
          confidence: number
          created_at: string
          home_team: string
          id: string
          is_premium: boolean | null
          is_upset_alert: boolean | null
          league: string
          match_date: string
          match_id: string
          odds_value: number | null
          prediction: string
          reasoning: string
          result: string | null
          sport: string | null
        }
        Insert: {
          ai_model?: string | null
          away_team: string
          confidence: number
          created_at?: string
          home_team: string
          id?: string
          is_premium?: boolean | null
          is_upset_alert?: boolean | null
          league: string
          match_date: string
          match_id: string
          odds_value?: number | null
          prediction: string
          reasoning: string
          result?: string | null
          sport?: string | null
        }
        Update: {
          ai_model?: string | null
          away_team?: string
          confidence?: number
          created_at?: string
          home_team?: string
          id?: string
          is_premium?: boolean | null
          is_upset_alert?: boolean | null
          league?: string
          match_date?: string
          match_id?: string
          odds_value?: number | null
          prediction?: string
          reasoning?: string
          result?: string | null
          sport?: string | null
        }
        Relationships: []
      }
      predictions_history: {
        Row: {
          actual_result: string | null
          away_team: string
          competition: string | null
          confidence: number
          created_at: string
          home_team: string
          id: string
          is_correct: boolean | null
          match_date: string
          match_id: string
          prediction: string
          user_id: string
        }
        Insert: {
          actual_result?: string | null
          away_team: string
          competition?: string | null
          confidence: number
          created_at?: string
          home_team: string
          id?: string
          is_correct?: boolean | null
          match_date: string
          match_id: string
          prediction: string
          user_id: string
        }
        Update: {
          actual_result?: string | null
          away_team?: string
          competition?: string | null
          confidence?: number
          created_at?: string
          home_team?: string
          id?: string
          is_correct?: boolean | null
          match_date?: string
          match_id?: string
          prediction?: string
          user_id?: string
        }
        Relationships: []
      }
      predictions_unlocked: {
        Row: {
          coins_spent: number
          created_at: string
          id: string
          prediction_id: string
          user_id: string
        }
        Insert: {
          coins_spent?: number
          created_at?: string
          id?: string
          prediction_id: string
          user_id: string
        }
        Update: {
          coins_spent?: number
          created_at?: string
          id?: string
          prediction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_unlocked_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      query_performance_log: {
        Row: {
          duration_ms: number | null
          id: number
          logged_at: string | null
          query_name: string | null
        }
        Insert: {
          duration_ms?: number | null
          id?: number
          logged_at?: string | null
          query_name?: string | null
        }
        Update: {
          duration_ms?: number | null
          id?: number
          logged_at?: string | null
          query_name?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
          uses_count?: number | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          coins_earned: number | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string | null
        }
        Insert: {
          coins_earned?: number | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string | null
        }
        Update: {
          coins_earned?: number | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string | null
        }
        Relationships: []
      }
      seo_metadata: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          keywords: string[] | null
          og_image: string | null
          page_path: string
          structured_data: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          og_image?: string | null
          page_path: string
          structured_data?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          og_image?: string | null
          page_path?: string
          structured_data?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      smart_slips: {
        Row: {
          combined_confidence: number | null
          created_at: string | null
          id: string
          is_public: boolean | null
          potential_return: number | null
          predictions: Json
          stake_suggestion: number | null
          total_odds: number | null
          user_id: string | null
        }
        Insert: {
          combined_confidence?: number | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          potential_return?: number | null
          predictions?: Json
          stake_suggestion?: number | null
          total_odds?: number | null
          user_id?: string | null
        }
        Update: {
          combined_confidence?: number | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          potential_return?: number | null
          predictions?: Json
          stake_suggestion?: number | null
          total_odds?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      sms_subscriptions: {
        Row: {
          alerts_enabled: boolean | null
          country_code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          phone_number: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alerts_enabled?: boolean | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alerts_enabled?: boolean | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      spin_wheel_entries: {
        Row: {
          id: string
          prize_amount: number | null
          prize_type: string
          spun_at: string
          user_id: string
        }
        Insert: {
          id?: string
          prize_amount?: number | null
          prize_type: string
          spun_at?: string
          user_id: string
        }
        Update: {
          id?: string
          prize_amount?: number | null
          prize_type?: string
          spun_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          plan: string
          price_kes: number
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          plan: string
          price_kes: number
          starts_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          plan?: string
          price_kes?: number
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          payment_method: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      transfer_rumors: {
        Row: {
          created_at: string | null
          current_club: string | null
          details: string | null
          headline: string
          id: string
          is_confirmed: boolean | null
          player_name: string
          probability: number | null
          source: string | null
          target_club: string | null
          transfer_fee: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_club?: string | null
          details?: string | null
          headline: string
          id?: string
          is_confirmed?: boolean | null
          player_name: string
          probability?: number | null
          source?: string | null
          target_club?: string | null
          transfer_fee?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_club?: string | null
          details?: string | null
          headline?: string
          id?: string
          is_confirmed?: boolean | null
          player_name?: string
          probability?: number | null
          source?: string | null
          target_club?: string | null
          transfer_fee?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      upcoming_matches_cache: {
        Row: {
          away_team: string
          confidence: number | null
          created_at: string
          home_team: string
          id: string
          league: string
          match_date: string
          match_id: string
          match_time: string
          prediction: string | null
          sport: string | null
          updated_at: string
        }
        Insert: {
          away_team: string
          confidence?: number | null
          created_at?: string
          home_team: string
          id?: string
          league: string
          match_date: string
          match_id: string
          match_time: string
          prediction?: string | null
          sport?: string | null
          updated_at?: string
        }
        Update: {
          away_team?: string
          confidence?: number | null
          created_at?: string
          home_team?: string
          id?: string
          league?: string
          match_date?: string
          match_id?: string
          match_time?: string
          prediction?: string | null
          sport?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_name: string
          badge_type: string
          description: string | null
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_name: string
          badge_type: string
          description?: string | null
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_name?: string
          badge_type?: string
          description?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_predictions: {
        Row: {
          coins_wagered: number | null
          created_at: string
          id: string
          is_correct: boolean | null
          prediction_id: string
          user_choice: string
          user_id: string
        }
        Insert: {
          coins_wagered?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          prediction_id: string
          user_choice: string
          user_id: string
        }
        Update: {
          coins_wagered?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          prediction_id?: string
          user_choice?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_predictions_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_prediction_date: string | null
          longest_streak: number | null
          total_correct: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_prediction_date?: string | null
          longest_streak?: number | null
          total_correct?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_prediction_date?: string | null
          longest_streak?: number | null
          total_correct?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_subscriptions: {
        Row: {
          country_code: string
          created_at: string
          id: string
          is_active: boolean
          last_message_sent_at: string | null
          message_count: number | null
          phone_number: string
          subscribed_at: string
          unsubscribed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_sent_at?: string | null
          message_count?: number | null
          phone_number: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_sent_at?: string | null
          message_count?: number | null
          phone_number?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      dns_summary: {
        Row: {
          notes: string | null
          record_type: string | null
          subdomain: string | null
          target: string | null
          ttl: number | null
        }
        Insert: {
          notes?: string | null
          record_type?: string | null
          subdomain?: string | null
          target?: string | null
          ttl?: number | null
        }
        Update: {
          notes?: string | null
          record_type?: string | null
          subdomain?: string | null
          target?: string | null
          ttl?: number | null
        }
        Relationships: []
      }
      games_news_categories: {
        Row: {
          category: string | null
        }
        Relationships: []
      }
      games_news_featured: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          created_at: string | null
          id: number | null
          title: string | null
        }
        Relationships: []
      }
      games_news_recent: {
        Row: {
          category: string | null
          created_at: string | null
          id: number | null
          title: string | null
        }
        Relationships: []
      }
      leaderboard_view: {
        Row: {
          full_name: string | null
          rank: number | null
          score: number | null
          user_id: string | null
        }
        Relationships: []
      }
      mv_featured_article: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          created_at: string | null
          id: number | null
          title: string | null
        }
        Relationships: []
      }
      mv_recent_articles: {
        Row: {
          category: string | null
          created_at: string | null
          id: number | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_spin_today: { Args: { _user_id: string }; Returns: boolean }
      enter_contest_atomic: {
        Args: { _contest_id: string; _entry_fee: number }
        Returns: Json
      }
      generate_ai_games_news: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_ai_generated_news: { Args: never; Returns: undefined }
      unlock_prediction: {
        Args: { _coin_cost?: number; _prediction_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "premium"
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
      app_role: ["admin", "user", "premium"],
    },
  },
} as const
