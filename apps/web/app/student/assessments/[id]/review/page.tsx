'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { AttemptStatus, Role } from '@campusedge/shared';
import { CheckCircle2, XCircle, ArrowRight, Trophy, Calendar, AlertCircle } from 'lucide-react';

interface ReviewOption {
  index: number;
  text: string;
}

interface ReviewQuestion {
  id: string;
  prompt: string;
  explanation?: string | null;
  correctOptionIndex?: number;
  options: ReviewOption[];
}

interface ReviewItem {
  id: string;
  position: number;
  selectedOptionIndex: number | null;
  isCorrect?: boolean | null;
  question: ReviewQuestion;
}

interface AttemptReviewData {
  id: string;
  status: AttemptStatus;
  score: number;
  maxScore: number;
  percentage: number;
  startedAt: string;
  submittedAt: string | null;
  items: ReviewItem[];
}

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: Role;
  status: string;
}

export default function AssessmentReviewPage() {
  const params = useParams();
  const attemptId = params?.id as string;

  const [review, setReview] = React.useState<AttemptReviewData | null>(null);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [userData, reviewData] = await Promise.all([
          api.get<UserProfile>('/students/me/profile'),
          api.get<AttemptReviewData>(`/assessments/attempts/${attemptId}`),
        ]);
        setUser(userData);
        setReview(reviewData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    if (attemptId) {
      loadData();
    }
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-muted-foreground">
        Retrieving validated performance score and explanations...
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-6 rounded-2xl border text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">Failed to load review</h2>
          <p className="text-sm text-slate-500">{error || 'Attempt not found'}</p>
          <Link href="/student/readiness">
            <Button variant="outline">Return to Readiness Cockpit</Button>
          </Link>
        </div>
      </div>
    );
  }

  const correctCount = review.items.filter((i) => i.isCorrect === true).length;
  const incorrectCount = review.items.filter(
    (i) => i.isCorrect === false && i.selectedOptionIndex !== null,
  ).length;
  const unattemptedCount = review.items.filter((i) => i.selectedOptionIndex === null).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Score Banner Hero */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-700 to-blue-800 p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                  <Trophy className="h-3.5 w-3.5" /> Assessment Completed
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Performance & Solution Review
                </h1>
                <p className="text-indigo-100 text-sm">
                  Your answers have been verified against authoritative answer keys and recorded in
                  your topic mastery index.
                </p>
              </div>

              {/* Score Badge */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center border border-white/20 shrink-0">
                <span className="text-xs uppercase font-bold text-indigo-200 block mb-1">
                  Overall Accuracy
                </span>
                <span className="text-5xl font-black">{Math.round(review.percentage)}%</span>
                <span className="text-xs text-indigo-200 block mt-1">
                  {correctCount} / {review.items.length} Correct
                </span>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Stat Counters */}
            <div className="grid grid-cols-3 gap-4 text-center divide-x divide-slate-200 dark:divide-slate-800">
              <div>
                <span className="text-2xl font-bold text-emerald-600 block">{correctCount}</span>
                <span className="text-xs text-slate-500 uppercase font-semibold">Correct</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-red-500 block">{incorrectCount}</span>
                <span className="text-xs text-slate-500 uppercase font-semibold">Incorrect</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-slate-400 block">{unattemptedCount}</span>
                <span className="text-xs text-slate-500 uppercase font-semibold">Unattempted</span>
              </div>
            </div>

            {/* Next Steps CTA */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                Topic masteries have been updated. Your readiness score and 28-day sprint roadmap
                have incorporated these results.
              </p>
              <div className="flex items-center gap-3">
                <Link href="/student/roadmap">
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Updated Roadmap
                  </Button>
                </Link>
                <Link href="/student/readiness">
                  <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    Readiness Score
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Solutions Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Detailed Question Explanations
          </h3>

          <div className="space-y-4">
            {review.items.map((item) => {
              const isCorrect = item.isCorrect === true;
              const isUnattempted = item.selectedOptionIndex === null;

              return (
                <Card
                  key={item.id}
                  className={`border transition-all ${
                    isCorrect
                      ? 'border-emerald-200 dark:border-emerald-950/60 bg-white dark:bg-slate-800/80'
                      : isUnattempted
                        ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50'
                        : 'border-red-200 dark:border-red-950/60 bg-white dark:bg-slate-800/80'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">
                        Question #{item.position}
                      </span>
                      {isCorrect ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Correct (+1.0)
                        </Badge>
                      ) : isUnattempted ? (
                        <Badge variant="secondary">Unattempted (0.0)</Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" /> Incorrect (0.0)
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base font-medium text-slate-900 dark:text-white mt-1 leading-relaxed">
                      {item.question.prompt}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Options list */}
                    <div className="space-y-2">
                      {item.question.options.map((option, optIdx) => {
                        const isStudentChoice = item.selectedOptionIndex === option.index;
                        const isRightAnswer = item.question.correctOptionIndex === option.index;
                        const optionLetter = String.fromCharCode(65 + optIdx);

                        let optStyle =
                          'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300';
                        if (isRightAnswer) {
                          optStyle =
                            'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                        } else if (isStudentChoice && !isRightAnswer) {
                          optStyle =
                            'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 ring-1 ring-red-500';
                        }

                        return (
                          <div
                            key={option.index}
                            className={`p-3 rounded-lg border text-sm flex items-start gap-3 ${optStyle}`}
                          >
                            <span className="font-bold text-xs shrink-0 pt-0.5">
                              {optionLetter}.
                            </span>
                            <span className="flex-1">{option.text}</span>
                            {isRightAnswer && (
                              <Badge variant="success" className="text-[10px] shrink-0">
                                Correct Answer
                              </Badge>
                            )}
                            {isStudentChoice && !isRightAnswer && (
                              <Badge variant="destructive" className="text-[10px] shrink-0">
                                Your Choice
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Verified Explanation */}
                    {item.question.explanation && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">
                          Explanation & Concept Analysis:
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.question.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
