import { describe, expect, it } from 'vitest';
import {
  boundedIntegerLimit,
  containsLikePattern,
  parseSort,
  validateUuidCursor,
} from './query-safety.js';

describe('query safety helpers', () => {
  it('escapes PostgreSQL LIKE wildcards and escape characters', () => {
    expect(containsLikePattern(' 50%_\\off ')).toBe('%50\\%\\_\\\\off%');
  });

  it('rejects invalid UUID cursors with a stable 400 error', () => {
    expect(() => validateUuidCursor('not-a-uuid')).toThrowError(
      expect.objectContaining({ status: 400 }),
    );
    expect(validateUuidCursor('0197c899-7612-7000-8000-000000000001')).toBe(
      '0197c899-7612-7000-8000-000000000001',
    );
  });

  it('rejects non-finite limits and clamps valid integers', () => {
    expect(() => boundedIntegerLimit(Number.NaN, 20)).toThrowError(
      expect.objectContaining({ status: 400 }),
    );
    expect(boundedIntegerLimit(500, 20)).toBe(100);
  });

  it('only accepts whitelisted sort columns', () => {
    expect(
      parseSort('-createdAt', ['name', 'createdAt'] as const, {
        column: 'name',
        direction: 'asc',
      }),
    ).toEqual({ column: 'createdAt', direction: 'desc' });
    expect(() =>
      parseSort('ownerId', ['name', 'createdAt'] as const, {
        column: 'name',
        direction: 'asc',
      }),
    ).toThrowError(expect.objectContaining({ status: 400 }));
  });
});
