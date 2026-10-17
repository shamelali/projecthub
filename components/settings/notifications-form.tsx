'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { updateNotifications } from '@/lib/actions/settings';

interface NotificationsFormProps {
  email: boolean;
  push: boolean;
}

export function NotificationsForm({ email, push }: NotificationsFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState({ email, push });
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    if (values.email) formData.append('email', 'on');
    if (values.push) formData.append('push', 'on');

    startTransition(async () => {
      await updateNotifications(formData);
      setIsEditing(false);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="text-sm">
                Email Notifications
              </Label>
              <input
                id="email-notifications"
                type="checkbox"
                className="h-4 w-4"
                checked={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="text-sm">
                Push Notifications
              </Label>
              <input
                id="push-notifications"
                type="checkbox"
                className="h-4 w-4"
                checked={values.push}
                onChange={(e) => setValues({ ...values, push: e.target.checked })}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValues({ email, push });
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email Notifications</span>
              <span className="text-sm font-medium">{values.email ? 'Enabled' : 'Disabled'}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Push Notifications</span>
              <span className="text-sm font-medium">{values.push ? 'Enabled' : 'Disabled'}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
