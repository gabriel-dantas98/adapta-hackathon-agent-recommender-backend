export interface Database {
  public: {
    Tables: {
      solutions_owner: {
        Row: {
          id: string;
          company_id: string;
          company_name: string;
          domain: string | null;
          metadata: Record<string, any>;
          output_base_prompt: Record<string, any>;
          embeddings: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string;
          company_name: string;
          domain?: string | null;
          metadata: Record<string, any>;
          output_base_prompt: Record<string, any>;
          embeddings?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          company_name?: string;
          domain?: string | null;
          metadata?: Record<string, any>;
          output_base_prompt?: Record<string, any>;
          embeddings?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      solutions_owner_products: {
        Row: {
          id: string;
          product_id: string;
          owner_id: string | null;
          metadata: Record<string, any>;
          output_base_prompt: Record<string, any>;
          embeddings: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string;
          owner_id?: string | null;
          metadata: Record<string, any>;
          output_base_prompt: Record<string, any>;
          embeddings?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          owner_id?: string | null;
          metadata?: Record<string, any>;
          output_base_prompt?: Record<string, any>;
          embeddings?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      testing_users: {
        Row: {
          id: number;
          created_at: string;
        };
        Insert: {
          id?: never;
          created_at?: string;
        };
        Update: {
          id?: never;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          user_id: string;
          email: string;
          onboarding_completed: boolean;
          profile_metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
          message: string | null;
        };
        Insert: {
          user_id?: string;
          email: string;
          onboarding_completed?: boolean;
          profile_metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
          message?: string | null;
        };
        Update: {
          user_id?: string;
          email?: string;
          onboarding_completed?: boolean;
          profile_metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
          message?: string | null;
        };
      };
      users_chat_history: {
        Row: {
          id: number;
          session_id: string;
          message: Record<string, any>;
        };
        Insert: {
          id?: number;
          session_id: string;
          message: Record<string, any>;
        };
        Update: {
          id?: number;
          session_id?: string;
          message?: Record<string, any>;
        };
      };
      users_enhanced_context: {
        Row: {
          id: string;
          context_id: string;
          user_id: string;
          metadata: Record<string, any>;
          output_base_prompt: Record<string, any>;
          embeddings: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          context_id?: string;
          user_id: string;
          metadata: Record<string, any>;
          output_base_prompt: Record<string, any>;
          embeddings?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          context_id?: string;
          user_id?: string;
          metadata?: Record<string, any>;
          output_base_prompt?: Record<string, any>;
          embeddings?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
