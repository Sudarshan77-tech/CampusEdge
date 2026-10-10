'use client';

import * as React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Global application error caught:', error);

    const isChunkError =
      error.name === 'ChunkLoadError' ||
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch dynamically imported module');

    if (isChunkError && typeof window !== 'undefined') {
      const reloadKey = `global_chunk_retry_${window.location.pathname}`;
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
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-xl text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 text-xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A critical application error occurred while loading this page.
          </p>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-600 dark:text-red-400 font-mono text-left break-words">
            {error.message || 'An unexpected client error occurred.'}
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={handleHardReload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
