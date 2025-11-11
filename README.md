# Real-Time Crypto Aggregator

This project was built as part of the **Eterna Backend Internship Assignment**.  
It aggregates real-time meme coin data from multiple DEX APIs, merges overlapping tokens intelligently, applies caching, and pushes live updates to connected clients using WebSockets.

---

## Features
- Aggregates token data from **DexScreener** and **GeckoTerminal**
- Modular architecture: clean separation of services, utilities, and cache
- Implements **in-memory caching** with configurable TTL (default 30 seconds)
- Handles **rate limiting** using **exponential backoff with jitter**
- Supports **filtering, sorting, and cursor-based pagination**
- Pushes **real-time updates** (price and volume) via WebSocket to multiple connected clients
- Provides **REST endpoints** for health check and aggregated token queries
- Designed to be easily extensible (e.g., add Jupiter API, Redis cache, or scheduler)
- Fully TypeScript-based for type safety and cleaner error handling

---

## Tech Stack
- **Runtime:** Node.js (TypeScript)
- **Framework:** Express.js
- **Realtime:** Socket.io
- **HTTP Client:** Axios (with retry logic)
- **Cache:** Custom in-memory cache (can be swapped for Redis)
- **Task Scheduling:** Native `setInterval` (easily replaceable with `node-cron`)
- **Package Scripts:** `npm run dev`, `npm run build`, `npm start`

---

## Endpoints

### `GET /health`
Basic health check endpoint to verify the service is running.

**Response:**
```json
{"status": "ok"}


WebSocket Connection

Connect using Socket.io to receive live updates.

Connection URL:

ws://localhost:3000


Events:

snapshot → full snapshot of all tokens

update → incremental updates for tokens (price or volume changes)

Browser Console Test:

await import("https://cdn.socket.io/4.7.2/socket.io.esm.min.js").then(m => window.io = m.io);
const s = io('http://localhost:3000');
s.on('snapshot', data => console.log('Snapshot:', data));
s.on('update', upd => console.log('Update:', upd));


Note:
If network restrictions block DexScreener or GeckoTerminal (for example, on campus Wi-Fi), the backend may return an empty dataset.
The system itself — aggregation, caching, rate-limiting, and WebSocket updates — continues to function normally.

System Architecture & Design
1. Data Aggregation Layer

Defined in src/services/aggregator.ts

Fetches data from multiple APIs in parallel (dexscreener.ts, geckoterminal.ts)

Normalizes into a unified Token interface

Merges duplicates by token_address

Aggregates source metadata (e.g., sources: ["dexscreener","geckoterminal"])

2. Rate Limiting & Retry

Implemented in fetchWithRetry (src/services/httpClient.ts)

Exponential backoff with random jitter

Configurable retry count (default: 3 attempts)

Prevents bans from rate-limited APIs

3. Caching

Implemented in src/cache.ts

In-memory store with TTL (default 30s)

Reduces API calls and improves response speed

Configurable via environment variables:

CACHE_TTL_MS=30000
POLL_INTERVAL_MS=15000

4. Real-Time Updates

Implemented with Socket.io in src/index.ts and src/services/aggregator.ts

Emits:

snapshot on client connect or refresh

update when token price/volume change exceeds thresholds

Configurable polling interval (default 15s)

5. Filtering, Sorting & Pagination

Filtering by minVolume and time period

Sorting by volume, price, price change %, or market cap

Cursor-based pagination (encodeCursor, decodeCursor helpers)

6. Error Handling

Graceful fallback for failed API calls

Partial results served when one API fails

No unhandled rejections or crashes

Safe retries for temporary network errors

7. Scalability

Stateless architecture — can scale horizontally

Cache easily replaceable with Redis

Polling decoupled from HTTP responses

File Structure
src/
├── cache.ts
├── index.ts
├── types.ts
│
├── services/
│   ├── aggregator.ts
│   ├── dexscreener.ts
│   ├── geckoterminal.ts
│   └── httpClient.ts
│
└── utils/
    └── pagination.ts

Limitations & Notes

Network restrictions: Some networks (e.g., institutional firewalls) may block external DEX APIs. In such cases, /tokens may return an empty array even though the backend logic is correct.

Mock fallback: Developers can manually inject mock tokens in aggregator.ts for offline demo purposes.

No auth or blockchain integration (excluded per assignment brief).

Historical persistence intentionally omitted — focus on live streaming data.

Future Improvements

Add Jupiter Price API for enhanced data coverage

Replace SimpleCache with Redis for distributed cache

Add unit and integration tests using Jest

Deploy to Render or Railway for public hosting

Author

Kalyani Nagure
Eterna Backend Internship Assignment (November 2025)


---
