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
      payment_items: {
        Row: {
          id: string
          user_id: string
          description: string
          amount: number
          type: 'expense' | 'revenue'
          due_date: string
          category: string
          priority: 'low' | 'medium' | 'high' | 'critical'
          notes: string | null
          created_at: string
          updated_at: string
          is_paid: boolean
          paid_date: string | null
          recurring_expense_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          amount: number
          type?: 'expense' | 'revenue'
          due_date: string
          category: string
          priority: 'low' | 'medium' | 'high' | 'critical'
          notes?: string | null
          created_at?: string
          updated_at?: string
          is_paid?: boolean
          paid_date?: string | null
          recurring_expense_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          amount?: number
          type?: 'expense' | 'revenue'
          due_date?: string
          category?: string
          priority?: 'low' | 'medium' | 'high' | 'critical'
          notes?: string | null
          created_at?: string
          updated_at?: string
          is_paid?: boolean
          paid_date?: string | null
          recurring_expense_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_items_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_financials: {
        Row: {
          id: string
          user_id: string
          available_funds: number
          savings_reserve: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          available_funds?: number
          savings_reserve?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          available_funds?: number
          savings_reserve?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_financials_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      recurring_expenses: {
        Row: {
          id: string
          user_id: string
          description: string
          amount: number
          type: 'expense' | 'revenue'
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'
          frequency_config: Json
          day_of_month: number | null
          priority: 'low' | 'medium' | 'high' | 'critical'
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          amount: number
          type?: 'expense' | 'revenue'
          frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'
          frequency_config?: Json
          day_of_month?: number | null
          priority: 'low' | 'medium' | 'high' | 'critical'
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          amount?: number
          type?: 'expense' | 'revenue'
          frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'
          frequency_config?: Json
          day_of_month?: number | null
          priority?: 'low' | 'medium' | 'high' | 'critical'
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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


