import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          avatar_url: string | null;
          role: 'guest' | 'user' | 'admin';
          reputation: number;
          questions_answered: number;
          badge: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          avatar_url?: string | null;
          role?: 'guest' | 'user' | 'admin';
          reputation?: number;
          questions_answered?: number;
          badge?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          avatar_url?: string | null;
          role?: 'guest' | 'user' | 'admin';
          reputation?: number;
          questions_answered?: number;
          badge?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          title: string;
          description: string;
          tags: string[];
          author_id: string;
          votes: number;
          views: number;
          accepted_answer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          tags: string[];
          author_id: string;
          votes?: number;
          views?: number;
          accepted_answer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          tags?: string[];
          author_id?: string;
          votes?: number;
          views?: number;
          accepted_answer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      answers: {
        Row: {
          id: string;
          content: string;
          question_id: string;
          author_id: string;
          votes: number;
          is_accepted: boolean;
          is_ai_generated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          question_id: string;
          author_id: string;
          votes?: number;
          is_accepted?: boolean;
          is_ai_generated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          question_id?: string;
          author_id?: string;
          votes?: number;
          is_accepted?: boolean;
          is_ai_generated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          target_id: string;
          target_type: 'question' | 'answer';
          value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_id: string;
          target_type: 'question' | 'answer';
          value: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_id?: string;
          target_type?: 'question' | 'answer';
          value?: number;
          created_at?: string;
        };
      };
    };
  };
};