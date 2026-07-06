import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import Redis from 'ioredis';
import { from, mergeMap, type Observable } from 'rxjs';
import {
  RATE_LIMIT_DEFAULTS,
  RATE_LIMIT_KEY,
  type RateLimitOptions,
} from '../decorators/rate-limit.decorator.js';
import { AppException } from '../errors/app.exception.js';
import { REDIS_TOKEN } from '../redis/redis.module.js';

type MemoryBucket = {
  hits: number[];
};

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly memoryBuckets = new Map<string, MemoryBucket>();
  private readonly disabled: boolean;

  constructor(
    private readonly reflector: Reflector,
    @Inject(REDIS_TOKEN) private readonly redis: Redis | null,
    config: ConfigService,
  ) {
    this.disabled = config.get('NODE_ENV') === 'test';
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (this.disabled) return next.handle();
    const options =
      this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? this.defaultForRequest(context);

    return from(this.consume(context, options)).pipe(
      mergeMap(() => next.handle()),
    );
  }

  private defaultForRequest(context: ExecutionContext): RateLimitOptions {
    const request = context.switchToHttp().getRequest<Request>();
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
      ? RATE_LIMIT_DEFAULTS.write
      : RATE_LIMIT_DEFAULTS.read;
  }

  private async consume(context: ExecutionContext, options: RateLimitOptions) {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const sessionUserId = (request as { session?: { user?: { id?: string } } })
      .session?.user?.id;
    const identity = sessionUserId ? `user:${sessionUserId}` : `ip:${ip}`;
    const key = `rate:${identity}:${request.method}:${request.route?.path ?? request.path}`;
    const now = Date.now();
    const windowMs = options.windowSeconds * 1000;

    const count = this.redis
      ? await this.consumeRedis(key, now, windowMs)
      : this.consumeMemory(key, now, windowMs);

    if (count > options.limit) {
      response.setHeader('Retry-After', String(options.windowSeconds));
      throw new AppException('RATE_LIMITED', undefined, {
        retryAfterSeconds: options.windowSeconds,
      });
    }
  }

  private async consumeRedis(key: string, now: number, windowMs: number) {
    const member = `${now}:${Math.random()}`;
    const pipeline = this.redis!.pipeline();
    pipeline.zremrangebyscore(key, 0, now - windowMs);
    pipeline.zadd(key, now, member);
    pipeline.zcard(key);
    pipeline.pexpire(key, windowMs);
    const results = await pipeline.exec();
    return Number(results?.[2]?.[1] ?? 0);
  }

  private consumeMemory(key: string, now: number, windowMs: number) {
    const bucket = this.memoryBuckets.get(key) ?? { hits: [] };
    bucket.hits = bucket.hits.filter((hit) => hit > now - windowMs);
    bucket.hits.push(now);
    this.memoryBuckets.set(key, bucket);
    return bucket.hits.length;
  }
}
