/**
 * Email transport for Better Auth verification and password-reset emails.
 *
 * Production uses the Brevo HTTP API (https://api.brevo.com/v3/smtp/email),
 * which needs only an API key — no SMTP ports or extra dependency.
 *
 * In development it logs to stdout instead, so local work needs no account.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Thrown when a send fails. Carries the HTTP status so callers can tell a
 * config problem (4xx) apart from a transient one (5xx).
 */
export class EmailSendError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'EmailSendError';
    this.status = status;
  }
}

export async function sendEmail(params: EmailParams): Promise<void> {
  const { to, subject, text, html } = params;

  // Development: log to stdout so you can copy the verification link.
  if (process.env.NODE_ENV !== 'production') {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════════
║  EMAIL (dev mode - not actually sent)
║  To: ${to}
║  Subject: ${subject}
║ ─────────────────────────────────────────────────────────────────────────────
║${text.split('\n').map((line) => `║ ${line}`).join('\n')}
╚══════════════════════════════════════════════════════════════════════════════════
`);
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not set — cannot send email in production.');
  }

  // Falls back to a registered Brevo sender so a missing EMAIL_FROM cannot
  // silently break verification emails in production.
  const fromEmail = process.env.EMAIL_FROM ?? 'admin@dutaintegra.my';
  const fromName = process.env.EMAIL_FROM_NAME ?? 'ProjectHub';

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      textContent: text,
      ...(html ? { htmlContent: html } : {}),
    }),
  });

  if (!response.ok) {
    // Brevo returns {message, code} on failure — surface it rather than
    // logging a bare "email failed".
    const body = await response.text().catch(() => '');
    throw new EmailSendError(
      `Brevo rejected the email to ${to} (HTTP ${response.status}): ${body || response.statusText}`,
      response.status
    );
  }
}