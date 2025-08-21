import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthHashHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthHashHandler: Component mounted');
    console.log('AuthHashHandler: Current URL:', window.location.href);
    console.log('AuthHashHandler: Hash:', window.location.hash);
    console.log('AuthHashHandler: Search params:', window.location.search);
    
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    if (!hash) {
      console.log('AuthHashHandler: No hash found, returning');
      return;
    }

    console.log('AuthHashHandler: Processing hash:', hash);
    
    // Fix malformed hash: replace multiple # symbols with & (except the first one)
    const normalizedHash = hash.replace(/#(?!^)/g, '&');
    console.log('AuthHashHandler: Normalized hash:', normalizedHash);
    
    const params = new URLSearchParams(normalizedHash);
    
    // Let Supabase handle the auth state change first
    let hasRedirected = false;
    
    const handleAuthStateChange = (event: string, session: any) => {
      console.log('AuthHashHandler: Auth state change:', event, session ? 'Session present' : 'No session');
      
      if (hasRedirected) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        hasRedirected = true;
        
        // Check for custom invitation token
        const customInvitationToken = localStorage.getItem('custom_invitation_token');
        if (customInvitationToken) {
          console.log('AuthHashHandler: Found custom invitation token after successful sign-in');
          localStorage.removeItem('custom_invitation_token');
          navigate(`/auth/complete-invite?token=${customInvitationToken}&type=azure_ad&completed=true`, { replace: true });
          return;
        }
        
        // Check type from params
        const type = params.get('type');
        const token = params.get('token');
        
        if (type === 'invite' && token) {
          navigate(`/auth/complete-invite?token=${token}&type=azure_invite&completed=true`, { replace: true });
        } else if (type === 'invite') {
          navigate('/auth/complete-invite?completed=true', { replace: true });
        } else if (type === 'recovery') {
          const redirectTo = params.get('redirect_to') || '';
          console.log('AuthHashHandler: Recovery flow with redirect_to:', redirectTo);
          
          // Check if this is an Azure invitation recovery flow
          if (redirectTo.includes('type=azure_invite')) {
            const redirectUrl = new URL(redirectTo);
            const recoveryToken = redirectUrl.searchParams.get('token');
            if (recoveryToken) {
              navigate(`/auth/complete-invite?token=${recoveryToken}&type=azure_invite&completed=true`, { replace: true });
              return;
            }
          }
          
          // Set flag for email authentication flow
          localStorage.setItem('from_email_auth', 'true');
          
          // For regular password recovery, redirect to new password page
          navigate('/auth/new-password', { replace: true });
        } else {
          navigate('/app', { replace: true });
        }
      }
    };
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    // Cleanup function to unsubscribe and handle fallback
    const cleanup = () => {
      subscription.unsubscribe();
      
      // Fallback if no auth state change occurs within 5 seconds
      if (!hasRedirected) {
        setTimeout(() => {
          if (!hasRedirected) {
            console.log('AuthHashHandler: No auth state change detected, falling back to manual handling');
            handleManualAuthProcess();
          }
        }, 5000);
      }
    };
    
    const handleManualAuthProcess = async () => {
      // Log all parameters for debugging
      console.log('AuthHashHandler: Hash parameters:');
      for (const [key, value] of params) {
        console.log(`  ${key}:`, value);
      }

      // Check for successful authentication with access_token
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const expiresAt = params.get('expires_at');
      
      if (accessToken) {
        console.log('AuthHashHandler: Found access token, establishing session manually');
        
        try {
          // Manually establish the Supabase session
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            console.error('AuthHashHandler: Error setting session:', error);
            navigate('/auth/code?type=email', { replace: true });
            return;
          }
          
          if (data.session?.user) {
            console.log('AuthHashHandler: Session established successfully');
            hasRedirected = true;
            
            // Check for custom invitation token
            const customInvitationToken = localStorage.getItem('custom_invitation_token');
            if (customInvitationToken) {
              console.log('AuthHashHandler: Found custom invitation token after manual session establishment');
              localStorage.removeItem('custom_invitation_token');
              navigate(`/auth/complete-invite?token=${customInvitationToken}&type=azure_ad&completed=true`, { replace: true });
              return;
            }
            
            // Check type from params for other invitation flows
            const type = params.get('type');
            const token = params.get('token');
            
            if (type === 'invite' && token) {
              navigate(`/auth/complete-invite?token=${token}&type=azure_invite&completed=true`, { replace: true });
            } else if (type === 'invite') {
              navigate('/auth/complete-invite?completed=true', { replace: true });
            } else if (type === 'recovery') {
              // Set flag for email authentication flow
              localStorage.setItem('from_email_auth', 'true');
              // For password recovery, redirect to new password page
              navigate('/auth/new-password', { replace: true });
            } else {
              navigate('/app', { replace: true });
            }
            return;
          }
        } catch (err) {
          console.error('AuthHashHandler: Exception during session establishment:', err);
          navigate('/auth/code?type=email', { replace: true });
          return;
        }
      }

      // Error handling for manual process
      if (params.get('error')) {
        const type = params.get('type') || 'email';
        const error = params.get('error');
        console.log('AuthHashHandler: Manual error flow with type:', type, 'error:', error);
        
        // Check for custom invitation token first
        const customInvitationToken = localStorage.getItem('custom_invitation_token');
        if (customInvitationToken) {
          console.log('AuthHashHandler: Found custom invitation token in error flow');
          
          // Check if we actually have a valid session despite the error
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
              console.log('AuthHashHandler: User is authenticated despite error, completing Azure AD invitation');
              localStorage.removeItem('custom_invitation_token');
              navigate(`/auth/complete-invite?token=${customInvitationToken}&type=azure_ad&completed=true`, { replace: true });
              return;
            } else {
              console.log('AuthHashHandler: No valid session despite custom token, treating as error');
              navigate(`/auth/complete-invite?error=${encodeURIComponent(error || 'auth_error')}&token=${customInvitationToken}&type=azure_ad`, { replace: true });
            }
          }).catch(() => {
            console.log('AuthHashHandler: Error getting session for custom invitation');
            navigate(`/auth/complete-invite?error=${encodeURIComponent(error || 'auth_error')}&token=${customInvitationToken}&type=azure_ad`, { replace: true });
          });
          return;
        }
        
        // Standard error handling
        if (type === 'invite') {
          navigate(`/auth/complete-invite?error=${encodeURIComponent(error || 'auth_error')}`, { replace: true });
        } else {
          navigate(`/auth/code?type=${encodeURIComponent(type)}`, { replace: true });
        }
        return;
      }
      
      console.log('AuthHashHandler: No access token or error found in manual process');
    };
    
    // Start cleanup process
    cleanup();
    
    return () => {
      subscription.unsubscribe();
    };

  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Processing authentication...</p>
      </div>
    </div>
  );
}