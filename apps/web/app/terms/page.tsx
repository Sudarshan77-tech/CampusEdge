import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | CampusEdge',
  description: 'CampusEdge Terms of Service and End User Agreement',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-card rounded-lg border shadow-sm p-8 space-y-6">
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <strong>LEGAL DISCLAIMER:</strong> DRAFT — requires legal review before launch. These
          terms govern platform access for students, placement cells, and institutional
          administrators.
        </div>

        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Version: 2026.1 | Last Updated: October 2026
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By creating an account or accessing CampusEdge, you agree to be bound by these Terms of
            Service. If you are registering on behalf of a college or educational institution, you
            represent and warrant that you possess the requisite authority to bind that entity.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Student Verification & Representation</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Students agree to provide accurate, truthful, and up-to-date academic information,
            including CGPA, active backlog status, and degree details. Misrepresentation of academic
            standing constitutes grounds for immediate suspension from campus placement drives and
            account termination.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Institutional Tenancy and Access</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Colleges operate as distinct tenant domains within CampusEdge. College Placement Cell
            administrators have the authority to verify student rosters, manage drive eligibility
            criteria, and suspend non-compliant student accounts.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Prohibited Conduct</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 leading-relaxed">
            <li>Sharing credentials or permitting third-party access to student/admin accounts.</li>
            <li>
              Attempting unauthorized cross-tenant data access or circumventing Row Level Security
              controls.
            </li>
            <li>Automated scraping or scraping placement test questions and AI evaluations.</li>
          </ul>
        </section>

        <div className="pt-4 border-t flex justify-between text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/grievance" className="hover:underline">
            Grievance Redressal
          </Link>
        </div>
      </div>
    </div>
  );
}
