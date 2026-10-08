import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | CampusEdge',
  description: 'CampusEdge Privacy Policy and DPDP Compliance Notice',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-card rounded-lg border shadow-sm p-8 space-y-6">
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <strong>LEGAL DISCLAIMER:</strong> DRAFT — requires legal review before launch. This
          document outlines data collection, processing, and retention practices under the Digital
          Personal Data Protection (DPDP) Act, 2023.
        </div>

        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Version: 2026.1 | Last Updated: October 2026
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Overview & Data Fiduciary</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            CampusEdge acts as a Data Fiduciary and Processor for affiliated colleges and
            universities. We collect and process student personal data solely to provide
            college-specific placement preparation, eligibility screening, drive applications, and
            career intelligence.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Data We Collect</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 leading-relaxed">
            <li>
              <strong>Identity & Contact:</strong> Full name, verified email address, phone number
              (optional), student roll/registration number.
            </li>
            <li>
              <strong>Academic Credentials:</strong> Enrolled college, degree, department/branch,
              batch graduation year, cumulative grade point average (CGPA), and academic backlog
              history.
            </li>
            <li>
              <strong>Skills & Career Profile:</strong> Programming languages, technical
              competencies, resume data, and interview practice logs.
            </li>
            <li>
              <strong>Audit & Security Telemetry:</strong> Login timestamps, IP addresses, browser
              user agent, and activity logs for security verification.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Purpose and Legal Basis (DPDP Act, 2023)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All personal data is processed pursuant to free, specific, informed, and unambiguous
            consent obtained during student onboarding. Processing is strictly limited to:
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 leading-relaxed">
            <li>Verifying student enrollment with the affiliated college placement cell.</li>
            <li>Screening eligibility for placement company job descriptions.</li>
            <li>Generating personalized interview practice questions and diagnostic feedback.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Data Subject Rights (Student Rights)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Under Chapter III of the DPDP Act 2023, you have the right to access your personal data,
            request corrections, withdraw consent, and request data erasure. You may submit data
            export or erasure requests directly from your Profile settings or by contacting our
            Grievance Officer.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Contact & Grievance Redressal</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For privacy inquiries or to file a grievance, visit our{' '}
            <Link href="/grievance" className="text-primary underline">
              Grievance Redressal Portal
            </Link>{' '}
            or contact <code>privacy@campusedge.internal</code>.
          </p>
        </section>

        <div className="pt-4 border-t flex justify-between text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          <Link href="/grievance" className="hover:underline">
            Grievance Redressal
          </Link>
        </div>
      </div>
    </div>
  );
}
