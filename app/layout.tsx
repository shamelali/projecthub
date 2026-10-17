import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { themeScript, themeToHtmlClass } from '@/lib/theme';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ProjectHub',
  description: 'A full-stack project management platform for developers, teams, and clients.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The saved preference is applied server-side: no theme flash for signed-in
  // users. Signed-out views (landing, login) keep the dark default.
  const session = await auth();
  let theme: string | null = null;
  if (session?.user?.id) {
    const preferences = await db.userPreferences.findUnique({
      where: { userId: session.user.id },
      select: { theme: true },
    });
    theme = preferences?.theme ?? null;
  }
  const effective = theme ?? 'DARK';

  return (
    <html lang="en" className={themeToHtmlClass(effective)} suppressHydrationWarning>
      <body className={inter.className}>
        {effective === 'SYSTEM' && (
          <script dangerouslySetInnerHTML={{ __html: themeScript(effective) }} />
        )}
        {children}
      </body>
    </html>
  );
}
