export function parseCorsOriginsValue(
  value = 'http://localhost:3000',
): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
