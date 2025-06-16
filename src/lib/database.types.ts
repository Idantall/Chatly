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
      chats: {
        Row: {
          id: string
          created_at: string
          title: string | null
          user_id: string
          persona: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          title?: string | null
          user_id: string
          persona?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string | null
          user_id?: string
          persona?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          created_at: string
          chat_id: string
          content: string
          role: string
        }
        Insert: {
          id?: string
          created_at?: string
          chat_id: string
          content: string
          role: string
        }
        Update: {
          id?: string
          created_at?: string
          chat_id?: string
          content?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            referencedRelation: "chats"
            referencedColumns: ["id"]
          }
        ]
      }
      rulebook: {
        Row: {
          id: string
          created_at: string
          user_id: string
          chat_id: string | null
          message_id: string | null
          feedback_type: string | null
          original_content: string | null
          new_content: string | null
          name: string
          rules: Json
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          chat_id?: string | null
          message_id?: string | null
          feedback_type?: string | null
          original_content?: string | null
          new_content?: string | null
          name: string
          rules: Json
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          chat_id?: string | null
          message_id?: string | null
          feedback_type?: string | null
          original_content?: string | null
          new_content?: string | null
          name?: string
          rules?: Json
        }
        Relationships: [
          {
            foreignKeyName: "rulebook_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      api_keys: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          key: string
          enabled: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          key: string
          enabled?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          key?: string
          enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
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
  }
}
