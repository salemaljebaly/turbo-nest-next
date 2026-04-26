import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { SentrySmokeController } from './sentry-smoke.controller.js';

function createController(enabled: boolean) {
  const config = {
    get: (_key: string, fallback?: unknown) =>
      typeof fallback === 'boolean' ? enabled : fallback,
  } as unknown as ConfigService;

  return new SentrySmokeController(config);
}

describe('SentrySmokeController', () => {
  it('hides the smoke route when disabled', () => {
    const controller = createController(false);

    expect(() => controller.triggerSentrySmoke()).toThrow(NotFoundException);
  });

  it('throws a smoke-test error when enabled', () => {
    const controller = createController(true);

    expect(() => controller.triggerSentrySmoke()).toThrow(
      'Sentry smoke test error',
    );
  });
});
