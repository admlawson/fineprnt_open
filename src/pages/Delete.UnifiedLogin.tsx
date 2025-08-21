
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building2, Mail, Shield } from 'lucide-react';
import { extractDomainFromEmail, isBusinessDomain } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

type AuthStep = 'email' | 'method-selection' | 'email-password' | 'organization-exists';
type AuthMethod = 'email' | 'azure';

export const UnifiedLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [isSignUp, setIsSignUp] = useState(false);
  const [adminContact, setAdminContact] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const isInvited = !!inviteToken;
  const { 
    login, 
    signUp, 
    signInWithAzureAD, 
    checkDomainOrganization, 
    resetPassword 
  } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    const stored = localStorage.getItem('inviteToken');
    const finalToken = token || stored;

    if (token) {
      localStorage.setItem('inviteToken', token);
    }

    if (finalToken) {
      setInviteToken(finalToken);
      supabase.rpc('get_invitation_details', { p_token: finalToken }).then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setInviteInfo(data[0]);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (inviteToken) {
      setIsSignUp(false);
    }
  }, [inviteToken]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    try {
      // If accessing via invitation, bypass domain gate and go straight to method/password
      const token = localStorage.getItem('inviteToken');
      if (token) {
        if (isBusinessDomain(email)) {
          setAuthStep('method-selection');
        } else {
          setAuthMethod('email');
          setAuthStep('email-password');
        }
        return;
      }

      // Check if domain has existing organization
      const domainCheck = await checkDomainOrganization(email);
      
      if (domainCheck.hasOrganization) {
        setAdminContact(domainCheck.adminContact);
        // Allow the user to choose a sign-in method instead of blocking
        setAuthStep('method-selection');
        setIsLoading(false);
        return;
      }

      // For business domains, suggest OAuth or SAML
      if (isBusinessDomain(email)) {
        setAuthStep('method-selection');
      } else {
        // For personal domains, go directly to email/password
        setAuthMethod('email');
        setAuthStep('email-password');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodSelection = (method: AuthMethod) => {
    setAuthMethod(method);
    if (method === 'email') {
      setAuthStep('email-password');
    } else {
      handleSSOLogin();
    }
  };

  const handleSSOLogin = async () => {
    setIsLoading(true);
    
    try {
      await signInWithAzureAD(email);
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, companyName);
        toast({
          title: "Account Created",
          description: "Please check your email to verify your account.",
        });
      } else {
        await login(email, password);
        navigate('/app');
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? "Sign Up Error" : "Login Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await resetPassword(email);
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Continue
      </Button>
    </form>
  );

  const renderMethodSelection = () => (
    <div className="space-y-4">
      {adminContact && (
        <Alert>
          <AlertDescription>
            Your organization already exists. You can sign in below. For help, contact {adminContact.admin_name} ({adminContact.admin_email}).
          </AlertDescription>
        </Alert>
      )}

      <p className="text-sm text-muted-foreground">
        Choose how you'd like to sign in to your organization:
      </p>
      
      <div className="space-y-3">

        <Button
          variant="outline"
          className="w-full justify-start h-auto p-4"
          onClick={() => handleMethodSelection('azure')}
          disabled={isLoading}
        >
          <Building2 className="h-5 w-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Microsoft Azure AD</div>
            <div className="text-sm text-muted-foreground">
              Sign in with your Microsoft work account
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start h-auto p-4"
          onClick={() => handleMethodSelection('email')}
          disabled={isLoading}
        >
          <Mail className="h-5 w-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Email & Password</div>
            <div className="text-sm text-muted-foreground">
              Sign in with your email and password
            </div>
          </div>
        </Button>
      </div>

      <div className="text-center">
        <Button variant="ghost" onClick={() => setAuthStep('email')}>
          ← Back
        </Button>
      </div>
    </div>
  );

  const renderEmailPasswordStep = () => (
    <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-display">Email Address</Label>
        <Input
          id="email-display"
          type="email"
          value={email}
          disabled
          className="bg-muted"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {isSignUp && !isInvited && (
        <div className="space-y-2">
          <Label htmlFor="company">Company Name</Label>
          <Input
            id="company"
            type="text"
            placeholder="Your company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {isSignUp ? 'Create Account' : 'Sign In'}
      </Button>

      <div className="space-y-2 text-center">
        {!isInvited && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Button>
        )}

        {!isSignUp && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePasswordReset}
          >
            Forgot password?
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={() => setAuthStep('email')}>
          ← Back
        </Button>
      </div>
    </form>
  );

  const renderOrganizationExists = () => (
    <div className="space-y-4 text-center">
      <div className="p-6 border rounded-lg bg-muted/50">
        <h3 className="font-semibold mb-2">Organization Already Exists</h3>
        <p className="text-sm text-muted-foreground mb-4">
          An organization for your domain already exists. Choose a sign-in method below.
        </p>
        
        {adminContact && (
          <div className="bg-background p-3 rounded border">
            <p className="font-medium">{adminContact.admin_name}</p>
            <p className="text-sm text-muted-foreground">{adminContact.admin_email}</p>
          </div>
        )}
      </div>

      <div className="space-y-3 text-left">
        <Button
          variant="outline"
          className="w-full justify-start h-auto p-4"
          onClick={() => handleMethodSelection('azure')}
          disabled={isLoading}
        >
          <Building2 className="h-5 w-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Continue with Microsoft Azure AD</div>
            <div className="text-sm text-muted-foreground">
              Use your Microsoft work account
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start h-auto p-4"
          onClick={() => handleMethodSelection('email')}
          disabled={isLoading}
        >
          <Mail className="h-5 w-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Continue with Email & Password</div>
            <div className="text-sm text-muted-foreground">
              Use your OmniClause account credentials
            </div>
          </div>
        </Button>
      </div>

      <Button variant="ghost" onClick={() => setAuthStep('email')}>
        ← Try Different Email
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to OmniClause</CardTitle>
          <CardDescription>
            Healthcare Contract Intelligence Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inviteToken && inviteInfo && (
            <Alert className="mb-4">
              <AlertDescription>
                You’re invited to join {inviteInfo.organization_name} as <strong>{inviteInfo.role}</strong>. Please continue with {inviteInfo.email} to accept.
              </AlertDescription>
            </Alert>
          )}
          {authStep === 'email' && renderEmailStep()}
          {authStep === 'method-selection' && renderMethodSelection()}
          {authStep === 'email-password' && renderEmailPasswordStep()}
          {authStep === 'organization-exists' && renderOrganizationExists()}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedLogin;
