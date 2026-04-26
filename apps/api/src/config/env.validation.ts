import { z } from 'zod/v4';

const envSchema = z.object({
  // App
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.url(),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  DB_IDLE_TIMEOUT: z.coerce.number().int().positive().default(20),
  DB_CONNECT_TIMEOUT: z.coerce.number().int().positive().default(10),

  // Auth
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),

  // Redis (optional)
  REDIS_URL: z.string().optional(),

  // Observability (optional)
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(1),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  SENTRY_SMOKE_TEST_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  // Email (optional in dev)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_SECURE: z.string().optional(),

  // App metadata
  APP_NAME: z.string().default('MyApp'),
  APP_URL: z.string().default('http://localhost:3000'),
});

export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = z.prettifyError(result.error);
    throw new Error(`Environment validation failed:\n${formatted}`);
  }
  return result.data;
}
