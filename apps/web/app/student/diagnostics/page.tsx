'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { Role } from '@campusedge/shared';
import {
  Compass,
  Clock,
  AlertTriangle,
  Brain,
  FileQuestion,
  Shield,
  ArrowRight,
} from 'lucide-react';

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

export default function StudentDiagnosticsPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [summary, setSummary] = React.useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cooldownMessage, setCooldownMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [userData, summaryData] = await Promise.all([
          api.get<UserProfile>('/students/me/profile'),
          api.get<AnalyticsSummary>('/me/analytics/summary'),
        ]);
        setUser(userData);
        setSummary(summaryData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleStartDiagnostic = async () => {
    try {
      setStarting(true);
      setError(null);
      setCooldownMessage(null);
      const res = await api.post<{ attemptId: string }>('/diagnostics/start', {});
      if (res && res.attemptId) {
        router.push(`/student/assessments/${res.attemptId}`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setCooldownMessage(err.message);
      } else {
        setError((err as Error).message);
      }
    } finally {
      setStarting(false);
    }
  };

  const isSoftware = summary?.technicalTrack === 'SOFTWARE';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="h-4 w-4" /> Comprehensive Skill Baseline
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Placement Readiness Diagnostic Assessment
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            The diagnostic test establishes your verified baseline across quantitative, logical,
            verbal, and technical topics, generating your initial 28-day roadmap.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/15 p-4 text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        {cooldownMessage && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              14-Day Retake Cooldown Active
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-300">{cooldownMessage}</p>
            <div className="pt-2">
              <Link href="/student/roadmap">
                <Button
                  variant="outline"
                  className="border-amber-400 text-amber-900 dark:text-amber-200"
                >
                  Follow Your Current 28-Day Roadmap
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Blueprint Overview Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Test Blueprint & Specification</CardTitle>
            <CardDescription>
              Carefully calibrated by institutional placement directors for{' '}
              {isSoftware ? 'Software / Engineering' : 'General / Non-Tech'} tracks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <FileQuestion className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                <span className="text-xs uppercase text-slate-500 font-semibold block">
                  Total Questions
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">45 Items</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <Clock className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                <span className="text-xs uppercase text-slate-500 font-semibold block">
                  Time Limit
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  60 Minutes
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <Brain className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                <span className="text-xs uppercase text-slate-500 font-semibold block">
                  Target Track
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isSoftware ? 'Software' : 'General'}
                </span>
              </div>
            </div>

            {/* Section Breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Section Distribution
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span>Quantitative Aptitude</span>
                  <Badge variant="secondary">{isSoftware ? '10 Qs' : '15 Qs'}</Badge>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span>Logical Reasoning</span>
                  <Badge variant="secondary">{isSoftware ? '10 Qs' : '15 Qs'}</Badge>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span>Verbal Ability</span>
                  <Badge variant="secondary">{isSoftware ? '10 Qs' : '15 Qs'}</Badge>
                </div>
                {isSoftware && (
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span>CS Fundamentals (Data Structures, DBMS, OS, Networks)</span>
                    <Badge variant="secondary">15 Qs</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Rules & Integrity Warning */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/40 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Shield className="h-4 w-4 text-indigo-600" />
                Assessment Integrity Rules
              </div>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Option orders and questions are randomized with pseudo-random seed protection.
                </li>
                <li>
                  Tab switching, browser blur, and window resizing events are logged for audit
                  compliance.
                </li>
                <li>
                  Your timer runs on authoritative server-synchronized timestamps. Unsubmitted tests
                  auto-finalize at expiry.
                </li>
                <li>
                  Answers are final once submitted. Correct answer keys unlock immediately after
                  submission.
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="pt-4 flex justify-end">
              <Button
                onClick={handleStartDiagnostic}
                disabled={starting || loading || !!cooldownMessage}
                size="lg"
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 font-bold px-8"
              >
                {starting ? 'Generating Test Session...' : 'Begin Diagnostic Assessment'}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
