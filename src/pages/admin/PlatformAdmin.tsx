import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building, 
  BarChart3, 
  Users, 
  FileText, 
  Activity,
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
  Search,
  TrendingUp,
  Server,
  MessageSquare,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePlatformAdminData, OrgAggregate } from '@/hooks/usePlatformAdminData';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { EditOrganizationDialog } from '@/components/admin/EditOrganizationDialog';
import { supabase } from '@/integrations/supabase/client';
import { 
  useAdminUsers,
  useAdminDocuments,
  useAdminChats,
  useAdminProcessingJobs,
} from '@/hooks/usePlatformAdminLists';
// Live data types and hooks are imported from usePlatformAdminData

export const PlatformAdmin: React.FC = () => {
  const { toast } = useToast();
  const [orgSearch, setOrgSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [documentSearch, setDocumentSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgAggregate | null>(null);

  const { metrics, orgs, recentLogins, recentChats, recentDocs, pendingInvites, loading } = usePlatformAdminData(orgSearch);

  // Admin lists for live data tabs
  const { data: adminUsers = [], isLoading: usersLoading } = useAdminUsers(userSearch);
  const { data: adminDocuments = [], isLoading: documentsLoading } = useAdminDocuments(documentSearch);
  const { data: adminChats = [], isLoading: chatsLoading } = useAdminChats(chatSearch);
  const { data: adminJobs = [], isLoading: jobsLoading } = useAdminProcessingJobs();

  useEffect(() => {
    document.title = 'Platform Admin — OmniClause';
  }, []);

  // Using server-side search via usePlatformAdminData(orgSearch)

const handleDeleteOrg = (orgId: string) => {
    toast({
      title: 'Requested organization removal',
      description: 'Admin actions will be added soon.',
    });
  };

const handleInvite = async (email: string, role: 'org_admin' | 'org_user') => {
    if (!selectedOrg) return;
    const { data: userData } = await supabase.auth.getUser();
    const invited_by = userData?.user?.id as string | undefined;
    const { error } = await supabase.from('invitations').insert({
      organization_id: selectedOrg.id,
      email,
      role,
      invited_by: invited_by || selectedOrg.id // fallback to avoid TS error; RLS will still enforce permissions
    } as any);
    if (error) {
      toast({ title: 'Failed to send invite', description: error.message, variant: 'destructive' });
      throw error;
    }
    toast({ title: 'Invitation sent', description: `${email} invited to ${selectedOrg.name}` });
  };

  const getOrgStatusBadge = (org: OrgAggregate) => {
    if (org.subscription_status === 'trial') {
      return <Badge variant="outline">Trial</Badge>;
    }
    if (org.status === 'active') {
      return <Badge className="bg-accent text-accent-foreground">Active</Badge>;
    }
    if (org.status === 'suspended') {
      return <Badge variant="secondary">Suspended</Badge>;
    }
    return <Badge variant="secondary">{org.status}</Badge>;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Platform Administration</h1>
            <p className="text-muted-foreground">
              Manage organizations, monitor platform usage, and configure global settings
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Server size={16} className="mr-2" />
              System Status
            </Button>
            <Button size="sm">
              <Plus size={16} className="mr-2" />
              New Organization
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 size={16} className="mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="organizations">
              <Building size={16} className="mr-2" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users size={16} className="mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText size={16} className="mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="chats">
              <MessageSquare size={16} className="mr-2" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="system">
              <Server size={16} className="mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
{/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <Card onClick={() => setActiveTab('organizations')} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Building size={16} className="mr-2" />
                    Organizations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.total_organizations ?? 0}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-accent font-medium">{metrics?.active_organizations ?? 0}</span> active
                  </p>
                </CardContent>
              </Card>

              <Card onClick={() => setActiveTab('users')} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Users size={16} className="mr-2" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.total_users ?? 0}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-accent font-medium">{metrics?.active_users ?? 0}</span> active
                  </p>
                </CardContent>
              </Card>

              <Card onClick={() => setActiveTab('documents')} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <FileText size={16} className="mr-2" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.total_documents ?? 0}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-accent font-medium">{metrics?.total_vectors ?? 0}</span> vectors
                  </p>
                </CardContent>
              </Card>

              <Card onClick={() => setActiveTab('organizations')} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <TrendingUp size={16} className="mr-2" />
                    Active Trials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.trials_active ?? 0}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-accent font-medium">{metrics?.trials_expiring_7d ?? 0}</span> expiring in 7 days
                  </p>
                </CardContent>
              </Card>

              <Card onClick={() => setActiveTab('chats')} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <MessageSquare size={16} className="mr-2" />
                    Recent Chats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recentChats.length}</div>
                  <p className="text-xs text-muted-foreground">Last 20 sessions</p>
                </CardContent>
              </Card>

              <Card onClick={() => setActiveTab('system')} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Server size={16} className="mr-2" />
                    System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.jobs_running ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Running • {metrics?.jobs_queued ?? 0} queued</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity size={20} className="mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const items = [
                    ...recentLogins.map(l => ({ type: 'login', label: `Login: ${l.email}`, time: l.last_sign_in_at || l.created_at })),
                    ...recentChats.map(c => ({ type: 'chat', label: `Chat: ${c.title || 'Untitled'}`, time: c.updated_at })),
                    ...recentDocs.map(d => ({ type: 'doc', label: `Doc: ${d.filename}`, time: d.created_at })),
                  ]
                  .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                  .slice(0, 8);

                  if (items.length === 0) {
                    return <p className="text-sm text-muted-foreground">No recent activity.</p>;
                  }

                  return (
                    <div className="space-y-4">
                      {items.map((it, idx) => (
                        <div className="flex items-center space-x-4" key={idx}>
                          <div className={`w-2 h-2 rounded-full ${it.type === 'login' ? 'bg-primary' : it.type === 'chat' ? 'bg-accent' : 'bg-secondary'}`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{it.label}</p>
                            <p className="text-xs text-muted-foreground">{new Date(it.time).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

              </CardContent>
            </Card>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search organizations..."
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>
                  Manage all organizations on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Vectors</TableHead>
                      <TableHead>Jobs</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9}>
                          <p className="text-sm text-muted-foreground">Loading organizations...</p>
                        </TableCell>
                      </TableRow>
                    ) : orgs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9}>
                          <p className="text-sm text-muted-foreground">No organizations found.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      orgs.map((org) => (
                        <TableRow key={org.id}>
                          <TableCell>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-sm text-muted-foreground">{org.domain}</div>
                          </TableCell>
                          <TableCell>{org.subscription_status ?? '-'}</TableCell>
                          <TableCell>{getOrgStatusBadge(org)}</TableCell>
                          <TableCell>{org.active_users_count}/{org.users_count}</TableCell>
                          <TableCell>{org.documents_count}</TableCell>
                          <TableCell>{org.vectors_count}</TableCell>
                          <TableCell>{org.jobs_running}/{org.jobs_error}</TableCell>
                          <TableCell>{org.last_doc_at ? new Date(org.last_doc_at).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedOrg(org); setEditOpen(true); }}>
                                  <Edit3 size={16} className="mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedOrg(org); setInviteOpen(true); }}>
                                  <UserPlus size={16} className="mr-2" />
                                  Invite User
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Activity size={16} className="mr-2" />
                                  View Usage
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteOrg(org.id)}
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search users by email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>All users across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading users...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Last sign-in</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Orgs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : '-'}</TableCell>
                          <TableCell>{new Date(u.created_at).toLocaleString()}</TableCell>
                          <TableCell>{u.active_orgs_count}/{u.orgs_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search documents or organizations..."
                  value={documentSearch}
                  onChange={(e) => setDocumentSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>All documents with status</CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading documents...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filename</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Uploaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminDocuments.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.filename}</TableCell>
                          <TableCell>{d.org_name}</TableCell>
                          <TableCell>{d.status ?? '-'}</TableCell>
                          <TableCell>{d.mime_type ?? '-'}</TableCell>
                          <TableCell>{typeof d.file_size === 'number' ? `${(d.file_size / (1024*1024)).toFixed(2)} MB` : '-'}</TableCell>
                          <TableCell>{new Date(d.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chats Tab */}
          <TabsContent value="chats" className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search chats by title or user email..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Chat Sessions</CardTitle>
                <CardDescription>Recent chat sessions across organizations</CardDescription>
              </CardHeader>
              <CardContent>
                {chatsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading chats...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Messages</TableHead>
                        <TableHead>Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminChats.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.title || 'Untitled'}</TableCell>
                          <TableCell>{c.user_email ?? c.user_id}</TableCell>
                          <TableCell>{c.org_name ?? c.org_id}</TableCell>
                          <TableCell>{c.message_count}</TableCell>
                          <TableCell>{new Date(c.updated_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Processing Jobs</CardTitle>
                <CardDescription>Live view of document processing pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading jobs...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filename</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminJobs.map((j) => (
                        <TableRow key={j.id}>
                          <TableCell className="font-medium">{j.filename ?? '-'}</TableCell>
                          <TableCell>{j.org_name ?? j.org_id}</TableCell>
                          <TableCell>{j.stage}</TableCell>
                          <TableCell>{j.status ?? '-'}</TableCell>
                          <TableCell>{new Date(j.created_at).toLocaleString()}</TableCell>
                          <TableCell>{j.started_at ? new Date(j.started_at).toLocaleString() : '-'}</TableCell>
                          <TableCell>{j.completed_at ? new Date(j.completed_at).toLocaleString() : '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">{j.error_message ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>
                  Configure global platform settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">System Configuration</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Maintenance Mode</span>
                        <Badge variant="outline">Disabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-backups</span>
                        <Badge className="bg-accent text-accent-foreground">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Rate Limiting</span>
                        <Badge className="bg-accent text-accent-foreground">Enabled</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Default Limits</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Max users per org</span>
                        <span className="text-sm text-muted-foreground">100</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Max storage per org</span>
                        <span className="text-sm text-muted-foreground">500 GB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Trial period</span>
                        <span className="text-sm text-muted-foreground">14 days</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};