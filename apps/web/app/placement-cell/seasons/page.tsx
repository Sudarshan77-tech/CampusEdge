'use client';

import * as React from 'react';
import { api, ApiError } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Plus, Calendar, CheckCircle2, Clock } from 'lucide-react';

interface Season {
  id: string;
  label: string;
  batchYear: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  _count?: { drives: number };
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = React.useState<Season[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [label, setLabel] = React.useState('');
  const [batchYear, setBatchYear] = React.useState(new Date().getFullYear() + 1);
  const [startDate, setStartDate] = React.useState(`${new Date().getFullYear()}-08-01`);
  const [endDate, setEndDate] = React.useState(`${new Date().getFullYear() + 1}-06-30`);
  const [isCurrent, setIsCurrent] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const fetchSeasons = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ items: Season[] }>('/seasons');
      setSeasons(res.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load placement seasons');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/seasons', {
        label: label.trim(),
        batchYear: Number(batchYear),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isCurrent,
      });
      setCreateOpen(false);
      setLabel('');
      fetchSeasons();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to create placement season');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetCurrent = async (id: string) => {
    try {
      await api.patch(`/seasons/${id}`, { isCurrent: true });
      fetchSeasons();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to set active season');
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Placement Seasons</h1>
          <p className="text-muted-foreground mt-1">
            Manage institutional placement cycles, batch years, and the active recruiting season.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>New Season</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12 text-muted-foreground">Loading seasons...</div>
      ) : seasons.length === 0 ? (
        <Card className="text-center p-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Placement Seasons Defined</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first placement season to begin scheduling campus drives.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4">
            Create Placement Season
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season) => (
            <Card key={season.id} className={season.isCurrent ? 'border-primary shadow-sm' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{season.label}</CardTitle>
                  {season.isCurrent ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline">Batch {season.batchYear}</Badge>
                  )}
                </div>
                <CardDescription>Target Batch: {season.batchYear}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(season.startDate).toLocaleDateString()} -{' '}
                    {new Date(season.endDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                  <span>Drives: {season._count?.drives ?? 0}</span>
                  {!season.isCurrent && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetCurrent(season.id)}>
                      Set as Active
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Placement Season"
        description="Define an academic placement year and graduating batch."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="label">Season Label (e.g. 2024-25)</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="2024-25"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="batchYear">Target Batch Graduating Year</Label>
            <Input
              id="batchYear"
              type="number"
              value={batchYear}
              onChange={(e) => setBatchYear(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isCurrent"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isCurrent" className="cursor-pointer">
              Set as currently active placement season
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Season'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
