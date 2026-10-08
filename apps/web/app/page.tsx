import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-primary">CampusEdge</span>
            <span className="text-xs uppercase bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold tracking-wider">
              Phase 0
            </span>
          </div>
          <nav className="flex items-center space-x-4">
            <Link href="/status">
              <Button variant="outline" size="sm">
                System Status
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12 max-w-5xl">
        <section className="text-center py-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            College-Specific Placement Intelligence Engine
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Targeted preparation tailored to your campus hiring history, past recruitment rounds,
            and company-specific cutoffs.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link href="/status">
              <Button size="lg">Check Infrastructure Status</Button>
            </Link>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 pt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Portal</CardTitle>
              <CardDescription>Targeted Diagnostics & Prep</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              What should I prepare? Which companies should I focus on? Transparent readiness scores
              mapped to your college hiring patterns.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Placement Cell (TPO)</CardTitle>
              <CardDescription>Campus Placement Intelligence</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Manage company drives, student eligibility, verified interview experiences, and cohort
              analytics in one unified cockpit.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Super Admin</CardTitle>
              <CardDescription>Multi-tenant Governance</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Institutional onboarding, cross-college intelligence aggregation, quota management,
              and strict security compliance.
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        CampusEdge Platform &copy; {new Date().getFullYear()} — Production Foundation
      </footer>
    </div>
  );
}
