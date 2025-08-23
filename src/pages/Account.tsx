import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserProfileDialog } from '@/components/auth/UserProfileDialog';
import { useToast } from '@/hooks/use-toast';
import { functionUrl } from '@/lib/supabaseEndpoints';
import { supabase } from '@/integrations/supabase/client';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      navigate('/app/documents');
    }
  }, [open, navigate]);

  // Handle successful subscription return from Stripe
  useEffect(() => {
    const subSuccess = searchParams.get('sub');
    if (subSuccess === 'success') {
      // Call sync function to update subscription data
      const syncSubscription = async () => {
        try {
          const token = (await supabase.auth.getSession()).data.session?.access_token;
          if (!token) return;

          const res = await fetch(functionUrl('sync-subscription'), {
            method: 'POST',
            headers: { 
              Authorization: `Bearer ${token}`, 
              'Content-Type': 'application/json' 
            },
          });

          if (res.ok) {
            const result = await res.json();
            if (result.success) {
              toast({
                title: 'Subscription activated!',
                description: `Your ${result.plan} plan is now active with ${result.credits} document credits.`,
              });
            } else {
              toast({
                title: 'Subscription sync failed',
                description: result.error || 'Please contact support if this persists.',
                variant: 'destructive',
              });
            }
          } else {
            toast({
              title: 'Subscription sync failed',
              description: 'Unable to sync subscription data. Please refresh the page.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Error syncing subscription:', error);
          toast({
            title: 'Subscription sync failed',
            description: 'Please refresh the page to see your updated subscription.',
            variant: 'destructive',
          });
        }
      };

      syncSubscription();
    }
  }, [searchParams, toast]);

  return (
    <UserProfileDialog open={open} onOpenChange={setOpen} />
  );
};

export default AccountPage;


