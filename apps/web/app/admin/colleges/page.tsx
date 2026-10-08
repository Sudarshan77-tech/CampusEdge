'use client';

import * as React from 'react';
import { Navbar } from '@/components/Navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api, ApiError } from '@/lib/api';
import { Role, CollegeStatus } from '@campusedge/shared';
import { Plus, Mail, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface CollegeItem {
  id: string;
  name: string;
  code: string;
  slug: string;
  status: CollegeStatus;
  emailDomains: string[];
  requireStudentApproval: boolean;
  createdAt: string;
  _count?: {
    users: number;
    branches: number;
    invitations: number;
  };
}

export default function SuperAdminCollegesPage() {
  const [colleges, setColleges] = React.useState<CollegeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Create College Modal state
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [createName, setCreateName] = React.useState('');
  const [createCode, setCreateCode] = React.useState('');
  const [createSlug, setCreateSlug] = React.useState('');
  const [createDomains, setCreateDomains] = React.useState('');
  const [createLoading, setCreateLoading] = React.useState(false);

  // Invite Admin Modal state
  const [inviteCollege, setInviteCollege] = React.useState<CollegeItem | null>(null);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteName, setInviteName] = React.useState('');
  const [inviteLoading, setInviteLoading] = React.useState(false);

  const fetchColleges = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ data: CollegeItem[] }>('/admin/colleges?page=1&limit=50');
      setColleges(data.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setCreateLoading(true);

    try {
      const domains = createDomains
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);

      await api.post('/admin/colleges', {
        name: createName.trim(),
        code: createCode.trim().toUpperCase(),
        slug: createSlug.trim().toLowerCase(),
        emailDomains: domains,
      });

      setSuccess(`College "${createName}" successfully onboarded!`);
      setShowCreateModal(false);
      setCreateName('');
      setCreateCode('');
      setCreateSlug('');
      setCreateDomains('');
      await fetchColleges();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (college: CollegeItem) => {
    const nextStatus =
      college.status === CollegeStatus.ACTIVE ? CollegeStatus.SUSPENDED : CollegeStatus.ACTIVE;
    try {
      await api.patch(`/admin/colleges/${college.id}/status`, { status: nextStatus });
      await fetchColleges();
    } catch (err) {
      setError((err as ApiError).message);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCollege) return;

    setError(null);
    setSuccess(null);
    setInviteLoading(true);

    try {
      await api.post(`/admin/colleges/${inviteCollege.id}/admins`, {
        email: inviteEmail.trim().toLowerCase(),
        fullName: inviteName.trim(),
      });

      setSuccess(`Placement Administrator invitation sent to ${inviteEmail}!`);
      setInviteCollege(null);
      setInviteEmail('');
      setInviteName('');
      await fetchColleges();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setInviteLoading(false);
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
            <h1 className="text-2xl font-bold tracking-tight">Institutional Tenant Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Onboard colleges, provision institutional placement administrators, and manage tenant
              boundaries.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={() => fetchColleges()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Onboard New College
            </Button>
          </div>
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

        {/* Colleges Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Onboarded Colleges ({colleges.length})</CardTitle>
            <CardDescription>
              Multi-tenant institutional partitions protected by PostgreSQL RLS.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-y text-xs text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">College Name / Slug</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Domains</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading colleges...
                      </td>
                    </tr>
                  ) : colleges.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        No colleges onboarded yet.
                      </td>
                    </tr>
                  ) : (
                    colleges.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{c.slug}</p>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {c.emailDomains && c.emailDomains.length > 0 ? (
                            <span className="font-mono">{c.emailDomains.join(', ')}</span>
                          ) : (
                            <span className="italic">None (Manual Approval)</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={c.status === CollegeStatus.ACTIVE ? 'success' : 'destructive'}
                          >
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => setInviteCollege(c)}
                            >
                              <Mail className="h-3.5 w-3.5 mr-1" />
                              Invite Admin
                            </Button>
                            <Button
                              size="sm"
                              variant={c.status === CollegeStatus.ACTIVE ? 'outline' : 'default'}
                              className={`h-8 ${
                                c.status === CollegeStatus.ACTIVE
                                  ? 'text-destructive border-destructive/30 hover:bg-destructive/10'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                              onClick={() => handleToggleStatus(c)}
                            >
                              {c.status === CollegeStatus.ACTIVE ? 'Suspend' : 'Activate'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal: Create College */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-lg shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Onboard New College</CardTitle>
                <CardDescription>
                  Provision an institutional tenant partition with automated domain verification.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateCollege}>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="colName">College Name</Label>
                    <Input
                      id="colName"
                      required
                      placeholder="Apex Institute of Technology"
                      value={createName}
                      onChange={(e) => {
                        setCreateName(e.target.value);
                        if (!createSlug) {
                          setCreateSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]/g, '-')
                              .replace(/-+/g, '-'),
                          );
                        }
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="colCode">Institutional Code</Label>
                      <Input
                        id="colCode"
                        required
                        placeholder="APEX"
                        value={createCode}
                        onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="colSlug">URL Slug</Label>
                      <Input
                        id="colSlug"
                        required
                        placeholder="apex"
                        value={createSlug}
                        onChange={(e) => setCreateSlug(e.target.value.toLowerCase())}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="colDomains">Allowed Email Domains</Label>
                    <Input
                      id="colDomains"
                      placeholder="apex.edu, student.apex.edu"
                      value={createDomains}
                      onChange={(e) => setCreateDomains(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Comma separated. Students matching these domains auto-activate upon
                      onboarding.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateModal(false)}
                    disabled={createLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? 'Onboarding...' : 'Create College'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}

        {/* Modal: Invite College Admin */}
        {inviteCollege && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Invite College Administrator</CardTitle>
                <CardDescription>
                  Invite a placement officer for <strong>{inviteCollege.name}</strong>.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleInviteAdmin}>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="admName">Full Name</Label>
                    <Input
                      id="admName"
                      required
                      placeholder="Dr. Anand Verma"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="admEmail">Email Address</Label>
                    <Input
                      id="admEmail"
                      type="email"
                      required
                      placeholder="placement.head@apex.edu"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setInviteCollege(null)}
                    disabled={inviteLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteLoading}>
                    {inviteLoading ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
