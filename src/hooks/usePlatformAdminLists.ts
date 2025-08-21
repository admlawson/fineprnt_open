import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUserRow {
  id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
  orgs_count: number;
  active_orgs_count: number;
}

export function useAdminUsers(search?: string, limit: number = 100) {
  return useQuery({
    queryKey: ['admin-users', search ?? '', limit],
    queryFn: async (): Promise<AdminUserRow[]> => {
      const { data, error } = await supabase.rpc('get_users_admin', {
        p_limit: limit,
        p_search: search ?? null,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface AdminDocumentRow {
  id: string;
  org_id: string;
  org_name: string;
  filename: string;
  status: string | null;
  created_at: string;
  mime_type: string | null;
  file_size: number | null;
}

export function useAdminDocuments(search?: string, status?: string | null, limit: number = 100) {
  return useQuery({
    queryKey: ['admin-documents', search ?? '', status ?? '', limit],
    queryFn: async (): Promise<AdminDocumentRow[]> => {
      const { data, error } = await supabase.rpc('get_documents_admin', {
        p_limit: limit,
        p_search: search ?? null,
        p_status: status ?? null,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface AdminChatSessionRow {
  id: string;
  title: string | null;
  user_id: string;
  user_email: string | null;
  org_id: string;
  org_name: string | null;
  message_count: number;
  updated_at: string;
  document_id: string | null;
}

export function useAdminChats(search?: string, orgId?: string | null, userId?: string | null, limit: number = 100) {
  return useQuery({
    queryKey: ['admin-chats', search ?? '', orgId ?? '', userId ?? '', limit],
    queryFn: async (): Promise<AdminChatSessionRow[]> => {
      const { data, error } = await supabase.rpc('get_chat_sessions_admin', {
        p_limit: limit,
        p_search: search ?? null,
        p_org_id: orgId ?? null,
        p_user_id: userId ?? null,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface AdminProcessingJobRow {
  id: string;
  document_id: string;
  filename: string | null;
  org_id: string;
  org_name: string | null;
  stage: string;
  status: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export function useAdminProcessingJobs(status?: string | null, stage?: string | null, orgId?: string | null, limit: number = 100) {
  return useQuery({
    queryKey: ['admin-processing-jobs', status ?? '', stage ?? '', orgId ?? '', limit],
    queryFn: async (): Promise<AdminProcessingJobRow[]> => {
      const { data, error } = await supabase.rpc('get_processing_jobs_admin', {
        p_limit: limit,
        p_status: status ?? null,
        p_stage: stage ?? null,
        p_org_id: orgId ?? null,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface AdminTrialOrgRow {
  id: string;
  name: string;
  domain: string;
  trial_ends_at: string;
  days_remaining: number;
  owner_id: string | null;
}

export function useAdminTrialOrgs(expiringDays?: number | null, limit: number = 100) {
  return useQuery({
    queryKey: ['admin-trial-orgs', expiringDays ?? '', limit],
    queryFn: async (): Promise<AdminTrialOrgRow[]> => {
      const { data, error } = await supabase.rpc('get_trial_orgs_admin', {
        p_limit: limit,
        p_expiring_days: expiringDays ?? null,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}
