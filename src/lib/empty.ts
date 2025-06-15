export function empty(
  value: unknown
): value is undefined | null | false | 0 | '' | [] | Record<string, never> {
  return (
    value === undefined ||
    value === null ||
    value === false ||
    value === 0 ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0)
  );
}
