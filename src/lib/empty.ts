export function empty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === false ||
    value === 0 ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
}
