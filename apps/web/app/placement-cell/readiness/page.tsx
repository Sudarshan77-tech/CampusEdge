'use client';

import * as React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { Role } from '@campusedge/shared';
import { ShieldAlert, Filter, Calendar } from 'lucide-react';

interface BandMetric {
  count: number;
  percentage: number;
}

interface CohortDistributionResponse {
  masked: boolean;
  totalStudents: number;
  message?: string;
  bands?: {
    GETTING_STARTED: BandMetric;
    BUILDING: BandMetric;
    COMPETITIVE: BandMetric;
    STRONG: BandMetric;
  };
  averageScore?: number;
}

interface TopicHeatmapItem {
  topicId: string;
  topicName: string;
  category: string;
  averageMastery: number;
  weakCount: number;
  moderateCount: number;
  strongCount: number;
}

interface TopicHeatmapResponse {
  masked: boolean;
  totalStudents: number;
  message?: string;
  topics?: TopicHeatmapItem[];
}

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: Role;
  status: string;
}

export default function PlacementCellReadinessPage() {
  const [distribution, setDistribution] = React.useState<CohortDistributionResponse | null>(null);
  const [heatmap, setHeatmap] = React.useState<TopicHeatmapResponse | null>(null);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [batchYear, setBatchYear] = React.useState<string>('');

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query = batchYear ? `?batchYear=${batchYear}` : '';
      const [userData, distData, heatData] = await Promise.all([
        api.get<UserProfile>('/students/me/profile'),
        api.get<CohortDistributionResponse>(
          `/placement-cell/readiness/cohort-distribution${query}`,
        ),
        api.get<TopicHeatmapResponse>(`/placement-cell/readiness/topic-heatmap${query}`),
      ]);
      setUser(userData);
      setDistribution(distData);
      setHeatmap(heatData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [batchYear]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Institutional Readiness Cockpit
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Cohort-wide readiness band distribution and topic mastery intelligence for placement
              planning.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/placement-cell/tests">
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Calendar className="h-4 w-4" />
                Schedule & Monitor Tests
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Filter className="h-4 w-4 text-indigo-600" />
                Filter Cohort:
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Batch Year:</label>
                <select
                  value={batchYear}
                  onChange={(e) => setBatchYear(e.target.value)}
                  className="h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="">All Batches</option>
                  <option value="2025">Class of 2025</option>
                  <option value="2026">Class of 2026</option>
                  <option value="2027">Class of 2027</option>
                </select>
              </div>
            </div>

            <Button onClick={fetchData} variant="outline" size="sm" className="gap-1.5">
              Apply Filter
            </Button>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Aggregating cohort assessment data...
          </div>
        ) : error ? (
          <div className="rounded-lg bg-destructive/15 p-4 text-destructive">{error}</div>
        ) : distribution ? (
          <>
            {/* ADR 0004 Differential Privacy Masking Notice */}
            {distribution.masked ? (
              <Card className="border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 shadow-md">
                <CardContent className="p-8 text-center space-y-4">
                  <ShieldAlert className="h-12 w-12 text-amber-600 mx-auto" />
                  <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200">
                    Differential Privacy Masking Applied (ADR 0004)
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-300 max-w-xl mx-auto">
                    The selected cohort has {distribution.totalStudents} student
                    {distribution.totalStudents === 1 ? '' : 's'}. Aggregated readiness metrics are
                    masked for groups under 3 students to prevent deanonymization and comply with
                    the DPDP Act.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* 4-Band Cohort Distribution Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Strong */}
                  <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm">
                    <CardHeader className="pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Strong (80-100)
                      </span>
                      <CardTitle className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-200">
                        {distribution.bands?.STRONG.count || 0}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-emerald-800 dark:text-emerald-400">
                        {distribution.bands?.STRONG.percentage.toFixed(1)}% of cohort ready for
                        premium tier offers
                      </p>
                    </CardContent>
                  </Card>

                  {/* Competitive */}
                  <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm">
                    <CardHeader className="pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                        Competitive (60-79)
                      </span>
                      <CardTitle className="text-3xl font-extrabold text-blue-900 dark:text-blue-200">
                        {distribution.bands?.COMPETITIVE.count || 0}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-blue-800 dark:text-blue-400">
                        {distribution.bands?.COMPETITIVE.percentage.toFixed(1)}% of cohort in
                        competitive range
                      </p>
                    </CardContent>
                  </Card>

                  {/* Building */}
                  <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm">
                    <CardHeader className="pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Building (40-59)
                      </span>
                      <CardTitle className="text-3xl font-extrabold text-amber-900 dark:text-amber-200">
                        {distribution.bands?.BUILDING.count || 0}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-amber-800 dark:text-amber-400">
                        {distribution.bands?.BUILDING.percentage.toFixed(1)}% active learners
                        building foundation
                      </p>
                    </CardContent>
                  </Card>

                  {/* Getting Started */}
                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 shadow-sm">
                    <CardHeader className="pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Getting Started (&lt;40)
                      </span>
                      <CardTitle className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {distribution.bands?.GETTING_STARTED.count || 0}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate-500">
                        {distribution.bands?.GETTING_STARTED.percentage.toFixed(1)}% require initial
                        diagnostic baseline
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Cohort Summary Bar */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">
                          Cohort Average Readiness: {Math.round(distribution.averageScore || 0)}/100
                        </h4>
                        <p className="text-xs text-slate-500">
                          Evaluated across {distribution.totalStudents} enrolled students.
                        </p>
                      </div>
                      <Progress
                        value={distribution.averageScore || 0}
                        className="w-full md:w-1/2 h-3"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Topic Mastery Heatmap */}
                {heatmap && !heatmap.masked && heatmap.topics && (
                  <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-xl">Curriculum Topic Mastery Heatmap</CardTitle>
                      <CardDescription>
                        Identifies specific curriculum weaknesses to target for campus workshops and
                        revision sprints.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase">
                              <th className="pb-3">Topic</th>
                              <th className="pb-3">Category</th>
                              <th className="pb-3 text-right">Avg Mastery</th>
                              <th className="pb-3 text-right">Weak (&lt;40%)</th>
                              <th className="pb-3 text-right">Moderate</th>
                              <th className="pb-3 text-right">Strong (≥70%)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {heatmap.topics.map((t) => (
                              <tr
                                key={t.topicId}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                              >
                                <td className="py-3 font-semibold text-slate-900 dark:text-white">
                                  {t.topicName}
                                </td>
                                <td className="py-3 text-xs text-slate-500">{t.category}</td>
                                <td className="py-3 text-right font-mono font-bold">
                                  {Math.round(t.averageMastery * 100)}%
                                </td>
                                <td className="py-3 text-right">
                                  <Badge variant={t.weakCount > 0 ? 'destructive' : 'secondary'}>
                                    {t.weakCount}
                                  </Badge>
                                </td>
                                <td className="py-3 text-right">
                                  <Badge variant="warning">{t.moderateCount}</Badge>
                                </td>
                                <td className="py-3 text-right">
                                  <Badge variant="success">{t.strongCount}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
