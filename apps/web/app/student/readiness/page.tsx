'use client';

import * as React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import {
  READINESS_DISCLAIMER,
  ReadinessBand,
  ReadinessConfidence,
  TopicMasteryLevel,
  Role,
} from '@campusedge/shared';
import {
  ShieldAlert,
  Compass,
  Calendar,
  Flame,
  TrendingUp,
  Brain,
  Code2,
  FileQuestion,
  Info,
} from 'lucide-react';

interface ReadinessScoreData {
  overallScore: number;
  confidenceTier: ReadinessConfidence;
  band: ReadinessBand;
  breakdown: {
    aptitude: number;
    technical: number | null;
    mock: number;
    consistency: number;
  };
  formulaVersion: string;
  calculatedAt: string;
}

interface TopicStat {
  topicId: string;
  topicName: string;
  category: string;
  level: TopicMasteryLevel;
  score: number;
  accuracyPercentage: number;
  totalAttempts: number;
  lastPracticedAt: string | null;
}

interface AnalyticsSummary {
  totalAttempts: number;
  overallAccuracy: number;
  totalTimeSpentSeconds: number;
  diagnosticCompleted: boolean;
  technicalTrack: string;
}

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: Role;
  status: string;
}

export default function StudentReadinessPage() {
  const [readiness, setReadiness] = React.useState<ReadinessScoreData | null>(null);
  const [topics, setTopics] = React.useState<TopicStat[]>([]);
  const [summary, setSummary] = React.useState<AnalyticsSummary | null>(null);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [userData, readinessData, topicsData, summaryData] = await Promise.all([
          api.get<UserProfile>('/students/me/profile'),
          api.get<ReadinessScoreData>('/me/readiness'),
          api.get<TopicStat[]>('/me/analytics/topics'),
          api.get<AnalyticsSummary>('/me/analytics/summary'),
        ]);

        setUser(userData);
        setReadiness(readinessData);
        setTopics(topicsData);
        setSummary(summaryData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getBandBadge = (band: ReadinessBand) => {
    switch (band) {
      case ReadinessBand.STRONG:
        return <Badge variant="success">Strong Readiness</Badge>;
      case ReadinessBand.COMPETITIVE:
        return <Badge className="bg-blue-600 text-white">Competitive</Badge>;
      case ReadinessBand.BUILDING:
        return <Badge variant="warning">Building Foundation</Badge>;
      case ReadinessBand.GETTING_STARTED:
      default:
        return <Badge variant="secondary">Getting Started</Badge>;
    }
  };

  const getConfidenceBadge = (tier: ReadinessConfidence) => {
    switch (tier) {
      case ReadinessConfidence.HIGH:
        return (
          <Badge
            variant="outline"
            className="border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30"
          >
            High Confidence
          </Badge>
        );
      case ReadinessConfidence.MEDIUM:
        return (
          <Badge
            variant="outline"
            className="border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/30"
          >
            Medium Confidence
          </Badge>
        );
      case ReadinessConfidence.LOW:
      default:
        return (
          <Badge variant="outline" className="border-slate-400 text-slate-600">
            Low Sample Confidence
          </Badge>
        );
    }
  };

  const getMasteryBadge = (level: TopicMasteryLevel) => {
    switch (level) {
      case TopicMasteryLevel.STRONG:
        return <Badge variant="success">Strong (≥70%)</Badge>;
      case TopicMasteryLevel.MODERATE:
        return <Badge variant="warning">Moderate (40-69%)</Badge>;
      case TopicMasteryLevel.WEAK:
      default:
        return <Badge variant="destructive">Needs Focus (&lt;40%)</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Placement Readiness Cockpit
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Multi-factor diagnostic evaluation based on verified test mastery and consistent
              practice.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/student/roadmap">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                28-Day Roadmap
              </Button>
            </Link>
            <Link href="/student/diagnostics">
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Compass className="h-4 w-4" />
                {summary?.diagnosticCompleted ? 'Retake Diagnostic' : 'Take Diagnostic Baseline'}
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Evaluating your placement readiness...
          </div>
        ) : error ? (
          <div className="rounded-lg bg-destructive/15 p-4 text-destructive">{error}</div>
        ) : readiness ? (
          <>
            {/* Main Score Hero Card */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-md">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  {/* Gauge Display */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">
                      Overall Readiness Score
                    </span>
                    <div className="relative flex items-center justify-center w-40 h-40 rounded-full border-8 border-indigo-600 bg-white dark:bg-slate-900 shadow-inner">
                      <div className="text-center">
                        <span className="text-5xl font-black text-indigo-700 dark:text-indigo-400">
                          {Math.round(readiness.overallScore)}
                        </span>
                        <span className="text-lg text-slate-400 font-bold">/100</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {getBandBadge(readiness.band)}
                      {getConfidenceBadge(readiness.confidenceTier)}
                    </div>
                  </div>

                  {/* Component Breakdown Bars */}
                  <div className="md:col-span-7 space-y-5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                      Readiness Engine Components
                    </h3>

                    {/* Aptitude */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-slate-500" /> Aptitude & Quantitative
                          Mastery
                        </span>
                        <span className="font-bold">
                          {Math.round(readiness.breakdown.aptitude)}%
                        </span>
                      </div>
                      <Progress value={readiness.breakdown.aptitude} className="h-2.5" />
                    </div>

                    {/* Technical (if Software track) */}
                    {readiness.breakdown.technical !== null && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="flex items-center gap-2">
                            <Code2 className="h-4 w-4 text-slate-500" /> Technical & CS Fundamentals
                          </span>
                          <span className="font-bold">
                            {Math.round(readiness.breakdown.technical)}%
                          </span>
                        </div>
                        <Progress value={readiness.breakdown.technical} className="h-2.5" />
                      </div>
                    )}

                    {/* Mock Assessments */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="flex items-center gap-2">
                          <FileQuestion className="h-4 w-4 text-slate-500" /> Timed Mock Assessment
                          Index
                        </span>
                        <span className="font-bold">{Math.round(readiness.breakdown.mock)}%</span>
                      </div>
                      <Progress value={readiness.breakdown.mock} className="h-2.5" />
                    </div>

                    {/* Consistency */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="flex items-center gap-2">
                          <Flame className="h-4 w-4 text-slate-500" /> 14-Day Consistency & Recency
                        </span>
                        <span className="font-bold">
                          {Math.round(readiness.breakdown.consistency)}%
                        </span>
                      </div>
                      <Progress value={readiness.breakdown.consistency} className="h-2.5" />
                    </div>
                  </div>
                </div>

                {/* Mandatory Statutory Preparation Indicator Disclaimer */}
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 text-amber-900 dark:text-amber-200">
                    <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div className="text-xs leading-relaxed">
                      <span className="font-semibold uppercase tracking-wider block mb-1">
                        Statutory Preparation Indicator Notice
                      </span>
                      {READINESS_DISCLAIMER}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Topic Mastery Heatmap & Detailed Breakdown */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Topic Mastery Breakdown</CardTitle>
                    <CardDescription>
                      Bayesian skill estimates weighted by recency decay and question difficulty.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Formula v{readiness.formulaVersion}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {topics.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p className="mb-4">No topic practice data logged yet.</p>
                    <Link href="/student/diagnostics">
                      <Button variant="outline">Take Diagnostic Baseline</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topics.map((t) => (
                      <div
                        key={t.topicId}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                              {t.topicName}
                            </h4>
                            <span className="text-xs text-slate-500 uppercase tracking-wide">
                              {t.category}
                            </span>
                          </div>
                          {getMasteryBadge(t.level)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span>Accuracy: {Math.round(t.accuracyPercentage)}%</span>
                            <span>{t.totalAttempts} attempts</span>
                          </div>
                          <Progress value={t.accuracyPercentage} className="h-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}
