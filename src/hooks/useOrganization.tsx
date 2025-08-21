import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface OrganizationUser {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: 'platform_owner' | 'org_admin' | 'org_user';
  status: 'active' | 'inactive';
  joined_at: string;
  last_login?: string;
  documents_processed?: number;
}

export interface Invitation {
  id: string;
  email: string;
  role: 'org_admin' | 'org_user';
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
  invited_by: string;
}

export interface OrganizationSettings {
  name: string;
  settings: Record<string, unknown>;
}

export const useOrganization = () => {
  const { user, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [organization, setOrganization] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Load organization data
  const loadOrganization = async () => {
    if (!user?.organizationId) return;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, settings')
        .eq('id', user.organizationId)
        .single();

      if (error) throw error;

      setOrganization({
        name: data.name,
        settings: (data.settings as Record<string, unknown>) || {}
      });
    } catch (error) {
      console.error('Error loading organization:', error);
      toast({
        title: "Error",
        description: "Failed to load organization data",
        variant: "destructive"
      });
    }
  };

  // Load organization users
  const loadUsers = async () => {
    if (!user?.organizationId) return;

    try {
      const { data, error } = await supabase
        .rpc('get_org_members', { p_org_id: user.organizationId });

      if (error) throw error;

      const mapped = (data || []).map((m: any) => ({
        id: m.membership_id,
        user_id: m.user_id,
        email: m.email,
        name: m.display_name || m.email,
        role: m.role,
        status: m.status,
        joined_at: m.joined_at,
      }));

      setUsers(mapped);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    }
  };

  // Load invitations
  const loadInvitations = async () => {
    if (!user?.organizationId) return;

    try {
      // Load both native Supabase invitations and custom org_invitations
      const { data: customInvitations, error: customError } = await supabase
        .from('org_invitations')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('status', 'pending');

      if (customError) {
        console.error('Error loading custom invitations:', customError);
      } else {
        // Map custom invitations to the expected format
        const mappedInvitations = customInvitations?.map(inv => ({
          id: inv.id,
          email: inv.email,
          role: inv.role as 'org_admin' | 'org_user', // Filter to only allow valid roles
          status: inv.status as 'pending' | 'accepted' | 'expired',
          created_at: inv.created_at,
          expires_at: inv.expires_at,
          invited_by: inv.invited_by
        })).filter(inv => inv.role === 'org_admin' || inv.role === 'org_user') || [];
        
        setInvitations(mappedInvitations);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive"
      });
    }
  };

  // Update organization settings
  const updateOrganization = async (updates: Partial<OrganizationSettings>) => {
    if (!user?.organizationId || !organization) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: updates.name || organization.name,
          settings: { ...organization.settings, ...(updates.settings || {}) } as any
        })
        .eq('id', user.organizationId);

      if (error) throw error;

      setOrganization({
        ...organization,
        ...updates,
        settings: { ...organization.settings, ...(updates.settings || {}) }
      });

      toast({
        title: "Success",
        description: "Organization settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: "Error",
        description: "Failed to update organization settings",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: 'org_admin' | 'org_user') => {
    try {
      console.log('Updating user role:', { userId, newRole, users });
      
      // Find the user to check if they're platform_owner
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        console.error('User not found:', userId);
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive"
        });
        throw new Error("User not found");
      }

      if (userToUpdate.role === 'platform_owner') {
        toast({
          title: "Error",
          description: "Cannot modify platform owner role",
          variant: "destructive"
        });
        throw new Error("Cannot modify platform owner role");
      }

      console.log('Updating user_organizations record:', {
        membershipId: userId,
        newRole,
        organizationId: user?.organizationId
      });

      // userId here is actually the membership_id from the user_organizations table
      const { data, error } = await supabase
        .from('user_organizations')
        .update({ role: newRole })
        .eq('id', userId)
        .eq('organization_id', user?.organizationId) // Add organization check for security
        .select();

      if (error) {
        console.error('Database error updating role:', error);
        throw error;
      }

      console.log('Role update successful:', data);

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      // If the updated user is the current user, refresh their profile
      if (userToUpdate.user_id === user?.id) {
        await refreshUserProfile();
      }

      toast({
        title: "Success",
        description: "User role updated successfully"
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: `Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  // Remove user from organization
  const removeUser = async (userId: string) => {
    try {
      // Note: In the database, we'll need to add a way to deactivate users
      // For now, we'll just remove them from the local state and you'd need to implement
      // the proper database schema for user deactivation
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== userId));

      toast({
        title: "Success",
        description: "User removed from organization"
      });
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Send invitation
  const sendInvitation = async (email: string, role: 'org_admin' | 'org_user') => {
    if (!user?.organizationId) return;

    try {
      // Call edge function to send invitation with proper permissions
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          role,
          organizationName: organization?.name
        }
      });

      if (error) throw error;

      // Add to local state for immediate UI update
      const newInvitation = {
        id: data.user?.id || crypto.randomUUID(),
        email: email,
        role: role,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        invited_by: user.id
      };
      setInvitations(prev => [...prev, newInvitation]);

      toast({
        title: "Success",
        description: `Invitation sent to ${email}`
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Cancel invitation
  const cancelInvitation = async (invitationId: string) => {
    try {
      // With Supabase native auth invitations, we can't easily cancel them
      // The invitation will expire automatically based on Supabase's default expiration
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));

      toast({
        title: "Success",
        description: "Invitation removed from list"
      });
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadOrganization(),
      loadUsers(),
      loadInvitations()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.organizationId) {
      loadData();
    }
  }, [user?.organizationId]);

  return {
    users,
    invitations,
    organization,
    loading,
    updateOrganization,
    updateUserRole,
    removeUser,
    sendInvitation,
    cancelInvitation,
    refreshData: loadData
  };
};