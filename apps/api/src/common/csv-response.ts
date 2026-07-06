import type { Response } from 'express';

export type CsvColumn = {
  header: string;
  key: string;
};

export function writeCsv(
  response: Response,
  filename: string,
  rows: Iterable<unknown>,
  columns: CsvColumn[],
) {
  response.status(200);
  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename.replace(/[^a-zA-Z0-9_.-]/g, '_')}"`,
  );
  response.write('\uFEFF');
  response.write(
    `${columns.map((column) => csvCell(column.header)).join(',')}\r\n`,
  );
  for (const row of rows) {
    const record =
      typeof row === 'object' && row !== null
        ? (row as Record<string, unknown>)
        : {};
    response.write(
      `${columns.map((column) => csvCell(record[column.key])).join(',')}\r\n`,
    );
  }
  response.end();
}

export function csvCell(value: unknown) {
  let normalized: string;
  if (value instanceof Date) normalized = value.toISOString();
  else if (value === null || value === undefined) normalized = '';
  else if (typeof value === 'string') normalized = value;
  else if (
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    normalized = `${value}`;
  } else if (typeof value === 'symbol') {
    normalized = value.description ?? '';
  } else if (typeof value === 'function') {
    normalized = value.name;
  } else {
    normalized = JSON.stringify(value) ?? '';
  }
  if (/^[=+\-@\t\r]/.test(normalized)) normalized = `'${normalized}`;
  return `"${normalized.replace(/"/g, '""')}"`;
}
