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
import { Check, X } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const supabase = createClient();

  const lengthValid = password.length >= 10;
  const upperValid = /[A-Z]/.test(password);
  const lowerValid = /[a-z]/.test(password);
  const digitValid = /[0-9]/.test(password);
  const matchValid = password === confirmPassword && confirmPassword.length > 0;
  const isValid = lengthValid && upperValid && lowerValid && digitValid && matchValid;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError('Please satisfy all password complexity requirements.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Set new password</CardTitle>
          <CardDescription>
            Choose a strong new password for your CampusEdge account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div
              className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          {success ? (
            <div className="rounded-md bg-emerald-50 p-4 text-center text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              Password updated successfully! Redirecting you to sign in...
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
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
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

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
                {loading ? 'Updating password...' : 'Update Password'}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
