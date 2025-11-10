import { SimpleCache } from '../cache';
import { searchDexScreener } from './dexscreener';
import { fetchGeckoTerminalTokens } from './geckoterminal';
import { Token } from '../types';
import { Server } from 'socket.io';

const CACHE_KEY = 'tokens:merged';

export class Aggregator {
  private cache = new SimpleCache(Number(process.env.CACHE_TTL_MS ? Number(process.env.CACHE_TTL_MS) : 30_000));
  private pollIntervalMs = Number(process.env.POLL_INTERVAL_MS ?? 15_000);
  private lastSnapshot: Map<string, Token> = new Map();

  constructor(private io?: Server) {}

  // main fetch function to combine multiple sources
  async fetchAndMerge(): Promise<Token[]> {
    const cached = this.cache.get<Token[]>(CACHE_KEY);
    if (cached) return cached;

    // fetch sources in parallel with safe queries
    const q = 'meme'; // simple query to pull meme-ish tokens; change as needed
    const [dex, geo] = await Promise.allSettled([
      searchDexScreener(q),
      fetchGeckoTerminalTokens()
    ]);

    const combined: Token[] = [];
    if (dex.status === 'fulfilled') combined.push(...dex.value);
    if (geo.status === 'fulfilled') combined.push(...geo.value);

    // merge by token_address; combine sources array
    const map = new Map<string, Token>();
    for (const t of combined) {
      if (!t.token_address) continue;
      const existing = map.get(t.token_address);
      if (!existing) {
        map.set(t.token_address, { ...t, sources: t.sources ?? [] });
      } else {
        // merge: prefer non-null fields from latest
        const merged: Token = {
          token_address: t.token_address,
          token_name: existing.token_name || t.token_name,
          token_ticker: existing.token_ticker || t.token_ticker,
          price: t.price ?? existing.price,
          market_cap: t.market_cap ?? existing.market_cap,
          volume_24h: t.volume_24h ?? existing.volume_24h,
          liquidity: t.liquidity ?? existing.liquidity,
          transaction_count: t.transaction_count ?? existing.transaction_count,
          price_1hr_change: t.price_1hr_change ?? existing.price_1hr_change,
          price_24hr_change: t.price_24hr_change ?? existing.price_24hr_change,
          price_7d_change: t.price_7d_change ?? existing.price_7d_change,
          protocol: existing.protocol || t.protocol,
          sources: Array.from(new Set([...(existing.sources ?? []), ...(t.sources ?? [])]))
        };
        map.set(t.token_address, merged);
      }
    }

    const out = Array.from(map.values());

    // cache result
    this.cache.set(CACHE_KEY, out);
    return out;
  }

  // start polling and emit updates via socket.io
  startPolling() {
    // initial snapshot
    this.fetchAndEmit().catch(err => console.error('initial fetch failed', err));
    setInterval(() => this.fetchAndEmit().catch(err => console.error('poll fetch failed', err)), this.pollIntervalMs);
  }

  // internal: fetch, compare with last snapshot, emit deltas
  private async fetchAndEmit() {
    const tokens = await this.fetchAndMerge();
    // build map
    const newMap = new Map<string, Token>();
    for (const t of tokens) newMap.set(t.token_address, t);

    // first time: emit snapshot
    if (this.lastSnapshot.size === 0 && this.io) {
      this.io.emit('snapshot', tokens);
      this.lastSnapshot = newMap;
      return;
    }

    // compute deltas and emit only changes (price or volume change beyond threshold)
    const updates: Partial<Token>[] = [];
    for (const [addr, t] of newMap.entries()) {
      const prev = this.lastSnapshot.get(addr);
      if (!prev) {
        updates.push(t);
        continue;
      }
      const priceDiff = (Number(t.price ?? 0) - Number(prev.price ?? 0));
      const pricePct = prev.price ? (priceDiff / prev.price) * 100 : 0;
      const volDiff = Math.abs((t.volume_24h ?? 0) - (prev.volume_24h ?? 0));
      // thresholds: price change > 0.5% OR volume change > 5% of prev volume
      if (Math.abs(pricePct) > 0.5 || (prev.volume_24h && volDiff > prev.volume_24h * 0.05)) {
        updates.push({
          token_address: addr,
          price: t.price,
          volume_24h: t.volume_24h,
          price_24hr_change: t.price_24hr_change
        });
      }
    }

    if (updates.length > 0 && this.io) {
      this.io.emit('update', updates);
    }
    this.lastSnapshot = newMap;
  }

  // helper used by REST endpoint so we can avoid refetching if cached
  async getTokens(): Promise<Token[]> {
    return this.fetchAndMerge();
  }
}
