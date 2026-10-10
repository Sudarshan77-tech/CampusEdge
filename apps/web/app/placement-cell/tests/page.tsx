'use client';

import * as React from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Role } from '@campusedge/shared';
import { Users, Download, FileSpreadsheet } from 'lucide-react';

interface AttendanceMetrics {
  scheduleId: string;
  scheduleTitle: string;
  startsAt: string;
  endsAt: string;
  totalAssigned: number;
  inProgress: number;
  submitted: number;
  abandoned: number;
  averageScore: number;
  integrityFlaggedCount: number;
}

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: Role;
  status: string;
}

export default function PlacementCellTestsPage() {
  const [scheduleId, setScheduleId] = React.useState<string>('');
  const [attendance, setAttendance] = React.useState<AttendanceMetrics | null>(null);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [exportPurpose, setExportPurpose] = React.useState<string>('Placement Drive Shortlisting');

  React.useEffect(() => {
    async function loadUser() {
      try {
        const u = await api.get<UserProfile>('/students/me/profile');
        setUser(u);
      } catch {
        // ignore
      }
    }
    loadUser();
  }, []);

  const fetchAttendance = async () => {
    if (!scheduleId.trim()) {
      setError('Please provide a Test Schedule UUID');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<AttendanceMetrics>(
        `/placement-cell/readiness/schedules/${scheduleId.trim()}/attendance`,
      );
      setAttendance(data);
    } catch (err) {
      setError((err as Error).message);
      setAttendance(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (!scheduleId.trim()) return;
    try {
      setExporting(true);
      const csvData = await api.get<string>(
        `/placement-cell/readiness/schedules/${scheduleId.trim()}/export-csv?purpose=${encodeURIComponent(
          exportPurpose,
        )}`,
      );

      const blob = new Blob([typeof csvData === 'string' ? csvData : JSON.stringify(csvData)], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assessment-results-${scheduleId.trim()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Assessment & Attendance Monitoring
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Real-time proctored session monitoring, integrity flag audits, and DPDP-compliant ranked
            CSV export.
          </p>
        </div>

        {/* Schedule Selector Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Select Assessment Schedule</CardTitle>
            <CardDescription>
              Enter the Test Schedule UUID from your scheduled drive to inspect live metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. 11111111-2222-3333-4444-555555555555"
                value={scheduleId}
                onChange={(e) => setScheduleId(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
              />
              <Button
                onClick={fetchAttendance}
                disabled={loading}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Users className="h-4 w-4" />
                {loading ? 'Fetching...' : 'Monitor Live Attendance'}
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-destructive/15 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {attendance && (
          <div className="space-y-6">
            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-2">
                  <span className="text-xs uppercase font-bold text-slate-500">In Progress</span>
                  <CardTitle className="text-2xl font-bold text-blue-600">
                    {attendance.inProgress}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500">Actively taking assessment</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-2">
                  <span className="text-xs uppercase font-bold text-slate-500">Submitted</span>
                  <CardTitle className="text-2xl font-bold text-emerald-600">
                    {attendance.submitted}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500">Finalized and scored</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-2">
                  <span className="text-xs uppercase font-bold text-slate-500">Average Score</span>
                  <CardTitle className="text-2xl font-bold text-indigo-600">
                    {attendance.averageScore.toFixed(1)}%
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500">Cohort mean accuracy</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-2">
                  <span className="text-xs uppercase font-bold text-slate-500">
                    Integrity Flags
                  </span>
                  <CardTitle
                    className={`text-2xl font-bold ${
                      attendance.integrityFlaggedCount > 0 ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {attendance.integrityFlaggedCount}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500">Tab blurs or integrity events</p>
                </CardContent>
              </Card>
            </div>

            {/* Export Card */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  DPDP Act Compliant Results Export
                </CardTitle>
                <CardDescription>
                  Exports candidate rankings with formula scores. An immutable audit trail entry is
                  logged with your specified institutional purpose.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Institutional Purpose (DPDP Compliance Log):
                  </label>
                  <input
                    type="text"
                    value={exportPurpose}
                    onChange={(e) => setExportPurpose(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleExportCsv}
                    disabled={exporting}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    <Download className="h-4 w-4" />
                    {exporting ? 'Generating Signed CSV...' : 'Download Results CSV'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
