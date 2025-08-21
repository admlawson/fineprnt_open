import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { OrganizationUser } from '@/hooks/useOrganization';
import { Edit3, Shield, User } from 'lucide-react';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: OrganizationUser | null;
  onUpdateRole: (userId: string, newRole: 'org_admin' | 'org_user') => Promise<void>;
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUpdateRole
}) => {
  const [role, setRole] = useState<'org_admin' | 'org_user'>(user?.role === 'platform_owner' ? 'org_admin' : user?.role || 'org_user');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      setRole(user.role === 'platform_owner' ? 'org_admin' : user.role);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.role === role) {
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      await onUpdateRole(user.id, role);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isPlatformOwner = user.role === 'platform_owner';
  const hasChanges = !isPlatformOwner && user.role !== role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 size={20} />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user permissions and role within your organization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* User Info */}
          <div className="space-y-2">
            <Label>User Information</Label>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                  {user.status}
                </Badge>
                {user.joined_at && (
                  <span className="text-xs text-muted-foreground">
                    Joined {new Date(user.joined_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              {isPlatformOwner ? (
                <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-2">
                  <Shield size={16} className="text-primary" />
                  <span className="font-medium">Platform Owner</span>
                  <Badge variant="default">Cannot be changed</Badge>
                </div>
              ) : (
                <Select 
                  value={role} 
                  onValueChange={(value: 'org_admin' | 'org_user') => setRole(value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org_user">
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <div>
                          <div>User</div>
                          <div className="text-xs text-muted-foreground">
                            Access documents and chat features
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="org_admin">
                      <div className="flex items-center gap-2">
                        <Shield size={16} />
                        <div>
                          <div>Admin</div>
                          <div className="text-xs text-muted-foreground">
                            Manage users and organization settings
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              {!isPlatformOwner && (
                <Button
                  type="submit"
                  disabled={loading || !hasChanges}
                >
                  {loading ? 'Updating...' : 'Update Role'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};