'use client';

import * as React from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Role } from '@campusedge/shared';
import { Shield, RefreshCw } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}

export default function PlacementCellAuditPage() {
  const [logs, setLogs] = React.useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchLogs = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ data: AuditLogEntry[] }>(
        '/colleges/my-college/audit?page=1&limit=50',
      );
      setLogs(data.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar
        user={{
          email: 'Placement Officer',
          role: Role.COLLEGE_ADMIN,
          status: 'ACTIVE',
        }}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center space-x-2">
              <Shield className="h-6 w-6 text-indigo-600" />
              <span>Immutable Audit Trail</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tamper-evident system log of student approvals, suspensions, and configuration edits.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => fetchLogs()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">{error}</div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Administrative Activity</CardTitle>
            <CardDescription>
              Protected by PostgreSQL trigger-enforced append-only constraints.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-y text-xs text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Actor / IP</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground font-sans">
                        Loading audit records...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground font-sans">
                        No audit events recorded yet for this college.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          <Badge variant="outline">{log.action}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.entityType} {log.entityId ? `(${log.entityId.slice(0, 8)}...)` : ''}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span>{log.actorId.slice(0, 8)}...</span>
                          {log.ipAddress && (
                            <span className="block text-[10px] text-slate-400">
                              {log.ipAddress}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
