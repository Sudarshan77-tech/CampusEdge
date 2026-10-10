'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { AttemptStatus } from '@campusedge/shared';
import {
  Clock,
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Shield,
} from 'lucide-react';

interface AttemptOption {
  index: number;
  text: string;
}

interface AttemptQuestion {
  id: string;
  prompt: string;
  codeSnippet?: string | null;
  options: AttemptOption[];
}

interface AttemptItemData {
  id: string;
  position: number;
  questionId: string;
  selectedOptionIndex: number | null;
  isFlagged: boolean;
  question: AttemptQuestion;
}

interface AttemptSession {
  id: string;
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string;
  durationMinutes: number;
  remainingSeconds: number;
  items: AttemptItemData[];
}

export default function AssessmentTakingPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params?.id as string;

  const [attempt, setAttempt] = React.useState<AttemptSession | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [savingAnswer, setSavingAnswer] = React.useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load Attempt Data
  React.useEffect(() => {
    async function loadAttempt() {
      try {
        setLoading(true);
        const data = await api.get<AttemptSession>(`/assessments/attempts/${attemptId}`);
        if (
          data.status === AttemptStatus.SUBMITTED ||
          data.status === AttemptStatus.AUTO_SUBMITTED
        ) {
          router.push(`/student/assessments/${attemptId}/review`);
          return;
        }

        setAttempt(data);
        const calculatedRemaining = Math.max(
          0,
          Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000),
        );
        setRemainingSeconds(calculatedRemaining);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    if (attemptId) {
      loadAttempt();
    }
  }, [attemptId, router]);

  // Submit Attempt Handler
  const handleSubmit = React.useCallback(async () => {
    try {
      setSubmitting(true);
      await api.post(`/assessments/attempts/${attemptId}/submit`, {});
      router.push(`/student/assessments/${attemptId}/review`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }, [attemptId, router]);

  // Server-synced Countdown Timer
  React.useEffect(() => {
    if (!attempt || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, remainingSeconds, handleSubmit]);

  // Integrity Event Logger (Tab blur / window visibility)
  React.useEffect(() => {
    if (!attemptId) return;

    const logEvent = async (eventType: string, metadata?: Record<string, unknown>) => {
      try {
        await api.post(`/assessments/attempts/${attemptId}/events`, {
          eventType,
          metadata,
        });
      } catch {
        // Silently continue to prevent disrupting test
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logEvent('TAB_BLUR', { reason: 'visibilitychange_hidden' });
      } else {
        logEvent('TAB_FOCUS', { reason: 'visibilitychange_visible' });
      }
    };

    const handleWindowBlur = () => {
      logEvent('TAB_BLUR', { reason: 'window_blur' });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [attemptId]);

  // Option Selection & Save
  const handleSelectOption = async (optionIndex: number) => {
    if (!attempt) return;
    const currentItem = attempt.items[currentIndex];
    if (!currentItem) return;
    const newSelectedIndex = currentItem.selectedOptionIndex === optionIndex ? null : optionIndex;

    // Optimistic Update
    setAttempt((prev) => {
      if (!prev) return null;
      const updatedItems = prev.items.map((item, idx) =>
        idx === currentIndex ? { ...item, selectedOptionIndex: newSelectedIndex } : item,
      );
      return { ...prev, items: updatedItems };
    });

    try {
      setSavingAnswer(true);
      await api.put(`/assessments/attempts/${attemptId}/items/${currentItem.id}/answer`, {
        selectedOptionIndex: newSelectedIndex,
        isFlagged: currentItem.isFlagged,
      });
    } catch (err) {
      // Revert if error
      setError((err as Error).message);
    } finally {
      setSavingAnswer(false);
    }
  };

  // Toggle Mark for Review
  const handleToggleFlag = async () => {
    if (!attempt) return;
    const currentItem = attempt.items[currentIndex];
    if (!currentItem) return;
    const newFlagged = !currentItem.isFlagged;

    setAttempt((prev) => {
      if (!prev) return null;
      const updatedItems = prev.items.map((item, idx) =>
        idx === currentIndex ? { ...item, isFlagged: newFlagged } : item,
      );
      return { ...prev, items: updatedItems };
    });

    try {
      await api.put(`/assessments/attempts/${attemptId}/items/${currentItem.id}/answer`, {
        selectedOptionIndex: currentItem.selectedOptionIndex,
        isFlagged: newFlagged,
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 font-medium">Securing test environment...</p>
        </div>
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="max-w-md w-full bg-slate-800 p-6 rounded-2xl border border-red-500/30 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold">Failed to load assessment</h2>
          <p className="text-sm text-slate-300">{error}</p>
          <Button onClick={() => router.push('/student/diagnostics')} variant="outline">
            Return to Assessment Hub
          </Button>
        </div>
      </div>
    );
  }

  if (!attempt) return null;

  const currentItem = attempt.items[currentIndex];
  const totalQuestions = attempt.items.length;
  const answeredCount = attempt.items.filter((i) => i.selectedOptionIndex !== null).length;
  const flaggedCount = attempt.items.filter((i) => i.isFlagged).length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Test Banner */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-400" />
            CampusEdge Proctored Assessment
          </div>
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            Question {currentIndex + 1} of {totalQuestions}
          </Badge>
        </div>

        {/* Autoritative Timer */}
        <div className="flex items-center gap-6">
          <div
            className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-1.5 rounded-full border ${
              remainingSeconds < 300
                ? 'bg-red-950/40 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            {formatTime(remainingSeconds)}
          </div>

          <Button
            onClick={() => setShowSubmitModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
          >
            <Send className="h-4 w-4" />
            Finish & Submit
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Content Area */}
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-6">
          {error && (
            <div className="p-3 bg-red-900/40 border border-red-500 rounded-lg text-sm text-red-200">
              {error}
            </div>
          )}

          {currentItem && (
            <Card className="bg-slate-800/80 border-slate-700 shadow-xl">
              <CardHeader className="pb-4 border-b border-slate-700/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
                    Question #{currentItem.position}
                  </span>
                  <button
                    onClick={handleToggleFlag}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      currentItem.isFlagged
                        ? 'bg-purple-950/60 text-purple-300 border border-purple-500'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    {currentItem.isFlagged ? 'Marked for Review' : 'Mark for Review'}
                  </button>
                </div>
                <CardTitle className="text-lg font-medium text-slate-100 mt-2 leading-relaxed">
                  {currentItem.question.prompt}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Code Snippet if present */}
                {currentItem.question.codeSnippet && (
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-200 overflow-x-auto">
                    {currentItem.question.codeSnippet}
                  </pre>
                )}

                {/* Multiple Choice Options */}
                <div className="space-y-3">
                  {currentItem.question.options.map((option, optIdx) => {
                    const isSelected = currentItem.selectedOptionIndex === option.index;
                    const optionLetter = String.fromCharCode(65 + optIdx);

                    return (
                      <div
                        key={option.index}
                        onClick={() => handleSelectOption(option.index)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                          isSelected
                            ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500'
                            : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-700/40 hover:border-slate-600'
                        }`}
                      >
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {optionLetter}
                        </div>
                        <span className="text-sm pt-0.5 leading-snug">{option.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Navigation */}
                <div className="pt-6 border-t border-slate-700/60 flex items-center justify-between">
                  <Button
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-700 gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {currentItem.selectedOptionIndex !== null && (
                      <button
                        onClick={() => handleSelectOption(currentItem.selectedOptionIndex!)}
                        className="text-xs text-slate-400 hover:text-slate-200 underline mr-2"
                      >
                        Clear Response
                      </button>
                    )}

                    <Button
                      onClick={() =>
                        setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))
                      }
                      disabled={currentIndex === totalQuestions - 1}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Question Palette Sidebar */}
        <aside className="w-80 border-l border-slate-800 bg-slate-950/60 p-6 flex flex-col justify-between hidden lg:flex">
          <div className="space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">
              Question Palette
            </h4>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-emerald-500" /> Answered ({answeredCount})
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-slate-700" /> Unanswered ({unansweredCount})
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-purple-500" /> Review ({flaggedCount})
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full border-2 border-indigo-400" /> Current
              </div>
            </div>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto pr-1">
              {attempt.items.map((item, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = item.selectedOptionIndex !== null;
                const isFlagged = item.isFlagged;

                let btnBg = 'bg-slate-800 text-slate-400 hover:bg-slate-700';
                if (isAnswered) {
                  btnBg = 'bg-emerald-600 text-white hover:bg-emerald-500';
                }
                if (isFlagged) {
                  btnBg = 'bg-purple-600 text-white hover:bg-purple-500';
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 w-9 rounded-lg font-bold text-xs transition-all flex items-center justify-center relative ${btnBg} ${
                      isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
            {savingAnswer ? 'Saving response...' : 'All answers saved to session'}
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Ready to Submit Assessment?</h3>
              <p className="text-sm text-slate-400">
                Please review your progress before submitting. Once submitted, your answers cannot
                be altered.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/80 rounded-xl text-center">
              <div>
                <span className="text-2xl font-black text-emerald-400">{answeredCount}</span>
                <span className="text-xs uppercase text-slate-500 block">Answered</span>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-400">{unansweredCount}</span>
                <span className="text-xs uppercase text-slate-500 block">Unanswered</span>
              </div>
              <div>
                <span className="text-2xl font-black text-purple-400">{flaggedCount}</span>
                <span className="text-xs uppercase text-slate-500 block">Flagged</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                You have {unansweredCount} unanswered questions that will be scored as 0.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                Return to Test
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {submitting ? 'Finalizing...' : 'Confirm Submission'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
