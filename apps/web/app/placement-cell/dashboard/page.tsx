'use client';

import * as React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Role } from '@campusedge/shared';
import { Users, UserCheck, Clock, Building2, ArrowRight } from 'lucide-react';

interface CollegeStats {
  totalStudents: number;
  activeStudents: number;
  pendingApproval: number;
  suspendedStudents: number;
  branchesCount: number;
}

interface CollegeInfo {
  id: string;
  name: string;
  code: string;
}

export default function PlacementCellDashboardPage() {
  const [stats, setStats] = React.useState<CollegeStats | null>(null);
  const [college, setCollege] = React.useState<CollegeInfo | null>(null);
  const [userEmail, setUserEmail] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [me, colData, statsData] = await Promise.all([
          api.get<{ email: string; fullName?: string }>('/me'),
          api.get<CollegeInfo>('/colleges/my-college'),
          api.get<CollegeStats>('/colleges/my-college/stats'),
        ]);

        setUserEmail(me.fullName || me.email);
        setCollege(colData);
        setStats(statsData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar
        user={{
          email: userEmail,
          role: Role.COLLEGE_ADMIN,
          status: 'ACTIVE',
        }}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Banner */}
        <div className="rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-lg border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Building2 className="h-4 w-4" />
                <span>Placement Operations Center</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {college ? college.name : 'Placement Cell Administration'}
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                College Code: <strong>{college?.code}</strong> &bull; Verified Institutional Tenant
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button asChild variant="secondary" size="sm">
                <Link href="/placement-cell/students">Review Student Roster</Link>
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">{error}</div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Registered
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : (stats?.totalStudents ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Enrolled student profiles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active & Verified
              </CardTitle>
              <UserCheck className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {loading ? '...' : (stats?.activeStudents ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Eligible for campus hiring</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Approval
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {loading ? '...' : (stats?.pendingApproval ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting roster decision</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Academic Branches
              </CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : (stats?.branchesCount ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Configured departments</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Student Verification</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Screen incoming student registrations, approve verified candidates, or manage
                suspensions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/placement-cell/students">Open Student List</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>College Settings</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Configure allowed college email domains, toggle mandatory approval, and manage
                branch codes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/placement-cell/settings">Manage College Settings</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Audit & Compliance</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Review tamper-evident audit logs of placement officer actions and verification
                decisions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/placement-cell/audit">View Audit Trail</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
