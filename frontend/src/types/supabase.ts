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
      activity_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      chatbots: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          industry: string | null
          business_type: string | null
          target_audience: string | null
          tone: string
          language: string
          welcome_message: string | null
          flow_data: Json
          settings: Json
          is_published: boolean
          is_active: boolean
          published_at: string | null
          views_count: number
          conversations_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          industry?: string | null
          business_type?: string | null
          target_audience?: string | null
          tone?: string
          language?: string
          welcome_message?: string | null
          flow_data?: Json
          settings?: Json
          is_published?: boolean
          is_active?: boolean
          published_at?: string | null
          views_count?: number
          conversations_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          industry?: string | null
          business_type?: string | null
          target_audience?: string | null
          tone?: string
          language?: string
          welcome_message?: string | null
          flow_data?: Json
          settings?: Json
          is_published?: boolean
          is_active?: boolean
          published_at?: string | null
          views_count?: number
          conversations_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          chatbot_id: string | null
          visitor_id: string | null
          visitor_name: string | null
          visitor_email: string | null
          session_data: Json
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          rating: number | null
          feedback: string | null
          is_resolved: boolean
          metadata: Json
        }
        Insert: {
          id?: string
          chatbot_id?: string | null
          visitor_id?: string | null
          visitor_name?: string | null
          visitor_email?: string | null
          session_data?: Json
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          rating?: number | null
          feedback?: string | null
          is_resolved?: boolean
          metadata?: Json
        }
        Update: {
          id?: string
          chatbot_id?: string | null
          visitor_id?: string | null
          visitor_name?: string | null
          visitor_email?: string | null
          session_data?: Json
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          rating?: number | null
          feedback?: string | null
          is_resolved?: boolean
          metadata?: Json
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string | null
          sender_type: string
          content: string
          message_type: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          sender_type: string
          content: string
          message_type?: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string | null
          sender_type?: string
          content?: string
          message_type?: string
          metadata?: Json
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          company_name: string | null
          website: string | null
          location: string | null
          bio: string | null
          timezone: string
          is_active: boolean
          email_verified: boolean
          last_seen_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          company_name?: string | null
          website?: string | null
          location?: string | null
          bio?: string | null
          timezone?: string
          is_active?: boolean
          email_verified?: boolean
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          company_name?: string | null
          website?: string | null
          location?: string | null
          bio?: string | null
          timezone?: string
          is_active?: boolean
          email_verified?: boolean
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string | null
          subscription_id: string | null
          amount: number
          currency: string
          status: string
          payment_method: string | null
          payment_provider: string | null
          transaction_id: string | null
          invoice_id: string | null
          receipt_url: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          subscription_id?: string | null
          amount: number
          currency?: string
          status?: string
          payment_method?: string | null
          payment_provider?: string | null
          transaction_id?: string | null
          invoice_id?: string | null
          receipt_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          subscription_id?: string | null
          amount?: number
          currency?: string
          status?: string
          payment_method?: string | null
          payment_provider?: string | null
          transaction_id?: string | null
          invoice_id?: string | null
          receipt_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      subscription_tiers: {
        Row: {
          id: string
          tier_key: string
          name: string
          description: string | null
          price: number
          original_price: number | null
          currency: string
          period: string
          is_active: boolean
          is_featured: boolean
          sort_order: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tier_key: string
          name: string
          description?: string | null
          price?: number
          original_price?: number | null
          currency?: string
          period?: string
          is_active?: boolean
          is_featured?: boolean
          sort_order?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tier_key?: string
          name?: string
          description?: string | null
          price?: number
          original_price?: number | null
          currency?: string
          period?: string
          is_active?: boolean
          is_featured?: boolean
          sort_order?: number
          metadata?: Json
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
  }
}
