'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const name = (formData.get('name') as string)?.trim();
  if (!name) return;

  await db.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  revalidatePath('/dashboard/settings');
}

export async function updateAppearance(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const theme = formData.get('theme') as string;
  const defaultView = formData.get('defaultView') as string;

  const validThemes = ['LIGHT', 'DARK', 'SYSTEM'];
  const validViews = ['GRID', 'LIST', 'TABLE'];

  const data = {
    ...(validThemes.includes(theme) ? { theme: theme as 'LIGHT' | 'DARK' | 'SYSTEM' } : {}),
    ...(validViews.includes(defaultView)
      ? { defaultView: defaultView as 'GRID' | 'LIST' | 'TABLE' }
      : {}),
  };

  await db.userPreferences.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      userId: session.user.id,
      theme: validThemes.includes(theme) ? (theme as 'LIGHT' | 'DARK' | 'SYSTEM') : 'SYSTEM',
      defaultView: validViews.includes(defaultView)
        ? (defaultView as 'GRID' | 'LIST' | 'TABLE')
        : 'GRID',
    },
  });

  revalidatePath('/dashboard/settings');
}

export async function updateNotifications(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const email = formData.get('email') === 'on';
  const push = formData.get('push') === 'on';

  const data = { notifications: { email, push } };

  await db.userPreferences.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      userId: session.user.id,
      notifications: { email, push },
    },
  });

  revalidatePath('/dashboard/settings');
}
