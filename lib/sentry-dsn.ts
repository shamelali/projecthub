/**
 * Guard against a malformed DSN being set in the environment.
 *
 * A Sentry DSN must look like:
 *   https://<publicKey>@<orgId>.ingest.<region>.sentry.io/<projectId>
 *
 * The SDK logs "Invalid Sentry Dsn" and silently disables itself when given
 * anything else, which is easy to miss. Checking here turns a silent
 * no-op into an explicit disabled state.
 */
export function resolveSentryDsn(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;

  try {
    const url = new URL(raw.trim());
    if (!url.protocol.startsWith('http')) return undefined;
    if (!url.username) return undefined;
    if (!url.hostname.includes('sentry.io')) return undefined;
    return raw.trim();
  } catch {
    return undefined;
  }
}
