import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization, OrganizationUser } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { EditUserDialog } from '@/components/admin/EditUserDialog';
import { AuthenticationSettings } from '@/components/admin/AuthenticationSettings';
import { 
  Users, 
  Settings, 
  CreditCard, 
  MoreVertical, 
  Edit3, 
  Trash2,
  UserPlus,
  Mail,
  Clock,
  Shield,
  User,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEnterpriseStatus } from '@/hooks/useEnterpriseStatus';

export const OrgAdmin: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    users,
    invitations,
    organization,
    loading,
    updateOrganization,
    updateUserRole,
    removeUser,
    sendInvitation,
    cancelInvitation,
    refreshData
  } = useOrganization();

  const { subscription_status, trial_ends_at, enterprise_features_enabled, has_access, days_remaining, isLoading: subLoading } = useEnterpriseStatus();
  // Local state for UI
  const [orgName, setOrgName] = useState('');
  const [maxUsers, setMaxUsers] = useState('50');
  const [storageLimit, setStorageLimit] = useState('100');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(null);
  const [removeUserDialogOpen, setRemoveUserDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<OrganizationUser | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Update local state when organization data loads
  React.useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setMaxUsers(organization.settings.maxUsers?.toString() || '50');
      setStorageLimit(organization.settings.storageLimit?.toString() || '100');
    }
  }, [organization]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateOrganization({
        name: orgName,
        settings: {
          maxUsers: parseInt(maxUsers) || 50,
          storageLimit: parseInt(storageLimit) || 100
        }
      });
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setSavingSettings(false);
    }
  };

  const handleEditUser = (user: OrganizationUser) => {
    setSelectedUser(user);
    setEditUserDialogOpen(true);
  };

  const handleRemoveUser = (user: OrganizationUser) => {
    setUserToRemove(user);
    setRemoveUserDialogOpen(true);
  };

  const confirmRemoveUser = async () => {
    if (userToRemove) {
      await removeUser(userToRemove.id);
      setRemoveUserDialogOpen(false);
      setUserToRemove(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-accent text-accent-foreground">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'platform_owner':
        return <Badge variant="default" className="bg-primary"><Shield size={12} className="mr-1" />Owner</Badge>;
      case 'org_admin':
        return <Badge variant="default"><Shield size={12} className="mr-1" />Admin</Badge>;
      case 'org_user':
        return <Badge variant="outline"><User size={12} className="mr-1" />User</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  // Check if current user can perform admin actions
  const canEditUsers = user?.role === 'platform_owner' || user?.role === 'org_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading organization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Organization Management</h1>
            <p className="text-muted-foreground">
              Manage users, settings, and billing for {user?.organizationName}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {canEditUsers && (
              <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
                <UserPlus size={16} className="mr-2" />
                Invite User
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">
              <Users size={16} className="mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings size={16} className="mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard size={16} className="mr-2" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="space-y-6">
              {/* Active Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage users and their permissions within your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Documents</TableHead>
                        {canEditUsers && <TableHead className="w-[50px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((orgUser) => (
                        <TableRow key={orgUser.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{orgUser.name}</div>
                              <div className="text-sm text-muted-foreground">{orgUser.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(orgUser.role)}</TableCell>
                          <TableCell>{getStatusBadge(orgUser.status)}</TableCell>
                          <TableCell>
                            {orgUser.joined_at ? new Date(orgUser.joined_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>{orgUser.documents_processed || 0}</TableCell>
                          {canEditUsers && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical size={16} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditUser(orgUser)}>
                                    <Edit3 size={16} className="mr-2" />
                                    Edit Role
                                  </DropdownMenuItem>
                                  {orgUser.role !== 'platform_owner' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-destructive"
                                        onClick={() => handleRemoveUser(orgUser)}
                                      >
                                        <Trash2 size={16} className="mr-2" />
                                        Remove
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Pending Invitations */}
              {invitations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail size={20} />
                      Pending Invitations
                    </CardTitle>
                    <CardDescription>
                      Users who have been invited but haven't joined yet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Invited</TableHead>
                          <TableHead>Expires</TableHead>
                          {canEditUsers && <TableHead className="w-[50px]"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invitations.map((invitation) => (
                          <TableRow key={invitation.id}>
                            <TableCell>
                              <div className="font-medium">{invitation.email}</div>
                            </TableCell>
                            <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock size={12} />
                                {invitation.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(invitation.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(invitation.expires_at).toLocaleDateString()}
                            </TableCell>
                            {canEditUsers && (
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical size={16} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => cancelInvitation(invitation.id)}
                                    >
                                      <Trash2 size={16} className="mr-2" />
                                      Cancel
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Basic Organization Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>
                  Configure your organization's basic information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxUsers">Maximum Users</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      value={maxUsers}
                      onChange={(e) => setMaxUsers(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storageLimit">Storage Limit (GB)</Label>
                    <Input
                      id="storageLimit"
                      type="number"
                      value={storageLimit}
                      onChange={(e) => setStorageLimit(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSaveSettings}
                  disabled={savingSettings || !organization}
                >
                  {savingSettings ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {/* Authentication Settings */}
            {organization && (
              <AuthenticationSettings
                settings={organization.settings}
                onUpdate={updateOrganization}
                disabled={!canEditUsers}
              />
            )}
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard size={20} />
                  Subscription
                </CardTitle>
                <CardDescription>
                  Enterprise agreement managed by OmniClause.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subLoading ? (
                  <div className="text-muted-foreground">Loading subscription...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {subscription_status === 'enterprise' && (
                        <Badge>Enterprise</Badge>
                      )}
                      {subscription_status === 'trial' && (
                        <Badge variant="secondary">Trial</Badge>
                      )}
                      {subscription_status === 'suspended' && (
                        <Badge variant="destructive">Suspended</Badge>
                      )}
                      {!subscription_status && (
                        <Badge variant="outline">Unknown</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Access</div>
                        <div className="font-medium">{has_access ? 'Enabled' : 'Disabled'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Enterprise features</div>
                        <div className="font-medium">{enterprise_features_enabled ? 'Enabled' : 'Disabled'}</div>
                      </div>
                      {subscription_status === 'trial' && (
                        <>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Trial ends</div>
                            <div className="font-medium">{trial_ends_at ? new Date(trial_ends_at).toLocaleDateString() : '—'}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Days remaining</div>
                            <div className="font-medium">{days_remaining ?? '—'}</div>
                          </div>
                        </>
                      )}
                    </div>

                    {subscription_status !== 'enterprise' && (
                      <div className="pt-2">
                        <Button asChild>
                          <a href="/app/contact-sales">Contact Sales</a>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvite={sendInvitation}
      />

      <EditUserDialog
        open={editUserDialogOpen}
        onOpenChange={setEditUserDialogOpen}
        user={selectedUser}
        onUpdateRole={updateUserRole}
      />

      <AlertDialog open={removeUserDialogOpen} onOpenChange={setRemoveUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-destructive" />
              Remove User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{userToRemove?.name}</strong> from your organization? 
              This action cannot be undone and they will lose access to all documents and features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};