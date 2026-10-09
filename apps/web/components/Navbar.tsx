'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, LogOut } from 'lucide-react';
import { Role } from '@campusedge/shared';

interface NavbarProps {
  user?: {
    email: string;
    role: Role;
    status: string;
    fullName?: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getLinks = () => {
    if (!user) return [];

    if (user.role === Role.SUPER_ADMIN) {
      return [
        { href: '/admin/colleges', label: 'Colleges' },
        { href: '/admin/companies', label: 'Companies' },
        { href: '/admin/topics', label: 'Topics' },
        { href: '/admin/experiences', label: 'Takedowns' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/audit', label: 'Audit' },
      ];
    }

    if (user.role === Role.COLLEGE_ADMIN) {
      return [
        { href: '/placement-cell/dashboard', label: 'Dashboard' },
        { href: '/placement-cell/drives', label: 'Drives' },
        { href: '/placement-cell/companies', label: 'Companies' },
        { href: '/placement-cell/seasons', label: 'Seasons' },
        { href: '/placement-cell/import', label: 'Import' },
        { href: '/placement-cell/notices', label: 'Notices' },
        { href: '/placement-cell/experiences', label: 'Moderation' },
        { href: '/placement-cell/intelligence', label: 'Intelligence' },
        { href: '/placement-cell/students', label: 'Students' },
        { href: '/placement-cell/settings', label: 'Settings' },
      ];
    }

    if (user.role === Role.STUDENT) {
      return [
        { href: '/student/dashboard', label: 'Dashboard' },
        { href: '/student/drives', label: 'Drives' },
        { href: '/student/companies', label: 'Intelligence' },
        { href: '/student/notices', label: 'Notices' },
        { href: '/student/experiences', label: 'Experiences' },
        { href: '/student/profile', label: 'Profile' },
      ];
    }

    return [];
  };

  const links = getLinks();

  const roleBadgeVariant = (role?: Role) => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return 'destructive';
      case Role.COLLEGE_ADMIN:
        return 'warning';
      case Role.STUDENT:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2 font-bold text-xl text-primary">
            <GraduationCap className="h-6 w-6" />
            <span>CampusEdge</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-4">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    active ? 'text-primary font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <Badge variant={roleBadgeVariant(user.role)}>{user.role.replace('_', ' ')}</Badge>
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-foreground">
                  {user.fullName || user.email}
                </span>
                <span className="text-[10px] text-muted-foreground">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
