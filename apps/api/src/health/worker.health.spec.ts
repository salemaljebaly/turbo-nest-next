import { HealthCheckError } from '@nestjs/terminus';
import { describe, expect, it, vi } from 'vitest';
import { WorkerHealthIndicator } from './worker.health.js';

function mockConfig(overrides: Record<string, unknown> = {}) {
  const defaults: Record<string, unknown> = {
    QUEUE_PREFIX: 'template-test',
    WORKER_HEALTH_REQUIRED: true,
    ...overrides,
  };
  return {
    get: vi.fn((key: string, fallback?: unknown) => defaults[key] ?? fallback),
  };
}

describe('WorkerHealthIndicator', () => {
  it('reports a current worker heartbeat as healthy', async () => {
    const redis = { get: vi.fn().mockResolvedValue(new Date().toISOString()) };
    const indicator = new WorkerHealthIndicator(
      redis as never,
      mockConfig() as never,
    );

    await expect(indicator.isHealthy('worker')).resolves.toMatchObject({
      worker: { status: 'up' },
    });
    expect(redis.get).toHaveBeenCalledWith(
      'template-test:runtime:worker:heartbeat',
    );
  });

  it('fails when the worker heartbeat is absent and required', async () => {
    const indicator = new WorkerHealthIndicator(
      { get: vi.fn().mockResolvedValue(null) } as never,
      mockConfig() as never,
    );

    await expect(indicator.isHealthy('worker')).rejects.toBeInstanceOf(
      HealthCheckError,
    );
  });

  it('degrades gracefully when heartbeat is absent and not required', async () => {
    const indicator = new WorkerHealthIndicator(
      { get: vi.fn().mockResolvedValue(null) } as never,
      mockConfig({ WORKER_HEALTH_REQUIRED: false }) as never,
    );

    await expect(indicator.isHealthy('worker')).resolves.toMatchObject({
      worker: { status: 'up', required: false },
    });
  });
});
