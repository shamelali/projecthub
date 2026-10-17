'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Code2, GitBranch, Terminal, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { authClient } from '@/lib/auth-client';

interface LoginFormProps {
  providers: {
    github: boolean;
    gitlab: boolean;
    emailAndPassword: boolean;
  };
  initialError?: string;
}

export function LoginForm({ providers, initialError }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState<string | null>(null);
  const hasOAuthProvider = providers.github || providers.gitlab;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    setNotice(null);

    const result =
      mode === 'signup'
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? 'Unable to continue. Please try again.');
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      setNotice('Account created. Signing you in…');
    }

    router.replace('/dashboard');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">ProjectHub</CardTitle>
          <CardDescription>
            {mode === 'signup' ? 'Create your account' : 'Sign in to manage your projects'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          {notice && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md bg-secondary p-3 text-sm text-secondary-foreground"
            >
              {notice}
            </div>
          )}

          {hasOAuthProvider && (
            <div className="space-y-2">
              {providers.github && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    void authClient.signIn.social({ provider: 'github', callbackURL: '/dashboard' })
                  }
                >
                  <Code2 />
                  Continue with GitHub
                </Button>
              )}
              {providers.gitlab && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    void authClient.signIn.social({
                      provider: 'gitlab',
                      callbackURL: '/dashboard',
                    })
                  }
                >
                  <GitBranch />
                  Continue with GitLab
                </Button>
              )}
            </div>
          )}

          {hasOAuthProvider && providers.emailAndPassword && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
          )}

          {providers.emailAndPassword && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                {mode === 'signup' && (
                  <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {mode === 'signup' ? <UserPlus /> : <Terminal />}
                {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signup' ? 'signin' : 'signup');
                  setError(undefined);
                  setNotice(null);
                }}
                className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {mode === 'signup'
                  ? 'Already have an account? Sign in'
                  : 'Need an account? Create one'}
              </button>
            </form>
          )}

          {!hasOAuthProvider && !providers.emailAndPassword && (
            <p className="text-center text-sm text-muted-foreground">
              No sign-in providers are configured.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
