/**
 * Email transport for Better Auth verification and password-reset emails.
 *
 * In development this logs to stdout (no external SMTP needed).
 * In production, configure SMTP via environment variables and replace the
 * sendMail implementation with a real transporter (nodemailer, Resend, etc.).
 */
export interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<void> {
  const { to, subject, text } = params;

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

  // Production: replace with a real SMTP transporter.
  // Example with nodemailer:
  // import { createTransport } from 'nodemailer';
  // const transport = createTransport({ host, port, secure, auth });
  // await transport.sendMail({ from, to, subject, text, html });
  throw new Error('Production email transport not configured. Set up SMTP in lib/email.ts.');
}
