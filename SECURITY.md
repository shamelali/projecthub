# Security Policy

ProjectHub

**Last updated:** 2026-10-17

## Supported versions

| Version | Supported | Notes |
|---------|-----------|-------|
| v0.1 (current) | ✅ | MVP |
| v0.2 | ⏳ | Planned |
| < v0.1 | ❌ | Unsupported |

## Reporting a vulnerability

Please do not open public GitHub issues for security vulnerabilities. Contact the maintainer through the repository's security advisory feature or email listed in the repository profile.

Include:
- Description of the vulnerability
- Steps to reproduce
- Affected versions and endpoints
- Suggested fix (if any)

We will acknowledge receipt within 5 business days and provide a remediation timeline.

## Security practices

- Secrets never in tracked files (`~/.secrets/`, `{env:…}` references).
- `NEXTAUTH_SECRET` required; generate with `openssl rand -base64 32`.
- Invite tokens stored hashed (SHA-256); raw token transmitted once.
- Server actions enforce authentication + project role checks on every mutation.
- Client share links are scope-limited, rate-limited, and revocable.
- Activity log provides an audit trail for mutations.
- `path-security.ts` guards against path traversal in local scans.

## Dependencies

Keep dependencies updated; run `pnpm audit` regularly and address high/critical findings before release.
