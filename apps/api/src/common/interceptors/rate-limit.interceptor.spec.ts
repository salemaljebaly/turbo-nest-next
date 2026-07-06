import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator.js';
import { RateLimitInterceptor } from './rate-limit.interceptor.js';

function createContext() {
  const headers = new Map<string, string>();
  return {
    headers,
    context: {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          path: '/limited',
          route: { path: '/limited' },
          ip: '127.0.0.1',
          socket: {},
        }),
        getResponse: () => ({
          setHeader: (name: string, value: string) => headers.set(name, value),
        }),
      }),
    } as never,
  };
}

describe(RateLimitInterceptor.name, () => {
  it('returns 429 with Retry-After after the sliding window is exhausted', async () => {
    const getAllAndOverride = vi.fn(() => ({ limit: 1, windowSeconds: 60 }));
    const reflector = { getAllAndOverride } as unknown as Reflector;
    const config = { get: () => 'development' } as never;
    const interceptor = new RateLimitInterceptor(reflector, null, config);
    const { context, headers } = createContext();

    await lastValueFrom(
      interceptor.intercept(context, { handle: () => of('ok') }),
    );

    await expect(
      lastValueFrom(interceptor.intercept(context, { handle: () => of('ok') })),
    ).rejects.toMatchObject({ status: 429 });

    expect(headers.get('Retry-After')).toBe('60');
    expect(getAllAndOverride.mock.calls[0]).toEqual([
      RATE_LIMIT_KEY,
      [undefined, undefined],
    ]);
  });
});
