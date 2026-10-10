'use client';

import * as React from 'react';

/**
 * Global client handler that catches uncaught ChunkLoadError / dynamic import errors
 * (typically triggered after a rebuild or network cache mismatch) and reloads the page once.
 */
export function ChunkLoadHandler() {
  React.useEffect(() => {
    function isChunkLoadFailure(message?: string | null): boolean {
      if (!message) return false;
      const lower = message.toLowerCase();
      return (
        lower.includes('chunkloaderror') ||
        lower.includes('loading chunk') ||
        lower.includes('failed to fetch dynamically imported module')
      );
    }

    function handleChunkRetry() {
      if (typeof window === 'undefined') return;
      const key = `chunk_auto_retry_${window.location.pathname}`;
      const lastRetry = window.sessionStorage.getItem(key);
      const now = Date.now();

      // Guard: only auto-retry once every 15 seconds per path to prevent reload loops
      if (!lastRetry || now - parseInt(lastRetry, 10) > 15000) {
        window.sessionStorage.setItem(key, now.toString());
        window.location.reload();
      }
    }

    function onError(event: ErrorEvent) {
      if (isChunkLoadFailure(event.message) || isChunkLoadFailure(event.error?.message)) {
        handleChunkRetry();
      }
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reasonMsg =
        event.reason?.message || (typeof event.reason === 'string' ? event.reason : '');
      if (isChunkLoadFailure(reasonMsg)) {
        handleChunkRetry();
      }
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
