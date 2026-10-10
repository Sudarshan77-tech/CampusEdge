'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, ApiError } from '@/lib/api';
import {
  Degree,
  ConsentType,
  POLICY_VERSIONS,
  Proficiency,
  UserStatus,
  Role,
} from '@campusedge/shared';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  BookOpen,
  ShieldCheck,
  Check,
  RotateCcw,
  ShieldAlert,
  Search,
} from 'lucide-react';

import {
  OnboardingStepNumber,
  CollegeOption,
  SkillCatalogItem,
  MeProfileResponse,
  SpecialAccountState,
  resolveOnboardingStep,
} from './onboarding-helpers';

export default function StudentOnboardingPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = React.useState<OnboardingStepNumber>(1);
  const [initialLoading, setInitialLoading] = React.useState<boolean>(true);
  const [actionLoading, setActionLoading] = React.useState<boolean>(false);
  const [initialError, setInitialError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [specialState, setSpecialState] = React.useState<SpecialAccountState>(null);

  // Step 1: College Selection
  const [searchQuery, setSearchQuery] = React.useState('');
  const [allColleges, setAllColleges] = React.useState<CollegeOption[]>([]);
  const [filteredColleges, setFilteredColleges] = React.useState<CollegeOption[]>([]);
  const [selectedCollege, setSelectedCollege] = React.useState<CollegeOption | null>(null);

  // Step 2: Statutory Consents
  const [consentTerms, setConsentTerms] = React.useState(false);
  const [consentPrivacy, setConsentPrivacy] = React.useState(false);
  const [consentPlacement, setConsentPlacement] = React.useState(false);

  // Step 3: Academic Profile
  const [degree, setDegree] = React.useState<Degree>(Degree.BTECH);
  const [branchId, setBranchId] = React.useState('');
  const [batchYear, setBatchYear] = React.useState<number>(new Date().getFullYear() + 1);
  const [cgpa, setCgpa] = React.useState<string>('8.50');
  const [backlogs, setBacklogs] = React.useState<number>(0);
  const [skillsCatalog, setSkillsCatalog] = React.useState<SkillCatalogItem[]>([]);
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);

  // Step 4: Verification Status
  const [finalStatus, setFinalStatus] = React.useState<UserStatus | null>(null);

  // Primary data loader
  const loadInitial = React.useCallback(async () => {
    try {
      setInitialLoading(true);
      setInitialError(null);
      setFormError(null);
      setSpecialState(null);

      // 1. Fetch current profile from authoritative /me endpoint
      const meRes = await api.get<{ data?: MeProfileResponse } & MeProfileResponse>('/me');
      const me: MeProfileResponse = meRes.data && meRes.data.id ? meRes.data : meRes;

      // Handle non-student roles
      if (me.role === Role.SUPER_ADMIN) {
        router.push('/admin/colleges');
        return;
      }
      if (me.role === Role.COLLEGE_ADMIN) {
        router.push('/placement-cell/dashboard');
        return;
      }

      // 2. Resolve target step or special state
      const resolved = resolveOnboardingStep(me.onboardingStep, me.status, me.collegeId);

      if (resolved.redirect) {
        router.push(resolved.redirect);
        return;
      }

      if (resolved.specialState) {
        setSpecialState(resolved.specialState);
        setInitialLoading(false);
        return;
      }

      if (resolved.stepNumber) {
        setStep(resolved.stepNumber);
      }

      // 3. Preload public colleges and available skill catalog
      const [publicColleges, skills] = await Promise.all([
        api.get<CollegeOption[]>('/colleges/public'),
        api.get<SkillCatalogItem[]>('/students/skills-catalog').catch(() => []),
      ]);

      const safeColleges = Array.isArray(publicColleges) ? publicColleges : [];
      setAllColleges(safeColleges);
      setFilteredColleges(safeColleges);

      const safeSkills = Array.isArray(skills) ? skills : [];
      setSkillsCatalog(safeSkills);
      if (safeSkills.length > 0) {
        setSelectedSkills(safeSkills.slice(0, 2).map((s) => s.name));
      }

      const activeCollege =
        me.college || (me.collegeId && safeColleges.find((c) => c.id === me.collegeId)) || null;

      if (activeCollege) {
        setSelectedCollege(activeCollege);
        const firstBranch = activeCollege.branches?.[0];
        if (firstBranch) {
          setBranchId(firstBranch.id);
        }
      }
    } catch (err) {
      setInitialError((err as Error).message || 'Failed to load account onboarding details.');
    } finally {
      setInitialLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // College search handler
  const handleSearchColleges = (q: string) => {
    setSearchQuery(q);
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) {
      setFilteredColleges(allColleges);
      return;
    }
    const filtered = allColleges.filter(
      (c) =>
        c.name.toLowerCase().includes(trimmed) ||
        (c.code && c.code.toLowerCase().includes(trimmed)),
    );
    setFilteredColleges(filtered);
  };

  const handleSelectCollege = (col: CollegeOption) => {
    setSelectedCollege(col);
    const firstBranch = col.branches?.[0];
    if (firstBranch) {
      setBranchId(firstBranch.id);
    }
  };

  // Step 1: Select College Submit
  const handleSelectCollegeSubmit = async () => {
    if (!selectedCollege) {
      setFormError('Please select your affiliated college.');
      return;
    }
    setFormError(null);
    setActionLoading(true);

    try {
      await api.post('/onboarding/college', { collegeId: selectedCollege.id });
      setStep(2);
    } catch (err) {
      setFormError((err as ApiError).message || 'Failed to save college selection.');
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: DPDP Consents Submit
  const handleConsentsSubmit = async () => {
    if (!consentTerms || !consentPrivacy || !consentPlacement) {
      setFormError('You must accept all required statutory DPDP consents to continue.');
      return;
    }
    setFormError(null);
    setActionLoading(true);

    try {
      await Promise.all([
        api.post('/onboarding/consent', {
          consentType: ConsentType.TERMS,
          policyVersion: POLICY_VERSIONS.TERMS,
        }),
        api.post('/onboarding/consent', {
          consentType: ConsentType.PRIVACY,
          policyVersion: POLICY_VERSIONS.PRIVACY,
        }),
        api.post('/onboarding/consent', {
          consentType: ConsentType.DATA_PROCESSING,
          policyVersion: POLICY_VERSIONS.DATA_PROCESSING,
        }),
      ]);
      setStep(3);
    } catch (err) {
      setFormError((err as ApiError).message || 'Failed to record statutory consents.');
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3: Academic Profile Submit
  const handleProfileSubmit = async () => {
    const parsedCgpa = parseFloat(cgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
      setFormError('Please enter a valid CGPA between 0.00 and 10.00.');
      return;
    }

    if (!branchId) {
      setFormError('Please choose your academic branch/department.');
      return;
    }

    setFormError(null);
    setActionLoading(true);

    try {
      const skillsDto = selectedSkills
        .map((sName) => {
          const item = skillsCatalog.find((c) => c.name === sName);
          return item?.id ? { skillId: item.id, proficiency: Proficiency.INTERMEDIATE } : null;
        })
        .filter(Boolean);

      const res = await api.post<{
        profile: unknown;
        userStatus?: UserStatus;
        status?: UserStatus;
      }>('/onboarding/profile', {
        branchId,
        degree,
        batchYear: Number(batchYear),
        cgpa: parsedCgpa,
        activeBacklogs: Number(backlogs),
        skills: skillsDto,
      });

      const nextStatus = res.userStatus || res.status || UserStatus.ACTIVE;
      setFinalStatus(nextStatus);
      setStep(4);
    } catch (err) {
      setFormError((err as ApiError).message || 'Failed to save academic profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSkill = (skillName: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName],
    );
  };

  // -------------------------------------------------------------
  // RENDER: Loading Skeleton State
  // -------------------------------------------------------------
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-slate-900 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-8 animate-pulse">
          {/* Stepper Skeleton */}
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center bg-slate-50 dark:bg-slate-900 px-2 z-10"
              >
                <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-14 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
              </div>
            ))}
          </div>

          {/* Card Content Skeleton */}
          <Card className="shadow-md">
            <CardHeader className="space-y-3">
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-72 bg-slate-200 dark:bg-slate-700 rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="space-y-2 pt-2">
                <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-4">
              <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Initial Load Error State
  // -------------------------------------------------------------
  if (initialError) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-slate-900 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto pt-10">
          <Card className="shadow-lg border-destructive/20" data-testid="onboarding-fetch-error">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold">Unable to Load Onboarding</CardTitle>
              <CardDescription>
                We could not retrieve your account or college onboarding data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {initialError}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => loadInitial()} className="w-full sm:w-auto">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/login')}
                className="w-full sm:w-auto"
              >
                Return to Sign In
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Special Lifecycle States (Suspended, Deactivated, Unknown)
  // -------------------------------------------------------------
  if (specialState === 'SUSPENDED') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-slate-900 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto pt-10">
          <Card className="shadow-lg border-amber-300">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold">Account Suspended</CardTitle>
              <CardDescription>
                Your student account has been suspended by administration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Please contact your campus placement cell or CampusEdge platform support for further
                assistance.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={() => router.push('/login')}>
                Return to Sign In
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (specialState === 'DEACTIVATED') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-slate-900 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto pt-10">
          <Card className="shadow-lg border-muted">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <AlertCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold">Account Deactivated</CardTitle>
              <CardDescription>
                This account is currently deactivated and cannot access onboarding.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                If you believe this is in error, reach out to your college placement administrator.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={() => router.push('/login')}>
                Return to Sign In
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (specialState === 'UNKNOWN') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-slate-900 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto pt-10">
          <Card className="shadow-lg border-destructive/20">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold">Unexpected Onboarding State</CardTitle>
              <CardDescription>
                We could not determine your onboarding progression step.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Please refresh the page to try again, or sign out and sign back in.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => loadInitial()} className="w-full sm:w-auto">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/login')}
                className="w-full sm:w-auto"
              >
                Return to Sign In
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Active Onboarding Stepper & Wizard Steps (1 - 4)
  // -------------------------------------------------------------
  const stepsMeta = [
    { num: 1, title: 'College' },
    { num: 2, title: 'Consents' },
    { num: 3, title: 'Academic Profile' },
    { num: 4, title: 'Status' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Stepper Progress Bar */}
        <div className="flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />
          {stepsMeta.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div
                key={s.num}
                className="flex flex-col items-center bg-slate-50 dark:bg-slate-900 px-2 z-10"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                  data-testid={`step-indicator-${s.num}`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className="text-xs font-medium mt-1 text-muted-foreground">{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* Action / Form Error Alert */}
        {formError && (
          <div
            className="rounded-md bg-destructive/15 p-4 text-sm text-destructive flex items-center space-x-2"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 1: CHOOSE COLLEGE */}
        {/* ======================================================== */}
        {step === 1 && (
          <Card className="shadow-md" data-testid="onboarding-step-1">
            <CardHeader>
              <CardTitle className="text-xl flex items-center space-x-2">
                <Building className="h-5 w-5 text-primary" />
                <span>Select Your College</span>
              </CardTitle>
              <CardDescription>
                Choose your enrolled institution to link your account to your campus placement cell.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-colleges">Search Colleges</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-colleges"
                    className="pl-9"
                    placeholder="Type college name or code (e.g. Apex Institute)..."
                    value={searchQuery}
                    onChange={(e) => handleSearchColleges(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {allColleges.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm space-y-2">
                    <p>
                      No colleges are open for registration yet. Ask your placement cell to contact
                      CampusEdge.
                    </p>
                  </div>
                ) : filteredColleges.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm space-y-2">
                    <p>No approved colleges found matching &quot;{searchQuery}&quot;.</p>
                  </div>
                ) : (
                  filteredColleges.map((col) => {
                    const isSelected = selectedCollege?.id === col.id;
                    return (
                      <div
                        key={col.id}
                        onClick={() => handleSelectCollege(col)}
                        className={`cursor-pointer rounded-lg border p-3.5 transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'hover:bg-muted/50 border-input'
                        }`}
                        data-testid={`college-option-${col.id}`}
                      >
                        <div>
                          <p className="font-semibold text-sm text-foreground">{col.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Code: {col.code || col.slug}
                          </p>
                        </div>
                        {isSelected && <Badge variant="default">Selected</Badge>}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSelectCollegeSubmit}
                disabled={actionLoading || !selectedCollege}
                data-testid="continue-to-consents-btn"
              >
                {actionLoading ? 'Saving...' : 'Continue to Consents'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ======================================================== */}
        {/* STEP 2: STATUTORY DPDP CONSENTS */}
        {/* ======================================================== */}
        {step === 2 && (
          <Card className="shadow-md" data-testid="onboarding-step-2">
            <CardHeader>
              <CardTitle className="text-xl flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>Statutory DPDP Consents</span>
              </CardTitle>
              <CardDescription>
                Review and grant explicit consent under the Digital Personal Data Protection Act,
                2023.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={consentTerms}
                    onChange={(e) => setConsentTerms(e.target.checked)}
                    data-testid="consent-terms-cb"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Terms of Service Acceptance</span>
                    <p className="text-xs text-muted-foreground">
                      I agree to the CampusEdge platform terms of service governing placement
                      activities.
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={consentPrivacy}
                    onChange={(e) => setConsentPrivacy(e.target.checked)}
                    data-testid="consent-privacy-cb"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-foreground">
                      Privacy Policy &amp; Data Processing
                    </span>
                    <p className="text-xs text-muted-foreground">
                      I consent to the collection and retention of my academic records for campus
                      placement purposes.
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={consentPlacement}
                    onChange={(e) => setConsentPlacement(e.target.checked)}
                    data-testid="consent-placement-cb"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-foreground">
                      Placement Cell Verification &amp; Sharing
                    </span>
                    <p className="text-xs text-muted-foreground">
                      I authorize my college placement office to verify my academic credentials and
                      share eligible profiles with campus hiring companies.
                    </p>
                  </div>
                </label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={actionLoading}>
                Back
              </Button>
              <Button
                onClick={handleConsentsSubmit}
                disabled={actionLoading || !consentTerms || !consentPrivacy || !consentPlacement}
                data-testid="accept-consents-btn"
              >
                {actionLoading ? 'Recording Consents...' : 'Accept & Proceed'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ======================================================== */}
        {/* STEP 3: ACADEMIC PROFILE */}
        {/* ======================================================== */}
        {step === 3 && (
          <Card className="shadow-md" data-testid="onboarding-step-3">
            <CardHeader>
              <CardTitle className="text-xl flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>Academic Credentials</span>
              </CardTitle>
              <CardDescription>
                Provide your degree, branch, CGPA, and key technical skills for placement screening.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree</Label>
                  <select
                    id="degree"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value as Degree)}
                  >
                    <option value={Degree.BTECH}>B.Tech / B.E.</option>
                    <option value={Degree.MTECH}>M.Tech</option>
                    <option value={Degree.MCA}>MCA</option>
                    <option value={Degree.MBA}>MBA</option>
                    <option value={Degree.OTHER}>Other Degree</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">Branch / Department</Label>
                  <select
                    id="branch"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    data-testid="branch-select"
                  >
                    <option value="">Select branch...</option>
                    {selectedCollege?.branches && selectedCollege.branches.length > 0 ? (
                      selectedCollege.branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name || b.branchName || b.code} ({b.code || b.branchCode || ''})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No active branches found for selected college
                      </option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchYear">Graduation Year</Label>
                  <Input
                    id="batchYear"
                    type="number"
                    min={2020}
                    max={2035}
                    value={batchYear}
                    onChange={(e) => setBatchYear(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cgpa">CGPA (0.00 - 10.00)</Label>
                  <Input
                    id="cgpa"
                    type="text"
                    placeholder="8.50"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    data-testid="cgpa-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backlogs">Active Backlogs</Label>
                  <Input
                    id="backlogs"
                    type="number"
                    min={0}
                    max={20}
                    value={backlogs}
                    onChange={(e) => setBacklogs(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Technical Skills</Label>
                <div className="flex flex-wrap gap-2 pt-1 max-h-40 overflow-y-auto p-2 border rounded-md">
                  {skillsCatalog.length > 0
                    ? skillsCatalog.map((s) => {
                        const isSelected = selectedSkills.includes(s.name);
                        return (
                          <button
                            key={s.name}
                            type="button"
                            onClick={() => toggleSkill(s.name)}
                            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background hover:bg-muted text-muted-foreground'
                            }`}
                          >
                            {s.name}
                          </button>
                        );
                      })
                    : ['TypeScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'Java', 'C++'].map(
                        (s) => {
                          const isSelected = selectedSkills.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleSkill(s)}
                              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background hover:bg-muted text-muted-foreground'
                              }`}
                            >
                              {s}
                            </button>
                          );
                        },
                      )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={actionLoading}>
                Back
              </Button>
              <Button
                onClick={handleProfileSubmit}
                disabled={actionLoading || !branchId}
                data-testid="submit-profile-btn"
              >
                {actionLoading ? 'Submitting...' : 'Complete Onboarding'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ======================================================== */}
        {/* STEP 4: VERIFICATION & COMPLETION STATUS */}
        {/* ======================================================== */}
        {step === 4 && (
          <Card className="shadow-md text-center p-6" data-testid="onboarding-step-4">
            <CardContent className="space-y-6 pt-4">
              {finalStatus === UserStatus.ACTIVE ? (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold">Profile Activated!</CardTitle>
                    <CardDescription className="max-w-md mx-auto text-sm">
                      Your college email domain matched{' '}
                      <strong>{selectedCollege?.name || 'your institution'}</strong>. Your profile
                      has been automatically verified and activated.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => router.push('/student/dashboard')}
                    className="w-full max-w-xs mx-auto"
                    data-testid="go-to-dashboard-btn"
                  >
                    Go to Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                    <Clock className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold">
                      Pending Placement Cell Approval
                    </CardTitle>
                    <CardDescription className="max-w-md mx-auto text-sm">
                      Your profile has been registered for{' '}
                      <strong>{selectedCollege?.name || 'your institution'}</strong>. Your placement
                      administrator must review and approve your account before drive access is
                      granted.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/student/dashboard')}
                      data-testid="view-dashboard-btn"
                    >
                      View Student Dashboard
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
