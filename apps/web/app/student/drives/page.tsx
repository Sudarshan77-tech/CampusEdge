'use client';

import * as React from 'react';
import { api, ApiError } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Briefcase, CheckCircle, AlertCircle, Clock, ShieldCheck, Building2 } from 'lucide-react';
import { DriveStatus, DriveCategory, ApplicationStatus } from '@campusedge/shared';

interface StudentDriveItem {
  id: string;
  title: string;
  category: DriveCategory;
  status: DriveStatus;
  visitDate: string | null;
  registrationDeadline: string | null;
  venue: string | null;
  company: { id: string; name: string; logoUrl: string | null };
  roles: { id: string; title: string; ctcLpaMin: string; ctcLpaMax: string; jobType: string }[];
  eligibilityEvaluation?: {
    isEligible: boolean;
    reasons: string[];
  };
  myApplication?: {
    id: string;
    status: ApplicationStatus;
    appliedAt: string;
  } | null;
}

export default function StudentDrivesPage() {
  const [drives, setDrives] = React.useState<StudentDriveItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<'eligible' | 'all'>('eligible');
  const [error, setError] = React.useState<string | null>(null);

  // Apply Modal state
  const [selectedDrive, setSelectedDrive] = React.useState<StudentDriveItem | null>(null);
  const [consentChecked, setConsentChecked] = React.useState(false);
  const [applying, setApplying] = React.useState(false);

  const fetchDrives = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ items: StudentDriveItem[] }>('/drives?limit=50');
      setDrives(res.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load drives');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const handleApply = async () => {
    if (!selectedDrive || !consentChecked) return;
    try {
      setApplying(true);
      await api.post(`/applications/drives/${selectedDrive.id}/apply`, {
        consentGiven: true,
        policyVersion: '1.0',
      });
      setSelectedDrive(null);
      setConsentChecked(false);
      fetchDrives();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Application submission failed');
    } finally {
      setApplying(false);
    }
  };

  const filteredDrives = drives.filter((d) => {
    if (tab === 'eligible') {
      return d.eligibilityEvaluation?.isEligible !== false;
    }
    return true;
  });

  const getCategoryBadge = (category: DriveCategory) => {
    switch (category) {
      case DriveCategory.SUPER_DREAM:
        return <Badge className="bg-purple-600 text-white">Super Dream</Badge>;
      case DriveCategory.DREAM:
        return <Badge className="bg-blue-600 text-white">Dream</Badge>;
      default:
        return <Badge variant="outline">Regular</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campus Placement Drives</h1>
        <p className="text-muted-foreground mt-1">
          Explore upcoming recruitment opportunities, check your eligibility, and register.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setTab('eligible')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'eligible'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Eligible For Me
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'all'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All Active Drives ({drives.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-muted-foreground">Loading drives...</div>
      ) : filteredDrives.length === 0 ? (
        <Card className="text-center p-12">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Placement Drives Available</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === 'eligible'
              ? 'There are currently no drives matching your academic eligibility criteria.'
              : 'Check back later as new recruiters schedule campus drives.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDrives.map((drive) => {
            const isEligible = drive.eligibilityEvaluation?.isEligible !== false;
            const reasons = drive.eligibilityEvaluation?.reasons || [];
            const hasApplied = Boolean(drive.myApplication);

            return (
              <Card key={drive.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-lg">{drive.title}</span>
                        {getCategoryBadge(drive.category)}
                        {hasApplied && (
                          <Badge variant="default" className="bg-emerald-600 text-white">
                            Registered
                          </Badge>
                        )}
                        {!isEligible && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Not Eligible
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {drive.company.name}
                        </span>

                        {drive.registrationDeadline && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-xs">
                              <Clock className="h-3.5 w-3.5" />
                              Deadline: {new Date(drive.registrationDeadline).toLocaleDateString()}
                            </span>
                          </>
                        )}

                        {drive.roles?.[0] && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-foreground text-xs">
                              ₹{drive.roles[0].ctcLpaMin} - ₹{drive.roles[0].ctcLpaMax} LPA
                            </span>
                          </>
                        )}
                      </div>

                      {/* Ineligibility Reasons */}
                      {!isEligible && reasons.length > 0 && (
                        <div className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs space-y-1">
                          {reasons.map((r, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span>•</span>
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="self-end md:self-center">
                      {hasApplied ? (
                        <Button variant="outline" size="sm" disabled className="text-emerald-700">
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Registered
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={!isEligible || drive.status !== DriveStatus.REGISTRATION_OPEN}
                          onClick={() => {
                            setSelectedDrive(drive);
                            setConsentChecked(false);
                          }}
                        >
                          {drive.status !== DriveStatus.REGISTRATION_OPEN
                            ? 'Registration Closed'
                            : 'Apply / Register'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Registration & Consent Modal */}
      <Dialog
        open={Boolean(selectedDrive)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDrive(null);
            setConsentChecked(false);
          }
        }}
        title={`Register for ${selectedDrive?.title}`}
        description="Verify your application details and confirm placement data sharing consent."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-md bg-muted/40 text-xs space-y-1.5">
            <div className="font-semibold text-foreground">
              Recruiter: {selectedDrive?.company.name}
            </div>
            <div className="text-muted-foreground">
              Offered Roles: {selectedDrive?.roles.map((r) => r.title).join(', ')}
            </div>
            <div className="text-muted-foreground">
              Package: ₹{selectedDrive?.roles[0]?.ctcLpaMin} - ₹{selectedDrive?.roles[0]?.ctcLpaMax}{' '}
              LPA
            </div>
          </div>

          {/* Explicit Placement Sharing Consent Checkbox */}
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/[0.03] space-y-3">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="consentCheck"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="consentCheck"
                className="text-xs leading-relaxed text-foreground cursor-pointer"
              >
                <span className="font-semibold">Placement Data Sharing Consent: </span>I confirm my
                registration and authorize the College Placement Cell to share my academic record
                (CGPA, enrollment details, resume) with{' '}
                <span className="font-semibold">{selectedDrive?.company.name}</span> for the purpose
                of recruitment, assessments, and interview scheduling.
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSelectedDrive(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={!consentChecked || applying}
              className="flex items-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{applying ? 'Submitting...' : 'Confirm Registration'}</span>
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
