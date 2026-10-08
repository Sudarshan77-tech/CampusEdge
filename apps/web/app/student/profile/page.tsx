'use client';

import * as React from 'react';
import { Navbar } from '@/components/Navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api, ApiError } from '@/lib/api';
import { Role, UserStatus, Degree, Proficiency, DataRequestType } from '@campusedge/shared';
import { ShieldCheck, Download, Trash2, Check, AlertCircle } from 'lucide-react';

interface StudentProfileData {
  id: string;
  email: string;
  fullName?: string;
  role: Role;
  status: UserStatus;
  college?: {
    name: string;
    code: string;
  };
  studentProfile?: {
    degree: string;
    branchCode: string;
    batchYear: number;
    cgpa: number;
    activeBacklogs: number;
    skills?: Array<{ skillName: string; proficiency: string }>;
  };
  consents?: Array<{
    id: string;
    consentType: string;
    policyVersion: string;
    granted: boolean;
    createdAt: string;
  }>;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = React.useState<StudentProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Form states
  const [cgpa, setCgpa] = React.useState('8.50');
  const [backlogs, setBacklogs] = React.useState(0);
  const [skills, setSkills] = React.useState<string[]>([]);
  const [newSkill, setNewSkill] = React.useState('');

  // DPDP state
  const [dataReqSuccess, setDataReqSuccess] = React.useState<string | null>(null);
  const [dataReqLoading, setDataReqLoading] = React.useState(false);

  React.useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const data = await api.get<StudentProfileData>('/students/me/profile');
        setProfile(data);
        if (data.studentProfile) {
          setCgpa(String(data.studentProfile.cgpa));
          setBacklogs(data.studentProfile.activeBacklogs);
          setSkills(data.studentProfile.skills?.map((s) => s.skillName) || []);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.studentProfile) return;

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const parsedCgpa = parseFloat(cgpa);
      if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
        throw new Error('CGPA must be between 0.00 and 10.00');
      }

      const skillsDto = skills.map((s) => ({
        skillName: s,
        category: 'TECHNICAL',
        proficiency: Proficiency.INTERMEDIATE,
      }));

      await api.put('/students/me/profile', {
        degree: profile.studentProfile.degree as Degree,
        branchCode: profile.studentProfile.branchCode,
        batchYear: profile.studentProfile.batchYear,
        cgpa: parsedCgpa,
        activeBacklogs: Number(backlogs),
        skills: skillsDto,
      });

      setSuccess('Academic profile successfully updated!');
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleDataRequest = async (requestType: DataRequestType) => {
    setDataReqSuccess(null);
    setDataReqLoading(true);

    try {
      await api.post('/students/me/data-requests', { type: requestType });
      setDataReqSuccess(
        requestType === DataRequestType.EXPORT
          ? 'Data export request submitted. Our compliance team will dispatch your data bundle within 72 hours.'
          : 'Data erasure request submitted. An administrative verification will be initiated pursuant to statutory requirements.',
      );
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setDataReqLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar
        user={
          profile
            ? {
                email: profile.email,
                role: profile.role,
                status: profile.status,
                fullName: profile.fullName,
              }
            : null
        }
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Academic Profile & DPDP Privacy Controls
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your academic credentials, verified skills, and statutory data rights.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 flex items-center space-x-2">
            <Check className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading profile...</div>
        ) : profile ? (
          <>
            {/* Academic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Academic Records</CardTitle>
                <CardDescription>
                  Affiliated with {profile.college?.name} ({profile.college?.code})
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdate}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Degree Program</Label>
                      <Input value={profile.studentProfile?.degree || 'BTECH'} disabled />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Branch / Department</Label>
                      <Input value={profile.studentProfile?.branchCode || 'CSE'} disabled />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="cgpa">Cumulative GPA (CGPA)</Label>
                      <Input
                        id="cgpa"
                        type="text"
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="backlogs">Active Academic Backlogs</Label>
                      <Input
                        id="backlogs"
                        type="number"
                        min={0}
                        max={20}
                        value={backlogs}
                        onChange={(e) => setBacklogs(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label>Verified Technical Competencies</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 text-muted-foreground hover:text-foreground"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a new skill (e.g. Python, Docker)..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addSkill}>
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Statutory Consents Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <span>DPDP Statutory Consents</span>
                </CardTitle>
                <CardDescription>
                  Immutable consent logs recorded under Section 6 of the DPDP Act 2023.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y rounded-md border text-sm">
                  {profile.consents && profile.consents.length > 0 ? (
                    profile.consents.map((c) => (
                      <div key={c.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {c.consentType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Policy Version: {c.policyVersion} &bull; Recorded on{' '}
                            {new Date(c.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="success">Granted</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-xs text-muted-foreground">
                      No statutory consent records recorded yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* DPDP Data Subject Rights Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Subject Rights (DPDP Act, 2023)</CardTitle>
                <CardDescription>
                  Exercise statutory rights regarding your personal records held by CampusEdge.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dataReqSuccess && (
                  <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    {dataReqSuccess}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 flex items-center justify-center space-x-2"
                    disabled={dataReqLoading}
                    onClick={() => handleDataRequest(DataRequestType.EXPORT)}
                  >
                    <Download className="h-4 w-4" />
                    <span>Request Data Export</span>
                  </Button>

                  <Button
                    variant="destructive"
                    className="flex-1 flex items-center justify-center space-x-2"
                    disabled={dataReqLoading}
                    onClick={() => handleDataRequest(DataRequestType.DELETE)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Request Data Erasure</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}
