'use client';

import * as React from 'react';
import { api, ApiError } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import { ExperienceStatus } from '@campusedge/shared';

interface AdminExperienceItem {
  id: string;
  roleTitle: string;
  seasonLabel: string;
  difficulty: number;
  outcome: string;
  status: ExperienceStatus;
  overallSummary: string;
  company: { id: string; name: string };
  author: {
    userId: string;
    userProfile: { fullName: string; email: string };
  };
  _count?: { reports: number };
}

export default function AdminExperiencesPage() {
  const [items, setItems] = React.useState<AdminExperienceItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Takedown state
  const [activeItem, setActiveItem] = React.useState<AdminExperienceItem | null>(null);
  const [reason, setReason] = React.useState('');
  const [takingDown, setTakingDown] = React.useState(false);

  const fetchItems = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ items: AdminExperienceItem[] }>('/experiences?limit=50');
      setItems(res.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load experiences');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleTakedown = async () => {
    if (!activeItem || !reason.trim()) return;
    try {
      setTakingDown(true);
      await api.patch(`/experiences/${activeItem.id}/takedown`, {
        reason: reason.trim(),
      });
      alert('Experience removed under platform terms.');
      setActiveItem(null);
      setReason('');
      fetchItems();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Takedown failed');
    } finally {
      setTakingDown(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Platform Content Moderation & Takedowns
        </h1>
        <p className="text-muted-foreground mt-1">
          Super Admin emergency removal for copyright, NDA, or harassment violations.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12 text-muted-foreground">Loading experiences...</div>
      ) : items.length === 0 ? (
        <Card className="text-center p-12">
          <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Experiences Flagged</h3>
          <p className="text-sm text-muted-foreground mt-1">
            All user-submitted experiences comply with safety guidelines.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((exp) => (
            <Card key={exp.id} className="hover:border-destructive/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-lg">{exp.company.name}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-medium">{exp.roleTitle}</span>
                      <Badge variant="outline">{exp.status}</Badge>
                      {exp._count?.reports && exp._count.reports >= 3 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {exp._count.reports} Reports
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Author: {exp.author?.userProfile?.fullName || 'Anonymous'} (
                      {exp.author?.userProfile?.email})
                    </div>

                    <p className="text-sm text-foreground/90 line-clamp-3 pt-1">
                      {exp.overallSummary}
                    </p>
                  </div>

                  <Button size="sm" variant="destructive" onClick={() => setActiveItem(exp)}>
                    Emergency Takedown
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Takedown Dialog */}
      <Dialog
        open={Boolean(activeItem)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveItem(null);
            setReason('');
          }
        }}
        title="Super Admin Content Takedown"
        description="Permanently remove this post from public and college feeds."
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="takedownReason">Audit Log Takedown Reason *</Label>
            <textarea
              id="takedownReason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Verified company NDA complaint, inappropriate defamatory language..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setActiveItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={takingDown || !reason.trim()}
              onClick={handleTakedown}
            >
              {takingDown ? 'Removing...' : 'Confirm Takedown'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
