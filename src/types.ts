export type Token = {
  token_address: string;
  token_name: string;
  token_ticker?: string;
  price?: number;
  market_cap?: number;
  volume_24h?: number;
  liquidity?: number;
  transaction_count?: number;
  price_1hr_change?: number;
  price_24hr_change?: number;
  price_7d_change?: number;
  protocol?: string;
  sources?: string[]; // e.g., ["dexscreener","geckoterminal"]
};
