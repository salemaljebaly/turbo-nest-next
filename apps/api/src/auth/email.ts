import nodemailer, { type Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface EmailSenderConfig {
  appName: string;
  nodeEnv: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
}

export type EmailSender = (options: SendEmailOptions) => Promise<void>;

export function createEmailSender(config: EmailSenderConfig): EmailSender {
  let transporter: Transporter | null = null;

  const fromAddress =
    config.smtpFrom?.trim() || `${config.appName} <noreply@localhost>`;
  const smtpConfigured = Boolean(config.smtpHost && config.smtpPort);

  const getTransporter = () => {
    if (!smtpConfigured) return null;

    if (!transporter) {
      transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure ?? false,
        auth:
          config.smtpUser && config.smtpPass
            ? {
                user: config.smtpUser,
                pass: config.smtpPass,
              }
            : undefined,
      });
    }

    return transporter;
  };

  return async ({ to, subject, html }) => {
    const mailer = getTransporter();

    if (!mailer) {
      if (config.nodeEnv !== 'production') {
        console.log(`\n[Email] To: ${to}\n[Email] Subject: ${subject}\n[Email] Body: ${html}\n`);
        return;
      }

      throw new Error(
        'SMTP is not configured. Set SMTP_HOST and SMTP_PORT, and optionally SMTP_USER, SMTP_PASS, SMTP_FROM.',
      );
    }

    await mailer.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    if (config.nodeEnv !== 'production') {
      console.log(`[Email] Delivered via SMTP to ${to}`);
    }
  };
}
