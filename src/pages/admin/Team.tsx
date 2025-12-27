import { useState, useEffect } from 'react';
import { useAuth, AdminRole } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from '@/lib/auditLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, UserPlus, Trash2, ArrowUpCircle, ArrowDownCircle, Search, Users, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MAX_ADMINS = 10;

interface AdminUser {
  id: string;
  user_id: string;
  role: AdminRole;
  email: string;
  full_name: string;
  created_at: string;
}

interface SearchResult {
  id: string;
  email: string;
  full_name: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
  officer: 'Officer',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-primary text-primary-foreground',
  admin: 'bg-blue-500 text-white',
  moderator: 'bg-green-500 text-white',
  officer: 'bg-amber-500 text-white',
};

export default function Team() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<AdminUser | null>(null);
  const [processing, setProcessing] = useState(false);

  // Only super_admin can access this page
  useEffect(() => {
    if (userRole && userRole !== 'super_admin') {
      toast.error('Access denied. Super Admin only.');
      navigate('/admin');
    }
  }, [userRole, navigate]);

  // Fetch all admins
  const fetchAdmins = async () => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, created_at')
        .in('role', ['super_admin', 'admin', 'moderator', 'officer'])
        .order('created_at', { ascending: true });

      if (roleError) throw roleError;

      // Get profiles for these users
      const userIds = roleData?.map(r => r.user_id) || [];
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Merge data
      const mergedAdmins: AdminUser[] = (roleData || []).map(role => {
        const profile = profileData?.find(p => p.id === role.user_id);
        return {
          id: role.id,
          user_id: role.user_id,
          role: role.role as AdminRole,
          email: profile?.email || 'Unknown',
          full_name: profile?.full_name || 'Unknown',
          created_at: role.created_at,
        };
      });

      setAdmins(mergedAdmins);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'super_admin') {
      fetchAdmins();
    }
  }, [userRole]);

  // Search users by email
  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('email', `%${searchEmail}%`)
        .limit(10);

      if (error) throw error;

      // Filter out users who are already admins
      const existingAdminIds = admins.map(a => a.user_id);
      const filtered = (data || []).filter(u => !existingAdminIds.includes(u.id));
      
      setSearchResults(filtered);
      if (filtered.length === 0) {
        toast.info('No users found or all matching users are already admins');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  // Add new admin
  const handleAddAdmin = async () => {
    if (!selectedUser) return;
    
    if (admins.length >= MAX_ADMINS) {
      toast.error(`Maximum admin limit (${MAX_ADMINS}) reached`);
      return;
    }

    setProcessing(true);
    try {
      // First check if user already has a role entry
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('user_id', selectedUser.id)
        .maybeSingle();

      const roleValue = selectedRole as 'super_admin' | 'admin' | 'moderator' | 'officer';

      if (existing) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: roleValue })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert([{
            user_id: selectedUser.id,
            role: roleValue,
          }]);

        if (error) throw error;
      }

      await logAdminAction({
        action: 'create',
        entityType: 'admin_role',
        entityId: selectedUser.id,
        details: {
          email: selectedUser.email,
          role: selectedRole,
        },
      });

      toast.success(`${selectedUser.email} added as ${ROLE_LABELS[selectedRole]}`);
      setAddDialogOpen(false);
      setSelectedUser(null);
      setSearchEmail('');
      setSearchResults([]);
      fetchAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Failed to add admin');
    } finally {
      setProcessing(false);
    }
  };

  // Change role
  const handleChangeRole = async (admin: AdminUser, newRole: string) => {
    // Prevent demoting the last super_admin
    if (admin.role === 'super_admin' && newRole !== 'super_admin') {
      const superAdminCount = admins.filter(a => a.role === 'super_admin').length;
      if (superAdminCount <= 1) {
        toast.error('Cannot demote the last Super Admin');
        return;
      }
    }

    // Prevent self-demotion from super_admin
    if (admin.user_id === user?.id && admin.role === 'super_admin' && newRole !== 'super_admin') {
      toast.error('Cannot demote yourself from Super Admin');
      return;
    }

    setProcessing(true);
    try {
      const roleValue = newRole as 'super_admin' | 'admin' | 'moderator' | 'officer';
      const { error } = await supabase
        .from('user_roles')
        .update({ role: roleValue })
        .eq('id', admin.id);

      if (error) throw error;

      await logAdminAction({
        action: 'update',
        entityType: 'admin_role',
        entityId: admin.user_id,
        details: {
          email: admin.email,
          previousRole: admin.role,
          newRole: newRole,
        },
      });

      toast.success(`${admin.email} role changed to ${ROLE_LABELS[newRole]}`);
      fetchAdmins();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Failed to change role');
    } finally {
      setProcessing(false);
    }
  };

  // Remove admin
  const handleRemoveAdmin = async () => {
    if (!adminToRemove) return;

    // Prevent removing the last super_admin
    if (adminToRemove.role === 'super_admin') {
      const superAdminCount = admins.filter(a => a.role === 'super_admin').length;
      if (superAdminCount <= 1) {
        toast.error('Cannot remove the last Super Admin');
        setRemoveDialogOpen(false);
        return;
      }
    }

    // Prevent self-removal
    if (adminToRemove.user_id === user?.id) {
      toast.error('Cannot remove yourself');
      setRemoveDialogOpen(false);
      return;
    }

    setProcessing(true);
    try {
      // Set role back to 'user'
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'user' })
        .eq('id', adminToRemove.id);

      if (error) throw error;

      await logAdminAction({
        action: 'delete',
        entityType: 'admin_role',
        entityId: adminToRemove.user_id,
        details: {
          email: adminToRemove.email,
          previousRole: adminToRemove.role,
        },
      });

      toast.success(`${adminToRemove.email} removed from team`);
      setRemoveDialogOpen(false);
      setAdminToRemove(null);
      fetchAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to remove admin');
    } finally {
      setProcessing(false);
    }
  };

  if (userRole !== 'super_admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Team Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage admin access and roles
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Users className="h-4 w-4 mr-2" />
            {admins.length} / {MAX_ADMINS} Admins
          </Badge>
          <Button 
            onClick={() => setAddDialogOpen(true)}
            disabled={admins.length >= MAX_ADMINS}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        </div>
      </div>

      {/* Limit Warning */}
      {admins.length >= MAX_ADMINS && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="text-destructive">Maximum admin limit ({MAX_ADMINS}) reached. Remove an admin to add new ones.</p>
        </div>
      )}

      {/* Admin Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading team members...
                </TableCell>
              </TableRow>
            ) : admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No team members found
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    {admin.full_name}
                    {admin.user_id === user?.id && (
                      <Badge variant="secondary" className="ml-2">You</Badge>
                    )}
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Select
                      value={admin.role || ''}
                      onValueChange={(value) => handleChangeRole(admin, value)}
                      disabled={processing}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="officer">Officer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setAdminToRemove(admin);
                        setRemoveDialogOpen(true);
                      }}
                      disabled={admin.user_id === user?.id || processing}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Role Permissions Info */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Role Permissions</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Badge className={ROLE_COLORS.super_admin}>Super Admin</Badge>
            <p className="text-sm text-muted-foreground">Full access + manage team</p>
          </div>
          <div className="space-y-2">
            <Badge className={ROLE_COLORS.admin}>Admin</Badge>
            <p className="text-sm text-muted-foreground">Products, orders, delivery, settings</p>
          </div>
          <div className="space-y-2">
            <Badge className={ROLE_COLORS.moderator}>Moderator</Badge>
            <p className="text-sm text-muted-foreground">Products, orders, banners</p>
          </div>
          <div className="space-y-2">
            <Badge className={ROLE_COLORS.officer}>Officer</Badge>
            <p className="text-sm text-muted-foreground">Orders management only</p>
          </div>
        </div>
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Search for a registered user by email to add them as an admin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                      selectedUser?.id === result.id ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => setSelectedUser(result)}
                  >
                    <p className="font-medium">{result.full_name || 'No name'}</p>
                    <p className="text-sm text-muted-foreground">{result.email}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className="space-y-3 p-3 bg-muted rounded-lg">
                <p className="font-medium">Selected: {selectedUser.email}</p>
                <div className="space-y-2">
                  <Label>Assign Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="officer">Officer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddAdmin} 
              disabled={!selectedUser || processing}
            >
              {processing ? 'Adding...' : 'Add Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {adminToRemove?.email} from the team?
              They will lose all admin access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveAdmin}
              disabled={processing}
            >
              {processing ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}