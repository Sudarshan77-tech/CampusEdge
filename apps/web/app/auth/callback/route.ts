import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && authData.session?.access_token) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Query /auth/me from NestJS backend to determine destination
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${authData.session.access_token}`,
          },
        });

        if (res.ok) {
          const profile = await res.json();
          if (profile.role === 'SUPER_ADMIN') {
            return NextResponse.redirect(`${origin}/admin/colleges`);
          }
          if (profile.role === 'COLLEGE_ADMIN') {
            return NextResponse.redirect(`${origin}/placement-cell/dashboard`);
          }
          if (profile.role === 'STUDENT') {
            if (profile.status === 'ONBOARDING') {
              return NextResponse.redirect(`${origin}/student/onboarding`);
            }
            return NextResponse.redirect(`${origin}/student/dashboard`);
          }
        }
      } catch {
        // Fallback to default student onboarding or home
      }

      return NextResponse.redirect(`${origin}/student/dashboard`);
    }
  }

  // Return user to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
