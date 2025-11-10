import { fetchWithRetry } from './httpClient';
import { Token } from '../types';

const BASE = 'https://api.geckoterminal.com/api/v2/networks/solana/tokens';

export async function fetchGeckoTerminalTokens(): Promise<Token[]> {
  const data = await fetchWithRetry<any>(BASE, {}, 3, 300);
  const tokens: Token[] = [];
  if (!Array.isArray(data)) return tokens;
  for (const t of data) {
    // geckoterminal tokens format can vary; normalize best-effort
    const id = t?.token_address ?? t?.address ?? t?.id;
    if (!id) continue;
    tokens.push({
      token_address: id,
      token_name: t?.token?.name ?? t?.name ?? t?.symbol,
      token_ticker: t?.token?.symbol ?? t?.symbol,
      price: Number(t?.price ?? 0),
      volume_24h: Number(t?.volume_24h ?? 0),
      market_cap: Number(t?.market_cap ?? 0),
      price_24hr_change: Number(t?.price_change_24h ?? 0),
      price_7d_change: Number(t?.price_change_7d ?? 0),
      protocol: t?.protocol ?? 'geckoterminal',
      sources: ['geckoterminal']
    });
  }
  return tokens;
}
