'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function DevApiHealthBanner() {
  const [isUnreachable, setIsUnreachable] = React.useState(false);
  const [checking, setChecking] = React.useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const checkHealth = React.useCallback(async () => {
    // Development only; never run in production
    if (process.env.NODE_ENV === 'production') return;

    try {
      setChecking(true);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${apiUrl}/api/v1/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      if (res.ok) {
        setIsUnreachable(false);
      } else {
        setIsUnreachable(true);
      }
    } catch {
      setIsUnreachable(true);
    } finally {
      setChecking(false);
    }
  }, [apiUrl]);

  React.useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Completely absent in production builds
  if (process.env.NODE_ENV === 'production' || !isUnreachable) {
    return null;
  }

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 w-full bg-amber-500 text-amber-950 px-4 py-2 text-sm font-medium shadow-md flex items-center justify-between gap-3"
      data-testid="dev-api-health-banner"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          The API is not running on {apiUrl}. Start it with <code>pnpm dev</code>.
        </span>
      </div>
      <button
        type="button"
        onClick={() => checkHealth()}
        disabled={checking}
        className="inline-flex items-center gap-1 rounded bg-amber-600 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
        <span>{checking ? 'Checking...' : 'Check Again'}</span>
      </button>
    </div>
  );
}
