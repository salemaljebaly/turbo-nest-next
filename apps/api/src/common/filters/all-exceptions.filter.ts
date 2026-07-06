import {
  Catch,
  ExceptionFilter,
  HttpException,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { noopObservability, type Observability } from '@repo/observability';
import { Request, Response } from 'express';
import type { RequestWithContext } from '../middleware/request-context.middleware.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly observability: Observability = noopObservability,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithContext>();
    const requestId = request.context?.requestId ?? 'unknown';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? ((exceptionResponse as Record<string, unknown>)['message'] ??
            'An error occurred')
          : 'Internal server error';
    const normalizedMessage =
      status >= 500
        ? 'Internal server error'
        : typeof message === 'string'
          ? message
          : Array.isArray(message)
            ? message.map((part) => String(part)).join(', ')
            : 'An error occurred';
    const responseCode =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>)['code']
        : undefined;
    const details =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? Object.fromEntries(
            Object.entries(exceptionResponse as Record<string, unknown>).filter(
              ([key]) =>
                !['code', 'message', 'statusCode', 'error'].includes(key),
            ),
          )
        : undefined;

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status} requestId=${requestId}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      this.observability.captureException(exception, {
        requestId,
        method: request.method,
        path: request.url,
        statusCode: status,
      });
    } else {
      this.logger.warn(
        `${request.method} ${request.url} → ${status}: ${normalizedMessage} requestId=${requestId}`,
      );
    }

    response.status(status).json({
      error: {
        code:
          status < 500 && typeof responseCode === 'string'
            ? responseCode
            : status >= 500
              ? 'INTERNAL_SERVER_ERROR'
              : (HttpStatus[status as unknown as keyof typeof HttpStatus] ??
                'UNKNOWN'),
        message: normalizedMessage,
        ...(status < 500 && details && Object.keys(details).length > 0
          ? { details }
          : {}),
        requestId,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
