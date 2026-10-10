'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Role, UserStatus } from '@campusedge/shared';
import { BookOpen, Clock, Sparkles, UserCheck, AlertCircle, RotateCcw } from 'lucide-react';

interface StudentProfileResponse {
  id?: string;
  email?: string;
  fullName?: string;
  role?: Role;
  status?: UserStatus;
  college?: {
    id?: string;
    name?: string;
    code?: string;
    slug?: string;
  };
  studentProfile?: {
    degree?: string;
    branchCode?: string;
    branchName?: string;
    batchYear?: number;
    cgpa?: number;
    activeBacklogs?: number;
    skills?: Array<{ skillName: string; proficiency: string }>;
  };
  degree?: string;
  branchCode?: string;
  batchYear?: number;
  cgpa?: number;
  activeBacklogs?: number;
  completionPercentage?: number;
  profileCompletion?: number;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<StudentProfileResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Attempt to load student profile
      let data: StudentProfileResponse;
      try {
        data = await api.get<StudentProfileResponse>('/students/me/profile');
      } catch (err: unknown) {
        // If 404 or missing profile, check canonical /me state
        try {
          const meData = await api.get<StudentProfileResponse & { onboardingStep?: string }>('/me');
          if (
            meData.status === UserStatus.ONBOARDING ||
            meData.onboardingStep !== 'COMPLETED' ||
            !meData.studentProfile
          ) {
            router.push('/student/onboarding');
            return;
          }
          data = {
            id: meData.id,
            email: meData.email,
            fullName: meData.fullName,
            role: meData.role,
            status: meData.status,
            college: meData.college,
            studentProfile: meData.studentProfile,
            completionPercentage: meData.profileCompletion ?? 85,
          };
        } catch {
          throw err;
        }
      }

      setProfile(data);

      // If user is in ONBOARDING state, redirect to onboarding
      if (data.status === UserStatus.ONBOARDING) {
        router.push('/student/onboarding');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusBadge = (status?: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return <Badge variant="success">Active</Badge>;
      case UserStatus.PENDING_APPROVAL:
        return <Badge variant="warning">Pending Approval</Badge>;
      case UserStatus.SUSPENDED:
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Onboarding</Badge>;
    }
  };

  const displayName =
    profile?.fullName || (profile?.email ? profile.email.split('@')[0] : 'Student');
  const collegeName = profile?.college?.name || 'Your College';
  const collegeCode = profile?.college?.code || profile?.college?.slug?.toUpperCase() || '';
  const degree = profile?.studentProfile?.degree || profile?.degree || 'Engineering';
  const branch = profile?.studentProfile?.branchCode || profile?.branchCode || '';
  const batchYear = profile?.studentProfile?.batchYear || profile?.batchYear;
  const completion = profile?.completionPercentage ?? profile?.profileCompletion ?? 85;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar
        user={
          profile?.email
            ? {
                email: profile.email,
                role: profile.role || Role.STUDENT,
                status: profile.status || UserStatus.ACTIVE,
                fullName: profile.fullName,
              }
            : null
        }
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {loading ? (
          <div className="space-y-6 animate-pulse" data-testid="dashboard-loading-skeleton">
            {/* Banner Skeleton */}
            <div className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
            {/* Completion Card Skeleton */}
            <div className="h-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
            {/* Feature Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ) : error ? (
          <Card className="border-destructive/20 shadow-md">
            <CardHeader>
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <CardTitle className="text-lg">Dashboard Error</CardTitle>
              </div>
              <CardDescription>We could not load your dashboard data at this time.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive font-mono">
                {error}
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex gap-3">
              <Button onClick={() => loadData()} variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button asChild size="sm">
                <Link href="/student/onboarding">Go to Onboarding</Link>
              </Button>
            </div>
          </Card>
        ) : profile ? (
          <>
            {/* Banner Header */}
            <div className="rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                      Welcome back, {displayName}!
                    </h1>
                    {getStatusBadge(profile.status)}
                  </div>
                  <p className="text-blue-100 text-sm">
                    {collegeName}
                    {collegeCode ? ` (${collegeCode})` : ''}
                    {branch ? ` \u2022 ${degree} in ${branch}` : ` \u2022 ${degree}`}
                    {batchYear ? ` \u2022 Class of ${batchYear}` : ''}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/student/profile">View Academic Profile</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Verification Notice if Pending */}
            {profile.status === UserStatus.PENDING_APPROVAL && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 flex items-start space-x-3">
                <Clock className="h-5 w-5 mt-0.5 text-amber-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Placement Cell Verification In Progress</p>
                  <p className="text-xs mt-0.5">
                    Your college placement officer has not yet approved your student account. Once
                    approved, you will have full access to campus placement drives and AI mock
                    interviews.
                  </p>
                </div>
              </div>
            )}

            {/* Profile Completion Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Profile Completion</CardTitle>
                    <CardDescription>
                      Complete your profile to increase your visibility to recruiting partners
                    </CardDescription>
                  </div>
                  <span className="text-2xl font-bold text-primary">{completion}%</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2 text-primary mb-2">
                    <BookOpen className="h-5 w-5" />
                    <CardTitle className="text-base">Placement Drives</CardTitle>
                  </div>
                  <CardDescription>
                    Browse and register for campus recruitment opportunities matching your CGPA and
                    branch.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {profile.status === UserStatus.ACTIVE
                      ? 'No active placement drives published yet.'
                      : 'Requires placement cell account verification.'}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2 text-indigo-600 mb-2">
                    <Sparkles className="h-5 w-5" />
                    <CardTitle className="text-base">AI Mock Interview Prep</CardTitle>
                  </div>
                  <CardDescription>
                    Practice coding and technical questions customized to past hiring trends at{' '}
                    {collegeName}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">Coming in Phase 2</Badge>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2 text-emerald-600 mb-2">
                    <UserCheck className="h-5 w-5" />
                    <CardTitle className="text-base">Academic & DPDP Controls</CardTitle>
                  </div>
                  <CardDescription>
                    Review statutory consents, update skills catalog, or submit data export/erasure
                    requests.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/student/profile">Manage Profile & Privacy</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
