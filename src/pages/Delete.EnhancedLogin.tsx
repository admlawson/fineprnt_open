import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isBusinessDomain, suggestAuthMethod, extractDomainFromEmail, getOrganizationNameFromDomain } from '@/lib/utils';

type AuthStep = 'email' | 'password' | 'oauth';

export const EnhancedLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [suggestedAuthMethod, setSuggestedAuthMethod] = useState<'oauth' | 'email'>('email');
  const [detectedDomain, setDetectedDomain] = useState('');
  
  const { login, signUp, signInWithAzureAD, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    const domain = extractDomainFromEmail(email);
    const authMethod = suggestAuthMethod(email);
    
    setDetectedDomain(domain);
    setSuggestedAuthMethod(authMethod);
    
    if (authMethod === 'oauth') {
      setAuthStep('oauth');
    } else {
      setAuthStep('password');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isSignUp) {
        const orgName = companyName || getOrganizationNameFromDomain(extractDomainFromEmail(email));
        await signUp(email, password, orgName);
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        await login(email, password);
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

  const handleOAuthSignIn = async () => {
    try {
      await signInWithAzureAD(email);
      // Navigation will be handled by redirect
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackToEmail = () => {
    setAuthStep('email');
    setPassword('');
    setCompanyName('');
  };

  const renderEmailStep = () => (
    <>
      <CardHeader className="text-center">
        <CardTitle>Welcome to omniclause</CardTitle>
        <CardDescription>
          Enter your email to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </>
  );

  const renderOAuthStep = () => (
    <>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToEmail}
            className="absolute left-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Building2 className="h-5 w-5" />
          Business Account Detected
        </CardTitle>
        <CardDescription>
          We detected you're using a business email from{' '}
          <Badge variant="secondary" className="mx-1">
            {getOrganizationNameFromDomain(detectedDomain)}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            Sign in with your organization's Microsoft account for the best experience.
            You'll be automatically added to your company's workspace.
          </AlertDescription>
        </Alert>

        <Button
          type="button"
          onClick={handleOAuthSignIn}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
          </svg>
          Continue with Microsoft
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or use email/password
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setAuthStep('password')}
          className="w-full"
        >
          <Mail className="mr-2 h-4 w-4" />
          Continue with email
        </Button>
      </CardContent>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToEmail}
            className="absolute left-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <CardTitle>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </CardTitle>
        <CardDescription>
          {isSignUp ? 'Create your account for' : 'Sign in to'} {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input
                id="companyName"
                type="text"
                placeholder={getOrganizationNameFromDomain(extractDomainFromEmail(email))}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full"
            disabled={isLoading}
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </Button>
        </div>
      </CardContent>
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md relative">
        {authStep === 'email' && renderEmailStep()}
        {authStep === 'oauth' && renderOAuthStep()}
        {authStep === 'password' && renderPasswordStep()}
      </Card>
    </div>
  );
};