import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "[email] RESEND_API_KEY is not set. Emails will fail. Add it to .env.local",
  )
}

/**
 * Send an email via Resend.
 * @param from Sender email (e.g., "Acme <onboarding@yourdomain.com>")
 * @param to Recipient email address
 * @param subject Email subject
 * @param html HTML body
 */
export async function sendEmail({
  from,
  to,
  subject,
  html,
}: {
  from: string
  to: string | string[]
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is not configured. Add it to .env.local",
    )
  }

  const { data, error } = await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }

  return data
}

/**
 * Send welcome email to a new user.
 * @param email User email
 * @param name User name
 */
export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail({
    from: "ProjectHub <onboarding@yourdomain.com>",
    to: email,
    subject: `Welcome to ProjectHub, ${name}!`,
    html: `<p>Hi ${name},</p><p>Welcome to ProjectHub! We're excited to have you on board.</p><p>Get started by exploring the dashboard.</p>`,
  })
}

/**
 * Send password reset email (if using custom reset flow).
 * @param email User email
 * @param resetUrl Reset URL with token
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  return sendEmail({
    from: "ProjectHub <onboarding@yourdomain.com>",
    to: email,
    subject: "Reset your ProjectHub password",
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>If you didn't request this, ignore this email.</p>`,
  })
}