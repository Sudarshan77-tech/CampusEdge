'use client';

import * as React from 'react';
import { api, ApiError } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Plus, Sparkles, BookOpen } from 'lucide-react';
import { TopicCategory } from '@campusedge/shared';

interface Topic {
  id: string;
  name: string;
  category: TopicCategory;
}

export default function AdminTopicsPage() {
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog State
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState<TopicCategory>(TopicCategory.DSA);
  const [submitting, setSubmitting] = React.useState(false);

  const fetchTopics = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ items: Topic[] }>('/topics?limit=100');
      setTopics(res.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/topics', {
        name: name.trim(),
        category,
      });
      setCreateOpen(false);
      setName('');
      fetchTopics();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to create topic');
    } finally {
      setSubmitting(false);
    }
  };

  const grouped = topics.reduce(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    },
    {} as Record<TopicCategory, Topic[]>,
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Standard Topic Taxonomy</h1>
          <p className="text-muted-foreground mt-1">
            Global curriculum topics tagged across interview experiences and candidate preparation.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Topic</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12 text-muted-foreground">Loading topics...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="text-center p-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Topics Defined</h3>
          <p className="text-sm text-muted-foreground mt-1">Initialize standard taxonomy topics.</p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4">
            Add Topic
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, list]) => (
            <Card key={cat}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>{cat.replace('_', ' ')}</span>
                  <Badge variant="outline" className="text-xs ml-2">
                    {list.length} topics
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {list.map((t) => (
                    <span
                      key={t.id}
                      className="px-3 py-1 rounded-full text-xs font-medium border bg-muted/40 text-foreground"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add Taxonomy Topic"
        description="Add a new standard topic to categorize interview rounds."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="tname">Topic Name *</Label>
            <Input
              id="tname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dynamic Programming, Distributed Systems"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tcat">Category</Label>
            <select
              id="tcat"
              value={category}
              onChange={(e) => setCategory(e.target.value as TopicCategory)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            >
              {Object.values(TopicCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Topic'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
