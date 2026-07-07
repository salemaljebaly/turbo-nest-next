import { createHash, randomUUID } from 'node:crypto';
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { and, eq, idempotencyKeys, lt, or, type Database } from '@repo/db';
import type { Request } from 'express';
import {
  catchError,
  from,
  mergeMap,
  of,
  throwError,
  type Observable,
} from 'rxjs';
import { DATABASE_TOKEN } from '../../database/database.module.js';
import { IDEMPOTENT_KEY } from '../decorators/idempotent.decorator.js';
import { AppException } from '../errors/app.exception.js';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const IDEMPOTENCY_IN_PROGRESS_TTL_MS = 60 * 1000;

type IdempotencyRequest = Request & {
  session?: {
    user?: {
      id?: string;
    };
  };
};

type IdempotencyReservation =
  | { action: 'execute' }
  | { action: 'replay'; response: unknown };

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  return `{${Object.keys(value)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`,
    )
    .join(',')}}`;
}

function hashRequest(request: Request) {
  const body = stableStringify(request.body ?? {});
  return createHash('sha256')
    .update(`${request.method}:${request.originalUrl ?? request.url}:${body}`)
    .digest('hex');
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(DATABASE_TOKEN) private readonly db: Database,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isIdempotent = this.reflector.getAllAndOverride<boolean>(
      IDEMPOTENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isIdempotent) return next.handle();

    const request = context.switchToHttp().getRequest<IdempotencyRequest>();
    const userId = request.session?.user?.id;
    const key = request.header('idempotency-key')?.trim();

    if (!userId) {
      throw new AppException('FORBIDDEN');
    }

    if (!key) {
      throw new AppException(
        'VALIDATION_FAILED',
        'Idempotency-Key header is required',
        {
          header: 'Idempotency-Key',
        },
      );
    }

    const requestHash = hashRequest(request);

    return from(this.reserve(userId, key, requestHash)).pipe(
      mergeMap((reservation) => {
        if (reservation.action === 'replay') return of(reservation.response);

        return next.handle().pipe(
          mergeMap((response: unknown) =>
            from(this.persistResponse(userId, key, response)).pipe(
              mergeMap(() => of(response)),
            ),
          ),
          catchError((error: unknown) =>
            from(this.releaseReservation(userId, key)).pipe(
              mergeMap(() => throwError(() => error)),
            ),
          ),
        );
      }),
    );
  }

  private async reserve(
    userId: string,
    key: string,
    requestHash: string,
  ): Promise<IdempotencyReservation> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + IDEMPOTENCY_TTL_MS);
    const staleBefore = new Date(
      now.getTime() - IDEMPOTENCY_IN_PROGRESS_TTL_MS,
    );

    const [inserted] = await this.db
      .insert(idempotencyKeys)
      .values({
        id: randomUUID(),
        userId,
        key,
        requestHash,
        status: 'in_progress',
        expiresAt,
      })
      .onConflictDoNothing({
        target: [idempotencyKeys.userId, idempotencyKeys.key],
      })
      .returning();

    if (inserted) return { action: 'execute' };

    const existing = await this.findExisting(userId, key);
    if (!existing) return { action: 'execute' };

    if (existing.requestHash !== requestHash) {
      throw new AppException('IDEMPOTENCY_CONFLICT');
    }

    if (existing.status === 'completed' && existing.expiresAt > now) {
      return { action: 'replay', response: existing.response };
    }

    if (
      existing.status === 'in_progress' &&
      existing.createdAt > staleBefore &&
      existing.expiresAt > now
    ) {
      throw new AppException('IDEMPOTENCY_IN_PROGRESS');
    }

    const [reserved] = await this.db
      .update(idempotencyKeys)
      .set({
        requestHash,
        response: null,
        status: 'in_progress',
        expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(idempotencyKeys.userId, userId),
          eq(idempotencyKeys.key, key),
          or(
            lt(idempotencyKeys.expiresAt, now),
            lt(idempotencyKeys.createdAt, staleBefore),
          ),
        ),
      )
      .returning();

    if (!reserved) throw new AppException('IDEMPOTENCY_IN_PROGRESS');

    return { action: 'execute' };
  }

  private async findExisting(userId: string, key: string) {
    const [existing] = await this.db
      .select()
      .from(idempotencyKeys)
      .where(
        and(eq(idempotencyKeys.userId, userId), eq(idempotencyKeys.key, key)),
      );

    return existing;
  }

  private async persistResponse(
    userId: string,
    key: string,
    response: unknown,
  ) {
    await this.db
      .update(idempotencyKeys)
      .set({
        response,
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(
        and(eq(idempotencyKeys.userId, userId), eq(idempotencyKeys.key, key)),
      );
  }

  private async releaseReservation(userId: string, key: string) {
    await this.db
      .delete(idempotencyKeys)
      .where(
        and(eq(idempotencyKeys.userId, userId), eq(idempotencyKeys.key, key)),
      );
  }
}
