import { HttpException } from '@nestjs/common';
import type { ErrorCode } from '@repo/types';
import { getErrorDefinition } from './error-codes.js';

export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly details?: Record<string, unknown>,
  ) {
    const definition = getErrorDefinition(code);
    super(
      {
        code,
        message: message ?? definition.message,
        ...(details ? details : {}),
      },
      definition.status,
    );
  }
}
