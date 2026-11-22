export function readSaved<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => T,
): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? validate(JSON.parse(raw)) : fallback;
  } catch {
    return fallback;
  }
}
export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private browsing may disable storage. */
  }
}
export const localDay = () => new Date().toLocaleDateString("en-CA");
