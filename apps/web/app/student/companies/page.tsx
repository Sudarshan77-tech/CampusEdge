'use client';

import * as React from 'react';
import { api, ApiError } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Building2, Search, Repeat, Info, Layers, Sparkles } from 'lucide-react';

interface RecruiterSummary {
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    industry: string | null;
  };
  totalSeasonsVisited: number;
  isRecurringRecruiter: boolean;
  totalOffers: number;
  drivesCount: number;
  salaryMetrics: {
    masked: boolean;
    ctcMinLpa?: number | null;
    ctcMaxLpa?: number | null;
    ctcAvgLpa?: number | null;
    message?: string;
  };
}

interface CompanyIntelligence {
  disclaimer: string;
  company: {
    id: string;
    name: string;
    industry: string | null;
  };
  stats: {
    drivesCount: number;
    seasonsVisited: string[];
    selectionRate: number;
  };
  roundPatterns: { pattern: string; frequency: number }[];
  topTopics: { id: string; name: string; category: string; count: number }[];
}

export default function StudentCompaniesPage() {
  const [recruiters, setRecruiters] = React.useState<RecruiterSummary[]>([]);
  const [disclaimer, setDisclaimer] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // Detail Modal
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [intel, setIntel] = React.useState<CompanyIntelligence | null>(null);
  const [intelLoading, setIntelLoading] = React.useState(false);

  const fetchRecruiters = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{
        disclaimer: string;
        recruiters: RecruiterSummary[];
      }>(`/intelligence/recruiters${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setRecruiters(res.recruiters || []);
      setDisclaimer(res.disclaimer);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load recruiters');
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecruiters();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchRecruiters]);

  const openInsights = async (id: string) => {
    try {
      setSelectedId(id);
      setIntelLoading(true);
      const res = await api.get<CompanyIntelligence>(`/intelligence/companies/${id}`);
      setIntel(res);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to load insights');
    } finally {
      setIntelLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recruiter Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          Historical placement trends, interview round patterns, and frequently asked topics.
        </p>
      </div>

      {disclaimer && (
        <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/70 text-blue-900 text-xs flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">{disclaimer}</div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recruiters by name..."
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-muted-foreground">Loading recruiters...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recruiters.map((r) => (
            <Card key={r.company.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span>{r.company.name}</span>
                  </CardTitle>
                  {r.isRecurringRecruiter && (
                    <Badge className="bg-emerald-600 text-white flex items-center gap-1 text-[10px]">
                      <Repeat className="h-2.5 w-2.5" />
                      Recurring
                    </Badge>
                  )}
                </div>
                {r.company.industry && <CardDescription>{r.company.industry}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="text-xs text-muted-foreground">
                  Seasons Visited: {r.totalSeasonsVisited} • Offers: {r.totalOffers}
                </div>

                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-xs font-semibold">
                    {r.salaryMetrics.masked ? (
                      <span className="text-muted-foreground italic">Compensation Hidden</span>
                    ) : r.salaryMetrics.ctcMinLpa ? (
                      `₹${r.salaryMetrics.ctcMinLpa} - ₹${r.salaryMetrics.ctcMaxLpa} LPA`
                    ) : (
                      'N/A'
                    )}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => openInsights(r.company.id)}>
                    Insights
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Insights Dialog */}
      <Dialog
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setIntel(null);
          }
        }}
        title={intel ? `${intel.company.name} Interview Insights` : 'Insights'}
      >
        {intelLoading || !intel ? (
          <div className="p-8 text-center text-muted-foreground">Loading insights...</div>
        ) : (
          <div className="space-y-5">
            {intel.roundPatterns.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Selection Stages</span>
                </h4>
                <div className="space-y-1.5">
                  {intel.roundPatterns.map((rp, i) => (
                    <div key={i} className="p-2 rounded border bg-muted/20 text-xs font-mono">
                      {rp.pattern}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {intel.topTopics.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Topics Asked in Past Interviews</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {intel.topTopics.map((t) => (
                    <Badge key={t.id} variant="outline" className="text-xs">
                      {t.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
