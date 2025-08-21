import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformMetrics {
  total_organizations: number;
  active_organizations: number;
  enterprise_orgs: number;
  trials_active: number;
  trials_expiring_7d: number;
  suspended_orgs: number;
  total_users: number;
  active_users: number;
  total_documents: number;
  total_vectors: number;
  jobs_queued: number;
  jobs_running: number;
  jobs_done: number;
  jobs_error: number;
  last_updated: string;
}

export interface OrgAggregate {
  id: string;
  name: string;
  domain: string;
  subscription_status: string | null;
  trial_ends_at: string | null;
  status: string;
  created_at: string;
  users_count: number;
  active_users_count: number;
  documents_count: number;
  vectors_count: number;
  last_doc_at: string | null;
  jobs_running: number;
  jobs_error: number;
}

export interface RecentLogin { user_id: string; email: string; last_sign_in_at: string | null; created_at: string; }
export interface RecentChat { id: string; title: string; user_id: string; user_email: string | null; org_id: string; message_count: number; updated_at: string; document_id: string | null; }
export interface RecentDocument { id: string; org_id: string; filename: string; status: string; created_at: string; mime_type: string | null; file_size: number | null; }
export interface PendingInvite { id: string; organization_id: string; organization_name: string; email: string; role: string; created_at: string; expires_at: string | null; }

export function usePlatformAdminData(search?: string) {
  const results = useQueries({
    queries: [
      {
        queryKey: ['platform-metrics'],
        queryFn: async (): Promise<PlatformMetrics | null> => {
          const { data, error } = await supabase.rpc('get_platform_overview_metrics');
          if (error) throw error;
          return data?.[0] ?? null;
        },
      },
      {
        queryKey: ['recent-logins'],
        queryFn: async (): Promise<RecentLogin[]> => {
          const { data, error } = await supabase.rpc('get_recent_logins', { p_limit: 20 });
          if (error) throw error;
          return data ?? [];
        },
      },
      {
        queryKey: ['recent-chats'],
        queryFn: async (): Promise<RecentChat[]> => {
          const { data, error } = await supabase.rpc('get_recent_chat_sessions', { p_limit: 20 });
          if (error) throw error;
          return data ?? [];
        },
      },
      {
        queryKey: ['recent-documents'],
        queryFn: async (): Promise<RecentDocument[]> => {
          const { data, error } = await supabase.rpc('get_recent_documents', { p_limit: 20 });
          if (error) throw error;
          return data ?? [];
        },
      },
      {
        queryKey: ['pending-invitations'],
        queryFn: async (): Promise<PendingInvite[]> => {
          const { data, error } = await supabase.rpc('get_pending_invitations', { p_limit: 20 });
          if (error) throw error;
          return data ?? [];
        },
      },
      {
        queryKey: ['orgs-aggregates', search ?? ''],
        queryFn: async (): Promise<OrgAggregate[]> => {
          const { data, error } = await supabase.rpc('get_organizations_with_aggregates', {
            p_limit: 100,
            p_search: search ?? null,
          });
          if (error) throw error;
          return data ?? [];
        },
      },
    ],
  });

  const [metricsQ, loginsQ, chatsQ, docsQ, invitesQ, orgsQ] = results;

  const loading = results.some(r => r.isLoading);
  const error = results.find(r => r.error)?.error as unknown as Error | undefined;

  return useMemo(() => ({
    metrics: metricsQ.data ?? null,
    recentLogins: loginsQ.data ?? [],
    recentChats: chatsQ.data ?? [],
    recentDocs: docsQ.data ?? [],
    pendingInvites: invitesQ.data ?? [],
    orgs: orgsQ.data ?? [],
    loading,
    error,
  }), [metricsQ.data, loginsQ.data, chatsQ.data, docsQ.data, invitesQ.data, orgsQ.data, loading, error]);
}
