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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          sequence_number: number
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          sequence_number: number
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          sequence_number?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          document_id: string
          id: string
          message_count: number
          org_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          message_count?: number
          org_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          message_count?: number
          org_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_text: {
        Row: {
          created_at: string | null
          document_id: string
          markdown: string | null
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          markdown?: string | null
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          markdown?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_text_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_vectors: {
        Row: {
          chunk_order: number
          content: string
          created_at: string | null
          document_id: string
          embedding: string | null
          id: number
          metadata: Json | null
          page_number: number | null
        }
        Insert: {
          chunk_order: number
          content: string
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: number
          metadata?: Json | null
          page_number?: number | null
        }
        Update: {
          chunk_order?: number
          content?: string
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: number
          metadata?: Json | null
          page_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_vectors_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_size: number | null
          filename: string
          id: string
          metadata: Json | null
          mime_type: string | null
          org_id: string
          sha256: string
          status: string | null
          storage_path: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          filename: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          org_id: string
          sha256: string
          status?: string | null
          storage_path?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          org_id?: string
          sha256?: string
          status?: string | null
          storage_path?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          metadata: Json | null
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invitation_status"] | null
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          metadata?: Json | null
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"] | null
          token?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          metadata?: Json | null
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"] | null
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          metadata: Json | null
          method: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          metadata?: Json | null
          method?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          metadata?: Json | null
          method?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          domain: string
          enterprise_features_enabled: boolean | null
          id: string
          name: string
          owner_id: string | null
          sales_contact_info: Json | null
          settings: Json | null
          status: Database["public"]["Enums"]["organization_status"] | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          enterprise_features_enabled?: boolean | null
          id?: string
          name: string
          owner_id?: string | null
          sales_contact_info?: Json | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["organization_status"] | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          enterprise_features_enabled?: boolean | null
          id?: string
          name?: string
          owner_id?: string | null
          sales_contact_info?: Json | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["organization_status"] | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          document_id: string
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          stage: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          document_id: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          stage: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          document_id?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          stage?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_organizations: {
        Row: {
          created_at: string | null
          id: string
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["membership_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["membership_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["membership_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_custom_invitation: {
        Args: { p_token: string }
        Returns: Json
      }
      accept_invitation: {
        Args: { p_token: string }
        Returns: Json
      }
      accept_invitations_for_current_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      auto_assign_user_to_domain_org: {
        Args: {
          suggested_org_name?: string
          user_email: string
          user_id: string
          user_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      ensure_membership_for_email_domain: {
        Args: { p_suggested_org_name?: string }
        Returns: Json
      }
      find_or_create_organization_by_domain: {
        Args: { suggested_name?: string; user_email: string }
        Returns: string
      }
      get_chat_messages_admin: {
        Args: { p_limit?: number; p_session_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
          role: string
          sequence_number: number
          session_id: string
        }[]
      }
      get_chat_sessions_admin: {
        Args: {
          p_limit?: number
          p_org_id?: string
          p_search?: string
          p_user_id?: string
        }
        Returns: {
          document_id: string
          id: string
          message_count: number
          org_id: string
          org_name: string
          title: string
          updated_at: string
          user_email: string
          user_id: string
        }[]
      }
      get_custom_invitation_details: {
        Args: { p_token: string }
        Returns: {
          email: string
          expires_at: string
          method: string
          organization_id: string
          organization_name: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }[]
      }
      get_documents_admin: {
        Args: { p_limit?: number; p_search?: string; p_status?: string }
        Returns: {
          created_at: string
          file_size: number
          filename: string
          id: string
          mime_type: string
          org_id: string
          org_name: string
          status: string
        }[]
      }
      get_invitation_details: {
        Args: { p_token: string }
        Returns: {
          email: string
          expires_at: string
          organization_id: string
          organization_name: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invitation_status"]
        }[]
      }
      get_org_admin_contact: {
        Args: { org_domain: string }
        Returns: {
          admin_email: string
          admin_name: string
        }[]
      }
      get_org_auth_preferences: {
        Args: { org_domain: string }
        Returns: {
          auth_method: string
          azure_ad_enabled: boolean
          default_auth_method: string
          email_password_enabled: boolean
          organization_id: string
          organization_name: string
        }[]
      }
      get_org_members: {
        Args: { p_org_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          email: string
          joined_at: string
          membership_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }[]
      }
      get_org_subscription_details: {
        Args: { org_uuid: string }
        Returns: {
          days_remaining: number
          enterprise_features_enabled: boolean
          has_access: boolean
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string
        }[]
      }
      get_organizations_with_aggregates: {
        Args: { p_limit?: number; p_search?: string }
        Returns: {
          active_users_count: number
          created_at: string
          documents_count: number
          domain: string
          id: string
          jobs_error: number
          jobs_running: number
          last_doc_at: string
          name: string
          status: Database["public"]["Enums"]["organization_status"]
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string
          users_count: number
          vectors_count: number
        }[]
      }
      get_pending_invitations: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          email: string
          expires_at: string
          id: string
          organization_id: string
          organization_name: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_platform_overview_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_organizations: number
          active_users: number
          enterprise_orgs: number
          jobs_done: number
          jobs_error: number
          jobs_queued: number
          jobs_running: number
          last_updated: string
          suspended_orgs: number
          total_documents: number
          total_organizations: number
          total_users: number
          total_vectors: number
          trials_active: number
          trials_expiring_7d: number
        }[]
      }
      get_processing_jobs_admin: {
        Args: {
          p_limit?: number
          p_org_id?: string
          p_stage?: string
          p_status?: string
        }
        Returns: {
          completed_at: string
          created_at: string
          document_id: string
          error_message: string
          filename: string
          id: string
          org_id: string
          org_name: string
          stage: string
          started_at: string
          status: string
        }[]
      }
      get_recent_chat_sessions: {
        Args: { p_limit?: number }
        Returns: {
          document_id: string
          id: string
          message_count: number
          org_id: string
          title: string
          updated_at: string
          user_email: string
          user_id: string
        }[]
      }
      get_recent_documents: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          file_size: number
          filename: string
          id: string
          mime_type: string
          org_id: string
          status: string
        }[]
      }
      get_recent_logins: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          email: string
          last_sign_in_at: string
          user_id: string
        }[]
      }
      get_trial_orgs_admin: {
        Args: { p_expiring_days?: number; p_limit?: number }
        Returns: {
          days_remaining: number
          domain: string
          id: string
          name: string
          owner_id: string
          trial_ends_at: string
        }[]
      }
      get_user_organizations: {
        Args: { user_uuid: string }
        Returns: {
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["membership_status"]
        }[]
      }
      get_users_admin: {
        Args: { p_limit?: number; p_search?: string }
        Returns: {
          active_orgs_count: number
          created_at: string
          email: string
          id: string
          last_sign_in_at: string
          orgs_count: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_enterprise_access: {
        Args: { org_uuid: string }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      hybrid_search: {
        Args: {
          match_count: number
          match_document_id: string
          match_threshold: number
          query_embedding: string
          query_text: string
          user_org_id: string
        }
        Returns: {
          content: string
          document_id: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      is_org_admin_or_owner: {
        Args: { org_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { org_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_platform_owner: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_document_chunks: {
        Args:
          | {
              match_count?: number
              match_document_id: string
              match_threshold?: number
              query_embedding: string
            }
          | {
              match_count?: number
              match_document_id: string
              match_threshold?: number
              query_embedding: string
              user_org_id: string
            }
        Returns: {
          chunk_order: number
          content: string
          document_id: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      reassign_user_org_on_email_change: {
        Args: { p_new_email: string; p_old_email: string; p_user_id: string }
        Returns: Json
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      verify_extension_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          extension_name: string
          is_secure: boolean
          schema_name: string
        }[]
      }
    }
    Enums: {
      app_role: "platform_owner" | "org_admin" | "org_user"
      invitation_status: "pending" | "accepted" | "declined" | "expired"
      membership_status: "active" | "invited" | "pending" | "suspended"
      organization_status: "active" | "pending" | "suspended"
      subscription_status: "trial" | "enterprise" | "suspended"
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
      app_role: ["platform_owner", "org_admin", "org_user"],
      invitation_status: ["pending", "accepted", "declined", "expired"],
      membership_status: ["active", "invited", "pending", "suspended"],
      organization_status: ["active", "pending", "suspended"],
      subscription_status: ["trial", "enterprise", "suspended"],
    },
  },
} as const
