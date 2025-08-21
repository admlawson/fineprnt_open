import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface OtpCodeInputProps {
  email: string;
  onSuccess?: () => void;
  type?: 'magic_link' | 'password_reset' | 'invite';
}

export const OtpCodeInput: React.FC<OtpCodeInputProps> = ({ 
  email, 
  onSuccess,
  type = 'magic_link'
}) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { verifyOtp, sendMagicLink, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code from your email.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsVerifying(true);
      await verifyOtp(email, code, type);
      toast({
        title: "Verification successful!",
        description: "You've been signed in successfully.",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Please check your code and try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResending(true);
      if (type === 'password_reset') {
        await resetPassword(email);
        toast({
          title: "New reset code sent!",
          description: "Check your email for a new 6-digit code.",
        });
      } else {
        await sendMagicLink(email);
        toast({
          title: "New code sent!",
          description: "Check your email for a new 6-digit code.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to resend",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'password_reset':
        return 'Enter your password reset code';
      case 'invite':
        return 'Enter your invitation code';
      default:
        return 'Enter your sign-in code';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'password_reset':
        return 'Enter the 6-digit code from your password reset email.';
      case 'invite':
        return 'Enter the 6-digit code from your invitation email.';
      default:
        return 'Enter the 6-digit code from your sign-in email.';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">{getTitle()}</h2>
        <p className="text-muted-foreground text-sm">
          {getDescription()} We sent it to <strong>{email}</strong>
        </p>
      </div>

      <Alert>
        <AlertDescription>
          If you don't see the email, check your spam folder. Email scanners may have 
          expired the magic link, but the 6-digit code will still work.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleVerifyCode} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">6-digit verification code</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-lg tracking-widest"
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isVerifying || code.length !== 6}
        >
          {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify Code
        </Button>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={handleResendCode}
            disabled={isResending}
            className="text-sm"
          >
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Didn't receive a code? Resend
          </Button>
        </div>
      </form>
    </div>
  );
};