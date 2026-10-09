'use client';

import * as React from 'react';
import { api, ApiError } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  TrendingUp,
  Search,
  Building2,
  Repeat,
  Info,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

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
  totalRegistered: number;
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
    slug: string;
    industry: string | null;
  };
  stats: {
    drivesCount: number;
    seasonsVisited: string[];
    totalRegistered: number;
    totalSelected: number;
    selectionRate: number;
  };
  salaryIntelligence: {
    cohortTooSmall: boolean;
    minCtcLpa?: number | null;
    maxCtcLpa?: number | null;
    avgCtcLpa?: number | null;
    message?: string;
  };
  roundPatterns: { pattern: string; frequency: number }[];
  topTopics: { id: string; name: string; category: string; count: number }[];
  recentDrives: {
    id: string;
    title?: string;
    season?: string;
    selectedCount?: number | null;
  }[];
}

export default function PlacementIntelligencePage() {
  const [recruiters, setRecruiters] = React.useState<RecruiterSummary[]>([]);
  const [disclaimer, setDisclaimer] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // Deep dive company detail
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string | null>(null);
  const [deepDive, setDeepDive] = React.useState<CompanyIntelligence | null>(null);
  const [deepLoading, setDeepLoading] = React.useState(false);

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
      setError(err instanceof ApiError ? err.message : 'Failed to load intelligence metrics');
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecruiters();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchRecruiters]);

  const openCompanyDetail = async (companyId: string) => {
    try {
      setSelectedCompanyId(companyId);
      setDeepLoading(true);
      const res = await api.get<CompanyIntelligence>(`/intelligence/companies/${companyId}`);
      setDeepDive(res);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to load company intelligence');
    } finally {
      setDeepLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Placement Intelligence & Recruiter Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Historical recruiter retention, compensation trends, and round patterns across placement
          cycles.
        </p>
      </div>

      {/* Official Disclaimer Banner */}
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
            placeholder="Search recruiters..."
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-muted-foreground">Loading analytics...</div>
      ) : recruiters.length === 0 ? (
        <Card className="text-center p-12">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Recruiter Data Available</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Data will populate as past drives are imported or recorded.
          </p>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left border-b">
              <tr>
                <th className="p-3.5">Recruiter</th>
                <th className="p-3.5">Retention Status</th>
                <th className="p-3.5">Seasons</th>
                <th className="p-3.5">Total Offers</th>
                <th className="p-3.5">Salary Range (LPA)</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recruiters.map((r) => (
                <tr key={r.company.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3.5 font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{r.company.name}</span>
                    </div>
                    {r.company.industry && (
                      <div className="text-xs text-muted-foreground pl-6">{r.company.industry}</div>
                    )}
                  </td>
                  <td className="p-3.5">
                    {r.isRecurringRecruiter ? (
                      <Badge className="bg-emerald-600 text-white flex items-center gap-1 w-fit">
                        <Repeat className="h-3 w-3" />
                        Recurring Recruiter
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Standard
                      </Badge>
                    )}
                  </td>
                  <td className="p-3.5">{r.totalSeasonsVisited}</td>
                  <td className="p-3.5 font-semibold">{r.totalOffers}</td>
                  <td className="p-3.5">
                    {r.salaryMetrics.masked ? (
                      <span className="text-xs text-muted-foreground italic">
                        Hidden (Cohort &lt; 3)
                      </span>
                    ) : r.salaryMetrics.ctcMinLpa !== null && r.salaryMetrics.ctcMaxLpa !== null ? (
                      <span>
                        ₹{r.salaryMetrics.ctcMinLpa} - ₹{r.salaryMetrics.ctcMaxLpa} LPA
                        {r.salaryMetrics.ctcAvgLpa && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (Avg: ₹{r.salaryMetrics.ctcAvgLpa})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Not disclosed</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openCompanyDetail(r.company.id)}
                    >
                      Insights
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Company Deep Dive Dialog */}
      <Dialog
        open={Boolean(selectedCompanyId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCompanyId(null);
            setDeepDive(null);
          }
        }}
        title={deepDive ? `${deepDive.company.name} Placement Insights` : 'Company Insights'}
        maxWidth="max-w-3xl"
      >
        {deepLoading || !deepDive ? (
          <div className="p-8 text-center text-muted-foreground">Loading insights...</div>
        ) : (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xl font-bold">{deepDive.stats.drivesCount}</div>
                <div className="text-xs text-muted-foreground">Past Drives</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xl font-bold">{deepDive.stats.seasonsVisited.length}</div>
                <div className="text-xs text-muted-foreground">Seasons Visited</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xl font-bold">{deepDive.stats.totalSelected}</div>
                <div className="text-xs text-muted-foreground">Total Placed</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xl font-bold">{deepDive.stats.selectionRate}%</div>
                <div className="text-xs text-muted-foreground">Selection Rate</div>
              </div>
            </div>

            {/* Privacy notice if cohort < 3 */}
            {deepDive.salaryIntelligence.cohortTooSmall && (
              <div className="p-3 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-xs">
                {deepDive.salaryIntelligence.message}
              </div>
            )}

            {/* Round Sequences */}
            {deepDive.roundPatterns.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Observed Selection Stages</span>
                </h4>
                <div className="space-y-2">
                  {deepDive.roundPatterns.map((rp, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-md border text-xs flex items-center justify-between"
                    >
                      <span className="font-mono text-foreground">{rp.pattern}</span>
                      <Badge variant="secondary">{rp.frequency} drive(s)</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Topics Asked */}
            {deepDive.topTopics.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Frequently Tested Topics</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {deepDive.topTopics.map((topic) => (
                    <Badge key={topic.id} variant="outline" className="text-xs">
                      {topic.name} ({topic.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Drives list */}
            {deepDive.recentDrives.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Campus Drive History</span>
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {deepDive.recentDrives.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-md border text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium">{d.title}</span>
                        <span className="text-muted-foreground ml-2">Season: {d.season}</span>
                      </div>
                      <div>
                        {d.selectedCount !== null && (
                          <span className="font-semibold text-green-700">
                            {d.selectedCount} offers
                          </span>
                        )}
                      </div>
                    </div>
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
