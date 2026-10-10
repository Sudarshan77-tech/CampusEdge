'use client';

import * as React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { RoadmapTaskStatus, Role } from '@campusedge/shared';
import { RefreshCw, Sparkles, ArrowRight, Check, Compass, BookOpen } from 'lucide-react';

interface RawRoadmapTask {
  id: string;
  scheduledDate: string;
  kind: string;
  topicId?: string | null;
  driveId?: string | null;
  targetQuestionCount: number;
  status: RoadmapTaskStatus;
  completedAt?: string | null;
  priority: number;
  reason: string;
  topic?: { id: string; name: string; slug: string; category: string } | null;
  drive?: { id: string; company: { id: string; name: string } } | null;
}

interface RawRoadmapPlan {
  id: string;
  status: string;
  horizonDays: number;
  dailyQuestionBudget: number;
  targetRole?: string | null;
  targetDate?: string | null;
  generatedAt: string;
  tasks: RawRoadmapTask[];
}

interface RoadmapResponse {
  active: boolean;
  plan: RawRoadmapPlan | null;
  message?: string;
}

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: Role;
  status: string;
}

export default function StudentRoadmapPage() {
  const [data, setData] = React.useState<RoadmapResponse | null>(null);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [regenerating, setRegenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = React.useState<number>(1);

  const fetchPlan = React.useCallback(async () => {
    try {
      setLoading(true);
      const [userData, roadmapData] = await Promise.all([
        api.get<UserProfile>('/students/me/profile'),
        api.get<RoadmapResponse>('/me/roadmap'),
      ]);
      setUser(userData);
      setData(roadmapData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const toggleTaskStatus = async (taskId: string, currentStatus: RoadmapTaskStatus) => {
    try {
      const nextStatus =
        currentStatus === RoadmapTaskStatus.DONE
          ? RoadmapTaskStatus.PENDING
          : RoadmapTaskStatus.DONE;

      // Optimistic update
      setData((prev) => {
        if (!prev || !prev.plan) return prev;
        const updatedTasks = prev.plan.tasks.map((t) =>
          t.id === taskId ? { ...t, status: nextStatus } : t,
        );
        return {
          ...prev,
          plan: {
            ...prev.plan,
            tasks: updatedTasks,
          },
        };
      });

      await api.patch(`/me/roadmap/tasks/${taskId}`, { status: nextStatus });
    } catch {
      fetchPlan();
    }
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      await api.post('/me/roadmap/regenerate', {});
      await fetchPlan();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRegenerating(false);
    }
  };

  const plan = data?.plan;
  const totalTasks = plan?.tasks.length || 0;
  const completedTasks = plan?.tasks.filter((t) => t.status === RoadmapTaskStatus.DONE).length || 0;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Group tasks into 4 weeks based on 7-day intervals
  const weekTasks = React.useMemo(() => {
    const grouped: Record<number, RawRoadmapTask[]> = { 1: [], 2: [], 3: [], 4: [] };
    if (!plan || !plan.tasks.length || !plan.tasks[0]) return grouped;
    const sorted = [...plan.tasks].sort(
      (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime(),
    );

    const firstTask = sorted[0];
    if (!firstTask) return grouped;
    const firstDate = new Date(firstTask.scheduledDate).getTime();

    sorted.forEach((t) => {
      const taskDate = new Date(t.scheduledDate).getTime();
      const diffDays = Math.max(0, Math.floor((taskDate - firstDate) / (1000 * 60 * 60 * 24)));
      const weekIndex = Math.min(4, Math.floor(diffDays / 7) + 1);
      const targetList = grouped[weekIndex];
      if (targetList) {
        targetList.push(t);
      }
    });

    return grouped;
  }, [plan]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-indigo-600" />
              28-Day Preparation Roadmap
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Personalized 4-week structured sprint calibrated to your weak topics and upcoming
              campus drives.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data?.active && (
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                Recalibrate Roadmap
              </Button>
            )}
            <Link href="/student/readiness">
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                View Readiness Cockpit
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Building your personalized sprint roadmap...
          </div>
        ) : error ? (
          <div className="rounded-lg bg-destructive/15 p-4 text-destructive">{error}</div>
        ) : !data?.active ? (
          /* Diagnostic Required Empty State */
          <Card className="border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-md">
            <CardContent className="p-12 text-center space-y-4">
              <Compass className="h-16 w-16 text-indigo-600 mx-auto" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Initial Diagnostic Baseline Required
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {data?.message ||
                  'Complete your initial Diagnostic Assessment to establish your baseline and generate your tailored 28-day roadmap.'}
              </p>
              <div className="pt-2">
                <Link href="/student/diagnostics">
                  <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 font-bold px-6">
                    Take 60-Minute Diagnostic Test
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : plan ? (
          <>
            {/* Progress Banner */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 w-full md:w-2/3">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>Overall Sprint Completion</span>
                      <span className="text-indigo-600 font-bold">
                        {completedTasks} / {totalTasks} Tasks ({Math.round(completionRate)}%)
                      </span>
                    </div>
                    <Progress value={completionRate} className="h-3" />
                  </div>

                  <div className="flex items-center gap-6 divide-x divide-slate-200 dark:divide-slate-800">
                    <div className="text-center px-4">
                      <span className="text-xs uppercase text-slate-500 font-semibold block">
                        Duration
                      </span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">
                        4 Weeks
                      </span>
                    </div>
                    <div className="text-center px-4">
                      <span className="text-xs uppercase text-slate-500 font-semibold block">
                        Target
                      </span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">
                        {plan.targetRole || 'Software Engineer'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Week Selection Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              {[1, 2, 3, 4].map((w) => (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    selectedWeek === w
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  Week {w} ({weekTasks[w]?.length || 0} tasks)
                </button>
              ))}
            </div>

            {/* Selected Week Tasks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Week {selectedWeek} Practice Routines
                  </h3>
                  <p className="text-sm text-slate-500">
                    Daily deliberate practice tasks to strengthen weak topics.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {weekTasks[selectedWeek]?.filter((t) => t.status === RoadmapTaskStatus.DONE)
                    .length || 0}{' '}
                  / {weekTasks[selectedWeek]?.length || 0} Completed
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {weekTasks[selectedWeek]?.map((task) => {
                  const isDone = task.status === RoadmapTaskStatus.DONE;
                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                        isDone
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40 text-slate-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleTaskStatus(task.id, task.status)}
                          className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center border transition-colors ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-indigo-600 dark:border-slate-600'
                          }`}
                        >
                          {isDone ? <Check className="h-4 w-4" /> : null}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-400">
                              {task.scheduledDate}
                            </span>
                            <h4
                              className={`text-sm font-bold ${
                                isDone
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {task.topic?.name || task.drive?.company.name || task.reason}
                            </h4>
                            <Badge variant="secondary" className="text-[10px]">
                              {task.kind.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {task.reason}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <BookOpen className="h-3.5 w-3.5" />
                          {task.targetQuestionCount} questions
                        </span>
                        {task.topic && (
                          <Badge variant="outline" className="text-xs">
                            {task.topic.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
