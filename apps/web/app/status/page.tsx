'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  database: string;
  version: string;
}

export default function StatusPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/health`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Health check returned HTTP ${res.status}`);
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach API endpoint');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="container mx-auto px-6 py-12 max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
          <p className="text-sm text-muted-foreground">
            Real-time API & Database Health Verification
          </p>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm">
            &larr; Back to Home
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Core Infrastructure Status</span>
            {loading ? (
              <span className="text-xs px-2 py-1 bg-muted rounded font-mono">Checking...</span>
            ) : error ? (
              <span className="text-xs px-2 py-1 bg-destructive/20 text-destructive rounded font-mono font-semibold">
                DEGRADED / OFFLINE
              </span>
            ) : (
              <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded font-mono font-semibold">
                OPERATIONAL
              </span>
            )}
          </CardTitle>
          <CardDescription>Direct heartbeat from NestJS `/api/v1/health`</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Contacting backend service...
            </div>
          )}

          {error && (
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <strong>Connection Error:</strong> {error}
              <p className="text-xs mt-1 text-muted-foreground">
                Ensure the API service is running on the configured port.
              </p>
            </div>
          )}

          {data && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Service Status:</span>
                <span className="font-bold text-green-600 uppercase">{data.status}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Database Connectivity:</span>
                <span className="font-bold text-green-600 uppercase">{data.database}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Version:</span>
                <span>{data.version}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Service Uptime:</span>
                <span>{Math.floor(data.uptime)} seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timestamp:</span>
                <span>{data.timestamp}</span>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button onClick={fetchHealth} disabled={loading} size="sm">
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
