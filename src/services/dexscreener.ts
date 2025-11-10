import { fetchWithRetry } from './httpClient';
import { Token } from '../types';

const BASE = 'https://api.dexscreener.com/latest/dex/search?q=';

/**
 * searchDexScreener - query dexscreener search endpoint with a short query like "meme" or "sol"
 * returns an array of Token objects (normalized)
 */
export async function searchDexScreener(query: string): Promise<Token[]> {
  const url = BASE + encodeURIComponent(query);
  const data = await fetchWithRetry<any>(url, {}, 3, 300);
  // dexscreener returns 'pairs' and 'tokens' structure; normalize whatever available
  const tokens: Token[] = [];

  if (data?.pairs && Array.isArray(data.pairs)) {
    for (const p of data.pairs) {
      if (!p?.token || !p.token.address) continue;
      const t = p.token;
      tokens.push({
        token_address: t.address,
        token_name: t.name || t.symbol,
        token_ticker: t.symbol,
        price: Number(t.priceUsd ?? t.price?.usd ?? t.price),
        market_cap: Number(t.marketCapUsd ?? 0),
        volume_24h: Number(p?.volumeUsd ?? 0),
        liquidity: Number(p?.liquidity ?? 0),
        price_1hr_change: Number(t.priceChange?.hour ?? 0),
        price_24hr_change: Number(t.priceChange?.day ?? 0),
        protocol: p.dexId ?? p?.exchange ?? 'dexscreener',
        sources: ['dexscreener']
      });
    }
  }

  // also handle tokens list if present
  if (data?.tokens && Array.isArray(data.tokens)) {
    for (const t of data.tokens) {
      tokens.push({
        token_address: t.address,
        token_name: t.name || t.symbol,
        token_ticker: t.symbol,
        price: Number(t.priceUsd ?? 0),
        market_cap: Number(t.marketCapUsd ?? 0),
        price_1hr_change: Number(t.priceChange?.hour ?? 0),
        price_24hr_change: Number(t.priceChange?.day ?? 0),
        protocol: t.dexId ?? 'dexscreener',
        sources: ['dexscreener']
      });
    }
  }

  // dedupe by address
  const map = new Map<string, Token>();
  for (const tk of tokens) {
    if (!tk.token_address) continue;
    map.set(tk.token_address, { ...(map.get(tk.token_address) ?? {}), ...tk });
  }
  return Array.from(map.values());
}
