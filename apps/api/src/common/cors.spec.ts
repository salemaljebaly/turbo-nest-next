import { describe, expect, it } from 'vitest';
import { parseCorsOriginsValue } from './cors.js';

describe(parseCorsOriginsValue.name, () => {
  it('parses comma-separated CORS origins with trimming', () => {
    expect(
      parseCorsOriginsValue(
        'http://localhost:3000, https://app.example.com, ,https://admin.example.com',
      ),
    ).toEqual([
      'http://localhost:3000',
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });

  it('uses the HTTP CORS default origin when no value is configured', () => {
    expect(parseCorsOriginsValue(undefined)).toEqual(['http://localhost:3000']);
  });
});
