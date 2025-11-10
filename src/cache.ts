type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class SimpleCache {
  private map = new Map<string, CacheEntry<any>>();
  constructor(private defaultTtlMs = 30_000) {} // default 30s

  get<T>(key: string): T | null {
    const e = this.map.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return e.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number) {
    const ttl = ttlMs ?? this.defaultTtlMs;
    this.map.set(key, { value, expiresAt: Date.now() + ttl });
  }

  del(key: string) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}
