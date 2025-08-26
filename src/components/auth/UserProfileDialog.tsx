import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building, ImagePlus, Loader2, Mail, Phone, User, Briefcase } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { functionUrl } from '@/lib/supabaseEndpoints';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAvatarUpdate?: (avatarPath: string | null) => void;
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  open,
  onOpenChange,
  onAvatarUpdate,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  // B2C: no domain/org logic

  // Avatar
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initial values snapshot for change detection
  const [initialized, setInitialized] = useState(false);
  const [creditSummary, setCreditSummary] = useState<{ starting_credits: number; credits_used: number; overage_units: number; credits_available: number; period_start: string; period_end: string } | null>(null);
  const [subscription, setSubscription] = useState<{ plan_key: string | null; status: string | null; period_start: string | null; period_end: string | null } | null>(null);
  const initialSnapshot = useRef({
    displayName: '',
    email: '',
    title: '',
    phone: '',
    bio: '',
    avatarPath: null as string | null,
  });

  const userInitials = useMemo(() => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  const validateDisplayName = (name: string) => name.trim().length >= 2;
  const validateEmail = (email: string) => /.+@.+\..+/.test(email);

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch profile
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, title, phone, bio, avatar_path')
        .eq('id', user.id)
        .maybeSingle();
      // If profiles table is missing, fall back gracefully
      if (error && (error as any).code !== 'PGRST116') {
        console.warn('Profiles table not found; using auth metadata only');
      }

      const effectiveDisplayName = data?.display_name || user.name || '';
      setDisplayName(effectiveDisplayName);
      setNewEmail(user.email);
      setTitle(data?.title || '');
      setPhone(data?.phone || '');
      setBio(data?.bio || '');
      setAvatarPath(data?.avatar_path || null);

      // Snapshot for change detection
      initialSnapshot.current = {
        displayName: effectiveDisplayName,
        email: user.email,
        title: data?.title || '',
        phone: data?.phone || '',
        bio: data?.bio || '',
        avatarPath: data?.avatar_path || null,
      };

      // Generate a signed URL for current avatar if present
      if (data?.avatar_path) {
        await generateAvatarUrl(data.avatar_path);
        // Notify parent component about current avatar
        onAvatarUpdate?.(data.avatar_path);
      } else {
        setAvatarUrl(null);
        // Notify parent component that no avatar exists
        onAvatarUpdate?.(null);
      }

      setInitialized(true);
      // Load credit summary and subscription status (best-effort)
      // Note: These tables may not be in TypeScript types yet
      try {
        // Use raw SQL for now until types are updated
        const { data: credit } = await supabase.rpc('get_credit_summary', { p_user_id: user.id });
        if (credit && Array.isArray(credit) && credit.length > 0) {
          const row = credit[0];
          setCreditSummary({
            starting_credits: Number(row.starting_credits ?? 0),
            credits_used: Number(row.credits_used ?? 0),
            overage_units: Number(row.overage_units ?? 0),
            credits_available: Number(row.credits_available ?? 0),
            period_start: row.period_start ?? null,
            period_end: row.period_end ?? null,
          });
        }
      } catch (err) {
        console.warn('get_credit_summary not available yet');
      }
      
      try {
        // Use raw SQL for subscription data
        const { data: subData } = await supabase.rpc('get_user_subscription', { p_user_id: user.id });
        if (subData && Array.isArray(subData) && subData.length > 0) {
          const row = subData[0];
          setSubscription({
            plan_key: row.plan_key ?? null,
            status: row.status ?? null,
            period_start: row.current_period_start ?? null,
            period_end: row.current_period_end ?? null,
          });
        }
      } catch (err) {
        console.warn('get_user_subscription not available yet');
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Failed to load profile.',
        variant: 'destructive',
      });
    }
  }, [toast, user]);

  // Generate avatar URL helper function
  const generateAvatarUrl = useCallback(async (avatarPath: string) => {
    try {
      const { data: signed, error: signErr } = await supabase.storage
        .from('avatars')
        .createSignedUrl(avatarPath, 60 * 60); // 1 hour
      if (!signErr && signed?.signedUrl) {
        setAvatarUrl(signed.signedUrl);
      } else {
        console.warn('Failed to generate avatar URL:', signErr);
        setAvatarUrl(null);
      }
    } catch (error) {
      console.error('Error generating avatar URL:', error);
      setAvatarUrl(null);
    }
  }, []);

  // Load avatar URL when component mounts or avatar path changes
  useEffect(() => {
    if (avatarPath) {
      generateAvatarUrl(avatarPath);
    }
  }, [avatarPath, generateAvatarUrl]);

  useEffect(() => {
    if (open) {
      setInitialized(false);
      setUploadProgress(0);
      loadProfile();
    }
  }, [open, loadProfile]);

  // No domain-based behavior in B2C

  const handleAvatarFile = useCallback(
    async (file: File) => {
      if (!user) return;

      // Validate file
      const allowed = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowed.includes(file.type)) {
        toast({
          title: 'Unsupported format',
          description: 'Please upload a PNG, JPG, or WEBP image.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Max size is 2MB.',
          variant: 'destructive',
        });
        return;
      }

      try {
        setUploading(true);
        setUploadProgress(5);

        // Compress/resize
        const compressed = await imageCompression(file, {
          maxSizeMB: 1.8,
          maxWidthOrHeight: 512,
          useWebWorker: true,
          initialQuality: 0.8,
          onProgress: (p) => setUploadProgress(Math.min(90, p)),
        });

        // Determine extension
        const ext = (compressed.type || file.type).split('/')[1] || 'png';
        const path = `${user.id}/avatar.${ext}`;

        // Upload (upsert)
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, compressed, {
            cacheControl: '3600',
            upsert: true,
            contentType: compressed.type || file.type,
          });
        if (upErr) throw upErr;

        setUploadProgress(95);

        // Update profile with avatar_path
        const { error: updErr } = await supabase
          .from('profiles')
          .update({ avatar_path: path })
          .eq('id', user.id);
        if (updErr) throw updErr;

        setAvatarPath(path);

        // Generate signed URL for preview
        await generateAvatarUrl(path);
        
        // Notify parent component about avatar update
        onAvatarUpdate?.(path);

        setUploadProgress(100);
        toast({ title: 'Profile photo updated' });
      } catch (err: any) {
        console.error(err);
        toast({
          title: 'Upload failed',
          description: err?.message || 'Could not upload avatar.',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 800);
      }
    },
    [toast, user]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (uploading) return;
      const file = e.dataTransfer.files?.[0];
      if (file) void handleAvatarFile(file);
    },
    [handleAvatarFile, uploading]
  );

  const onSelectFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleAvatarFile(file);
      // reset to allow selecting the same file again
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleAvatarFile]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updates: Record<string, any> = {};
    if (displayName !== initialSnapshot.current.displayName) updates.display_name = displayName.trim();
    if (title !== initialSnapshot.current.title) updates.title = title;
    if (phone !== initialSnapshot.current.phone) updates.phone = phone;
    if (bio !== initialSnapshot.current.bio) updates.bio = bio;

    if (!validateDisplayName(displayName)) {
      toast({
        title: 'Invalid name',
        description: 'Display name must be at least 2 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateEmail(newEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Update profile fields
      if (Object.keys(updates).length > 0) {
        const { error: updErr } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
        if (updErr) throw updErr;
      }

      // Update email if changed
      if (newEmail !== initialSnapshot.current.email) {
        if (!currentPassword.trim()) {
          throw new Error('Current password is required to change email.');
        }
        // Re-authenticate to verify password
        const { error: reauthErr } = await supabase.auth.signInWithPassword({
          email: initialSnapshot.current.email,
          password: currentPassword,
        });
        if (reauthErr) throw new Error('Incorrect password. Please try again.');

        const { error: emailErr } = await supabase.auth.updateUser({ email: newEmail });
        if (emailErr) throw emailErr;

        // B2C: no org reassignment

        toast({
          title: 'Confirm your email change',
          description: 'We sent confirmation links to your old and new email. Changes take effect after confirmation.',
        });
      }

      toast({ title: 'Profile updated successfully' });
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openStripePortal = async () => {
    try {
      const res = await fetch(functionUrl('stripe-portal'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabase.auth.getSession ? (await supabase.auth.getSession()).data.session?.access_token : ''}` },
      });
      const json = await res.json();
      if (json?.url) {
        window.location.href = json.url;
      } else {
        throw new Error(json?.error || 'Failed to open portal');
      }
    } catch (err: any) {
      toast({ title: 'Portal error', description: err?.message || 'Unable to open billing portal', variant: 'destructive' });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <User size={18} className="sm:w-5 sm:h-5" />
            User Profile
          </DialogTitle>
          <DialogDescription className="text-sm">
            Manage your profile information and preferences.
          </DialogDescription>
        </DialogHeader>

        {/* Subscription & Credits */}
        <div className="p-3 sm:p-4 rounded-lg bg-muted/50 mb-4 text-sm">
          {(creditSummary || subscription) ? (
            <div className="flex flex-col gap-2 sm:gap-3">
              {subscription && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-medium capitalize">{subscription.plan_key || 'no plan'}</span>
                  <span className="text-xs rounded px-2 py-1 bg-secondary text-secondary-foreground capitalize w-fit">{subscription.status || 'inactive'}</span>
                  {subscription.period_end && (
                    <span className="text-muted-foreground text-xs">renews {new Date(subscription.period_end).toLocaleDateString()}</span>
                  )}
                </div>
              )}
              {creditSummary && (creditSummary.starting_credits + creditSummary.overage_units > 0 || creditSummary.credits_available >= 0) && (
                <>
                  <div className="text-sm">
                    Credits available: <span className="font-medium">{Number(creditSummary.credits_available ?? 0)}</span> / {Number(creditSummary.starting_credits ?? 0) + Number(creditSummary.overage_units ?? 0)}
                  </div>
                  {(creditSummary.period_start || creditSummary.period_end) && (
                    <div className="text-muted-foreground text-xs">
                      Period: {creditSummary.period_start ? new Date(creditSummary.period_start).toLocaleDateString() : '—'} → {creditSummary.period_end ? new Date(creditSummary.period_end).toLocaleDateString() : '—'}
                    </div>
                  )}
                </>
              )}
              <div className="flex flex-col gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={openStripePortal} className="w-full h-11 text-sm">Manage Billing</Button>
                {subscription?.plan_key && (
                  <Button size="sm" variant="outline" onClick={openStripePortal} className="w-full h-11 text-sm">Manage Subscription</Button>
                )}
                <Button size="sm" onClick={async () => {
                  try {
                    const token = (await supabase.auth.getSession()).data.session?.access_token;
                    const res = await fetch(functionUrl('stripe-checkout'), {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'credit', quantity: 1 })
                    });
                    const json = await res.json();
                    if (json?.url) window.location.href = json.url; else throw new Error(json?.error || 'Failed to start checkout');
                  } catch (err: any) {
                    toast({ title: 'Checkout error', description: err?.message || 'Unable to buy credit', variant: 'destructive' });
                  }
                }} className="w-full h-11 text-sm">Buy one document ($12)</Button>
                {subscription?.plan_key !== 'pro' && (
                <Button size="sm" variant="secondary" onClick={async () => {
                  try {
                    const token = (await supabase.auth.getSession()).data.session?.access_token;
                    const res = await fetch(functionUrl('stripe-subscribe'), {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ plan: subscription?.plan_key ? 'pro' : undefined })
                    });
                    const json = await res.json();
                    if (json?.url) window.location.href = json.url; else throw new Error(json?.error || 'Failed to start subscription');
                  } catch (err: any) {
                    toast({ title: 'Subscription error', description: err?.message || 'Unable to start subscription', variant: 'destructive' });
                  }
                }} className="w-full h-11 text-sm">{subscription?.plan_key ? 'Upgrade to Pro' : 'Subscribe'}</Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription...
            </div>
          )}
        </div>

        {!initialized ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading profile...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="User avatar image" />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-base sm:text-lg" aria-label="User initials avatar">
                      {userInitials}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="w-full rounded-lg border border-dashed p-3 sm:p-4 text-center text-xs sm:text-sm cursor-pointer hover:bg-muted/50 transition-colors min-h-[60px] flex items-center justify-center"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload profile photo via click or drag and drop"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={onSelectFile}
                />
                <div className="flex items-center justify-center gap-2">
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Tap to select or drag an image (max 2MB)</span>
                      <span className="sm:hidden">Tap to select image (max 2MB)</span>
                    </>
                  )}
                </div>
                {uploading && (
                  <div className="mt-3">
                    <Progress value={uploadProgress} aria-label="Upload progress" />
                  </div>
                )}
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                aria-invalid={!validateDisplayName(displayName)}
                className="h-10 sm:h-11"
              />
              {!validateDisplayName(displayName) && (
                <p className="text-xs text-destructive">Must be at least 2 characters.</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="pl-10 h-10 sm:h-11"
                  placeholder="Enter your email"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Changing your email will require confirmation via email.
              </p>
              {newEmail !== initialSnapshot.current.email && (
                <div className="space-y-2 mt-3">
                  <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="h-10 sm:h-11"
                  />
                </div>
              )}
            </div>

            {/* Title and Phone */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium">
                  <Briefcase size={14} /> Job Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Compliance Officer"
                  className="h-10 sm:h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                  <Phone size={14} /> Phone Number
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +1 555 123 4567"
                  className="h-10 sm:h-11"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">Bio / Description</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a bit about your role..."
                className="min-h-[80px] sm:min-h-[100px] resize-none"
              />
            </div>

            {/* Role (Read-only) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>

            <DialogFooter className="flex-col-reverse gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading || uploading}
                className="w-full h-11"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || uploading || !validateDisplayName(displayName)} 
                className="w-full h-11"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> 
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
