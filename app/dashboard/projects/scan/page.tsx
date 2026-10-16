import { notFound } from 'next/navigation';

import { isLocalScanEnabled } from '@/lib/local-scan';

import { ScanProjectsClient } from './scan-client';

/**
 * The scanner depends on the local filesystem and the `git` binary, neither of
 * which exist on serverless hosts. Gate it so the route 404s in production
 * instead of presenting a feature that can only ever return nothing.
 */
export default function ScanProjectsPage() {
  if (!isLocalScanEnabled()) {
    notFound();
  }

  return <ScanProjectsClient />;
}
