import { ReactNode } from 'react';
import { useEnterpriseStatus } from '@/hooks/useEnterpriseStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { functionUrl } from '@/lib/supabaseEndpoints';

interface SubscriptionGateProps {
  children: ReactNode;
  feature?: string;
  fallback?: ReactNode;
}

export function SubscriptionGate({ children, feature = 'this feature', fallback }: SubscriptionGateProps) {
  const { has_access, subscription_status, isLoading } = useEnterpriseStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (has_access) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="grid gap-6 w-full max-w-4xl md:grid-cols-2">
        <Card className="border-primary/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Basic</CardTitle>
            <CardDescription>1 document/month • Unlimited chat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-center">
            <div className="text-2xl font-semibold">$20<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <Button
              className="w-full"
              onClick={async () => {
                try {
                  const token = (await supabase.auth.getSession()).data.session?.access_token;
                  const res = await fetch(functionUrl('stripe-subscribe'), {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan: 'basic' }),
                  });
                  const json = await res.json();
                  if (json?.url) window.location.href = json.url;
                } catch {}
              }}
            >
              Subscribe
            </Button>
          </CardContent>
        </Card>
        <Card className="border-primary">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <CardTitle>Pro</CardTitle>
              <Badge>Most Popular</Badge>
            </div>
            <CardDescription>5 documents/month • Unlimited chat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-center">
            <div className="text-2xl font-semibold">$60<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <Button
              className="w-full"
              onClick={async () => {
                try {
                  const token = (await supabase.auth.getSession()).data.session?.access_token;
                  const res = await fetch(functionUrl('stripe-subscribe'), {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan: 'pro' }),
                  });
                  const json = await res.json();
                  if (json?.url) window.location.href = json.url;
                } catch {}
              }}
            >
              Upgrade
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}