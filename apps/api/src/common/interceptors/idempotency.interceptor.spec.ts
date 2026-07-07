import { Reflector } from '@nestjs/core';
import { lastValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { IDEMPOTENT_KEY } from '../decorators/idempotent.decorator.js';
import { IdempotencyInterceptor } from './idempotency.interceptor.js';

const requestHash =
  '246af6222700577d7486f1e462b12c3ab3fd4241fa509cf1fb2e1aa9637b2fe2';

function createContext(key = 'idem-1', userId = 'user-1') {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'POST',
        originalUrl: '/api/v1/test',
        url: '/api/v1/test',
        body: { value: 1 },
        session: { user: { id: userId } },
        header: (name: string) =>
          name.toLowerCase() === 'idempotency-key' ? key : undefined,
      }),
    }),
  } as never;
}

function createDb({
  inserted = [],
  selected = [],
  updated = [],
}: {
  inserted?: unknown[];
  selected?: unknown[];
  updated?: unknown[];
} = {}) {
  const insertReturning = vi.fn().mockResolvedValue(inserted);
  const onConflictDoNothing = vi.fn(() => ({ returning: insertReturning }));
  const insertValues = vi.fn(() => ({ onConflictDoNothing }));
  const insert = vi.fn(() => ({ values: insertValues }));

  const selectWhere = vi.fn().mockResolvedValue(selected);
  const select = vi.fn(() => ({
    from: () => ({
      where: selectWhere,
    }),
  }));

  const updateReturning = vi.fn().mockResolvedValue(updated);
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));

  const deleteWhere = vi.fn().mockResolvedValue(undefined);
  const deleteFn = vi.fn(() => ({ where: deleteWhere }));

  return {
    db: { insert, select, update, delete: deleteFn },
    insertValues,
    onConflictDoNothing,
    updateSet,
    updateWhere,
    deleteWhere,
  };
}

function createInterceptor(db: unknown) {
  const getAllAndOverride = vi.fn(() => true);
  const reflector = { getAllAndOverride } as unknown as Reflector;
  return {
    interceptor: new IdempotencyInterceptor(reflector, db as never),
    getAllAndOverride,
  };
}

describe(IdempotencyInterceptor.name, () => {
  it('replays a completed response without executing the handler again', async () => {
    const { db } = createDb({
      selected: [
        {
          key: 'idem-1',
          userId: 'user-1',
          requestHash,
          status: 'completed',
          expiresAt: new Date(Date.now() + 60_000),
          response: { data: { ok: true } },
        },
      ],
    });
    const { interceptor, getAllAndOverride } = createInterceptor(db);
    const next = { handle: vi.fn(() => of({ data: { ok: false } })) };

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

  it('creates idempotency reservations scoped to the current user', async () => {
    const { db, insertValues, onConflictDoNothing } = createDb({
      inserted: [{ id: 'reservation-1' }],
    });
    const { interceptor } = createInterceptor(db);

    await expect(
      lastValueFrom(
        interceptor.intercept(createContext('idem-1', 'user-1'), {
          handle: vi.fn(() => of({ data: { ok: true } })),
        }),
      ),
    ).resolves.toEqual({ data: { ok: true } });

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        key: 'idem-1',
        requestHash,
      }),
    );
    expect(onConflictDoNothing).toHaveBeenCalledWith({
      target: expect.any(Array),
    });
  });

  it('rejects the same key with a different request hash', async () => {
    const { db } = createDb({
      selected: [
        {
          key: 'idem-1',
          userId: 'user-1',
          requestHash: 'different',
          status: 'completed',
          expiresAt: new Date(Date.now() + 60_000),
          response: { data: { ok: true } },
        },
      ],
    });
    const { interceptor } = createInterceptor(db);

    await expect(
      lastValueFrom(
        interceptor.intercept(createContext(), {
          handle: vi.fn(() => of({ data: { ok: false } })),
        }),
      ),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('rejects duplicate requests while the first request is still processing', async () => {
    const { db } = createDb({
      selected: [
        {
          key: 'idem-1',
          userId: 'user-1',
          requestHash,
          status: 'in_progress',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        },
      ],
    });
    const { interceptor } = createInterceptor(db);

    await expect(
      lastValueFrom(
        interceptor.intercept(createContext(), {
          handle: vi.fn(() => of({ data: { ok: false } })),
        }),
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'IDEMPOTENCY_IN_PROGRESS' }),
      status: 409,
    });
  });

  it('takes over expired idempotency keys and stores the new response', async () => {
    const { db, updateSet, updateWhere } = createDb({
      selected: [
        {
          key: 'idem-1',
          userId: 'user-1',
          requestHash,
          status: 'completed',
          createdAt: new Date(Date.now() - 120_000),
          expiresAt: new Date(Date.now() - 1_000),
          response: { data: { old: true } },
        },
      ],
      updated: [{ id: 'reservation-1' }],
    });
    const { interceptor } = createInterceptor(db);

    await expect(
      lastValueFrom(
        interceptor.intercept(createContext(), {
          handle: vi.fn(() => of({ data: { ok: true } })),
        }),
      ),
    ).resolves.toEqual({ data: { ok: true } });

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        response: null,
        status: 'in_progress',
      }),
    );
    expect(updateWhere).toHaveBeenCalled();
  });

  it('deletes the reservation when the handler fails', async () => {
    const { db, deleteWhere } = createDb({
      inserted: [{ id: 'reservation-1' }],
    });
    const { interceptor } = createInterceptor(db);

    await expect(
      lastValueFrom(
        interceptor.intercept(createContext(), {
          handle: vi.fn(() => throwError(() => new Error('boom'))),
        }),
      ),
    ).rejects.toThrow('boom');

    expect(deleteWhere).toHaveBeenCalledOnce();
  });
});
