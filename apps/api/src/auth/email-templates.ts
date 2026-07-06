export type EmailTemplateInput = {
  appName: string;
  name?: string | null;
  url: string;
};

export function verificationEmail({ appName, name, url }: EmailTemplateInput) {
  return {
    subject: `Verify your ${appName} email`,
    html: `<p>Hi ${name ?? 'there'},</p><p>Verify your email address.</p><p><a href="${url}">Verify email</a></p>`,
  };
}

export function passwordResetEmail({ appName, name, url }: EmailTemplateInput) {
  return {
    subject: `Reset your ${appName} password`,
    html: `<p>Hi ${name ?? 'there'},</p><p>Reset your password using the link below.</p><p><a href="${url}">Reset password</a></p>`,
  };
}
