import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailSendError, sendEmail } from '@/lib/email';

const PARAMS = {
  to: 'user@example.com',
  subject: 'Verify your ProjectHub email',
  text: 'Verify: https://example.com/verify?token=abc',
  html: '<p>Verify</p>',
};

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    ...response,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('sendEmail', () => {
  beforeEach(() => {
    // NODE_ENV is readonly in the Node types, so stub rather than assign.
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('BREVO_API_KEY', 'xkeysib-test-key');
    vi.stubEnv('EMAIL_FROM', undefined);
    vi.stubEnv('EMAIL_FROM_NAME', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('posts to the Brevo API with the key in the api-key header', async () => {
    const fetchMock = mockFetch({});

    await sendEmail(PARAMS);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['api-key']).toBe('xkeysib-test-key');

    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual([{ email: 'user@example.com' }]);
    expect(body.subject).toBe(PARAMS.subject);
    expect(body.textContent).toBe(PARAMS.text);
    expect(body.htmlContent).toBe(PARAMS.html);
  });

  it('falls back to a registered sender when EMAIL_FROM is unset', async () => {
    const fetchMock = mockFetch({});

    await sendEmail(PARAMS);

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.sender.email).toBe('admin@dutaintegra.my');
  });

  it('honours EMAIL_FROM when set', async () => {
    process.env.EMAIL_FROM = 'support@dutaintegra.my';
    const fetchMock = mockFetch({});

    await sendEmail(PARAMS);

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.sender.email).toBe('support@dutaintegra.my');
  });

  it('throws a descriptive error when BREVO_API_KEY is missing', async () => {
    vi.stubEnv('BREVO_API_KEY', undefined);
    const fetchMock = mockFetch({});

    await expect(sendEmail(PARAMS)).rejects.toThrow(/BREVO_API_KEY/);
    // Must not attempt a send that could only fail with an auth error.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces the Brevo error body and status on a rejected send', async () => {
    mockFetch({
      ok: false,
      status: 400,
      text: () => Promise.resolve('{"message":"sender not found","code":"invalid_parameter"}'),
    });

    // A bad sender is a config problem, so the upstream detail must survive.
    const error = await sendEmail(PARAMS).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EmailSendError);
    expect((error as EmailSendError).status).toBe(400);
    expect((error as Error).message).toContain('sender not found');
  });

  it('logs to stdout and sends nothing outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fetchMock = mockFetch({});

    await sendEmail(PARAMS);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledOnce();
  });
});
