'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Palette } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { updateAppearance } from '@/lib/actions/settings';

const THEMES = [
  { value: 'LIGHT', label: 'Light' },
  { value: 'DARK', label: 'Dark' },
  { value: 'SYSTEM', label: 'System' },
];

const VIEWS = [
  { value: 'GRID', label: 'Grid' },
  { value: 'LIST', label: 'List' },
  { value: 'TABLE', label: 'Table' },
];

interface AppearanceFormProps {
  theme: string;
  defaultView: string;
}

const selectClass = 'h-9 rounded-md border border-input bg-background px-3 text-sm';

export function AppearanceForm({ theme, defaultView }: AppearanceFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState({ theme, defaultView });
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('theme', values.theme);
    formData.append('defaultView', values.defaultView);

    startTransition(async () => {
      await updateAppearance(formData);
      setIsEditing(false);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Theme and display preferences</CardDescription>
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
            <div className="space-y-1.5">
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                className={selectClass}
                value={values.theme}
                onChange={(e) => setValues({ ...values, theme: e.target.value })}
              >
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="defaultView">Default View</Label>
              <select
                id="defaultView"
                className={selectClass}
                value={values.defaultView}
                onChange={(e) => setValues({ ...values, defaultView: e.target.value })}
              >
                {VIEWS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValues({ theme, defaultView });
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
              <span className="text-sm text-muted-foreground">Theme</span>
              <span className="text-sm font-medium">{values.theme.toLowerCase()}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Default View</span>
              <span className="text-sm font-medium">{values.defaultView.toLowerCase()}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
