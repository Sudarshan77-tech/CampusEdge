'use client';

import * as React from 'react';
import { api, ApiError } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { MessageSquare, Plus, Flag, User, Search } from 'lucide-react';
import { ExperienceOutcome } from '@campusedge/shared';

interface ExperienceFeedItem {
  id: string;
  roleTitle: string;
  seasonLabel: string;
  difficulty: number;
  outcome: ExperienceOutcome;
  overallSummary: string;
  tips: string | null;
  isAnonymous: boolean;
  createdAt: string;
  company: { id: string; name: string };
  author?: {
    userProfile?: { fullName: string };
    branch?: { name: string };
    batchYear?: number;
  };
  rounds: {
    id: string;
    sequence: number;
    roundType: string;
    description: string;
    difficulty: number | null;
    topics: { topic: { name: string } }[];
  }[];
}

interface Company {
  id: string;
  name: string;
}

export default function StudentExperiencesPage() {
  const [experiences, setExperiences] = React.useState<ExperienceFeedItem[]>([]);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // Create Experience Dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [companyId, setCompanyId] = React.useState('');
  const [roleTitle, setRoleTitle] = React.useState('');
  const [seasonLabel, setSeasonLabel] = React.useState('2024-25');
  const [difficulty, setDifficulty] = React.useState(3);
  const [outcome, setOutcome] = React.useState<ExperienceOutcome>(ExperienceOutcome.SELECTED);
  const [overallSummary, setOverallSummary] = React.useState('');
  const [tips, setTips] = React.useState('');
  const [isAnonymous, setIsAnonymous] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  // Report Dialog state
  const [reportingId, setReportingId] = React.useState<string | null>(null);
  const [reportReason, setReportReason] = React.useState('');
  const [reporting, setReporting] = React.useState(false);

  const fetchExperiences = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ items: ExperienceFeedItem[] }>(
        `/experiences${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      );
      setExperiences(res.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load experiences');
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    fetchExperiences();
    api
      .get<{ items: Company[] }>('/companies?limit=100')
      .then((res) => {
        setCompanies(res.items || []);
        if (res.items?.[0]) setCompanyId(res.items[0].id);
      })
      .catch(console.error);
  }, [fetchExperiences]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const exp = await api.post<{ id: string }>('/experiences', {
        companyId,
        roleTitle: roleTitle.trim(),
        seasonLabel: seasonLabel.trim(),
        difficulty: Number(difficulty),
        outcome,
        overallSummary: overallSummary.trim(),
        tips: tips.trim() || undefined,
        isAnonymous,
      });

      // Submit for moderation review
      await api.post(`/experiences/${exp.id}/submit`, {});

      alert(
        'Experience submitted successfully! It will appear once approved by the placement cell.',
      );
      setCreateOpen(false);
      setRoleTitle('');
      setOverallSummary('');
      setTips('');
      fetchExperiences();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to submit experience');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!reportingId || !reportReason.trim()) return;
    try {
      setReporting(true);
      await api.post(`/experiences/${reportingId}/report`, {
        reason: reportReason.trim(),
      });
      alert('Report submitted for placement cell review.');
      setReportingId(null);
      setReportReason('');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to submit report');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Experiences</h1>
          <p className="text-muted-foreground mt-1">
            Real interview questions, preparation strategies, and round breakdowns shared by
            seniors.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Share My Experience</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company or role..."
            className="pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12 text-muted-foreground">Loading experiences...</div>
      ) : experiences.length === 0 ? (
        <Card className="text-center p-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Experiences Shared Yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Be the first to share your interview rounds and tips with fellow batchmates!
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4">
            Share Experience
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {experiences.map((exp) => (
            <Card key={exp.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-lg">{exp.company.name}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-medium">{exp.roleTitle}</span>
                      <Badge
                        variant={
                          exp.outcome === ExperienceOutcome.SELECTED
                            ? 'default'
                            : exp.outcome === ExperienceOutcome.NOT_SELECTED
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {exp.outcome}
                      </Badge>
                      <Badge variant="outline">Difficulty: {exp.difficulty}/5</Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{exp.author?.userProfile?.fullName || 'Anonymous Senior'}</span>
                      {exp.author?.branch?.name && <span>• {exp.author.branch.name}</span>}
                      <span>• Season: {exp.seasonLabel}</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                    onClick={() => setReportingId(exp.id)}
                    title="Report inappropriate content"
                  >
                    <Flag className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {exp.overallSummary}
                </div>

                {/* Rounds Breakdown */}
                {exp.rounds && exp.rounds.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Interview Rounds
                    </span>
                    <div className="space-y-2">
                      {exp.rounds.map((round) => (
                        <div
                          key={round.id}
                          className="p-3 rounded-md border bg-muted/20 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-primary">
                              Round {round.sequence}: {round.roundType}
                            </span>
                            {round.difficulty && (
                              <span className="text-muted-foreground">
                                Difficulty: {round.difficulty}/5
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            {round.description}
                          </p>
                          {round.topics && round.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {round.topics.map((t, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px]">
                                  {t.topic.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {exp.tips && (
                  <div className="p-3 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-xs leading-relaxed">
                    <span className="font-semibold">Preparation Advice: </span>
                    {exp.tips}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Share Experience Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Share Interview Experience"
        description="Help future candidates by detailing your recruitment process and questions."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="expCompany">Company / Recruiter *</Label>
              <select
                id="expCompany"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                required
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="expRole">Role Designation *</Label>
              <Input
                id="expRole"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Associate Software Engineer"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="expSeason">Season</Label>
              <Input
                id="expSeason"
                value={seasonLabel}
                onChange={(e) => setSeasonLabel(e.target.value)}
                placeholder="2024-25"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="expDiff">Difficulty (1-5)</Label>
              <Input
                id="expDiff"
                type="number"
                min="1"
                max="5"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="expOutcome">Outcome</Label>
              <select
                id="expOutcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as ExperienceOutcome)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              >
                <option value={ExperienceOutcome.SELECTED}>Offered / Selected</option>
                <option value={ExperienceOutcome.NOT_SELECTED}>Not Selected</option>
                <option value={ExperienceOutcome.NOT_DISCLOSED}>Undisclosed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="expSummary">Overall Interview Summary & Rounds Breakdown *</Label>
            <textarea
              id="expSummary"
              rows={5}
              value={overallSummary}
              onChange={(e) => setOverallSummary(e.target.value)}
              placeholder="Detail the technical questions asked, coding problems, behavioral questions..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="expTips">Tips for Juniors</Label>
            <Input
              id="expTips"
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              placeholder="e.g. Revise DBMS transactions and practice dynamic programming"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="anonCheck"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="anonCheck" className="cursor-pointer text-xs">
              Post anonymously (your name will not be shown to other students)
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Report Dialog */}
      <Dialog
        open={Boolean(reportingId)}
        onOpenChange={(open) => {
          if (!open) setReportingId(null);
        }}
        title="Report Interview Experience"
        description="Flag inappropriate content or NDA violations to the placement cell."
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="reasonInput">Reason for Report *</Label>
            <textarea
              id="reasonInput"
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe why this post violates community guidelines or company NDAs..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReportingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={reporting || !reportReason.trim()}
              onClick={handleReport}
            >
              {reporting ? 'Reporting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
