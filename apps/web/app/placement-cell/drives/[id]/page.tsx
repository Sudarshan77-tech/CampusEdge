'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, RefreshCw } from 'lucide-react';
import { DriveStatus, DriveCategory, ApplicationStatus } from '@campusedge/shared';

interface DriveDetail {
  id: string;
  title: string;
  category: DriveCategory;
  status: DriveStatus;
  rowVersion: number;
  visitDate: string | null;
  registrationDeadline: string | null;
  venue: string | null;
  company: { id: string; name: string };
  season: { id: string; label: string };
  roles: {
    id: string;
    title: string;
    jobType: string;
    ctcLpaMin: string;
    ctcLpaMax: string;
    location: string | null;
  }[];
  eligibility: {
    minCgpa: number | null;
    maxActiveBacklogs: number | null;
    allowedDegrees: string[];
  } | null;
  rounds: {
    id: string;
    sequence: number;
    title: string;
    roundType: string;
    mode: string;
  }[];
  _count?: { applications: number };
}

interface Applicant {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
  offeredCtcLpa: number | null;
  student: {
    userId: string;
    enrollmentNumber: string | null;
    cgpa: string | number;
    activeBacklogs: number;
    branch?: { name: string };
    userProfile: { fullName: string; email: string };
  };
}

export default function DriveDetailPage() {
  const params = useParams();
  const driveId = params.id as string;

  const [drive, setDrive] = React.useState<DriveDetail | null>(null);
  const [applicants, setApplicants] = React.useState<Applicant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'applicants'>('applicants');
  const [error, setError] = React.useState<string | null>(null);

  // Bulk actions
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = React.useState(false);

  const fetchDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [driveRes, appRes] = await Promise.all([
        api.get<DriveDetail>(`/drives/${driveId}`),
        api.get<{ items: Applicant[] }>(`/applications?driveId=${driveId}&limit=100`),
      ]);
      setDrive(driveRes);
      setApplicants(appRes.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load drive details');
    } finally {
      setLoading(false);
    }
  }, [driveId]);

  React.useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleTransition = async (nextStatus: DriveStatus) => {
    if (!drive) return;
    try {
      await api.post(`/drives/${drive.id}/transition`, {
        status: nextStatus,
        rowVersion: drive.rowVersion,
      });
      fetchDetails();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Status transition failed');
    }
  };

  const handleBulkStatus = async (status: ApplicationStatus) => {
    if (selectedIds.length === 0) return;
    try {
      setBulkLoading(true);
      await api.post('/applications/bulk-status', {
        applicationIds: selectedIds,
        status,
      });
      setSelectedIds([]);
      fetchDetails();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Bulk status update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === applicants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applicants.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  if (loading && !drive) {
    return (
      <div className="container mx-auto p-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (!drive) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-destructive">Drive not found</p>
        <Button asChild className="mt-4">
          <Link href="/placement-cell/drives">Back to Drives</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/placement-cell/drives">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{drive.title}</h1>
              <Badge variant="outline">{drive.company.name}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Season: {drive.season.label} • Current Status:{' '}
              <span className="font-semibold text-foreground">{drive.status}</span>
            </p>
          </div>
        </div>

        {/* Status Transition Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {drive.status === DriveStatus.DRAFT && (
            <Button size="sm" onClick={() => handleTransition(DriveStatus.REGISTRATION_OPEN)}>
              Open Registration
            </Button>
          )}

          {drive.status === DriveStatus.REGISTRATION_OPEN && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleTransition(DriveStatus.REGISTRATION_CLOSED)}
            >
              Close Registration
            </Button>
          )}

          {drive.status === DriveStatus.REGISTRATION_CLOSED && (
            <Button size="sm" onClick={() => handleTransition(DriveStatus.IN_PROGRESS)}>
              Start Interviews
            </Button>
          )}

          {drive.status === DriveStatus.IN_PROGRESS && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleTransition(DriveStatus.COMPLETED)}
            >
              Mark Completed
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={fetchDetails} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('applicants')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'applicants'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Applicants ({applicants.length})
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Drive Overview & Criteria
        </button>
      </div>

      {/* Tab: Applicants */}
      {activeTab === 'applicants' && (
        <div className="space-y-4">
          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium text-primary">
                {selectedIds.length} applicant(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkLoading}
                  onClick={() => handleBulkStatus(ApplicationStatus.SHORTLISTED)}
                >
                  Shortlist
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={bulkLoading}
                  onClick={() => handleBulkStatus(ApplicationStatus.SELECTED)}
                >
                  Mark Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={bulkLoading}
                  onClick={() => handleBulkStatus(ApplicationStatus.REJECTED)}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}

          {applicants.length === 0 ? (
            <Card className="text-center p-8">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No students have registered yet.</p>
            </Card>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-left border-b">
                  <tr>
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === applicants.length}
                        onChange={toggleSelectAll}
                        aria-label="Select all applicants"
                        className="rounded"
                      />
                    </th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">CGPA</th>
                    <th className="p-3">Backlogs</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Applied At</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {applicants.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(app.id)}
                          onChange={() => toggleSelectOne(app.id)}
                          aria-label={`Select ${app.student.userProfile.fullName}`}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3 font-medium">
                        <div>{app.student.userProfile.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {app.student.userProfile.email}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {app.student.enrollmentNumber || 'N/A'}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {app.student.branch?.name || 'N/A'}
                      </td>
                      <td className="p-3 font-semibold">{app.student.cgpa}</td>
                      <td className="p-3">{app.student.activeBacklogs}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            app.status === ApplicationStatus.SELECTED
                              ? 'default'
                              : app.status === ApplicationStatus.SHORTLISTED
                                ? 'warning'
                                : app.status === ApplicationStatus.REJECTED
                                  ? 'destructive'
                                  : 'secondary'
                          }
                        >
                          {app.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Roles & Compensation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {drive.roles.map((role) => (
                <div key={role.id} className="p-3 rounded-lg border bg-muted/20">
                  <div className="font-semibold">{role.title}</div>
                  <div className="text-sm text-muted-foreground">
                    CTC: ₹{role.ctcLpaMin} - ₹{role.ctcLpaMax} LPA • Type: {role.jobType}
                  </div>
                  {role.location && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Location: {role.location}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eligibility Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Minimum CGPA</span>
                <span className="font-semibold">{drive.eligibility?.minCgpa ?? 'No cutoff'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Max Active Backlogs</span>
                <span className="font-semibold">
                  {drive.eligibility?.maxActiveBacklogs ?? 'Any'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Allowed Degrees</span>
                <span className="font-semibold">
                  {drive.eligibility?.allowedDegrees.join(', ') || 'All'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Interview & Selection Rounds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {drive.rounds.map((round) => (
                <div
                  key={round.id}
                  className="flex items-center justify-between p-3 rounded-md border"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                      {round.sequence}
                    </span>
                    <span className="font-medium">{round.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">{round.roundType}</Badge>
                    <Badge variant="secondary">{round.mode}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
