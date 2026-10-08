---
name: nextjs-feature-page
description: Scaffold Next.js App Router feature pages with server component data fetching, loading/error boundaries, shadcn UI components, and Zod client validation.
---

# Next.js Feature Page Scaffolding

## When to Use

Use when creating frontend pages in `apps/web/app/` (e.g. `/drives`, `/readiness`, `/practice`, `/admin`).

## Directory Layout

```
apps/web/app/<feature>/
├── page.tsx            # Server Component (data fetching)
├── loading.tsx         # Streaming skeleton UI
├── error.tsx           # Error boundary
└── components/         # Client components & forms
    └── <feature>-form.tsx
```

## Implementation Templates

### 1. Server Component (`page.tsx`)

```typescript
import { Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

async function fetchFeatureData() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const res = await fetch(`${apiUrl}/api/v1/feature`, {
    cache: 'no-store', // or revalidate
  });

  if (!res.ok) {
    throw new Error('Failed to load feature data from API');
  }
  return res.json();
}

export default async function FeaturePage() {
  const data = await fetchFeatureData();

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Feature Overview</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((item: { id: string; name: string }) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Tenant scoped item</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 2. Loading Boundary (`loading.tsx`)

```typescript
export default function Loading() {
  return (
    <div className="container mx-auto px-6 py-8 space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/4"></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-32 bg-muted rounded"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    </div>
  );
}
```

### 3. Error Boundary (`error.tsx`)

```typescript
'use client';

import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-6 py-12 text-center space-y-4">
      <h2 className="text-xl font-bold text-destructive">Failed to load content</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={() => reset()} variant="outline">
        Try Again
      </Button>
    </div>
  );
}
```
