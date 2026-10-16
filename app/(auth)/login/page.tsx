import { configuredProviders } from '@/lib/auth';

import { LoginForm } from './login-form';

function getAuthErrorMessage(error?: string) {
  if (!error) return undefined;
  return 'Unable to sign in. Please check your details and try again.';
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return <LoginForm providers={configuredProviders} initialError={getAuthErrorMessage(error)} />;
}
