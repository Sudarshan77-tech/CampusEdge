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
import { AlertCircle, RotateCcw, LogIn } from 'lucide-react';

export default function OnboardingErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  React.useEffect(() => {
    console.error('Onboarding Error Boundary caught error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <Card
        className="w-full max-w-md shadow-lg border-destructive/20"
        data-testid="onboarding-error-boundary"
      >
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold">Onboarding Experience Error</CardTitle>
          <CardDescription>
            Something unexpected occurred while loading the onboarding flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error.message || 'An unexpected client error occurred.'}
          </div>
          {error.digest && (
            <p className="text-xs text-muted-foreground text-center font-mono">
              Error Digest: {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="outline" onClick={() => reset()} className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => router.push('/login')} className="w-full sm:w-auto">
            <LogIn className="mr-2 h-4 w-4" />
            Return to Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
