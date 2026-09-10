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
      profile: {
        Row: {
          id: string
          created_at: string
          username: string | null
          aesthetic_id: string | null
        }
        Insert: {
          id: string
          created_at?: string
          username?: string | null
          aesthetic_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          username?: string | null
          aesthetic_id?: string | null
        }
        Relationships: []
      }
      piece: {
        Row: {
          id: string
          user_id: string
          name: string
          storage_path: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          storage_path: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          storage_path?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
