import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import {
  noopObservability,
  type ExceptionContext,
  type Observability,
} from '@repo/observability';

export function initSentryFromEnv() {
  const dsn = process.env['SENTRY_DSN'];
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment:
      process.env['SENTRY_ENVIRONMENT'] ??
      process.env['NODE_ENV'] ??
      'development',
    release: process.env['SENTRY_RELEASE'],
    sampleRate: Number(process.env['SENTRY_SAMPLE_RATE'] ?? 1),
    tracesSampleRate: Number(process.env['SENTRY_TRACES_SAMPLE_RATE'] ?? 0),
  });
}

export function createApiObservability(config: ConfigService): Observability {
  if (!config.get<string>('SENTRY_DSN')) {
    return noopObservability;
  }

  return {
    captureException(exception: unknown, context?: ExceptionContext) {
      Sentry.captureException(exception, {
        tags: {
          requestId: context?.requestId ?? 'unknown',
          method: context?.method ?? 'unknown',
          path: context?.path ?? 'unknown',
          statusCode: String(context?.statusCode ?? 'unknown'),
          ...context?.tags,
        },
        extra: context?.extra,
      });
    },
    flush: (timeoutMs = 2000) => Sentry.flush(timeoutMs),
  };
}
