'use client';

import * as React from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api, ApiError } from '@/lib/api';
import { Role, UserStatus } from '@campusedge/shared';
import { Search, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  fullName?: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  college?: {
    name: string;
    code: string;
  } | null;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [roleFilter, setRoleFilter] = React.useState<string>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let query = `/admin/users?page=1&limit=50`;
      if (roleFilter !== 'ALL') query += `&role=${roleFilter}`;
      if (statusFilter !== 'ALL') query += `&status=${statusFilter}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const data = await api.get<{ data: UserItem[] }>(query);
      setUsers(data.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleUserStatus = async (user: UserItem) => {
    setActionLoading(user.id);
    setError(null);
    setSuccess(null);

    const nextStatus =
      user.status === UserStatus.SUSPENDED ? UserStatus.ACTIVE : UserStatus.SUSPENDED;

    try {
      await api.patch(`/admin/users/${user.id}/status`, { status: nextStatus });
      setSuccess(`User status for ${user.email} updated to ${nextStatus}.`);
      await fetchUsers();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return <Badge variant="destructive">SUPER ADMIN</Badge>;
      case Role.COLLEGE_ADMIN:
        return <Badge variant="warning">COLLEGE ADMIN</Badge>;
      default:
        return <Badge variant="secondary">STUDENT</Badge>;
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return <Badge variant="success">ACTIVE</Badge>;
      case UserStatus.SUSPENDED:
        return <Badge variant="destructive">SUSPENDED</Badge>;
      case UserStatus.PENDING_APPROVAL:
        return <Badge variant="warning">PENDING</Badge>;
      default:
        return <Badge variant="outline">ONBOARDING</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar
        user={{
          email: 'Super Administrator',
          role: Role.SUPER_ADMIN,
          status: 'ACTIVE',
        }}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Platform Users Directory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Global directory of students, placement administrators, and platform staff.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => fetchUsers()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 flex items-center space-x-2">
            <Check className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="w-full sm:w-44">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ALL">All Roles</option>
                  <option value={Role.STUDENT}>Students</option>
                  <option value={Role.COLLEGE_ADMIN}>College Admins</option>
                  <option value={Role.SUPER_ADMIN}>Super Admins</option>
                </select>
              </div>

              <div className="w-full sm:w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ALL">All Statuses</option>
                  <option value={UserStatus.ACTIVE}>Active</option>
                  <option value={UserStatus.PENDING_APPROVAL}>Pending</option>
                  <option value={UserStatus.ONBOARDING}>Onboarding</option>
                  <option value={UserStatus.SUSPENDED}>Suspended</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Registered Users ({users.length})</CardTitle>
            <CardDescription>
              Authenticated identities mapped across institutional tenants.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-y text-xs text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Affiliation</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{u.fullName || 'User'}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">{getRoleBadge(u.role)}</td>
                        <td className="px-4 py-3 text-xs">
                          {u.college ? (
                            <span className="font-medium text-foreground">
                              {u.college.name} ({u.college.code})
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">None / Platform</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(u.status)}</td>
                        <td className="px-4 py-3 text-right">
                          {u.role !== Role.SUPER_ADMIN && (
                            <Button
                              size="sm"
                              variant={u.status === UserStatus.SUSPENDED ? 'default' : 'outline'}
                              className={`h-8 ${
                                u.status === UserStatus.SUSPENDED
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'text-destructive border-destructive/30 hover:bg-destructive/10'
                              }`}
                              disabled={actionLoading === u.id}
                              onClick={() => handleToggleUserStatus(u)}
                            >
                              {u.status === UserStatus.SUSPENDED ? 'Reactivate' : 'Suspend'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
