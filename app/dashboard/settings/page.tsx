import { Shield } from 'lucide-react';

import { AppearanceForm } from '@/components/settings/appearance-form';
import { NotificationsForm } from '@/components/settings/notifications-form';
import { ProfileForm } from '@/components/settings/profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

type NotificationPrefs = { email?: boolean; push?: boolean };

export default async function SettingsPage() {
  const session = await auth();

  const [user, preferences] = await Promise.all([
    session?.user?.id
      ? db.user.findUnique({ where: { id: session.user.id } })
      : Promise.resolve(null),
    db.userPreferences.findUnique({
      where: { userId: session?.user?.id },
    }),
  ]);

  const notifications = (preferences?.notifications as NotificationPrefs | null) ?? {};
  const emailNotifications = notifications.email ?? true;
  const pushNotifications = notifications.push ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="space-y-4">
        <ProfileForm
          name={user?.name ?? session?.user?.name ?? ''}
          email={session?.user?.email ?? ''}
        />

        <AppearanceForm
          theme={preferences?.theme ?? 'SYSTEM'}
          defaultView={preferences?.defaultView ?? 'GRID'}
        />

        <NotificationsForm email={emailNotifications} push={pushNotifications} />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Password and session management</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Two-Factor Auth</span>
              <span className="text-sm font-medium">Disabled</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Sessions</span>
              <span className="text-sm font-medium">1</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
