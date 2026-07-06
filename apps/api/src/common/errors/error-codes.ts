import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@repo/types';

export type ErrorCodeDefinition = {
  status: number;
  message: string;
};

export const ERROR_CODES = {
  VALIDATION_FAILED: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Validation failed',
  },
  NOT_FOUND: { status: HttpStatus.NOT_FOUND, message: 'Resource not found' },
  FORBIDDEN: { status: HttpStatus.FORBIDDEN, message: 'Forbidden' },
  CONFLICT: { status: HttpStatus.CONFLICT, message: 'Conflict' },
  RATE_LIMITED: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: 'Rate limit exceeded',
  },
  IDEMPOTENCY_CONFLICT: {
    status: HttpStatus.CONFLICT,
    message: 'Idempotency-Key was already used for a different request',
  },
  INVALID_CURSOR: {
    status: HttpStatus.BAD_REQUEST,
    message: 'cursor must be a valid UUID',
  },
  INVALID_LIMIT: {
    status: HttpStatus.BAD_REQUEST,
    message: 'limit must be an integer between 1 and 100',
  },
  PROJECT_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Project not found',
  },
  PROJECT_ARCHIVED: {
    status: HttpStatus.CONFLICT,
    message: 'Archived projects cannot be modified',
  },
  SEPARATION_OF_DUTIES_VIOLATION: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The requester and approver must be different users',
  },
  STORAGE_NOT_CONFIGURED: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: 'Object storage is not configured',
  },
  STORAGE_VALIDATION_FAILED: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Upload does not match storage policy',
  },
  INTERNAL_SERVER_ERROR: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
  },
} as const satisfies Record<ErrorCode, ErrorCodeDefinition>;

export function getErrorDefinition(code: ErrorCode): ErrorCodeDefinition {
  return ERROR_CODES[code];
}

// Feature modules should use RESOURCE_ACTION_PROBLEM names, for example
// PROJECT_NOT_FOUND or BILLING_PLAN_LIMIT_EXCEEDED, and export their codes
// through packages/types so clients can localize them.
