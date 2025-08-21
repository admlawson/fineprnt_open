import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export interface EditOrganization {
  id: string;
  name: string;
  domain: string;
  subscription_status: string | null;
  trial_ends_at: string | null;
  enterprise_features_enabled: boolean;
}

interface EditOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  org: EditOrganization | null;
  onSaved?: () => void;
}

export const EditOrganizationDialog: React.FC<EditOrganizationDialogProps> = ({
  open,
  onOpenChange,
  org,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [subscription, setSubscription] = useState<string | 'none'>('none');
  const [trialEndsAt, setTrialEndsAt] = useState<string>('');
  const [enterpriseEnabled, setEnterpriseEnabled] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

useEffect(() => {
    const load = async () => {
      if (open && org) {
        const { data, error } = await supabase
          .from('organizations')
          .select('name, domain, subscription_status, trial_ends_at, enterprise_features_enabled')
          .eq('id', org.id)
          .single();
        if (!error && data) {
          setName(data.name ?? '');
          setSubscription((data.subscription_status as any) ?? 'none');
          setTrialEndsAt(data.trial_ends_at ? data.trial_ends_at.substring(0, 10) : '');
          setEnterpriseEnabled(!!data.enterprise_features_enabled);
        } else {
          setName(org.name || '');
          setSubscription((org.subscription_status as any) || 'none');
          setTrialEndsAt(org.trial_ends_at ? org.trial_ends_at.substring(0, 10) : '');
          setEnterpriseEnabled(!!org.enterprise_features_enabled);
        }
      }
    };
    load();
  }, [open, org?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setSaving(true);
    try {
      const updates: any = {
        name,
        subscription_status: subscription === 'none' ? null : subscription,
        trial_ends_at: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
        enterprise_features_enabled: enterpriseEnabled,
      };
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', org.id);
      if (error) throw error;
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      console.error('Failed to save organization', err);
    } finally {
      setSaving(false);
    }
  };

  if (!org) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>
            Update organization details, trial or licenses.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subscription">Subscription</Label>
              <Select value={subscription} onValueChange={(v) => setSubscription(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subscription" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trialEnds">Trial ends at</Label>
              <Input
                id="trialEnds"
                type="date"
                value={trialEndsAt}
                onChange={(e) => setTrialEndsAt(e.target.value)}
                disabled={subscription !== 'trial'}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Enterprise features</div>
              <div className="text-sm text-muted-foreground">Enable enterprise-only capabilities</div>
            </div>
            <Switch checked={enterpriseEnabled} onCheckedChange={setEnterpriseEnabled} />
          </div>

          <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
            <div>
              <div className="text-sm text-muted-foreground">Domain</div>
              <div className="font-mono text-sm">{org.domain}</div>
            </div>
            <Badge variant="outline">Org ID: {org.id.slice(0, 8)}…</Badge>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
