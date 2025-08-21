import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const { login, signUp, signInWithAzureAD, signInWithGoogle, resetPassword, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lastUsed, setLastUsed] = useState<'google' | 'azure' | 'password' | null>(null);

  useEffect(() => {
    const lu = localStorage.getItem('mc:last_oauth');
    if (lu === 'google' || lu === 'azure' || lu === 'password') setLastUsed(lu);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        await login(email, password);
        localStorage.setItem('mc:last_oauth', 'password');
        toast({
          title: "Welcome to omniclause!",
          description: "You've successfully signed in.",
        });
        navigate('/app');
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? "Sign up failed" : "Sign in failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAzureADSignIn = async () => {
    try {
      localStorage.setItem('mc:last_oauth', 'azure');
      await signInWithAzureAD();
      // Navigation will be handled by redirect
    } catch (error: any) {
      toast({
        title: "Azure AD sign in failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      localStorage.setItem('mc:last_oauth', 'google');
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Google sign in failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }

    try {
      await resetPassword(email);
      toast({
        title: "Reset email sent!",
        description: "Check your email for a magic link and 6-digit code to reset your password.",
      });
      setShowPasswordReset(false);
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      <div className="flex-1 flex items-center justify-center bg-secondary/30 px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp ? 'Start your organization setup' : 'Sign in to your account to continue'}
            </p>
          </div>

        {/* Login/Signup Form */}
        <Card className="border-0 shadow-medium">
          <CardHeader>
            <CardTitle>{isSignUp ? 'Sign Up' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Create your account'
                : 'Enter your credentials to access your account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 py-0 h-auto text-sm"
                      onClick={() => setShowPasswordReset(true)}
                    >
                      Forgot password?
                    </Button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            {!isSignUp && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="relative w-full justify-start"
                    >
                      <div className="flex items-center">
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M21.35 11.1h-9.17v2.96h5.3c-.23 1.5-1.6 4.4-5.3 4.4-3.19 0-5.8-2.64-5.8-5.9s2.61-5.9 5.8-5.9c1.82 0 3.04.77 3.74 1.43l2.55-2.46C17.7 3.8 15.7 2.8 12.48 2.8 7.58 2.8 3.6 6.78 3.6 11.66s3.98 8.86 8.88 8.86c5.13 0 8.52-3.6 8.52-8.66 0-.58-.06-1.02-.15-1.76Z"/>
                        </svg>
                        Sign in with Google
                      </div>
                      {lastUsed === 'google' && (
                        <span className="absolute right-2 top-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] px-2 py-0.5">Last used</span>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAzureADSignIn}
                      disabled={isLoading}
                      className="relative w-full justify-start"
                    >
                      <div className="flex items-center">
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                        </svg>
                        Sign in with Microsoft
                      </div>
                      {lastUsed === 'azure' && (
                        <span className="absolute right-2 top-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] px-2 py-0.5">Last used</span>
                      )}
                    </Button>
                  </div>
                  
                </div>
              </>
            )}

            <div className="mt-4 space-y-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full"
              >
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"
                }
              </Button>
              {!isSignUp && lastUsed === 'password' && (
                <p className="text-center text-xs text-muted-foreground">Last used: Email & Password</p>
              )}
              
            </div>
          </CardContent>
        </Card>


        {/* Password Reset Modal */}
        <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you a password reset link.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordReset(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};