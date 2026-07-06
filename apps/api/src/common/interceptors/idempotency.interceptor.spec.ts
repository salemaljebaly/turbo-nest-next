import { Reflector } from '@nestjs/core';
import { of, lastValueFrom } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { IDEMPOTENT_KEY } from '../decorators/idempotent.decorator.js';
import { IdempotencyInterceptor } from './idempotency.interceptor.js';

function createContext(key = 'idem-1') {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'POST',
        originalUrl: '/api/v1/test',
        url: '/api/v1/test',
        body: { value: 1 },
        header: (name: string) =>
          name.toLowerCase() === 'idempotency-key' ? key : undefined,
      }),
    }),
  } as never;
}

describe(IdempotencyInterceptor.name, () => {
  it('replays a completed response without executing the handler again', async () => {
    const db = {
      select: vi.fn(() => ({
        from: () => ({
          where: () =>
            Promise.resolve([
              {
                key: 'idem-1',
                requestHash:
                  '246af6222700577d7486f1e462b12c3ab3fd4241fa509cf1fb2e1aa9637b2fe2',
                status: 'completed',
                response: { data: { ok: true } },
              },
            ]),
        }),
      })),
    };
    const getAllAndOverride = vi.fn(() => true);
    const reflector = { getAllAndOverride } as unknown as Reflector;
    const next = { handle: vi.fn(() => of({ data: { ok: false } })) };

    const interceptor = new IdempotencyInterceptor(reflector, db as never);
    const response = await lastValueFrom(
      interceptor.intercept(createContext(), next),
    );

    expect(response).toEqual({ data: { ok: true } });
    expect(next.handle).not.toHaveBeenCalled();
    expect(getAllAndOverride.mock.calls[0]).toEqual([
      IDEMPOTENT_KEY,
      [undefined, undefined],
    ]);
  });

  it('rejects the same key with a different request hash', async () => {
    const db = {
      select: vi.fn(() => ({
        from: () => ({
          where: () =>
            Promise.resolve([
              {
                key: 'idem-1',
                requestHash: 'different',
                status: 'completed',
                response: { data: { ok: true } },
              },
            ]),
        }),
      })),
    };
    const reflector = {
      getAllAndOverride: vi.fn(() => true),
    } as unknown as Reflector;

    const interceptor = new IdempotencyInterceptor(reflector, db as never);

    await expect(
      lastValueFrom(
        interceptor.intercept(createContext(), {
          handle: vi.fn(() => of({ data: { ok: false } })),
        }),
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
});
