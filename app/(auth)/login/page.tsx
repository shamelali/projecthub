import { configuredProviders } from '@/lib/auth';

import { LoginForm } from './login-form';

function getAuthErrorMessage(error?: string) {
  if (!error) return undefined;
  if (error === 'CredentialsSignin') {
    return 'Invalid demo email or password.';
  }
  return 'Unable to sign in. Please try again.';
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return <LoginForm providers={configuredProviders} initialError={getAuthErrorMessage(error)} />;
}
