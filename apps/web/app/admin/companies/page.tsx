'use client';

import * as React from 'react';
import { api, ApiError } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Building2, GitMerge, Search } from 'lucide-react';
import { CompanyStatus } from '@campusedge/shared';

interface Company {
  id: string;
  name: string;
  normalizedName: string;
  slug: string;
  status: CompanyStatus;
  website: string | null;
  industry: string | null;
  createdByCollegeId: string | null;
  _count?: { drives: number; experiences: number };
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>('PENDING_REVIEW');
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // Merge Dialog State
  const [mergeSource, setMergeSource] = React.useState<Company | null>(null);
  const [targetId, setTargetId] = React.useState('');
  const [allCompanies, setAllCompanies] = React.useState<Company[]>([]);
  const [merging, setMerging] = React.useState(false);

  const fetchCompanies = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let query = `?limit=100`;
      if (statusFilter !== 'ALL') query += `&status=${statusFilter}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const res = await api.get<{ items: Company[] }>(`/companies${query}`);
      setCompanies(res.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  React.useEffect(() => {
    fetchCompanies();
    api
      .get<{ items: Company[] }>('/companies?limit=200')
      .then((res) => setAllCompanies(res.items || []))
      .catch(console.error);
  }, [fetchCompanies]);

  const handleVerify = async (id: string) => {
    try {
      await api.patch(`/companies/${id}/verify`, { status: CompanyStatus.VERIFIED });
      fetchCompanies();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Verification failed');
    }
  };

  const handleMerge = async () => {
    if (!mergeSource || !targetId) return;
    try {
      setMerging(true);
      await api.post(`/companies/${mergeSource.id}/merge`, {
        targetCompanyId: targetId,
      });
      alert(`Merged "${mergeSource.name}" successfully! All drives and experiences repointed.`);
      setMergeSource(null);
      setTargetId('');
      fetchCompanies();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Merge failed');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Recruiter Catalog Management</h1>
        <p className="text-muted-foreground mt-1">
          Review college-added recruiters, verify profiles, and merge duplicate catalog entries.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name..."
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter companies by status"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="VERIFIED">Verified</option>
          <option value="MERGED">Merged</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-muted-foreground">Loading catalog...</div>
      ) : companies.length === 0 ? (
        <Card className="text-center p-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Companies Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {statusFilter === 'PENDING_REVIEW'
              ? 'No companies currently pending review.'
              : 'Try adjusting your search filters.'}
          </p>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left border-b">
              <tr>
                <th className="p-3.5">Company Name</th>
                <th className="p-3.5">Industry</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Associated Data</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className="p-3.5 font-medium">
                    <div>{c.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{c.slug}</div>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{c.industry || 'N/A'}</td>
                  <td className="p-3.5">
                    <Badge
                      variant={
                        c.status === CompanyStatus.VERIFIED
                          ? 'default'
                          : c.status === CompanyStatus.PENDING_REVIEW
                            ? 'warning'
                            : 'secondary'
                      }
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-xs text-muted-foreground">
                    Drives: {c._count?.drives ?? 0} • Experiences: {c._count?.experiences ?? 0}
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    {c.status === CompanyStatus.PENDING_REVIEW && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleVerify(c.id)}
                      >
                        Verify
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMergeSource(c)}
                      className="flex items-center gap-1 inline-flex"
                    >
                      <GitMerge className="h-3.5 w-3.5" />
                      <span>Merge</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Merge Dialog */}
      <Dialog
        open={Boolean(mergeSource)}
        onOpenChange={(open) => {
          if (!open) {
            setMergeSource(null);
            setTargetId('');
          }
        }}
        title={`Merge "${mergeSource?.name}"`}
        description="Transactionally repoints all Drives and Experiences across all colleges to the target company, then marks this company as MERGED."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-xs">
            Warning: This action repoints all historical data and cannot be undone automatically.
          </div>

          <div className="space-y-1">
            <Label htmlFor="targetCompanySelect">Select Target Verified Company *</Label>
            <select
              id="targetCompanySelect"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              required
            >
              <option value="">Select target company...</option>
              {allCompanies
                .filter((c) => c.id !== mergeSource?.id && c.status === CompanyStatus.VERIFIED)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.slug})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setMergeSource(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={merging || !targetId} onClick={handleMerge}>
              {merging ? 'Merging...' : 'Confirm Merge'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
