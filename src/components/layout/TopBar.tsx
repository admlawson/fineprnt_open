import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sun, Moon, Monitor, LogOut, CreditCard } from 'lucide-react';
import { UserProfileDialog } from '@/components/auth/UserProfileDialog';
import { SubscriptionStartDialog } from '@/components/auth/SubscriptionStartDialog';
import { supabase } from '@/integrations/supabase/client';
import { functionUrl } from '@/lib/supabaseEndpoints';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [credits, setCredits] = useState<{ available: number; total: number } | null>(null);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [showStartSub, setShowStartSub] = useState(false);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={16} />;
      case 'dark':
        return <Moon size={16} />;
      default:
        return <Monitor size={16} />;
    }
  };

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const { data } = await supabase.rpc('get_credit_summary');
        const row: any = Array.isArray(data) ? data?.[0] : data;
        if (row) {
          const start = Number(row.starting_credits || 0);
          const over = Number(row.overage_units || 0);
          const used = Number(row.credits_used || 0);
          setCredits({
            available: Math.max(0, start + over - used),
            total: start + over,
          });
        }
      } catch {}
    };
    const loadSub = async () => {
      try {
        const { data } = await supabase.from('user_subscriptions').select('status').eq('user_id', user?.id || '').maybeSingle();
        setSubStatus((data as any)?.status ?? null);
      } catch {}
    };
    loadCredits();
    loadSub();

    // Realtime: refresh credits when consumption events occur or credits table changes
    const channel = supabase
      .channel('credits-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'document_usage_log',
        filter: `user_id=eq.${user?.id || ''}`
      }, () => { loadCredits(); })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'document_credits',
        filter: `user_id=eq.${user?.id || ''}`
      }, () => { loadCredits(); })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'documents',
        filter: `user_id=eq.${user?.id || ''}`
      }, (payload) => {
        const newStatus = (payload as any)?.new?.status;
        if (newStatus === 'completed') {
          loadCredits();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-background">
      <div className="flex items-center space-x-4">
        {/* Breadcrumb or page title could go here */}
      </div>

      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              {getThemeIcon()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun size={16} className="mr-2" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon size={16} className="mr-2" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor size={16} className="mr-2" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {credits && (
                    <p className="text-xs text-muted-foreground">Credits: {credits.available}/{credits.total}</p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                Account
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (subStatus !== 'active') {
                    setShowStartSub(true);
                    return;
                  }
                  // already subscribed: open portal
                  (async () => {
                    try {
                      const token = (await supabase.auth.getSession()).data.session?.access_token;
                      const res = await fetch(functionUrl('stripe-portal'), { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                      const json = await res.json();
                      if (json?.url) window.location.href = json.url;
                    } catch {}
                  })();
                }}
              >
                <CreditCard size={16} className="mr-2" />
                {subStatus === 'active' ? 'Manage/Upgrade plan' : 'Start subscription'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut size={16} className="mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User Profile Dialog */}
        <UserProfileDialog 
          open={showProfileDialog} 
          onOpenChange={setShowProfileDialog} 
        />
        <SubscriptionStartDialog open={showStartSub} onOpenChange={setShowStartSub} />
      </div>
    </header>
  );
};