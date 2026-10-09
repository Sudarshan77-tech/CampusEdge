'use client';

import * as React from 'react';
import { api, ApiError } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { ExperienceStatus } from '@campusedge/shared';

interface ModerationItem {
  id: string;
  roleTitle: string;
  seasonLabel: string;
  difficulty: number;
  outcome: string;
  status: ExperienceStatus;
  overallSummary: string;
  tips: string | null;
  company: { id: string; name: string };
  author: {
    userId: string;
    userProfile: { fullName: string; email: string };
    branch?: { name: string };
    batchYear: number;
  };
  _count?: { reports: number };
}

export default function ModerationQueuePage() {
  const [items, setItems] = React.useState<ModerationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Review Dialog State
  const [activeItem, setActiveItem] = React.useState<ModerationItem | null>(null);
  const [decision, setDecision] = React.useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | null>(
    null,
  );
  const [reviewNote, setReviewNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const fetchQueue = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ items: ModerationItem[] }>('/experiences/moderation');
      setItems(res.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleModerate = async () => {
    if (!activeItem || !decision) return;
    try {
      setSubmitting(true);
      await api.post(`/experiences/${activeItem.id}/moderate`, {
        decision,
        reviewNote: reviewNote.trim() || undefined,
      });
      setActiveItem(null);
      setDecision(null);
      setReviewNote('');
      fetchQueue();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Moderation action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interview Experience Moderation</h1>
        <p className="text-muted-foreground mt-1">
          Review, approve, or request edits on student-submitted placement interview experiences.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12 text-muted-foreground">Loading queue...</div>
      ) : items.length === 0 ? (
        <Card className="text-center p-12">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
          <h3 className="text-lg font-semibold">Moderation Queue is Clear</h3>
          <p className="text-sm text-muted-foreground mt-1">
            All submitted interview experiences have been reviewed and published.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-lg">{item.company.name}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-medium">{item.roleTitle}</span>
                      <Badge variant="outline">Difficulty: {item.difficulty}/5</Badge>
                      <Badge
                        variant={
                          item.outcome === 'SELECTED'
                            ? 'default'
                            : item.outcome === 'NOT_SELECTED'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {item.outcome}
                      </Badge>
                      {item.status === ExperienceStatus.UNDER_REVIEW && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Reported ({item._count?.reports ?? 0})
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Author: {item.author.userProfile.fullName} (
                      {item.author.branch?.name || 'Student'}, Batch {item.author.batchYear}) •
                      Season: {item.seasonLabel}
                    </div>

                    <p className="text-sm text-foreground/90 line-clamp-3 pt-1">
                      {item.overallSummary}
                    </p>

                    {item.tips && (
                      <p className="text-xs text-muted-foreground italic">Tip: {item.tips}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-start">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        setActiveItem(item);
                        setDecision('APPROVE');
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveItem(item);
                        setDecision('REQUEST_CHANGES');
                      }}
                    >
                      Request Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setActiveItem(item);
                        setDecision('REJECT');
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog
        open={Boolean(activeItem && decision)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveItem(null);
            setDecision(null);
            setReviewNote('');
          }
        }}
        title={
          decision === 'APPROVE'
            ? 'Approve and Publish Experience'
            : decision === 'REQUEST_CHANGES'
              ? 'Request Student Changes'
              : 'Reject Interview Experience'
        }
        description={
          decision === 'APPROVE'
            ? 'This will publish the interview experience to the student catalog.'
            : 'Provide feedback to the student explaining what needs correction.'
        }
      >
        <div className="space-y-4">
          {decision !== 'APPROVE' && (
            <div className="space-y-1">
              <Label htmlFor="reviewNote">Review Feedback / Reason *</Label>
              <textarea
                id="reviewNote"
                rows={4}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Specify NDA violations, missing information, or inappropriate content..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setActiveItem(null);
                setDecision(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleModerate}
              disabled={submitting || (decision !== 'APPROVE' && !reviewNote.trim())}
              className={decision === 'REJECT' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {submitting ? 'Processing...' : 'Confirm Decision'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
