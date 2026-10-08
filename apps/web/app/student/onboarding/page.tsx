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
import { Degree, ConsentType, POLICY_VERSIONS, Proficiency, UserStatus } from '@campusedge/shared';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  BookOpen,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface CollegeOption {
  id: string;
  name: string;
  code: string;
  branches: Array<{ id: string; branchCode: string; branchName: string }>;
}

interface SkillCatalogItem {
  id?: string;
  name: string;
  category: string;
}

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<number>(1);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Step 1: College Selection
  const [searchQuery, setSearchQuery] = React.useState('');
  const [colleges, setColleges] = React.useState<CollegeOption[]>([]);
  const [selectedCollege, setSelectedCollege] = React.useState<CollegeOption | null>(null);

  // Step 2: Consents
  const [consentTerms, setConsentTerms] = React.useState(false);
  const [consentPrivacy, setConsentPrivacy] = React.useState(false);
  const [consentPlacement, setConsentPlacement] = React.useState(false);

  // Step 3: Academic Profile
  const [degree, setDegree] = React.useState<Degree>(Degree.BTECH);
  const [branchCode, setBranchCode] = React.useState('');
  const [batchYear, setBatchYear] = React.useState<number>(new Date().getFullYear() + 1);
  const [cgpa, setCgpa] = React.useState<string>('8.50');
  const [backlogs, setBacklogs] = React.useState<number>(0);
  const [skillsCatalog, setSkillsCatalog] = React.useState<SkillCatalogItem[]>([]);
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>(['TypeScript', 'React']);

  // Step 4: Final status
  const [finalStatus, setFinalStatus] = React.useState<UserStatus | null>(null);

  // Load initial status
  React.useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        const me = await api.get<{
          id: string;
          email: string;
          status: UserStatus;
          collegeId?: string | null;
          onboardingStep?: number;
          college?: CollegeOption | null;
        }>('/auth/me');

        if (me.college) {
          setSelectedCollege(me.college);
        }

        if (me.onboardingStep) {
          setStep(me.onboardingStep);
        }

        // Preload colleges and skills
        const [publicColleges, skills] = await Promise.all([
          api.get<CollegeOption[]>('/colleges/public'),
          api.get<SkillCatalogItem[]>('/students/skills-catalog'),
        ]);

        setColleges(publicColleges);
        setSkillsCatalog(skills);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadInitial();
  }, []);

  // Update colleges on search query
  const handleSearchColleges = async (q: string) => {
    setSearchQuery(q);
    try {
      const results = await api.get<CollegeOption[]>(`/colleges/public?q=${encodeURIComponent(q)}`);
      setColleges(results);
    } catch {
      // Ignore search error
    }
  };

  // Step 1 Submission
  const handleSelectCollegeSubmit = async () => {
    if (!selectedCollege) {
      setError('Please select your affiliated college.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await api.post('/onboarding/college', { collegeId: selectedCollege.id });
      setStep(2);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Submission (DPDP Consents)
  const handleConsentsSubmit = async () => {
    if (!consentTerms || !consentPrivacy || !consentPlacement) {
      setError('You must accept all required DPDP statutory terms to continue.');
      return;
    }
    setError(null);
    setLoading(true);

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
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Submission (Academic Profile)
  const handleProfileSubmit = async () => {
    const parsedCgpa = parseFloat(cgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
      setError('Please enter a valid CGPA between 0.00 and 10.00.');
      return;
    }

    if (!branchCode) {
      setError('Please choose your academic branch/department.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const skillsDto = selectedSkills.map((s) => ({
        skillName: s,
        category: 'TECHNICAL',
        proficiency: Proficiency.INTERMEDIATE,
      }));

      const res = await api.post<{ status: UserStatus }>('/onboarding/profile', {
        degree,
        branchCode,
        batchYear: Number(batchYear),
        cgpa: parsedCgpa,
        activeBacklogs: Number(backlogs),
        skills: skillsDto,
      });

      setFinalStatus(res.status);
      setStep(4);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Stepper Progress */}
        <div className="flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />
          {[
            { num: 1, title: 'College' },
            { num: 2, title: 'Consents' },
            { num: 3, title: 'Academic Profile' },
            { num: 4, title: 'Status' },
          ].map((s) => (
            <div
              key={s.num}
              className="flex flex-col items-center bg-slate-50 dark:bg-slate-900 px-2 z-10"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  step === s.num
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className="text-xs font-medium mt-1 text-muted-foreground">{s.title}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: CHOOSE COLLEGE */}
        {step === 1 && (
          <Card className="shadow-md">
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
                <Input
                  id="search-colleges"
                  placeholder="Type college name or code (e.g. Apex Institute)..."
                  value={searchQuery}
                  onChange={(e) => handleSearchColleges(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {colleges.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No approved colleges found matching your search.
                  </p>
                ) : (
                  colleges.map((col) => {
                    const isSelected = selectedCollege?.id === col.id;
                    return (
                      <div
                        key={col.id}
                        onClick={() => setSelectedCollege(col)}
                        className={`cursor-pointer rounded-lg border p-3.5 transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'hover:bg-muted/50 border-input'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-sm text-foreground">{col.name}</p>
                          <p className="text-xs text-muted-foreground">Code: {col.code}</p>
                        </div>
                        {isSelected && <Badge variant="default">Selected</Badge>}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSelectCollegeSubmit} disabled={loading || !selectedCollege}>
                {loading ? 'Saving...' : 'Continue to Consents'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 2: CONSENTS */}
        {step === 2 && (
          <Card className="shadow-md">
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
                  />
                  <div className="text-sm">
                    <span className="font-medium text-foreground">
                      Privacy Policy & Data Processing
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
                  />
                  <div className="text-sm">
                    <span className="font-medium text-foreground">
                      Placement Cell Verification & Sharing
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
              <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
              <Button
                onClick={handleConsentsSubmit}
                disabled={loading || !consentTerms || !consentPrivacy || !consentPlacement}
              >
                {loading ? 'Recording Consents...' : 'Accept & Proceed'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 3: ACADEMIC PROFILE */}
        {step === 3 && (
          <Card className="shadow-md">
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
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                  >
                    <option value="">Select branch...</option>
                    {selectedCollege?.branches && selectedCollege.branches.length > 0 ? (
                      selectedCollege.branches.map((b) => (
                        <option key={b.branchCode} value={b.branchCode}>
                          {b.branchName} ({b.branchCode})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="CSE">Computer Science & Engineering (CSE)</option>
                        <option value="ECE">Electronics & Communication (ECE)</option>
                        <option value="MECH">Mechanical Engineering (MECH)</option>
                        <option value="CIVIL">Civil Engineering (CIVIL)</option>
                      </>
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
              <Button variant="ghost" onClick={() => setStep(2)} disabled={loading}>
                Back
              </Button>
              <Button onClick={handleProfileSubmit} disabled={loading || !branchCode}>
                {loading ? 'Submitting...' : 'Complete Onboarding'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 4: ONBOARDING COMPLETION STATUS */}
        {step === 4 && (
          <Card className="shadow-md text-center p-6">
            <CardContent className="space-y-6 pt-4">
              {finalStatus === UserStatus.ACTIVE ? (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold">Profile Activated!</CardTitle>
                    <CardDescription className="max-w-md mx-auto text-sm">
                      Your college email domain matched <strong>{selectedCollege?.name}</strong>.
                      Your profile has been automatically verified and activated.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => router.push('/student/dashboard')}
                    className="w-full max-w-xs mx-auto"
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
                      Your profile has been registered for <strong>{selectedCollege?.name}</strong>.
                      Your placement administrator must review and approve your account before drive
                      access is granted.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
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
