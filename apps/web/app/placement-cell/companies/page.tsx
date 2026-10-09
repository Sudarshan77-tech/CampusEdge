'use client';

import * as React from 'react';
import { api, ApiError } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Building2, Plus, Search, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import { CompanyStatus } from '@campusedge/shared';

interface Company {
  id: string;
  name: string;
  slug: string;
  website?: string | null;
  industry?: string | null;
  logoUrl?: string | null;
  status: CompanyStatus;
  _count?: { drives: number; experiences: number };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // Dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [industry, setIndustry] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const fetchCompanies = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ items: Company[] }>(
        `/companies${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      );
      setCompanies(res.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCompanies]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post<{
        company: Company;
        isExisting: boolean;
        message?: string;
      }>('/companies', {
        name: name.trim(),
        website: website.trim() || undefined,
        industry: industry.trim() || undefined,
      });

      if (res.isExisting) {
        alert(
          `Note: Company "${name}" matched an existing verified company in the global catalog.`,
        );
      }

      setCreateOpen(false);
      setName('');
      setWebsite('');
      setIndustry('');
      fetchCompanies();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to register company');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruiter Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Global catalog of recruiters and college-scoped employer profiles.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Recruiter</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by recruiter name or industry..."
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
        <div className="flex justify-center p-12 text-muted-foreground">Loading catalog...</div>
      ) : companies.length === 0 ? (
        <Card className="text-center p-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Companies Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? 'Try adjusting your search query.'
              : 'Add your first recruiter to get started.'}
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4">
            Add Recruiter
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span>{company.name}</span>
                  </CardTitle>
                  {company.status === CompanyStatus.VERIFIED ? (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-300 flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </div>
                {company.industry && <CardDescription>{company.industry}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {company.website && (
                  <a
                    href={
                      company.website.startsWith('http')
                        ? company.website
                        : `https://${company.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <span>{company.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                  <span>Drives: {company._count?.drives ?? 0}</span>
                  <span>Experiences: {company._count?.experiences ?? 0}</span>
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
        title="Add Recruiter to Catalog"
        description="Add a new company profile. Duplicate checks prevent duplicate catalog entries."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="cname">Company Name</Label>
            <Input
              id="cname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Microsoft India"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="industry">Industry / Sector</Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Software, Banking, Automotive"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="website">Official Website URL</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://company.com"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Save Recruiter'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
