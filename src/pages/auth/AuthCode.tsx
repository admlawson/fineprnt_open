import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const mapType = (t?: string) => {
  switch ((t || '').toLowerCase()) {
    case 'recovery':
    case 'password_reset':
      return 'recovery';
    case 'invite':
      return 'invite';
    case 'email_change':
      return 'email_change';
    case 'magiclink':
    case 'signup':
    case 'email':
    default:
      return 'email';
  }
};

const getTypeDisplayName = (type: string) => {
  switch (type) {
    case 'recovery':
      return 'Password Reset';
    case 'invite':
      return 'Invitation';
    case 'email_change':
      return 'Email Change';
    default:
      return 'Sign In';
  }
};

export default function AuthCode() {
  const query = useQuery();
  const navigate = useNavigate();
  const supaType = mapType(query.get('type') || 'email');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: supaType as any,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Redirect based on type
      if (supaType === 'recovery') {
        navigate('/auth/new-password', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      <div className="flex-1 flex items-center justify-center bg-secondary/30 px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-medium">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                {getTypeDisplayName(supaType)} Code Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Your authentication link has expired or been used. Please enter your email and the 6-digit code from your email to continue.
                  </AlertDescription>
                </Alert>

                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="code">6-digit code</Label>
                    <Input
                      id="code"
                      required
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="000000"
                      className="text-center text-lg tracking-widest"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading || !email || !code} 
                    className="w-full"
                  >
                    {loading ? 'Verifying...' : 'Continue'}
                  </Button>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}