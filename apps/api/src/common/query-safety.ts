import { BadRequestException } from '@nestjs/common';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function escapeLikeSearchTerm(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export function containsLikePattern(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? `%${escapeLikeSearchTerm(normalized)}%` : null;
}

export function validateUuidCursor(cursor?: string) {
  if (cursor && !UUID_PATTERN.test(cursor)) {
    throw new BadRequestException({
      code: 'INVALID_CURSOR',
      message: 'cursor must be a valid UUID',
    });
  }
  return cursor;
}

export function boundedIntegerLimit(
  limit: number | undefined,
  fallback: number,
) {
  const value = limit ?? fallback;
  if (!Number.isInteger(value) || !Number.isFinite(value)) {
    throw new BadRequestException({
      code: 'INVALID_LIMIT',
      message: 'limit must be an integer between 1 and 100',
    });
  }
  return Math.min(Math.max(value, 1), 100);
}

export type SortDirection = 'asc' | 'desc';

export type ParsedSort<T extends string> = {
  column: T;
  direction: SortDirection;
};

export function parseSort<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: ParsedSort<T>,
): ParsedSort<T> {
  if (!value) return fallback;
  const direction: SortDirection = value.startsWith('-') ? 'desc' : 'asc';
  const column = (direction === 'desc' ? value.slice(1) : value) as T;
  if (!allowed.includes(column)) {
    throw new BadRequestException({
      code: 'VALIDATION_FAILED',
      message: `sort must be one of: ${allowed.join(', ')}`,
      field: 'sort',
    });
  }
  return { column, direction };
}
