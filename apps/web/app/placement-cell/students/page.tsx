'use client';

import * as React from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api, ApiError } from '@/lib/api';
import { Role, UserStatus } from '@campusedge/shared';
import { Search, RefreshCw } from 'lucide-react';

interface StudentItem {
  id: string;
  email: string;
  fullName?: string;
  status: UserStatus;
  createdAt: string;
  studentProfile?: {
    degree: string;
    branchCode: string;
    batchYear: number;
    cgpa: number;
    activeBacklogs: number;
  } | null;
}

export default function PlacementCellStudentsPage() {
  const [students, setStudents] = React.useState<StudentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const fetchStudents = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let query = `/colleges/my-college/students?page=1&limit=100`;
      if (statusFilter !== 'ALL') {
        query += `&status=${statusFilter}`;
      }
      if (search) {
        query += `&search=${encodeURIComponent(search)}`;
      }
      const data = await api.get<{ data: StudentItem[] }>(query);
      setStudents(data.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleDecision = async (studentId: string, decision: 'APPROVE' | 'REJECT' | 'SUSPEND') => {
    setActionLoading(studentId);
    try {
      await api.patch(`/colleges/my-college/students/${studentId}`, { decision });
      await fetchStudents();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: UserStatus) => {
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar
        user={{
          email: 'Placement Officer',
          role: Role.COLLEGE_ADMIN,
          status: 'ACTIVE',
        }}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Student Roster Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Verify credentials, manage drive eligibility, and take administrative actions.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => fetchStudents()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">{error}</div>
        )}

        {/* Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="w-full sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ALL">All Statuses</option>
                  <option value={UserStatus.PENDING_APPROVAL}>Pending Approval</option>
                  <option value={UserStatus.ACTIVE}>Active</option>
                  <option value={UserStatus.SUSPENDED}>Suspended</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Registered Students ({students.length})</CardTitle>
            <CardDescription>
              Students who registered selecting your institutional domain.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-y text-xs text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Academic Info</th>
                    <th className="px-4 py-3">CGPA / Backlogs</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading student records...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {student.fullName || 'Student'}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          {student.studentProfile ? (
                            <div>
                              <p className="text-xs font-semibold">
                                {student.studentProfile.degree} ({student.studentProfile.branchCode}
                                )
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Class of {student.studentProfile.batchYear}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Incomplete</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {student.studentProfile ? (
                            <div className="text-xs">
                              <span className="font-semibold">
                                {student.studentProfile.cgpa} CGPA
                              </span>
                              <span className="text-muted-foreground ml-1.5">
                                ({student.studentProfile.activeBacklogs} backlogs)
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(student.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {student.status === UserStatus.PENDING_APPROVAL && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  disabled={actionLoading === student.id}
                                  onClick={() => handleDecision(student.id, 'APPROVE')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8"
                                  disabled={actionLoading === student.id}
                                  onClick={() => handleDecision(student.id, 'REJECT')}
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {student.status === UserStatus.ACTIVE && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                                disabled={actionLoading === student.id}
                                onClick={() => handleDecision(student.id, 'SUSPEND')}
                              >
                                Suspend
                              </Button>
                            )}

                            {student.status === UserStatus.SUSPENDED && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-emerald-600 border-emerald-600/30 hover:bg-emerald-50"
                                disabled={actionLoading === student.id}
                                onClick={() => handleDecision(student.id, 'APPROVE')}
                              >
                                Reactivate
                              </Button>
                            )}
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
      </main>
    </div>
  );
}
