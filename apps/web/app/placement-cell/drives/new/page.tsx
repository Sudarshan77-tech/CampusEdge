'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from 'lucide-react';
import {
  DriveType,
  DriveCategory,
  DriveStatus,
  JobType,
  RoundType,
  RoundMode,
  Degree,
} from '@campusedge/shared';

interface Company {
  id: string;
  name: string;
}

interface Season {
  id: string;
  label: string;
  isCurrent: boolean;
}

export default function NewDrivePage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Meta data
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [seasons, setSeasons] = React.useState<Season[]>([]);

  // Form State - Step 1: Basic
  const [companyId, setCompanyId] = React.useState('');
  const [seasonId, setSeasonId] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState<DriveCategory>(DriveCategory.REGULAR);
  const [driveType, setDriveType] = React.useState<DriveType>(DriveType.ON_CAMPUS);
  const [visitDate, setVisitDate] = React.useState('');
  const [registrationDeadline, setRegistrationDeadline] = React.useState('');
  const [venue, setVenue] = React.useState('');

  // Form State - Step 2: Roles
  const [roles, setRoles] = React.useState([
    {
      title: 'Graduate Trainee Engineer',
      jobType: JobType.FULL_TIME,
      ctcLpaMin: 6.0,
      ctcLpaMax: 7.0,
      location: 'Pan India',
      openings: 10,
    },
  ]);

  // Form State - Step 3: Eligibility
  const [minCgpa, setMinCgpa] = React.useState(6.5);
  const [maxActiveBacklogs, setMaxActiveBacklogs] = React.useState(0);
  const [allowedDegrees, setAllowedDegrees] = React.useState<Degree[]>([Degree.BTECH]);

  // Form State - Step 4: Rounds
  const [rounds, setRounds] = React.useState([
    {
      sequence: 1,
      title: 'Online Aptitude Assessment',
      roundType: RoundType.APTITUDE,
      mode: RoundMode.ONLINE,
      durationMinutes: 60,
    },
    {
      sequence: 2,
      title: 'Technical Interview',
      roundType: RoundType.TECHNICAL_INTERVIEW,
      mode: RoundMode.OFFLINE,
      durationMinutes: 45,
    },
    {
      sequence: 3,
      title: 'HR Interview',
      roundType: RoundType.HR_INTERVIEW,
      mode: RoundMode.OFFLINE,
      durationMinutes: 30,
    },
  ]);

  React.useEffect(() => {
    async function loadMeta() {
      try {
        const [compRes, seasonRes] = await Promise.all([
          api.get<{ items: Company[] }>('/companies?limit=100'),
          api.get<{ items: Season[] }>('/seasons'),
        ]);
        setCompanies(compRes.items || []);
        setSeasons(seasonRes.items || []);
        if (compRes.items?.[0]) setCompanyId(compRes.items[0].id);
        const curSeason = seasonRes.items?.find((s) => s.isCurrent) || seasonRes.items?.[0];
        if (curSeason) setSeasonId(curSeason.id);
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  const addRole = () => {
    setRoles((prev) => [
      ...prev,
      {
        title: 'Software Engineer',
        jobType: JobType.FULL_TIME,
        ctcLpaMin: 8.0,
        ctcLpaMax: 10.0,
        location: '',
        openings: 5,
      },
    ]);
  };

  const removeRole = (idx: number) => {
    if (roles.length <= 1) return;
    setRoles((prev) => prev.filter((_, i) => i !== idx));
  };

  const addRound = () => {
    setRounds((prev) => [
      ...prev,
      {
        sequence: prev.length + 1,
        title: 'Technical Round 2',
        roundType: RoundType.TECHNICAL_INTERVIEW,
        mode: RoundMode.OFFLINE,
        durationMinutes: 45,
      },
    ]);
  };

  const removeRound = (idx: number) => {
    if (rounds.length <= 1) return;
    setRounds((prev) =>
      prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, sequence: i + 1 })),
    );
  };

  const handleSubmit = async () => {
    if (!title || !companyId || !seasonId) {
      setError('Please fill in all required basic fields');
      setStep(1);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        companyId,
        seasonId,
        title: title.trim(),
        category,
        driveType,
        status: DriveStatus.DRAFT,
        visitDate: visitDate ? new Date(visitDate).toISOString() : null,
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline).toISOString()
          : null,
        venue: venue.trim() || null,
        roles: roles.map((r) => ({
          title: r.title.trim(),
          jobType: r.jobType,
          ctcLpaMin: Number(r.ctcLpaMin),
          ctcLpaMax: Number(r.ctcLpaMax),
          location: r.location || null,
          openings: r.openings ? Number(r.openings) : null,
        })),
        eligibility: {
          minCgpa: Number(minCgpa),
          maxActiveBacklogs: Number(maxActiveBacklogs),
          allowedDegrees,
        },
        rounds: rounds.map((r) => ({
          sequence: r.sequence,
          title: r.title.trim(),
          roundType: r.roundType,
          mode: r.mode,
          durationMinutes: r.durationMinutes ? Number(r.durationMinutes) : null,
        })),
      };

      const res = await api.post<{ id: string }>('/drives', payload);
      router.push(`/placement-cell/drives/${res.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create drive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/placement-cell/drives">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Placement Drive</h1>
          <p className="text-muted-foreground mt-1">
            Configure company, roles, eligibility criteria, and selection rounds.
          </p>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between border-b pb-4">
        {[
          { num: 1, label: 'Basic Info' },
          { num: 2, label: 'Roles & CTC' },
          { num: 3, label: 'Eligibility' },
          { num: 4, label: 'Interview Rounds' },
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-2 cursor-pointer ${
              step === s.num ? 'text-primary font-semibold' : 'text-muted-foreground'
            }`}
            onClick={() => setStep(s.num)}
          >
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${
                step === s.num
                  ? 'bg-primary text-primary-foreground'
                  : step > s.num
                    ? 'bg-muted text-foreground'
                    : 'border text-muted-foreground'
              }`}
            >
              {step > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
            </span>
            <span className="hidden sm:inline text-sm">{s.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Select recruiter, season, and overall campus drive schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="companySelect">Recruiter / Company *</Label>
                <select
                  id="companySelect"
                  value={companyId}
                  onChange={(e) => {
                    setCompanyId(e.target.value);
                    const comp = companies.find((c) => c.id === e.target.value);
                    if (comp && !title) setTitle(`${comp.name} Campus Drive`);
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  required
                >
                  <option value="">Select Recruiter</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="seasonSelect">Placement Season *</Label>
                <select
                  id="seasonSelect"
                  value={seasonId}
                  onChange={(e) => setSeasonId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  required
                >
                  <option value="">Select Season</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} {s.isCurrent ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="titleInput">Drive Title *</Label>
              <Input
                id="titleInput"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Google India Campus Hiring 2025"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="categorySelect">Drive Category</Label>
                <select
                  id="categorySelect"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DriveCategory)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                >
                  <option value={DriveCategory.REGULAR}>Regular (&lt; 10 LPA)</option>
                  <option value={DriveCategory.DREAM}>Dream (10 - 20 LPA)</option>
                  <option value={DriveCategory.SUPER_DREAM}>Super Dream (&gt; 20 LPA)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="driveTypeSelect">Drive Mode</Label>
                <select
                  id="driveTypeSelect"
                  value={driveType}
                  onChange={(e) => setDriveType(e.target.value as DriveType)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                >
                  <option value={DriveType.ON_CAMPUS}>On Campus</option>
                  <option value={DriveType.POOL}>Pooled Campus</option>
                  <option value={DriveType.OFF_CAMPUS}>Off Campus Referral</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="deadlineInput">Registration Deadline</Label>
                <Input
                  id="deadlineInput"
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="visitDateInput">Campus Visit / Test Date</Label>
                <Input
                  id="visitDateInput"
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="venueInput">Venue / Platform</Label>
              <Input
                id="venueInput"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Auditorium / HackerRank Assessment"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Roles */}
      {step === 2 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Designations & Roles</CardTitle>
              <CardDescription>Specify roles and CTC compensation in LPA.</CardDescription>
            </div>
            <Button
              onClick={addRole}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add Role</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {roles.map((role, idx) => (
              <div key={idx} className="p-4 rounded-lg border bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Role #{idx + 1}</span>
                  {roles.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-7 w-7"
                      onClick={() => removeRole(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor={`role-title-${idx}`}>Job Title *</Label>
                    <Input
                      id={`role-title-${idx}`}
                      value={role.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRoles((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, title: val } : r)),
                        );
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`role-type-${idx}`}>Job Type</Label>
                    <select
                      id={`role-type-${idx}`}
                      value={role.jobType}
                      onChange={(e) => {
                        const val = e.target.value as JobType;
                        setRoles((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, jobType: val } : r)),
                        );
                      }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    >
                      <option value={JobType.FULL_TIME}>Full Time (FTE)</option>
                      <option value={JobType.INTERNSHIP}>Internship</option>
                      <option value={JobType.INTERN_PLUS_PPO}>Internship + FTE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor={`role-ctc-min-${idx}`}>CTC Min (LPA) *</Label>
                    <Input
                      id={`role-ctc-min-${idx}`}
                      type="number"
                      step="0.1"
                      value={role.ctcLpaMin}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRoles((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, ctcLpaMin: val } : r)),
                        );
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`role-ctc-max-${idx}`}>CTC Max (LPA) *</Label>
                    <Input
                      id={`role-ctc-max-${idx}`}
                      type="number"
                      step="0.1"
                      value={role.ctcLpaMax}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRoles((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, ctcLpaMax: val } : r)),
                        );
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`role-openings-${idx}`}>Openings</Label>
                    <Input
                      id={`role-openings-${idx}`}
                      type="number"
                      value={role.openings}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRoles((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, openings: val } : r)),
                        );
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`role-loc-${idx}`}>Location</Label>
                    <Input
                      id={`role-loc-${idx}`}
                      value={role.location}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRoles((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, location: val } : r)),
                        );
                      }}
                      placeholder="e.g. Bangalore"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Eligibility */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Eligibility Criteria</CardTitle>
            <CardDescription>
              The eligibility engine automatically gates student registration based on these
              criteria.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cgpaInput">Minimum CGPA (0.00 - 10.00)</Label>
                <Input
                  id="cgpaInput"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="backlogsInput">Maximum Allowed Active Backlogs</Label>
                <Input
                  id="backlogsInput"
                  type="number"
                  min="0"
                  value={maxActiveBacklogs}
                  onChange={(e) => setMaxActiveBacklogs(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label>Allowed Degrees</Label>
              <div className="flex flex-wrap gap-4">
                {[Degree.BTECH, Degree.MTECH, Degree.MCA, Degree.MBA, Degree.OTHER].map((deg) => (
                  <label key={deg} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={allowedDegrees.includes(deg)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAllowedDegrees((prev) => [...prev, deg]);
                        } else {
                          setAllowedDegrees((prev) => prev.filter((d) => d !== deg));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>{deg}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Rounds */}
      {step === 4 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Selection Rounds</CardTitle>
              <CardDescription>Sequential hiring pipeline stages.</CardDescription>
            </div>
            <Button
              onClick={addRound}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add Round</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {rounds.map((round, idx) => (
              <div key={idx} className="p-4 rounded-lg border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Round {round.sequence}</span>
                  {rounds.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-7 w-7"
                      onClick={() => removeRound(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-1">
                    <Label htmlFor={`round-title-${idx}`}>Round Name</Label>
                    <Input
                      id={`round-title-${idx}`}
                      value={round.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRounds((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, title: val } : r)),
                        );
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`round-type-${idx}`}>Round Type</Label>
                    <select
                      id={`round-type-${idx}`}
                      value={round.roundType}
                      onChange={(e) => {
                        const val = e.target.value as RoundType;
                        setRounds((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, roundType: val } : r)),
                        );
                      }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    >
                      <option value={RoundType.APTITUDE}>Aptitude Assessment</option>
                      <option value={RoundType.TECHNICAL_MCQ}>Technical MCQ</option>
                      <option value={RoundType.CODING}>Coding Assessment</option>
                      <option value={RoundType.GROUP_DISCUSSION}>Group Discussion</option>
                      <option value={RoundType.TECHNICAL_INTERVIEW}>Technical Interview</option>
                      <option value={RoundType.HR_INTERVIEW}>HR Interview</option>
                      <option value={RoundType.MANAGERIAL}>Managerial</option>
                      <option value={RoundType.CASE_STUDY}>Case Study</option>
                      <option value={RoundType.OTHER}>Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`round-mode-${idx}`}>Mode</Label>
                    <select
                      id={`round-mode-${idx}`}
                      value={round.mode}
                      onChange={(e) => {
                        const val = e.target.value as RoundMode;
                        setRounds((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, mode: val } : r)),
                        );
                      }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    >
                      <option value={RoundMode.ONLINE}>Online / Remote</option>
                      <option value={RoundMode.OFFLINE}>In-Person / On Campus</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4">
        {step > 1 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
            Previous
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} className="flex items-center gap-1">
            <span>Next</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>{loading ? 'Creating...' : 'Publish / Create Drive'}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
