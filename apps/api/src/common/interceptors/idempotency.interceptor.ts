import { createHash, randomUUID } from 'node:crypto';
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq, idempotencyKeys, type Database } from '@repo/db';
import type { Request } from 'express';
import { from, mergeMap, of, type Observable } from 'rxjs';
import { DATABASE_TOKEN } from '../../database/database.module.js';
import { IDEMPOTENT_KEY } from '../decorators/idempotent.decorator.js';
import { AppException } from '../errors/app.exception.js';

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

    const request = context.switchToHttp().getRequest<Request>();
    const key = request.header('idempotency-key')?.trim();

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

    return from(this.findOrCreate(key, requestHash)).pipe(
      mergeMap((existing) => {
        if (existing?.status === 'completed') return of(existing.response);

        return next
          .handle()
          .pipe(
            mergeMap((response: unknown) =>
              from(this.persistResponse(key, response)).pipe(
                mergeMap(() => of(response)),
              ),
            ),
          );
      }),
    );
  }

  private async findOrCreate(key: string, requestHash: string) {
    const [existing] = await this.db
      .select()
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, key));

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new AppException('IDEMPOTENCY_CONFLICT');
      }
      return existing;
    }

    await this.db.insert(idempotencyKeys).values({
      id: randomUUID(),
      key,
      requestHash,
      status: 'in_progress',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return null;
  }

  private async persistResponse(key: string, response: unknown) {
    await this.db
      .update(idempotencyKeys)
      .set({
        response,
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(idempotencyKeys.key, key));
  }
}
