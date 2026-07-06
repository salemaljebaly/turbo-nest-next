import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { finalize, type Observable } from 'rxjs';
import type { RequestWithContext } from '../middleware/request-context.middleware.js';
import { metricPath, metrics } from '../../observability/metrics.js';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      finalize(() => {
        const durationMs = Date.now() - startedAt;
        const requestId = request.context?.requestId ?? 'unknown';
        const path = request.originalUrl ?? request.url;
        metrics.observeHttpDuration(durationMs / 1000, {
          method: request.method,
          path: metricPath(path),
          status: response.statusCode,
        });
        const message = JSON.stringify({
          requestId,
          method: request.method,
          path,
          statusCode: response.statusCode,
          durationMs,
        });

        if (response.statusCode >= 500) {
          this.logger.error(message);
        } else if (response.statusCode >= 400) {
          this.logger.warn(message);
        } else {
          this.logger.log(message);
        }
      }),
    );
  }
}
