import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { GraduationCap, ArrowRight, ShieldCheck, Sparkles, Building2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight text-primary">CampusEdge</span>
            <span className="text-xs uppercase bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold tracking-wider">
              Phase 1
            </span>
          </div>
          <nav className="flex items-center space-x-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12 max-w-5xl">
        <section className="text-center py-12 space-y-4">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-primary/10 text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            College-Specific Placement Intelligence Engine
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Targeted preparation tailored to your campus hiring history
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Diagnostic readiness scores, past recruitment cutoff trends, and seamless college
            placement coordination.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/signup">
                <span>Start Student Onboarding</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Institutional Sign In</Link>
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 pt-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2 text-primary mb-1">
                <GraduationCap className="h-5 w-5" />
                <CardTitle className="text-lg">Student Experience</CardTitle>
              </div>
              <CardDescription>Targeted Diagnostics & Prep</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Self-register, complete DPDP-compliant onboarding, and unlock company-specific mock
                interviews and drive applications.
              </p>
              <Button asChild variant="link" className="p-0 text-primary h-auto font-semibold">
                <Link href="/student/dashboard">Explore Student Dashboard &rarr;</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                <Building2 className="h-5 w-5" />
                <CardTitle className="text-lg">Placement Cell (TPO)</CardTitle>
              </div>
              <CardDescription>Institutional Roster Management</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Verify student cohorts, approve or suspend candidates, configure branch departments,
                and inspect immutable audit trails.
              </p>
              <Button asChild variant="link" className="p-0 text-primary h-auto font-semibold">
                <Link href="/placement-cell/dashboard">Open Placement Cockpit &rarr;</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2 text-red-600 mb-1">
                <ShieldCheck className="h-5 w-5" />
                <CardTitle className="text-lg">Super Admin Governance</CardTitle>
              </div>
              <CardDescription>Multi-Tenant Partitioning</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Onboard colleges, invite placement administrators, enforce tenant security
                boundaries, and supervise platform audit logs.
              </p>
              <Button asChild variant="link" className="p-0 text-primary h-auto font-semibold">
                <Link href="/admin/colleges">Super Admin Console &rarr;</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t py-6 bg-card">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <div>
            CampusEdge Platform &copy; {new Date().getFullYear()} — Production Core (Phase 1)
          </div>
          <div className="flex space-x-4">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy (DPDP)
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
            <Link href="/grievance" className="hover:underline">
              Grievance Redressal
            </Link>
            <Link href="/status" className="hover:underline">
              System Status
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
