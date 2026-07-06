import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'todo:rate-limit';

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMIT_DEFAULTS = {
  read: { limit: 120, windowSeconds: 60 },
  write: { limit: 30, windowSeconds: 60 },
  admin: { limit: 300, windowSeconds: 60 },
  otp: { limit: 3, windowSeconds: 600 },
} as const satisfies Record<string, RateLimitOptions>;

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
