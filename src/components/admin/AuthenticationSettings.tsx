import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthSettings {
  auth_method?: string;
  azure_ad_enabled?: boolean;
  email_password_enabled?: boolean;
  default_auth_method?: string;
  [key: string]: unknown; // Index signature to match Record<string, unknown>
}

interface AuthenticationSettingsProps {
  settings: Record<string, unknown>;
  onUpdate: (updates: { settings: Record<string, unknown> }) => Promise<void>;
  disabled?: boolean;
}

export const AuthenticationSettings: React.FC<AuthenticationSettingsProps> = ({
  settings,
  onUpdate,
  disabled = false
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Local state for form inputs
  const [azureAdEnabled, setAzureAdEnabled] = useState((settings.azure_ad_enabled as boolean) || false);
  const [emailPasswordEnabled, setEmailPasswordEnabled] = useState((settings.email_password_enabled as boolean) !== false);
  const [defaultAuthMethod, setDefaultAuthMethod] = useState((settings.default_auth_method as string) || 'email_password');

  const handleSave = async () => {
    setSaving(true);
    try {
      const authSettings: Record<string, unknown> = {
        ...settings,
        azure_ad_enabled: azureAdEnabled,
        email_password_enabled: emailPasswordEnabled,
        default_auth_method: defaultAuthMethod,
        auth_method: defaultAuthMethod // Set primary auth method to default
      };

      await onUpdate({ settings: authSettings });
      
      toast({
        title: "Success",
        description: "Authentication settings updated successfully"
      });
    } catch (error) {
      console.error('Failed to update auth settings:', error);
      toast({
        title: "Error",
        description: "Failed to update authentication settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = 
    azureAdEnabled !== ((settings.azure_ad_enabled as boolean) || false) ||
    emailPasswordEnabled !== ((settings.email_password_enabled as boolean) !== false) ||
    defaultAuthMethod !== ((settings.default_auth_method as string) || 'email_password');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield size={20} />
          Authentication Methods
        </CardTitle>
        <CardDescription>
          Configure how users sign in to your organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Key size={16} />
            <span className="font-medium">Current Configuration</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Azure AD (SSO)</span>
              <Badge variant={(settings.azure_ad_enabled as boolean) ? "default" : "secondary"}>
                {(settings.azure_ad_enabled as boolean) ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email & Password</span>
              <Badge variant={(settings.email_password_enabled as boolean) !== false ? "default" : "secondary"}>
                {(settings.email_password_enabled as boolean) !== false ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Default Method</span>
              <Badge variant="outline">
                {(settings.default_auth_method as string) === 'azure_ad' ? 'Azure AD' : 'Email & Password'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Authentication Methods */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="azure-ad">Azure AD (Single Sign-On)</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to sign in with their Microsoft/Azure AD accounts
              </p>
            </div>
            <Switch
              id="azure-ad"
              checked={azureAdEnabled}
              onCheckedChange={setAzureAdEnabled}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="email-password">Email & Password</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to sign in with email and password
              </p>
            </div>
            <Switch
              id="email-password"
              checked={emailPasswordEnabled}
              onCheckedChange={setEmailPasswordEnabled}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Default Authentication Method */}
        {(azureAdEnabled || emailPasswordEnabled) && (
          <div className="space-y-2">
            <Label htmlFor="default-method">Default Authentication Method</Label>
            <p className="text-sm text-muted-foreground">
              The preferred method shown to users when signing in
            </p>
            <Select
              value={defaultAuthMethod}
              onValueChange={setDefaultAuthMethod}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {azureAdEnabled && (
                  <SelectItem value="azure_ad">Azure AD (SSO)</SelectItem>
                )}
                {emailPasswordEnabled && (
                  <SelectItem value="email_password">Email & Password</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Users size={16} className="text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                User Invitation Behavior
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                When you invite users, they'll be guided to use your organization's preferred authentication method. 
                Users invited by Azure AD administrators will automatically be configured for Azure AD authentication.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={disabled || saving || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save Authentication Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};