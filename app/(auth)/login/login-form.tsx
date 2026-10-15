"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Code2, GitBranch, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface LoginFormProps {
  providers: {
    github: boolean;
    gitlab: boolean;
    credentials: boolean;
  };
  initialError?: string;
}

export function LoginForm({ providers, initialError }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const hasOAuthProvider = providers.github || providers.gitlab;

  const handleCredentialsLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError("Invalid demo email or password.");
        setLoading(false);
        return;
      }

      window.location.assign(result?.url ?? "/dashboard");
    } catch {
      setError("Unable to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            ProjectHub
          </CardTitle>
          <CardDescription>Sign in to manage your projects</CardDescription>
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

          {(hasOAuthProvider || providers.credentials) && (
            <div className="space-y-4">
              {hasOAuthProvider && (
                <div className="space-y-2">
                  {providers.github && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        void signIn("github", { callbackUrl: "/dashboard" })
                      }
                    >
                      <Code2 />
                      Continue with GitHub
                    </Button>
                  )}
                  {providers.gitlab && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        void signIn("gitlab", { callbackUrl: "/dashboard" })
                      }
                    >
                      <GitBranch />
                      Continue with GitLab
                    </Button>
                  )}
                </div>
              )}

              {hasOAuthProvider && providers.credentials && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>
              )}

              {providers.credentials && (
                <form onSubmit={handleCredentialsLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Demo email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="demo@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Demo password
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <Terminal />
                    {loading ? "Signing in..." : "Continue with Demo Account"}
                  </Button>
                </form>
              )}
            </div>
          )}

          {!hasOAuthProvider && !providers.credentials && (
            <p className="text-center text-sm text-muted-foreground">
              No sign-in providers are configured.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
