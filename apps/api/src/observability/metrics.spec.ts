import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { MetricsController } from './metrics.controller.js';
import { metricPath, metrics } from './metrics.js';

describe('Prometheus metrics', () => {
  it('normalizes high-cardinality IDs and renders valid labeled series', () => {
    metrics.reset();
    expect(
      metricPath(
        '/api/v1/projects/0197c899-7612-7000-8000-000000000001?full=true',
      ),
    ).toBe('/api/v1/projects/:id');
    metrics.increment('todo_test_total', 'Test counter', {
      outcome: 'ok',
    });

    expect(metrics.render()).toContain('todo_test_total{outcome="ok"} 1');
  });

  it('requires the configured bearer token', () => {
    const controller = new MetricsController({
      get: (key: string) =>
        key === 'METRICS_TOKEN' ? '0123456789abcdef' : null,
    } as never);

    expect(() =>
      controller.read({ headers: { authorization: 'Bearer wrong' } } as never),
    ).toThrow(ForbiddenException);
    expect(
      controller.read({
        headers: { authorization: 'Bearer 0123456789abcdef' },
      } as never),
    ).toContain('# HELP');
  });
});
