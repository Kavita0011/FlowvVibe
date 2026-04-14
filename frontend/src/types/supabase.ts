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
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          display_name: string | null
          role: string
          phone: string | null
          company_name: string | null
          location: string | null
          is_active: boolean
          subscription_tier: string
          subscription_status: string
          subscription_expires_at: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          display_name?: string | null
          role?: string
          phone?: string | null
          company_name?: string | null
          location?: string | null
          is_active?: boolean
          subscription_tier?: string
          subscription_status?: string
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          display_name?: string | null
          role?: string
          phone?: string | null
          company_name?: string | null
          location?: string | null
          is_active?: boolean
          subscription_tier?: string
          subscription_status?: string
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          chatbot_id: string
          user_id: string | null
          session_id: string | null
          visitor_id: string | null
          visitor_name: string | null
          visitor_email: string | null
          status: string
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          rating: number | null
          feedback: string | null
          lead_data: Json | null
          metadata: Json
        }
        Insert: {
          id?: string
          chatbot_id: string
          user_id?: string | null
          session_id?: string | null
          visitor_id?: string | null
          visitor_name?: string | null
          visitor_email?: string | null
          status?: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          rating?: number | null
          feedback?: string | null
          lead_data?: Json | null
          metadata?: Json
        }
        Update: {
          id?: string
          chatbot_id?: string
          user_id?: string | null
          session_id?: string | null
          visitor_id?: string | null
          visitor_name?: string | null
          visitor_email?: string | null
          status?: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          rating?: number | null
          feedback?: string | null
          lead_data?: Json | null
          metadata?: Json
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender: string
          content: string
          message_type: string
          intent: string | null
          sentiment: string | null
          confidence: number | null
          metadata: Json
          timestamp: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender: string
          content: string
          message_type?: string
          intent?: string | null
          sentiment?: string | null
          confidence?: number | null
          metadata?: Json
          timestamp?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender?: string
          content?: string
          message_type?: string
          intent?: string | null
          sentiment?: string | null
          confidence?: number | null
          metadata?: Json
          timestamp?: string
        }
      }
      leads: {
        Row: {
          id: string
          chatbot_id: string
          user_id: string
          conversation_id: string | null
          name: string | null
          email: string | null
          phone: string | null
          interest: string | null
          budget: string | null
          timeline: string | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chatbot_id: string
          user_id: string
          conversation_id?: string | null
          name?: string | null
          email?: string | null
          phone?: string | null
          interest?: string | null
          budget?: string | null
          timeline?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chatbot_id?: string
          user_id?: string
          conversation_id?: string | null
          name?: string | null
          email?: string | null
          phone?: string | null
          interest?: string | null
          budget?: string | null
          timeline?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          chatbot_id: string
          user_id: string
          customer_name: string
          customer_email: string
          customer_phone: string | null
          service: string
          booking_date: string
          booking_time: string
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chatbot_id: string
          user_id: string
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          service: string
          booking_date: string
          booking_time: string
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chatbot_id?: string
          user_id?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          service?: string
          booking_date?: string
          booking_time?: string
          notes?: string | null
          status?: string
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
      payment_methods: {
        Row: {
          id: string
          method_name: string
          details: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          method_name: string
          details: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          method_name?: string
          details?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      pricing_plans: {
        Row: {
          id: string
          plan_name: string
          price: number
          features: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_name: string
          price: number
          features: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_name?: string
          price?: number
          features?: string
          is_active?: boolean
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