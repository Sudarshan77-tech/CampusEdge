'use client';

import * as React from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Role } from '@campusedge/shared';
import { Building2, Globe2 } from 'lucide-react';

interface CollegeOverviewItem {
  collegeId: string;
  collegeName: string;
  collegeCode: string;
  totalStudents: number;
  averageReadiness: number;
  competitiveRatio: number;
  averageAccuracy: number;
}

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: Role;
  status: string;
}

export default function AdminReadinessPage() {
  const [colleges, setColleges] = React.useState<CollegeOverviewItem[]>([]);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [userData, overviewData] = await Promise.all([
          api.get<UserProfile>('/students/me/profile'),
          api.get<CollegeOverviewItem[]>('/admin/readiness/multi-institution-overview'),
        ]);
        setUser(userData);
        setColleges(overviewData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalNetworkStudents = colleges.reduce((sum, c) => sum + c.totalStudents, 0);
  const networkAvgReadiness =
    colleges.length > 0
      ? Math.round(colleges.reduce((sum, c) => sum + c.averageReadiness, 0) / colleges.length)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Globe2 className="h-4 w-4" /> Platform Intelligence
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Multi-Institution Readiness Benchmarking
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Cross-campus diagnostic comparisons, competitive talent distribution, and institutional
            readiness baselines.
          </p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <span className="text-xs uppercase font-bold text-slate-500">
                Partner Institutions
              </span>
              <CardTitle className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {colleges.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Active campus tenants</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <span className="text-xs uppercase font-bold text-slate-500">
                Total Enrolled Candidates
              </span>
              <CardTitle className="text-3xl font-extrabold text-indigo-600">
                {totalNetworkStudents}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Across all branch cohorts</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <span className="text-xs uppercase font-bold text-slate-500">
                Platform Mean Readiness
              </span>
              <CardTitle className="text-3xl font-extrabold text-emerald-600">
                {networkAvgReadiness}/100
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Weighted cross-college average</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Benchmarking multi-institution readiness data...
          </div>
        ) : error ? (
          <div className="rounded-lg bg-destructive/15 p-4 text-destructive">{error}</div>
        ) : (
          /* Institutional Comparison Table */
          <Card className="border-slate-200 dark:border-slate-800 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Institutional Readiness Comparison</CardTitle>
              <CardDescription>
                Ranked by institutional readiness score and placement-ready cohort ratio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase">
                      <th className="pb-3">Institution</th>
                      <th className="pb-3">Code</th>
                      <th className="pb-3 text-right">Students</th>
                      <th className="pb-3 text-right">Avg Readiness</th>
                      <th className="pb-3 text-right">Competitive Ratio</th>
                      <th className="pb-3 text-right">Avg Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {colleges.map((c) => (
                      <tr
                        key={c.collegeId}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
                          {c.collegeName}
                        </td>
                        <td className="py-4 font-mono text-xs text-slate-500">{c.collegeCode}</td>
                        <td className="py-4 text-right">{c.totalStudents}</td>
                        <td className="py-4 text-right">
                          <span className="font-mono font-bold text-indigo-600">
                            {Math.round(c.averageReadiness)}
                          </span>
                          <span className="text-xs text-slate-400">/100</span>
                        </td>
                        <td className="py-4 text-right">
                          <Badge
                            variant="outline"
                            className="border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-950/30"
                          >
                            {c.competitiveRatio.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-4 text-right font-mono">
                          {c.averageAccuracy.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
