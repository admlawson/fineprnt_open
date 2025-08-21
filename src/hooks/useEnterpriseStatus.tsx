import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EnterpriseStatus {
  subscription_status: 'active' | 'past_due' | 'canceled' | 'incomplete' | null;
  has_access: boolean;
  isLoading: boolean;
}

export function useEnterpriseStatus(): EnterpriseStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<EnterpriseStatus>({
    subscription_status: null,
    has_access: false,
    isLoading: true,
  });

  useEffect(() => {
    if (!user?.id) { setStatus(prev => ({ ...prev, isLoading: false })); return; }

    const fetchEnterpriseStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        const statusVal = (data as any)?.status ?? null;
        setStatus({
          subscription_status: statusVal,
          has_access: statusVal === 'active',
          isLoading: false,
        });
      } catch (error) {
        console.error('Error in fetchEnterpriseStatus:', error);
        setStatus(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchEnterpriseStatus();
  }, [user?.id]);

  return status;
}