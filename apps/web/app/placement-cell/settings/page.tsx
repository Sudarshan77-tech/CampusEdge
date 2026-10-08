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
import { api, ApiError } from '@/lib/api';
import { Role } from '@campusedge/shared';
import { Check, Plus, Trash2, AlertCircle } from 'lucide-react';

interface CollegeDetails {
  id: string;
  name: string;
  code: string;
  emailDomains: string[];
  requireStudentApproval: boolean;
  branches: Array<{ id: string; branchCode: string; branchName: string }>;
}

export default function PlacementCellSettingsPage() {
  const [college, setCollege] = React.useState<CollegeDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Form states
  const [emailDomainsStr, setEmailDomainsStr] = React.useState('');
  const [requireApproval, setRequireApproval] = React.useState(false);

  // Add branch form states
  const [newBranchCode, setNewBranchCode] = React.useState('');
  const [newBranchName, setNewBranchName] = React.useState('');
  const [branchSaving, setBranchSaving] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<CollegeDetails>('/colleges/my-college');
      setCollege(data);
      setEmailDomainsStr(data.emailDomains.join(', '));
      setRequireApproval(data.requireStudentApproval);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveCollegeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const domains = emailDomainsStr
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);

      await api.patch('/colleges/my-college', {
        emailDomains: domains,
        requireStudentApproval: requireApproval,
      });

      setSuccess('College settings successfully saved!');
      await loadData();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchCode.trim() || !newBranchName.trim()) return;

    setError(null);
    setBranchSaving(true);

    try {
      await api.post('/colleges/my-college/branches', {
        branchCode: newBranchCode.trim().toUpperCase(),
        branchName: newBranchName.trim(),
      });
      setNewBranchCode('');
      setNewBranchName('');
      await loadData();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBranchSaving(false);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    setError(null);
    try {
      await api.delete(`/colleges/my-college/branches/${branchId}`);
      await loadData();
    } catch (err) {
      setError((err as ApiError).message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar
        user={{
          email: 'Placement Officer',
          role: Role.COLLEGE_ADMIN,
          status: 'ACTIVE',
        }}
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Institutional Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage institutional email domains, verification policies, and academic departments.
          </p>
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

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading settings...</div>
        ) : college ? (
          <>
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">College Settings</CardTitle>
                <CardDescription>
                  Configure automated activation domains and student approval controls.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSaveCollegeSettings}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">College Name</Label>
                      <Input value={college.name} disabled />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Institutional Code</Label>
                      <Input value={college.code} disabled />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="domains">Allowed Email Domains (Comma-separated)</Label>
                    <Input
                      id="domains"
                      value={emailDomainsStr}
                      onChange={(e) => setEmailDomainsStr(e.target.value)}
                      placeholder="e.g. apex.edu, student.apex.edu"
                    />
                    <p className="text-xs text-muted-foreground">
                      Students signing up with an email matching one of these domains will be
                      automatically verified as ACTIVE upon finishing onboarding (unless mandatory
                      manual approval is enabled below).
                    </p>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requireApproval}
                        onChange={(e) => setRequireApproval(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="text-sm">
                        <span className="font-semibold text-foreground">
                          Require Mandatory Placement Cell Approval
                        </span>
                        <p className="text-xs text-muted-foreground">
                          If checked, ALL students will enter PENDING_APPROVAL status until manually
                          verified by an administrator, even if their email domain matches.
                        </p>
                      </div>
                    </label>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Department Branches */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Academic Branches & Departments</CardTitle>
                <CardDescription>
                  Departments available for student onboarding and placement screening.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* List existing */}
                <div className="divide-y rounded-md border text-sm">
                  {college.branches && college.branches.length > 0 ? (
                    college.branches.map((b) => (
                      <div key={b.id} className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-foreground">{b.branchName}</span>
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            ({b.branchCode})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteBranch(b.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-xs text-muted-foreground text-center">
                      No branches added yet.
                    </p>
                  )}
                </div>

                {/* Add new branch form */}
                <form
                  onSubmit={handleAddBranch}
                  className="rounded-lg border p-4 bg-muted/20 space-y-3"
                >
                  <p className="text-sm font-semibold">Add New Academic Branch</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="branchCode" className="text-xs">
                        Branch Code (e.g. CSE, AIML)
                      </Label>
                      <Input
                        id="branchCode"
                        value={newBranchCode}
                        onChange={(e) => setNewBranchCode(e.target.value)}
                        placeholder="CSE"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="branchName" className="text-xs">
                        Branch Full Name
                      </Label>
                      <Input
                        id="branchName"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="Computer Science & Engineering"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={branchSaving}>
                      <Plus className="h-4 w-4 mr-1" />
                      {branchSaving ? 'Adding...' : 'Add Department Branch'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}
