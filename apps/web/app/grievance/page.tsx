import Link from 'next/link';

export const metadata = {
  title: 'Grievance Redressal | CampusEdge',
  description: 'CampusEdge DPDP Data Protection Officer and Grievance Redressal Mechanism',
};

export default function GrievancePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-card rounded-lg border shadow-sm p-8 space-y-6">
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <strong>LEGAL DISCLAIMER:</strong> DRAFT — requires legal review before launch. Statutory
          Grievance Redressal notice under Section 13 of the Digital Personal Data Protection Act,
          2023.
        </div>

        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Grievance Redressal Mechanism</h1>
          <p className="text-sm text-muted-foreground mt-1">Data Protection Officer Designation</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Data Protection Officer (DPO) Details</h2>
          <div className="rounded-md bg-muted/60 p-4 space-y-2 text-sm">
            <p>
              <strong>Designation:</strong> Data Protection Officer & Grievance Officer
            </p>
            <p>
              <strong>Entity:</strong> CampusEdge Placement Intelligence
            </p>
            <p>
              <strong>Email:</strong> <code>grievance@campusedge.internal</code>
            </p>
            <p>
              <strong>Response Turnaround Time:</strong> 72 business hours
            </p>
            <p>
              <strong>Address:</strong> Technology Support & Data Ethics Cell, CampusEdge Core,
              India
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Grievance Filing Procedure</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have concerns regarding:
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 leading-relaxed">
            <li>Unauthorized processing or disclosure of your academic or personal data.</li>
            <li>Failure to honor data erasure or correction requests.</li>
            <li>Inappropriate placement access or account suspension appeals.</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please email <code>grievance@campusedge.internal</code> with your registered email,
            college name, and detailed description of the incident. We commit to acknowledging
            receipt within 24 hours and providing resolution within 30 days.
          </p>
        </section>

        <div className="pt-4 border-t flex justify-between text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
