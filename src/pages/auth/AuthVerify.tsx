import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OtpCodeInput } from '@/components/auth/OtpCodeInput';
import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';

const AuthVerify: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const type = searchParams.get('type') as 'magic_link' | 'password_reset' | 'invite' || 'magic_link';

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleSuccess = () => {
    if (type === 'password_reset') {
      navigate('/auth/reset');
    } else {
      navigate('/app');
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      <div className="flex-1 flex items-center justify-center bg-secondary/30 px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-medium">
            <CardHeader className="text-center">
              <CardTitle>Check your email</CardTitle>
            </CardHeader>
            <CardContent>
              <OtpCodeInput 
                email={email} 
                type={type}
                onSuccess={handleSuccess}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};

export default AuthVerify;