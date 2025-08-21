import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Building2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnterpriseStatus } from '@/hooks/useEnterpriseStatus';

export function ContactSales() {
  const { user } = useAuth();
  const { subscription_status, days_remaining } = useEnterpriseStatus();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Open email client with pre-filled information
    const subject = `Enterprise Upgrade Request - ${user?.organizationName}`;
    const body = `Hi OmniClause Sales Team,

I would like to upgrade ${user?.organizationName} to Enterprise access.

Organization: ${user?.organizationName}
Contact: ${user?.name} (${user?.email})
Current Status: ${subscription_status}
${days_remaining ? `Trial Days Remaining: ${days_remaining}` : ''}

Please contact me to discuss pricing and next steps.

Thank you!`;

    window.open(`mailto:sales@OmniClause.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">Request Sent!</CardTitle>
            <CardDescription>
              We've opened your email client with a pre-filled message. Our sales team will respond within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setSubmitted(false)}
            >
              Send Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Upgrade to Enterprise</CardTitle>
          <CardDescription className="text-lg">
            Unlock the full power of OmniClause for {user?.organizationName}
          </CardDescription>
          
          {subscription_status === 'trial' && days_remaining !== null && (
            <div className="flex items-center justify-center mt-4">
              <Badge variant={days_remaining > 7 ? 'secondary' : 'destructive'}>
                {days_remaining > 0 ? `${days_remaining} days left in trial` : 'Trial expired'}
              </Badge>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Enterprise Features */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Enterprise Features</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Unlimited document processing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Advanced AI contract analysis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Compliance risk monitoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Unlimited users</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Advanced analytics & reporting</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Why Enterprise?</h3>
              <div className="text-sm space-y-3">
                <p>
                  <strong>Save Time:</strong> Reduce contract review time from weeks to minutes with AI-powered analysis.
                </p>
                <p>
                  <strong>Reduce Risk:</strong> Automatically identify compliance issues and potential problems.
                </p>
                <p>
                  <strong>Scale Easily:</strong> Handle hundreds of contracts with unlimited processing.
                </p>
                <p>
                  <strong>Team Collaboration:</strong> Add unlimited users from your organization.
                </p>
              </div>
            </div>
          </div>
          
          {/* Contact Methods */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Get Started Today</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Button onClick={handleSubmit} className="h-auto p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span className="font-semibold">Email Sales Team</span>
                </div>
                <div className="text-xs opacity-90">Get a custom quote</div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 space-y-2"
                onClick={() => window.open('https://calendly.com/OmniClause/enterprise-demo', '_blank')}
              >
                <div className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span className="font-semibold">Schedule Demo</span>
                </div>
                <div className="text-xs opacity-90">See OmniClause in action</div>
              </Button>
            </div>
          </div>
          
          {/* Organization Info */}
          <div className="pt-4 border-t text-center text-sm text-muted-foreground">
            <p>
              Request for: <strong>{user?.organizationName}</strong>
            </p>
            <p>
              Contact: {user?.name} ({user?.email})
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}