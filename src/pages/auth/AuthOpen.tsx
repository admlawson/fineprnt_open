import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthOpen() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Extract the real Supabase URL from the fragment
    const raw = window.location.hash.slice(1);
    const target = decodeURIComponent(raw || '');
    
    console.log('AuthOpen: Processing target URL:', target);
    
    // Validate the URL to ensure it's a legitimate Supabase auth URL
    const ok = target.startsWith('https://api.fineprnt.com/auth/v1/verify');
    
    if (ok) {
      // Check if this is a password recovery flow
      try {
        const url = new URL(target);
        const type = url.searchParams.get('type');
        const redirectTo = url.searchParams.get('redirect_to');
        
        console.log('AuthOpen: URL type:', type, 'redirect_to:', redirectTo);
        
        // For any recovery type, ensure it goes to the hash handler for proper processing
        if (type === 'recovery') {
          console.log('AuthOpen: Detected password recovery flow, redirecting to hash handler');
          const fixedUrl = new URL(target);
          fixedUrl.searchParams.set('redirect_to', `${window.location.origin}/auth/hash`);
          window.location.replace(fixedUrl.toString());
          return;
        }
      } catch (e) {
        console.warn('AuthOpen: Could not parse target URL:', e);
      }
      
      // This is the FIRST real request to Supabase - scanners never get here
      window.location.replace(target);
    } else {
      // Invalid or missing URL - redirect to login with error
      navigate('/login?e=bad_link', { replace: true });
    }
  }, [navigate]);

  // Show minimal loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}