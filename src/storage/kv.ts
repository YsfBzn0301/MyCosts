// Kleine Helfer für localStorage. Jeder Zugriff ist abgesichert, weil Storage gesperrt sein kann.
export function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readList<T>(key: string, guard: (x: unknown) => x is T): T[] {
  const v = readJson(key);
  return Array.isArray(v) ? v.filter(guard) : [];
}
