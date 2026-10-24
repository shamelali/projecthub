'use client';

import Link from 'next/link';
import { LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function Navbar({
  user,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="h-5 w-5" />
            ProjectHub
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
            <Link href="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/dashboard/projects" className="transition-colors hover:text-foreground">
              Projects
            </Link>
            <Link href="/dashboard/tasks" className="transition-colors hover:text-foreground">
              Tasks
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings" className="text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user.name || user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
