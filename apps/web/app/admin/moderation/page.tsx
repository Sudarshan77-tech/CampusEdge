'use client';

import * as React from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Role } from '@campusedge/shared';
import { ShieldAlert, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface FlaggedQuestion {
  id: string;
  prompt: string;
  topicName?: string;
  flaggedCount: number;
  reporterNotes?: string[];
  options?: Array<{ index: number; text: string }>;
}

interface QuestionBankHealthResponse {
  totalQuestions: number;
  statusCounts: {
    ACTIVE: number;
    DRAFT: number;
    FLAGGED: number;
    ARCHIVED: number;
  };
  flaggedQuestions: FlaggedQuestion[];
}

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: Role;
  status: string;
}

export default function AdminModerationPage() {
  const [data, setData] = React.useState<QuestionBankHealthResponse | null>(null);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [userData, healthData] = await Promise.all([
        api.get<UserProfile>('/students/me/profile'),
        api.get<QuestionBankHealthResponse>('/admin/readiness/question-bank-health'),
      ]);
      setUser(userData);
      setData(healthData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      await api.post(`/admin/readiness/questions/${id}/approve`, {});
      setSuccessMessage('Question approved and reinstated to active bank.');
      await fetchData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setProcessingId(id);
      await api.post(`/admin/readiness/questions/${id}/reject`, {});
      setSuccessMessage('Question rejected and moved to archived bank.');
      await fetchData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Question Bank Health & Moderation
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Audit item quality, resolve candidate ambiguity flags, and enforce answer key accuracy
            across the platform.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-destructive/15 border border-destructive/20 rounded-xl text-destructive text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Status Distribution Cards */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2">
                <span className="text-xs uppercase font-bold text-slate-500">Active Bank</span>
                <CardTitle className="text-2xl font-bold text-emerald-600">
                  {data.statusCounts.ACTIVE}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">In live assessment rotation</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2">
                <span className="text-xs uppercase font-bold text-slate-500">
                  Flagged Questions
                </span>
                <CardTitle
                  className={`text-2xl font-bold ${
                    data.statusCounts.FLAGGED > 0 ? 'text-amber-600' : 'text-slate-400'
                  }`}
                >
                  {data.statusCounts.FLAGGED}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Reported by candidates</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2">
                <span className="text-xs uppercase font-bold text-slate-500">Draft Questions</span>
                <CardTitle className="text-2xl font-bold text-blue-600">
                  {data.statusCounts.DRAFT}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Pending initial review</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2">
                <span className="text-xs uppercase font-bold text-slate-500">Archived</span>
                <CardTitle className="text-2xl font-bold text-slate-500">
                  {data.statusCounts.ARCHIVED}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Retired from circulation</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Flagged Review Queue */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Flagged Question Review Queue
            </CardTitle>
            <CardDescription>
              Questions reported by students during assessments for ambiguous phrasing, missing
              choices, or disputable answers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-slate-500">Loading moderation queue...</div>
            ) : data?.flaggedQuestions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Zero flagged questions in the queue!
                </p>
                <p className="text-xs text-slate-400">
                  All questions in the active rotation are verified.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {data?.flaggedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                          {q.topicName || 'General Topic'}
                        </span>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                          {q.prompt}
                        </h4>
                      </div>
                      <Badge variant="destructive" className="shrink-0 gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {q.flaggedCount} Report{q.flaggedCount === 1 ? '' : 's'}
                      </Badge>
                    </div>

                    {/* Reporter Notes */}
                    {q.reporterNotes && q.reporterNotes.length > 0 && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                        <span className="font-semibold block uppercase tracking-wider">
                          Candidate Feedback:
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {q.reporterNotes.map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700/60">
                      <Button
                        onClick={() => handleReject(q.id)}
                        disabled={processingId === q.id}
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject & Archive
                      </Button>
                      <Button
                        onClick={() => handleApprove(q.id)}
                        disabled={processingId === q.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Dismiss Flags & Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
