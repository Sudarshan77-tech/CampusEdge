'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, RotateCcw, RefreshCw, LogIn } from 'lucide-react';

export default function StudentErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  React.useEffect(() => {
    // Log student error
    console.error('Student route error caught:', error);

    // Auto-reload on ChunkLoadError if not already attempted in this session
    const isChunkError =
      error.name === 'ChunkLoadError' ||
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch dynamically imported module');

    if (isChunkError && typeof window !== 'undefined') {
      const reloadKey = `chunk_retry_${window.location.pathname}`;
      const alreadyReloaded = window.sessionStorage.getItem(reloadKey);
      if (!alreadyReloaded) {
        window.sessionStorage.setItem(reloadKey, Date.now().toString());
        window.location.reload();
      }
    }
  }, [error]);

  const handleHardReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <Card
        className="w-full max-w-md shadow-lg border-destructive/20"
        data-testid="student-error-boundary"
      >
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold">Student Portal Error</CardTitle>
          <CardDescription>
            We encountered a problem loading this section of the student portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error.message || 'An unexpected client error occurred.'}
          </div>
          {error.digest && (
            <p className="text-xs text-muted-foreground text-center font-mono">
              Digest: {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="outline" onClick={handleHardReload} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
          <Button variant="outline" onClick={() => reset()} className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => router.push('/login')} className="w-full sm:w-auto">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
