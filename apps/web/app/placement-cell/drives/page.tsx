'use client';

import * as React from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Calendar, Briefcase, Users, ArrowRight } from 'lucide-react';
import { DriveStatus, DriveCategory } from '@campusedge/shared';

interface DriveItem {
  id: string;
  title: string;
  category: DriveCategory;
  status: DriveStatus;
  isHistorical: boolean;
  visitDate: string | null;
  registrationDeadline: string | null;
  company: { id: string; name: string; logoUrl: string | null };
  season: { id: string; label: string };
  roles: { id: string; title: string; ctcLpaMin: string; ctcLpaMax: string }[];
  _count?: { applications: number };
}

export default function DrivesListPage() {
  const [drives, setDrives] = React.useState<DriveItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [error, setError] = React.useState<string | null>(null);

  const fetchDrives = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let query = `?limit=50`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'ALL') query += `&status=${statusFilter}`;

      const res = await api.get<{ items: DriveItem[] }>(`/drives${query}`);
      setDrives(res.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load drives');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchDrives();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchDrives]);

  const getStatusBadge = (status: DriveStatus) => {
    switch (status) {
      case DriveStatus.REGISTRATION_OPEN:
        return <Badge variant="default">Registration Open</Badge>;
      case DriveStatus.REGISTRATION_CLOSED:
        return <Badge variant="secondary">Registration Closed</Badge>;
      case DriveStatus.IN_PROGRESS:
        return <Badge variant="warning">In Progress</Badge>;
      case DriveStatus.COMPLETED:
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            Completed
          </Badge>
        );
      case DriveStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const getCategoryBadge = (category: DriveCategory) => {
    switch (category) {
      case DriveCategory.SUPER_DREAM:
        return <Badge className="bg-purple-600 text-white hover:bg-purple-700">Super Dream</Badge>;
      case DriveCategory.DREAM:
        return <Badge className="bg-blue-600 text-white hover:bg-blue-700">Dream</Badge>;
      default:
        return <Badge variant="outline">Regular</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Placement Drives</h1>
          <p className="text-muted-foreground mt-1">
            Schedule on-campus recruiting drives, track applicants, and manage selection rounds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="flex items-center gap-2">
            <Link href="/placement-cell/drives/new">
              <Plus className="h-4 w-4" />
              <span>New Drive</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drives by title or recruiter..."
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter drives by status"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="REGISTRATION_OPEN">Registration Open</option>
          <option value="REGISTRATION_CLOSED">Registration Closed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12 text-muted-foreground">Loading drives...</div>
      ) : drives.length === 0 ? (
        <Card className="text-center p-12">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Placement Drives Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? 'No drives matching the current filters.'
              : 'Create your first campus recruiting drive.'}
          </p>
          <Button asChild className="mt-4">
            <Link href="/placement-cell/drives/new">Create Drive</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {drives.map((drive) => {
            const minCtc = drive.roles?.[0]?.ctcLpaMin;
            const maxCtc = drive.roles?.[0]?.ctcLpaMax;

            return (
              <Card key={drive.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-lg">{drive.title}</span>
                        {getCategoryBadge(drive.category)}
                        {getStatusBadge(drive.status)}
                        {drive.isHistorical && <Badge variant="secondary">Historical</Badge>}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{drive.company.name}</span>
                        <span>•</span>
                        <span>Season: {drive.season.label}</span>
                        {drive.visitDate && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Visit: {new Date(drive.visitDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                        {minCtc && maxCtc && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-foreground">
                              CTC: ₹{minCtc} - ₹{maxCtc} LPA
                            </span>
                          </>
                        )}
                      </div>

                      {drive.roles && drive.roles.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {drive.roles.map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
                            >
                              {r.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{drive._count?.applications ?? 0}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Registered</span>
                      </div>

                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Link href={`/placement-cell/drives/${drive.id}`}>
                          <span>Manage</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
