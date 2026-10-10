'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
import { formatAuthError } from '@/lib/auth-errors';
import { Check, X } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [signupComplete, setSignupComplete] = React.useState(false);

  const supabase = createClient();

  const lengthValid = password.length >= 10;
  const upperValid = /[A-Z]/.test(password);
  const lowerValid = /[a-z]/.test(password);
  const digitValid = /[0-9]/.test(password);
  const matchValid = password === confirmPassword && confirmPassword.length > 0;
  const isValid = lengthValid && upperValid && lowerValid && digitValid && matchValid;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError('Please satisfy all password complexity and matching requirements.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(formatAuthError(signUpError, 'signup'));
        setLoading(false);
        return;
      }

      if (data.session) {
        // Automatically signed in
        router.push('/student/onboarding');
      } else {
        // Confirmation email dispatched
        setSignupComplete(true);
      }
    } catch (err) {
      setError(formatAuthError(err, 'signup'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Create your account</CardTitle>
          <CardDescription>
            Join CampusEdge to prepare for placements and connect with campus drives
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div
              data-testid="auth-error"
              className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          {signupComplete ? (
            <div data-testid="signup-success" className="space-y-4 text-center">
              <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                <p className="font-semibold text-base mb-1">Check your inbox</p>A verification email
                has been sent to <strong>{email}</strong>. Please click the link inside to verify
                your account and start your onboarding.
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Return to Sign In</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Rahul Sharma"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">College Email or Personal Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@apex.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Using your official college email allows automatic instant verification.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="rounded-md bg-muted/60 p-3 space-y-1 text-xs text-muted-foreground">
                <div className="font-medium text-foreground mb-1">Password requirements:</div>
                <div className="flex items-center space-x-1.5">
                  {lengthValid ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className={lengthValid ? 'text-emerald-700 dark:text-emerald-400' : ''}>
                    At least 10 characters
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {upperValid && lowerValid ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span
                    className={
                      upperValid && lowerValid ? 'text-emerald-700 dark:text-emerald-400' : ''
                    }
                  >
                    Uppercase and lowercase letters
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {digitValid ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className={digitValid ? 'text-emerald-700 dark:text-emerald-400' : ''}>
                    At least one numeric digit
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {matchValid ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className={matchValid ? 'text-emerald-700 dark:text-emerald-400' : ''}>
                    Passwords match
                  </span>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !isValid}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-muted-foreground">
          <div>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
          <div className="text-xs">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-2">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
