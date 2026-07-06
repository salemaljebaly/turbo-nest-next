import { describe, expect, it } from 'vitest';
import { csvCell } from './csv-response.js';

describe('csvCell', () => {
  it('quotes delimiters and embedded quotes', () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
  });

  it('prevents spreadsheet formula injection', () => {
    expect(csvCell('=cmd()')).toBe('"\'=cmd()"');
    expect(csvCell('+123')).toBe('"\'+123"');
  });
});
