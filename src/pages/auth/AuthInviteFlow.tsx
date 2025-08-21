import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { extractDomainFromEmail } from '@/lib/utils';
import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';
import { UserPlus, Building2, Shield } from 'lucide-react';

interface OrganizationAuthSettings {
  organization_id: string;
  organization_name: string;
  auth_method: string;
  azure_ad_enabled: boolean;
  email_password_enabled: boolean;
  default_auth_method: string;
}

export default function AuthInviteFlow() {
  const navigate = useNavigate();
  const { signInWithAzureAD } = useAuth();
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orgSettings, setOrgSettings] = useState<OrganizationAuthSettings | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'loading' | 'method_selection' | 'password_setup'>('loading');

  useEffect(() => {
    document.title = 'Complete Your Invitation - OmniClause';
    init();
  }, []);

  const init = async () => {
    try {
      setLoading(true);
      
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type');
      const token = urlParams.get('token');
      const error = urlParams.get('error');
      const completed = urlParams.get('completed');
      
      console.log('Auth flow params:', { type, hasToken: !!token, error, completed });

      // FIRST: Check for error parameter - if present, don't proceed with auth
      if (error) {
        console.log('Error in URL parameters, stopping auth flow:', error);
        
        // Handle specific Azure AD errors with user-friendly messages
        if (error === 'server_error') {
          const errorDescription = urlParams.get('error_description');
          if (errorDescription?.includes('Error getting user email from external provider')) {
            setError('Unable to retrieve your email from Azure AD. This may be due to missing permissions. Please contact your administrator for assistance.');
          } else {
            setError('Authentication failed. Please try again or contact your administrator for assistance.');
          }
        } else {
          setError(`Authentication error: ${error}. Please try again or contact your administrator.`);
        }
        
        setLoading(false);
        return;
      }
      
      // Check if user is already authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('User already authenticated');
        
        // Check if user needs to set up password (newly authenticated from email invitation)
        const fromEmailAuth = localStorage.getItem('from_email_auth');
        const invitationToken = urlParams.get('invitation_token') || localStorage.getItem('invitation_token');
        
        if (fromEmailAuth && invitationToken) {
          console.log('User authenticated from email invitation, forcing password setup');
          localStorage.removeItem('from_email_auth');
          setUserEmail(session.user.email || '');
          setStep('password_setup');
          setLoading(false);
          return;
        }
        
        // If this is a completed flow, proceed with acceptance
        if (completed === 'true' || (type === 'azure_ad' && token)) {
          await acceptInvitationAndRedirect();
          return;
        }
        
        // Otherwise, still try to accept any pending invitations
        await acceptInvitationAndRedirect();
        return;
      }

      if (type === 'azure_ad' && token) {
        console.log('Handling custom Azure AD invitation');
        await handleCustomAzureInvitation(token);
        return;
      }
      
      if (type === 'azure_invite' && token) {
        console.log('Handling Azure invitation via recovery');
        await handleAzureInvitationFromRecovery(token);
        return;
      }
      
      // Check for regular invitation token
      const invitationToken = urlParams.get('invitation_token') || localStorage.getItem('invitation_token');
      
      if (invitationToken) {
        console.log('Found invitation token, fetching details');
        localStorage.setItem('invitation_token', invitationToken);
        
        const { data, error } = await supabase.rpc('get_invitation_details', {
          p_token: invitationToken
        });
        
        if (error || !data || data.length === 0) {
          console.error('Error fetching invitation details:', error);
          setError('Invalid or expired invitation link');
          return;
        }
        
        const invitation = data[0];
        setUserEmail(invitation.email);
        console.log('Invitation details:', invitation);
        
        // Set session ready for valid regular invitation
        setSessionReady(true);
        return;
      }
      
      const email = urlParams.get('email');
      if (email) {
        setUserEmail(email);
      } else {
        setError('No invitation found. Please check your invitation link.');
      }
      
    } catch (err) {
      console.error('Session initialization error:', err);
      setError('Failed to initialize invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAzureInvitation = async (token: string) => {
    try {
      console.log('Processing custom Azure AD invitation with token:', token);
      
      // Fetch custom invitation details
      const { data, error } = await supabase.rpc('get_custom_invitation_details', {
        p_token: token
      });
      
      if (error || !data || data.length === 0) {
        console.error('Error fetching custom invitation details:', error);
        setError('Invalid or expired invitation link');
        return;
      }
      
      const invitation = data[0];
      setUserEmail(invitation.email);
      console.log('Custom invitation details:', invitation);
      
      // Set session ready for valid custom Azure invitation
      setSessionReady(true);
      
      // Store token for later use
      localStorage.setItem('custom_invitation_token', token);
      
      // Start Azure sign-in flow immediately
      await handleAzureSignIn();
      
    } catch (error) {
      console.error('Error in handleCustomAzureInvitation:', error);
      setError('Failed to process Azure invitation. Please try again.');
    }
  };

  const handleAzureInvitation = async (token: string) => {
    try {
      setLoading(true);
      
      // Get invitation details
      const { data: inviteData, error: inviteError } = await supabase.rpc(
        'get_invitation_details',
        { p_token: token }
      );
      
      if (inviteError || !inviteData || inviteData.length === 0) {
        console.error('Invalid invitation token:', inviteError);
        setError('Invalid invitation link. Please contact your administrator for a new invitation.');
        setLoading(false);
        return;
      }
      
      const invitation = inviteData[0];
      
      // Check if invitation is expired
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        setError('This invitation has expired. Please contact your administrator for a new invitation.');
        setLoading(false);
        return;
      }
      
      setUserEmail(invitation.email);
      
      // Set session ready for valid Azure invitation
      setSessionReady(true);
      
      // Check if user is already signed in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User is already signed in, accept the invitation
        await acceptInvitationAndRedirect();
      } else {
        // Start Azure AD authentication with invitation context
        const inviteRedirectUrl = `${window.location.origin}/auth/hash#type=invite&token=${token}`;
        await signInWithAzureAD(invitation.email, inviteRedirectUrl);
      }
    } catch (err) {
      console.error('Azure invitation error:', err);
      setError('Failed to process invitation. Please try again.');
      setLoading(false);
    }
  };

  const handleAzureInvitationFromRecovery = async (token: string) => {
    try {
      setLoading(true);
      
      // Get invitation details
      const { data: inviteData, error: inviteError } = await supabase.rpc(
        'get_invitation_details',
        { p_token: token }
      );
      
      if (inviteError || !inviteData || inviteData.length === 0) {
        console.error('Invalid invitation token:', inviteError);
        setError('Invalid invitation link. Please contact your administrator for a new invitation.');
        setLoading(false);
        return;
      }
      
      const invitation = inviteData[0];
      
      // Check if invitation is expired
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        setError('This invitation has expired. Please contact your administrator for a new invitation.');
        setLoading(false);
        return;
      }
      
      setUserEmail(invitation.email);
      
      // Set session ready for valid Azure invitation from recovery
      setSessionReady(true);
      
      // For reauthentication-based Azure AD invitations, skip password setup and go directly to Azure AD
      console.log('Azure AD invitation from reauthentication email - redirecting to Azure AD');
      const inviteRedirectUrl = `${window.location.origin}/auth/complete-invite?token=${token}&type=azure_invite&completed=true`;
      await signInWithAzureAD(invitation.email, inviteRedirectUrl);
      
    } catch (err) {
      console.error('Azure invitation from recovery error:', err);
      setError('Failed to process invitation. Please try again.');
      setLoading(false);
    }
  };

  const acceptInvitationAndRedirect = async () => {
    try {
      console.log('Accepting invitations for current user');
      
      // Check for custom Azure invitation token from URL or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type');
      
      // Check for Azure AD type invitations using 'token' parameter
      let azureInviteToken = urlParams.get('azure_invite_token') || 
                            localStorage.getItem('custom_invitation_token');
      
      // Also check for 'token' parameter when type is azure_ad
      if (!azureInviteToken && type === 'azure_ad') {
        azureInviteToken = urlParams.get('token');
      }
      
      if (azureInviteToken) {
        console.log('Processing custom Azure invitation with token:', azureInviteToken);
        
        // Accept the custom Azure invitation
        const { data, error } = await supabase.rpc('accept_custom_invitation', {
          p_token: azureInviteToken
        });
        
        if (error) {
          console.error('Error accepting custom Azure invitation:', error);
          setError('Failed to accept invitation. Please contact your administrator.');
          return;
        }
        
        console.log('Custom Azure invitation accepted successfully:', data);
        
        // Clear the token from URL and localStorage
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        localStorage.removeItem('custom_invitation_token');
        
        // Redirect to app
        window.location.href = '/app';
        return;
      }
      
      // Handle regular invitations (native Supabase)
      const { data, error } = await supabase.rpc('accept_invitations_for_current_user');
      
      if (error) {
        console.error('Error accepting invitations:', error);
        setError('Failed to accept invitation. Please contact your administrator.');
        return;
      }
      
      console.log('Invitations accepted:', data);
      
      // Clear any stored invitation tokens
      localStorage.removeItem('invitation_token');
      
      // Redirect to the app
      window.location.href = '/app';
      
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('Failed to accept invitation. Please try again.');
    }
  };

  const handleAzureSignIn = async () => {
    try {
      setLoading(true);
      // For invitation flows, redirect back to complete-invite with type=invite parameter
      const inviteRedirectUrl = `${window.location.origin}/auth/hash#type=invite`;
      await signInWithAzureAD(userEmail, inviteRedirectUrl);
    } catch (err) {
      console.error('Azure AD sign-in error:', err);
      setError('Failed to sign in with Azure AD. Please try again.');
      setLoading(false);
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Navigate to app after successful password setup
      navigate('/app', { replace: true });
    } catch (err) {
      console.error('Password setup error:', err);
      setError('Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <div className="text-center">
        <Building2 className="mx-auto h-8 w-8 text-primary mb-2" />
        <h3 className="text-lg font-semibold">Welcome to {orgSettings?.organization_name}</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Choose how you'd like to sign in to your organization
        </p>
      </div>

      <div className="space-y-3">
        {orgSettings?.azure_ad_enabled && (
          <Button
            onClick={handleAzureSignIn}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            <Shield className="mr-2 h-4 w-4" />
            Continue with Azure AD
          </Button>
        )}

        {orgSettings?.email_password_enabled && (
          <>
            {orgSettings?.azure_ad_enabled && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>
            )}
            
            <Button
              onClick={() => setStep('password_setup')}
              disabled={loading}
              className="w-full"
              variant={orgSettings?.azure_ad_enabled ? "outline" : "default"}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Set up password
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const renderPasswordSetup = () => (
    <form onSubmit={handlePasswordSetup} className="space-y-4">
      <div className="text-center">
        <UserPlus className="mx-auto h-8 w-8 text-primary mb-2" />
        <h3 className="text-lg font-semibold">Set Your Password</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Create a secure password for your account
        </p>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={userEmail}
          disabled
          className="bg-muted"
        />
      </div>

      <div>
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          minLength={6}
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
          minLength={6}
        />
      </div>

      <Button
        type="submit"
        disabled={loading || !password || !confirmPassword}
        className="w-full"
      >
        {loading ? 'Setting up...' : 'Complete Setup'}
      </Button>

      {step === 'password_setup' && orgSettings?.azure_ad_enabled && (
        <Button
          type="button"
          onClick={() => setStep('method_selection')}
          variant="ghost"
          className="w-full"
        >
          ← Back to sign-in options
        </Button>
      )}
    </form>
  );

  if (loading && step === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <MarketingHeader />
        <div className="flex-1 flex items-center justify-center bg-secondary/30 px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Setting up your invitation...</p>
          </div>
        </div>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      <div className="flex-1 flex items-center justify-center bg-secondary/30 px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-medium">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Complete Your Invitation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!sessionReady && !loading ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Invalid invitation link. Please contact your administrator for a new invitation.
                  </AlertDescription>
                </Alert>
              ) : step === 'method_selection' ? (
                renderMethodSelection()
              ) : step === 'password_setup' ? (
                renderPasswordSetup()
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}