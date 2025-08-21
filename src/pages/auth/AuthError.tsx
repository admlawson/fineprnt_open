import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OtpCodeInput } from '@/components/auth/OtpCodeInput';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';

const AuthError: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const email = searchParams.get('email') || '';
  const type = searchParams.get('type') as 'magic_link' | 'password_reset' | 'invite' || 'magic_link';

  const isExpiredError = error === 'otp_expired' || errorDescription?.includes('expired');

  const handleSuccess = () => {
    if (type === 'password_reset') {
      navigate('/auth/reset');
    } else {
      navigate('/app');
    }
  };

  const getErrorMessage = () => {
    if (isExpiredError) {
      return "Your authentication link has expired. This often happens when email scanners check links automatically.";
    }
    return errorDescription || "There was an issue with your authentication link.";
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
                Authentication Issue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  {getErrorMessage()}
                </AlertDescription>
              </Alert>

              {isExpiredError && email ? (
                <div>
                  <h3 className="font-medium mb-3">No problem! Use your 6-digit code instead:</h3>
                  <OtpCodeInput 
                    email={email} 
                    type={type}
                    onSuccess={handleSuccess}
                  />
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground">
                    Please try signing in again or contact support if the issue persists.
                  </p>
                  <Button onClick={() => navigate('/login')} className="w-full">
                    Back to Sign In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};

export default AuthError;