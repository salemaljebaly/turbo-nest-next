import { Logger } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins/organization';
import Redis from 'ioredis';
import type { Database } from '@repo/db';
import type { EmailSender } from './email.js';

const logger = new Logger('Auth');

export const AUTH_TOKEN = Symbol('AUTH');

interface CreateAuthOptions {
  db: Database;
  appName: string;
  appUrl: string;
  corsOrigins: string[];
  redisUrl?: string;
  nodeEnv: string;
  sendEmail: EmailSender;
}

export function createAuth({
  db,
  appUrl,
  corsOrigins,
  redisUrl,
  nodeEnv,
  sendEmail,
}: CreateAuthOptions) {
  const redis = redisUrl
    ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 3 })
    : null;

  const secondaryStorage = redis
    ? {
        get: async (key: string) => redis.get(key),
        set: async (key: string, value: string, ttl?: number) => {
          if (ttl) await redis.setex(key, ttl, value);
          else await redis.set(key, value);
        },
        delete: async (key: string) => {
          await redis.del(key);
        },
      }
    : undefined;

  const authDatabase = db as Parameters<typeof drizzleAdapter>[0];

  return betterAuth({
    basePath: '/api/auth',
    database: drizzleAdapter(authDatabase, { provider: 'pg' }),
    ...(secondaryStorage && { secondaryStorage }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 30,

      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: 'Reset your password',
          html: `
            <p>Hi ${user.name},</p>
            <p>Click the link below to reset your password. It expires in 30 minutes.</p>
            <a href="${url}">Reset password</a>
            <p>If you did not request this, you can safely ignore this email.</p>
          `,
        });
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: 'Verify your email address',
          html: `
            <p>Hi ${user.name},</p>
            <p>Click the link below to verify your email address.</p>
            <a href="${url}">Verify email</a>
          `,
        });
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 60,
      storeSessionInDatabase: true,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
        strategy: 'jwe',
      },
    },

    rateLimit: {
      enabled: true,
      storage: secondaryStorage ? 'secondary-storage' : 'memory',
      window: 10,
      max: 100,
      customRules: {
        '/api/auth/sign-in/email': { window: 60, max: 5 },
        '/api/auth/sign-up/email': { window: 60, max: 3 },
        '/api/auth/forget-password': { window: 60, max: 3 },
      },
    },

    trustedOrigins: corsOrigins,

    plugins: [
      organization({
        allowUserToCreateOrganization: true,
        organizationLimit: 10,
        membershipLimit: 100,
        invitationExpiresIn: 60 * 60 * 24 * 7,
        sendInvitationEmail: async ({
          email,
          organization: org,
          inviter,
          invitation,
        }) => {
          const acceptUrl = `${appUrl}/accept-invitation/${invitation.id}`;
          await sendEmail({
            to: email,
            subject: `You're invited to join ${org.name}`,
            html: `
              <p>${inviter.user.name} has invited you to join <strong>${org.name}</strong>.</p>
              <a href="${acceptUrl}">Accept invitation</a>
              <p>This invitation expires in 7 days.</p>
            `,
          });
        },
      }),
    ],

    advanced: {
      useSecureCookies: nodeEnv === 'production',
      ipAddress: {
        ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
        disableIpTracking: false,
      },
    },

    databaseHooks: {
      session: {
        create: {
          after: async (session: { userId: string; id: string }) => {
            logger.log(`Session created for user ${session.userId}`);
          },
        },
      },
      user: {
        update: {
          after: async (user: { id: string }) => {
            logger.log(`User updated: ${user.id}`);
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session'];
export type User = Session['user'];
