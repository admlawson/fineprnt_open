import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { functionUrl } from '@/lib/supabaseEndpoints';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export const SubscriptionStartDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const goSubscribe = async (plan: 'basic' | 'pro') => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(functionUrl('stripe-subscribe'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (json?.url) window.location.href = json.url;
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose your plan</DialogTitle>
          <DialogDescription>Subscribe to unlock document processing and unlimited chat.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 w-full md:grid-cols-2">
          <Card className="border-primary/30">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Basic</CardTitle>
              <CardDescription>1 document/month • Unlimited chat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-center">
              <div className="text-2xl font-semibold">$40<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <Button className="w-full" onClick={() => goSubscribe('basic')}>Subscribe to Basic</Button>
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
              <Button className="w-full" onClick={() => goSubscribe('pro')}>Subscribe to Pro</Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};


