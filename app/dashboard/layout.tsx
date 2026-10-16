import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

import { Navbar } from './navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={session.user} />
      <main className="container mx-auto py-8">{children}</main>
    </div>
  );
}
