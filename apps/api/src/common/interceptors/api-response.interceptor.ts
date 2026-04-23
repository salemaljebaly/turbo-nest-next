import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';
import { API_ENVELOPE_SKIP_KEY } from '../decorators/api-envelope.decorator.js';

interface ApiSuccessEnvelope {
  success: true;
  data: unknown;
  message?: string;
}

function isApiSuccess(value: unknown): value is ApiSuccessEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { success?: unknown }).success === true &&
    'data' in value
  );
}

function isApiError(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { success?: unknown }).success === false &&
    typeof (value as { error?: { code?: unknown; message?: unknown } }).error
      ?.code === 'string' &&
    typeof (value as { error?: { code?: unknown; message?: unknown } }).error
      ?.message === 'string'
  );
}

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skipEnvelope = this.reflector.getAllAndOverride<boolean>(
      API_ENVELOPE_SKIP_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipEnvelope) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: unknown): unknown => {
        if (
          response.statusCode === 204 ||
          isApiSuccess(data) ||
          isApiError(data)
        ) {
          return data;
        }

        return {
          success: true,
          data,
        } satisfies ApiSuccessEnvelope;
      }),
    );
  }
}
